#!/usr/bin/env python3
"""Deterministic body-specific raster repairs for the two human avatars.

All inputs are read from the immutable Git revision below.  The current
working-tree PNGs are only outputs, which keeps repeated runs reproducible.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[2]
SOURCE_REVISION = "24ce5a3"
SOURCE_DIR = "docs/design/avatar-shop-sources"
DEFAULT_OUTPUT = ROOT / ".superpowers/sdd/2026-09-20-avatar-fit-v3/humans"
PUBLIC_OUTPUT = ROOT / "docs/design/avatar-fit-v3/humans"
RECIPE_PATH = ROOT / "docs/design/avatar-fit-recipes/humans/recipes.json"
FIGURES = ("explorer-girl", "explorer-boy")
ITEMS = {
    "cap": (None, "cap-front"),
    "backpack": ("backpack-rear", None),
    "sunhat": (None, "sunhat-front"),
    "knight-clothing": (None, "knight-clothing-front"),
    "binoculars": (None, "binoculars-front"),
    "mountainhat": (None, "mountainhat-front"),
    "compass": (None, "compass-front"),
    "runes-head": (None, "runes-head-front"),
    "runes-back": ("runes-back-rear", None),
    "runes-hand": (None, "runes-hand-front"),
}
ITEM_LABELS = {
    "cap": "Kappe",
    "backpack": "Rucksack",
    "sunhat": "Sonnenhut",
    "knight-clothing": "Ritterrüstung",
    "binoculars": "Fernglas",
    "mountainhat": "Bergmütze",
    "compass": "Kompass",
    "runes-head": "Runenmedaillon",
    "runes-back": "Sternenumhang",
    "runes-hand": "Kristall-Kompass",
}


def git_bytes(path: str) -> bytes:
    result = subprocess.run(
        ["git", "show", f"{SOURCE_REVISION}:{path}"],
        cwd=ROOT,
        check=True,
        stdout=subprocess.PIPE,
    )
    return result.stdout


def source_bytes(name: str) -> bytes:
    return git_bytes(f"{SOURCE_DIR}/{name}")


def source_image(name: str) -> Image.Image:
    return Image.open(io.BytesIO(source_bytes(name))).convert("RGBA")


def source_json(name: str) -> dict:
    return json.loads(source_bytes(name).decode("utf-8-sig"))


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def recipe() -> dict:
    return json.loads(RECIPE_PATH.read_text(encoding="utf-8"))


def registered_source(name: str, canvas: tuple[int, int]) -> Image.Image:
    meta = source_json(name.removesuffix(".png") + ".json")
    registration = meta.get("registration", {})
    scale = float(registration.get("scale", 1))
    x = round(float(registration.get("x", 0)))
    y = round(float(registration.get("y", 0)))
    source = source_image(name)
    if scale != 1:
        source = source.resize(
            (max(1, round(source.width * scale)), max(1, round(source.height * scale))),
            Image.Resampling.LANCZOS,
        )
    target = Image.new("RGBA", canvas)
    target.alpha_composite(source, (x, y))
    return target


def original_layers(figure: str) -> tuple[Image.Image, dict[str, Image.Image]]:
    base = source_image(f"{figure}-skin-0.png")
    layers = {}
    for rear, front in ITEMS.values():
        for suffix in (rear, front):
            if suffix:
                name = f"{figure}-{suffix}.png"
                layers[suffix] = registered_source(name, base.size)
    return base, layers


def clean_alpha(image: Image.Image, cutoff: int) -> Image.Image:
    result = image.copy()
    alpha = result.getchannel("A").point(lambda value: value if value >= cutoff else 0)
    result.putalpha(alpha)
    return result


def translated_copy(source: Image.Image, offset: list[int]) -> Image.Image:
    output = Image.new("RGBA", source.size)
    output.alpha_composite(source, tuple(offset))
    return output


def bbox_transform(source: Image.Image, transform: dict) -> Image.Image:
    source_bounds = tuple(transform["sourceBounds"])
    target_bounds = tuple(transform["targetBounds"])
    piece = source.crop(source_bounds)
    piece = piece.resize(
        (target_bounds[2] - target_bounds[0], target_bounds[3] - target_bounds[1]),
        Image.Resampling.LANCZOS,
    )
    output = Image.new("RGBA", source.size)
    output.alpha_composite(piece, (target_bounds[0], target_bounds[1]))
    return output


def painted_backpack_straps(source: Image.Image, parts: list[dict]) -> Image.Image:
    output = Image.new("RGBA", source.size)
    for part in parts:
        mask = Image.new("L", source.size)
        ImageDraw.Draw(mask).polygon([tuple(point) for point in part["polygon"]], fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(0.8))
        alpha = ImageChops.multiply(source.getchannel("A"), mask)
        piece = source.copy()
        piece.putalpha(alpha)
        piece = piece.crop(tuple(part["crop"]))
        piece = piece.resize(tuple(part["size"]), Image.Resampling.LANCZOS)
        piece = piece.rotate(float(part["angle"]), Image.Resampling.BICUBIC, expand=True)
        output.alpha_composite(piece, tuple(part["paste"]))
    return output


def painted_cloak_collar(source: Image.Image, shapes: dict) -> Image.Image:
    mask = Image.new("L", source.size)
    draw = ImageDraw.Draw(mask)
    for polygon in shapes["polygons"]:
        draw.polygon([tuple(point) for point in polygon], fill=255)
    for hole in shapes.get("holes", []):
        draw.polygon([tuple(point) for point in hole], fill=0)
    for ellipse in shapes["ellipses"]:
        draw.ellipse(tuple(ellipse), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(1.2))
    output = source.copy()
    output.putalpha(ImageChops.multiply(source.getchannel("A"), mask))
    return output


def repaired_layers(figure: str) -> dict[str, dict[str, Image.Image]]:
    values = recipe()
    cutoff = int(values["alphaCutoff"])
    geometry = values["figures"][figure]
    canvas = (values["canvas"]["width"], values["canvas"]["height"])
    output: dict[str, dict[str, Image.Image]] = {}
    for item, item_recipe in values["items"].items():
        source_suffix = item_recipe["source"]
        source = clean_alpha(registered_source(f"{figure}-{source_suffix}.png", canvas), cutoff)
        if "transform" in item_recipe:
            source = bbox_transform(source, item_recipe["transform"])
        layers: dict[str, Image.Image] = {}
        if item_recipe.get("rear") == "copy":
            layers["rear"] = source.copy()
        front_kind = item_recipe.get("front")
        if front_kind == "copy":
            layers["front"] = source.copy()
        elif front_kind == "translated-copy":
            layers["front"] = translated_copy(source, item_recipe["offset"])
        elif front_kind == "painted-straps":
            layers["front"] = painted_backpack_straps(source, geometry["paintedStraps"])
        elif front_kind == "painted-collar":
            layers["front"] = painted_cloak_collar(source, geometry["paintedCollar"])
        output[item] = layers
    return output


def checker(size: tuple[int, int], cell: int = 32) -> Image.Image:
    image = Image.new("RGBA", size, (248, 249, 245, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if ((x // cell) + (y // cell)) % 2:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=(225, 229, 235, 255))
    return image


def on_light(image: Image.Image) -> Image.Image:
    background = Image.new("RGBA", image.size, (248, 249, 245, 255))
    background.alpha_composite(image)
    return background.convert("RGB")


def composite(base: Image.Image, layers: dict[str, Image.Image], item: str) -> Image.Image:
    rear, front = ITEMS[item]
    output = Image.new("RGBA", base.size)
    if rear:
        output.alpha_composite(layers[rear])
    output.alpha_composite(base)
    if front:
        output.alpha_composite(layers[front])
    return output


def compose_repaired(
    base: Image.Image,
    layers: dict[str, dict[str, Image.Image]],
    item: str,
    clothing: Image.Image | None = None,
) -> Image.Image:
    output = Image.new("RGBA", base.size)
    rear = layers[item].get("rear")
    front = layers[item].get("front")
    if rear:
        output.alpha_composite(rear)
    output.alpha_composite(base)
    if clothing is not None and item != "knight-clothing":
        output.alpha_composite(clothing)
    if front:
        output.alpha_composite(front)
    return output


def fit_card(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    result = image.copy()
    result.thumbnail(size, Image.Resampling.LANCZOS)
    card = Image.new("RGB", size, "white")
    card.paste(result.convert("RGB"), ((size[0] - result.width) // 2, (size[1] - result.height) // 2))
    return card


def inspect_sources(output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    rows = []
    for figure in FIGURES:
        base, layers = original_layers(figure)
        cards = [fit_card(on_light(base), (256, 342))]
        for item in ITEMS:
            pair = composite(base, layers, item)
            on_light(pair).save(output / f"{figure}-{item}-before-light.png")
            pair.resize((256, round(256 * pair.height / pair.width)), Image.Resampling.LANCZOS).save(
                output / f"{figure}-{item}-before-256.png"
            )
            cards.append(fit_card(on_light(pair), (256, 342)))
        row = Image.new("RGB", (256 * len(cards), 342), "white")
        for index, card in enumerate(cards):
            row.paste(card, (256 * index, 0))
        rows.append(row)
    contact = Image.new("RGB", (256 * 11, 342 * 2), "white")
    for index, row in enumerate(rows):
        contact.paste(row, (0, 342 * index))
    contact.save(output / "humans-before-contact.png")


def load_registered_variant(name: str, canvas: tuple[int, int]) -> Image.Image:
    return registered_source(name, canvas)


def crop_comparison(before: Image.Image, after: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    before_crop = on_light(before).crop(box)
    after_crop = on_light(after).crop(box)
    output = Image.new("RGB", (before_crop.width * 2, before_crop.height), "white")
    output.paste(before_crop, (0, 0))
    output.paste(after_crop, (before_crop.width, 0))
    return output


def render_previews(output: Path) -> None:
    inspect_sources(output)
    figure_sheets = []
    for figure in FIGURES:
        base, old_layers = original_layers(figure)
        new_layers = repaired_layers(figure)
        canvas = base.size
        review_rows = []
        for item in ITEMS:
            before = composite(base, old_layers, item)
            after = compose_repaired(base, new_layers, item)
            on_light(after).save(output / f"{figure}-{item}-after-light.png")
            after.resize((256, round(256 * after.height / after.width)), Image.Resampling.LANCZOS).save(
                output / f"{figure}-{item}-after-256.png"
            )
            comparison = Image.new("RGB", (632, 372), "white")
            draw = ImageDraw.Draw(comparison)
            draw.text((8, 8), f"{ITEM_LABELS[item]} ({item})", fill=(24, 32, 42))
            draw.text((120, 26), "VORHER", fill=(86, 91, 101))
            draw.text((420, 26), "NACHHER", fill=(86, 91, 101))
            comparison.paste(fit_card(on_light(before), (256, 342)), (90, 30))
            comparison.paste(fit_card(on_light(after), (256, 342)), (376, 30))
            review_rows.append(comparison)

            skin_color = Image.new("RGB", (72 + 128 * 6, 28 + 171 * 4), "white")
            skin_draw = ImageDraw.Draw(skin_color)
            for color_index in range(6):
                skin_draw.text((72 + color_index * 128 + 38, 8), f"F{color_index}", fill=(60, 66, 75))
            for skin_index in range(4):
                skin_draw.text((8, 28 + skin_index * 171 + 76), f"Haut {skin_index}", fill=(60, 66, 75))
                skin = load_registered_variant(f"{figure}-skin-{skin_index}.png", canvas)
                for color_index in range(6):
                    clothing = load_registered_variant(f"{figure}-clothing-{color_index}.png", canvas)
                    rendered = compose_repaired(skin, new_layers, item, clothing)
                    card = fit_card(on_light(rendered), (128, 171))
                    skin_color.paste(card, (72 + color_index * 128, 28 + skin_index * 171))
            skin_color.save(output / f"{figure}-{item}-all-skins-colors.png")

        for item, box in {
            "binoculars": (660, 650, 960, 960),
            "compass": (680, 650, 930, 940),
            "runes-hand": (660, 740, 900, 1130),
            "runes-back": (270, 270, 820, 620),
        }.items():
            before = composite(base, old_layers, item)
            after = compose_repaired(base, new_layers, item)
            crop_comparison(before, after, box).save(output / f"{figure}-{item}-detail-before-after.png")
        figure_sheet = Image.new("RGB", (632, 30 + 372 * len(review_rows)), "white")
        ImageDraw.Draw(figure_sheet).text((8, 8), figure, fill=(15, 24, 38))
        for index, row_image in enumerate(review_rows):
            figure_sheet.paste(row_image, (0, 30 + index * 372))
        figure_sheet.save(output / f"{figure}-all-10-pairs-before-after.png")
        figure_sheets.append(figure_sheet)

    sheet = Image.new("RGB", (632 * 2, max(image.height for image in figure_sheets)), "white")
    for index, figure_sheet in enumerate(figure_sheets):
        sheet.paste(figure_sheet, (index * 632, 0))
    sheet.save(output / "humans-all-20-pairs-before-after.png")


def pair_review_row(label: str, before: Image.Image, after: Image.Image) -> Image.Image:
    row = Image.new("RGB", (584, 378), "white")
    draw = ImageDraw.Draw(row)
    draw.text((8, 8), label, fill=(24, 32, 42))
    draw.text((112, 27), "VORHER", fill=(86, 91, 101))
    draw.text((404, 27), "NACHHER", fill=(86, 91, 101))
    row.paste(fit_card(on_light(before), (256, 342)), (20, 36))
    row.paste(fit_card(on_light(after), (256, 342)), (308, 36))
    return row


def publish_curated(output: Path) -> None:
    """Write only the compact, reviewable public evidence set (eight PNGs)."""
    output.mkdir(parents=True, exist_ok=True)
    critical_items = ("binoculars", "compass", "runes-hand")
    final_items = ("backpack", "runes-back", "binoculars", "compass", "runes-hand")
    item_names = list(ITEMS)
    for figure in FIGURES:
        base, old_layers = original_layers(figure)
        new_layers = repaired_layers(figure)
        canvas = base.size

        for page_index, page_items in enumerate((item_names[:5], item_names[5:]), start=1):
            page = Image.new("RGB", (584, 34 + 378 * len(page_items)), "white")
            ImageDraw.Draw(page).text(
                (8, 10), f"{figure}: Paare {1 + (page_index - 1) * 5}-{page_index * 5}", fill=(15, 24, 38)
            )
            for row_index, item in enumerate(page_items):
                before = composite(base, old_layers, item)
                after = compose_repaired(base, new_layers, item)
                row = pair_review_row(f"{ITEM_LABELS[item]} ({item})", before, after)
                page.paste(row, (0, 34 + row_index * 378))
            page.save(output / f"{figure}-pairs-{page_index}.png", compress_level=9)

        matrix = Image.new("RGB", (840, 26 + len(critical_items) * 718), "white")
        matrix_draw = ImageDraw.Draw(matrix)
        matrix_draw.text((8, 8), f"{figure}: Handobjekte - 4 Hauttoene x 6 Kleidungsfarben", fill=(15, 24, 38))
        for item_index, item in enumerate(critical_items):
            top = 26 + item_index * 718
            matrix_draw.text((8, top + 5), f"{ITEM_LABELS[item]} ({item})", fill=(24, 32, 42))
            for color_index in range(6):
                matrix_draw.text((72 + color_index * 128 + 50, top + 25), f"F{color_index}", fill=(60, 66, 75))
            for skin_index in range(4):
                matrix_draw.text((8, top + 50 + skin_index * 166 + 76), f"H{skin_index}", fill=(60, 66, 75))
                skin = load_registered_variant(f"{figure}-skin-{skin_index}.png", canvas)
                for color_index in range(6):
                    clothing = load_registered_variant(f"{figure}-clothing-{color_index}.png", canvas)
                    rendered = compose_repaired(skin, new_layers, item, clothing)
                    matrix.paste(
                        fit_card(on_light(rendered), (128, 166)),
                        (72 + color_index * 128, top + 50 + skin_index * 166),
                    )
        matrix.save(output / f"{figure}-hands-all-skins-colors.png", compress_level=9)

        detail = Image.new("RGB", (776, 40 + 520 * 3), "white")
        detail_draw = ImageDraw.Draw(detail)
        detail_draw.text((8, 10), f"{figure}: finale kritische Kombinationen", fill=(15, 24, 38))
        for index, item in enumerate(final_items):
            x = 8 + (index % 2) * 384
            y = 40 + (index // 2) * 520
            detail_draw.text((x, y), f"{ITEM_LABELS[item]} ({item})", fill=(24, 32, 42))
            rendered = compose_repaired(base, new_layers, item)
            detail.paste(fit_card(on_light(rendered), (362, 483)), (x, y + 27))
        detail.save(output / f"{figure}-critical-final.png", compress_level=9)


def png_bytes(image: Image.Image) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG", compress_level=9, optimize=False)
    return buffer.getvalue()


def original_input_record(figure: str, suffix: str) -> dict:
    png_name = f"{figure}-{suffix}.png"
    json_name = png_name.removesuffix(".png") + ".json"
    return {
        "revision": SOURCE_REVISION,
        "png": png_name,
        "pngSha256": sha256(source_bytes(png_name)),
        "metadata": json_name,
        "metadataSha256": sha256(source_bytes(json_name)),
    }


def layer_metadata(figure: str, item: str, plane: str, source_suffix: str, data: bytes) -> dict:
    return {
        "date": "2026-09-20",
        "sourceFile": f"{figure}-{item}-{plane}.png",
        "reference": f"{figure}-skin-0.png",
        "provenance": (
            "Classical raster editing explicitly approved by the user on 2026-09-20; "
            "deterministic Pillow compositing and masks cut from original painted material; no image generation."
        ),
        "derivedFrom": original_input_record(figure, source_suffix),
        "recipe": "../avatar-fit-recipes/humans/recipes.json",
        "script": "../../../scripts/avatar-fit/humans.py",
        "item": item,
        "figure": figure,
        "layer": plane,
        "sourceSha256": sha256(data),
        "canvas": {"width": 1086, "height": 1448},
        "registration": {"scale": 1, "x": 0, "y": 0},
        "qa": (
            "Internally inspected at full canvas and 256-pixel card size on a light background; "
            "all four skin variants and all six clothing colors rendered. Personal user acceptance remains open."
        ),
    }


def write_sources(destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    values = recipe()
    for figure in FIGURES:
        layers = repaired_layers(figure)
        for item, item_layers in layers.items():
            source_suffix = values["items"][item]["source"]
            for plane, image in item_layers.items():
                png_name = f"{figure}-{item}-{plane}.png"
                data = png_bytes(image)
                (destination / png_name).write_bytes(data)
                metadata = layer_metadata(figure, item, plane, source_suffix, data)
                json_path = destination / png_name.replace(".png", ".json")
                with json_path.open("w", encoding="utf-8", newline="\n") as handle:
                    handle.write(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n")


def render(output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    write_sources(output / "generated-sources")
    render_previews(output)


def verify_worktree() -> None:
    failures = []
    values = recipe()
    for figure in FIGURES:
        for index in range(4):
            name = f"{figure}-skin-{index}.png"
            if (ROOT / SOURCE_DIR / name).read_bytes() != source_bytes(name):
                failures.append(f"{name}: protected skin source changed")
        for index in range(6):
            name = f"{figure}-clothing-{index}.png"
            if (ROOT / SOURCE_DIR / name).read_bytes() != source_bytes(name):
                failures.append(f"{name}: protected clothing source changed")
        for item, item_recipe in values["items"].items():
            for plane in ("rear", "front"):
                if plane not in item_recipe:
                    continue
                png_name = f"{figure}-{item}-{plane}.png"
                json_name = png_name.removesuffix(".png") + ".json"
                path = ROOT / SOURCE_DIR / png_name
                if not path.exists():
                    failures.append(f"{png_name}: missing")
                    continue
                meta = json.loads((ROOT / SOURCE_DIR / json_name).read_text(encoding="utf-8"))
                image = Image.open(path)
                if image.size != (1086, 1448):
                    failures.append(f"{png_name}: canvas {image.size}")
                if meta.get("registration") != {"scale": 1, "x": 0, "y": 0}:
                    failures.append(f"{json_name}: registration is not identity")
                if meta.get("sourceSha256") != sha256(path.read_bytes()):
                    failures.append(f"{json_name}: sourceSha256 mismatch")
                provenance = str(meta.get("provenance", ""))
                if "classical raster editing" not in provenance.lower():
                    failures.append(f"{json_name}: approval/provenance missing")
    if failures:
        raise SystemExit("\n".join(failures))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("inspect", "render", "publish", "install", "verify"))
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    if args.command == "inspect":
        inspect_sources(args.output)
    elif args.command == "render":
        render(args.output)
    elif args.command == "publish":
        publish_curated(args.output)
    elif args.command == "install":
        write_sources(ROOT / SOURCE_DIR)
    else:
        verify_worktree()


if __name__ == "__main__":
    main()
