#!/usr/bin/env python3
"""Deterministic body-specific raster repairs for four quadruped avatar sets.

Every source is read from the immutable Git revision named below.  The script
never treats the current working PNG as an input, so repeated runs are stable.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[2]
SOURCE_REVISION = "24ce5a3"
SOURCE_DIR = "docs/design/avatar-shop-sources"
DEFAULT_OUTPUT = ROOT / ".superpowers/sdd/2026-09-20-avatar-fit-v3/quadrupeds"
RECIPE_DIR = ROOT / "docs/design/avatar-fit-recipes/quadrupeds"
SOURCE_PATH = ROOT / SOURCE_DIR

FIGURES = {
    "tiger": {"set": "jungle", "items": ("head", "body", "adornment")},
    "wolf-aurora": {"set": "aurora", "items": ("head", "body", "adornment")},
    "deer-mist": {"set": "forest", "items": ("head", "body", "adornment")},
    "panther-shadow": {"set": "obsidian", "items": ("head", "body", "adornment")},
}


def git_bytes(path: str) -> bytes:
    result = subprocess.run(
        ["git", "show", f"{SOURCE_REVISION}:{path}"],
        cwd=ROOT,
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
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


def recipe(figure: str) -> dict:
    return json.loads((RECIPE_DIR / f"{figure}.json").read_text(encoding="utf-8"))


def layer_name(figure: str, item: str, plane: str = "front") -> str:
    set_id = FIGURES[figure]["set"]
    return f"{figure}-{set_id}-{item}-{plane}.png"


def registered_source(name: str, canvas: tuple[int, int]) -> Image.Image:
    meta = source_json(name.removesuffix(".png") + ".json")
    registration = meta.get("registration", {})
    scale = float(registration.get("scale", 1))
    x = int(registration.get("x", 0))
    y = int(registration.get("y", 0))
    source = source_image(name)
    if scale != 1:
        source = source.resize(
            (max(1, round(source.width * scale)), max(1, round(source.height * scale))),
            Image.Resampling.LANCZOS,
        )
    target = Image.new("RGBA", canvas)
    target.alpha_composite(source, (x, y))
    return target


def alpha_multiply(image: Image.Image, mask: Image.Image) -> Image.Image:
    output = image.copy()
    alpha = output.getchannel("A")
    alpha = Image.eval(Image.merge("L", (alpha,)), lambda value: value)
    from PIL import ImageChops

    output.putalpha(ImageChops.multiply(alpha, mask))
    return output


def transformed_piece(
    source: Image.Image,
    box: tuple[int, int, int, int],
    center: tuple[int, int],
    scale: tuple[float, float],
    angle: float,
    canvas: tuple[int, int],
) -> tuple[Image.Image, tuple[int, int, int, int]]:
    piece = source.crop(box)
    piece = piece.resize(
        (max(1, round(piece.width * scale[0])), max(1, round(piece.height * scale[1]))),
        Image.Resampling.LANCZOS,
    )
    if angle:
        piece = piece.rotate(angle, Image.Resampling.BICUBIC, expand=True)
    x = round(center[0] - piece.width / 2)
    y = round(center[1] - piece.height / 2)
    target = Image.new("RGBA", canvas)
    target.alpha_composite(piece, (x, y))
    return target, (x, y, x + piece.width, y + piece.height)


def shape_mask(size: tuple[int, int], shapes: list[dict], feather: float = 0) -> Image.Image:
    mask = Image.new("L", size)
    draw = ImageDraw.Draw(mask)
    for shape in shapes:
        if shape["type"] == "ellipse":
            draw.ellipse(tuple(shape["box"]), fill=255)
        elif shape["type"] == "rectangle":
            draw.rectangle(tuple(shape["box"]), fill=255)
        elif shape["type"] == "polygon":
            draw.polygon([tuple(point) for point in shape["points"]], fill=255)
        else:
            raise ValueError(f"unknown mask shape: {shape['type']}")
    return mask.filter(ImageFilter.GaussianBlur(feather)) if feather else mask


def selected(image: Image.Image, shapes: list[dict], feather: float = 0) -> Image.Image:
    return alpha_multiply(image, shape_mask(image.size, shapes, feather))


def transformed_crop(
    source: Image.Image,
    box: tuple[int, int, int, int],
    center: tuple[int, int],
    scale: tuple[float, float],
    angle: float,
    canvas: tuple[int, int],
) -> tuple[Image.Image, tuple[int, int, int, int]]:
    return transformed_piece(source, box, center, scale, angle, canvas)


def split_necklace(figure: str, config: dict) -> tuple[Image.Image, Image.Image]:
    base = source_image(f"{figure}.png")
    source = registered_source(layer_name(figure, "head"), base.size)
    fitted, bounds = transformed_crop(
        source,
        tuple(config["sourceBox"]),
        tuple(config["center"]),
        tuple(config["scale"]),
        float(config.get("angle", 0)),
        base.size,
    )
    x0, y0, x1, y1 = bounds
    width, height = x1 - x0, y1 - y0
    rear_fraction = float(config["rearChainFraction"])
    rear = selected(
        fitted,
        [{"type": "rectangle", "box": [x0, y0, x1, y0 + round(height * rear_fraction)]}],
        2,
    )
    fx0, fy0, fx1, fy1 = config["frontPendantBoxFraction"]
    front = selected(
        fitted,
        [
            {
                "type": "ellipse",
                "box": [
                    x0 + round(width * fx0),
                    y0 + round(height * fy0),
                    x0 + round(width * fx1),
                    y0 + round(height * fy1),
                ],
            }
        ],
        2,
    )
    return rear, front


def front_band(
    source: Image.Image,
    box: tuple[int, int, int, int],
    ellipse: tuple[int, int, int, int],
    center_width_angle: tuple[int, int, int, float],
    canvas: tuple[int, int],
) -> Image.Image:
    """Retain the decorated front below a soft lower ellipse.

    The dark opening and rear crown are removed rather than hidden with body
    alpha.  This leaves a gently curved band that never cuts a straight notch
    through the engraving.
    """
    part = source.crop(box)
    cx, cy, rx, ry = ellipse
    yy, xx = np.mgrid[box[1] : box[3], box[0] : box[2]]
    arc = cy + ry * np.sqrt(np.maximum(0, 1 - ((xx - cx) / rx) ** 2))
    alpha = np.array(part.getchannel("A"), dtype=np.float32)
    alpha *= np.clip((yy - arc + 1) / 3, 0, 1)
    # A wide source crop may intersect glow or metal at its side boundary.
    # Feather both ends so no repaired cuff exposes a vertical crop seam.
    fade_width = max(3, round((box[2] - box[0]) * 0.10))
    left_fade = np.clip((xx - box[0]) / fade_width, 0, 1)
    right_fade = np.clip((box[2] - 1 - xx) / fade_width, 0, 1)
    alpha *= np.minimum(left_fade, right_fade)
    part.putalpha(Image.fromarray(alpha.astype("uint8")))
    content = part.getbbox()
    if content is None:
        return Image.new("RGBA", canvas)
    part = part.crop(content)
    target_x, target_y, width, angle = center_width_angle
    height = max(1, round(part.height * width / part.width))
    part = part.resize((width, height), Image.Resampling.LANCZOS)
    part = part.rotate(angle, Image.Resampling.BICUBIC, expand=True)
    output = Image.new("RGBA", canvas)
    output.alpha_composite(part, (round(target_x - part.width / 2), round(target_y - part.height / 2)))
    return output


def repair_tiger_adornment() -> Image.Image:
    base = source_image("tiger.png")
    source = registered_source(layer_name("tiger", "adornment"), base.size)
    # Each source ring is isolated, resized and aligned to its own leg.  These
    # values intentionally differ because the four legs differ in depth and
    # axis; a single affine transform cannot fit them all.
    recipes = recipe("tiger")["adornment"]["parts"]
    front = Image.new("RGBA", base.size)
    for part in recipes:
        front.alpha_composite(
            front_band(
                source,
                tuple(part["crop"]),
                tuple(part["frontRimEllipse"]),
                tuple(part["centerWidthAngle"]),
                base.size,
            )
        )
    return front


def repair_adornment(figure: str, config: dict) -> Image.Image:
    if figure == "tiger":
        return repair_tiger_adornment()
    base = source_image(f"{figure}.png")
    source = registered_source(layer_name(figure, "adornment"), base.size)
    output = Image.new("RGBA", base.size)
    for part in config["parts"]:
        output.alpha_composite(
            front_band(
                source,
                tuple(part["crop"]),
                tuple(part["frontRimEllipse"]),
                tuple(part["centerWidthAngle"]),
                base.size,
            )
        )
    return output


def repair_head(figure: str, config: dict) -> tuple[Image.Image, Image.Image]:
    base = source_image(f"{figure}.png")
    source = registered_source(layer_name(figure, "head"), base.size)
    if "sourceBox" in config:
        return split_necklace(figure, config)
    feather = float(config.get("feather", 0))
    if config.get("colorOnly"):
        region = shape_mask(source.size, config.get("frontShapes", []), feather)
        pixels = np.array(source)
        rgb = pixels[..., :3].astype(np.int16)
        chroma = rgb.max(axis=2) - rgb.min(axis=2)
        cool = (rgb[..., 1] + rgb[..., 2]) / 2 - rgb[..., 0]
        color = np.where((chroma >= 24) & (cool >= 8), 255, 0).astype("uint8")
        color = Image.fromarray(color).filter(ImageFilter.GaussianBlur(0.8))
        from PIL import ImageChops

        front_mask = ImageChops.multiply(region, color)
        return Image.new("RGBA", base.size), alpha_multiply(source, front_mask)
    return (
        selected(source, config.get("rearShapes", []), feather),
        selected(source, config.get("frontShapes", []), feather),
    )


def repair_body(figure: str, config: dict) -> tuple[Image.Image | None, Image.Image]:
    base = source_image(f"{figure}.png")
    source = registered_source(layer_name(figure, "body"), base.size)
    feather = float(config.get("feather", 0))
    front = selected(source, config["frontShapes"], feather)
    if config.get("excludeShapes"):
        exclusion = shape_mask(source.size, config["excludeShapes"], feather)
        front = alpha_multiply(front, Image.eval(exclusion, lambda value: 255 - value))
    rear: Image.Image | None = None
    if config.get("retainOriginalRear"):
        rear = registered_source(layer_name(figure, "body", "rear"), base.size)
    elif config.get("rearShapes"):
        rear = selected(source, config["rearShapes"], feather)
    return rear, front


def repaired_layers(figure: str) -> dict[str, Image.Image]:
    config = recipe(figure)
    head_rear, head_front = repair_head(figure, config["head"])
    body_rear, body_front = repair_body(figure, config["body"])
    result = {
        "head-rear": head_rear,
        "head-front": head_front,
        "body-front": body_front,
        "adornment-front": repair_adornment(figure, config["adornment"]),
    }
    if body_rear is not None:
        result["body-rear"] = body_rear
    return result


def provenance(name: str) -> dict[str, str]:
    return {"path": name, "sha256": sha256(source_bytes(name))}


def save_layer(
    figure: str,
    item: str,
    plane: str,
    image: Image.Image,
    description: str,
    recipe_section: dict,
    original_names: list[str],
) -> None:
    name = layer_name(figure, item, plane)
    path = SOURCE_PATH / name
    image.save(path)
    metadata = {
        "sourceFile": name,
        "figure": figure,
        "item": f"{FIGURES[figure]['set']}-{item}",
        "layer": plane,
        "reference": f"{figure}.png",
        "generator": "Classical raster editing (Pillow/NumPy), explicitly authorized 2026-09-20",
        "provenance": description,
        "originalCommit": "24ce5a38b561c6012d7307603fc378ca339ab58c",
        "originalSources": [provenance(value) for value in original_names],
        "repairScript": "../../../scripts/avatar-fit/quadrupeds.py",
        "recipeFile": f"../avatar-fit-recipes/quadrupeds/{figure}.json",
        "recipe": recipe_section,
        "canvas": {"width": image.width, "height": image.height},
        "registration": {"scale": 1, "x": 0, "y": 0},
        "sourceSha256": sha256(path.read_bytes()),
        "qa": {
            "status": "internal-fit-review-pending",
            "personalAcceptance": False,
            "comparisonSheet": f"../avatar-fit-v3/quadrupeds/{figure}-pairs-256.png",
            "largeEvidence": f"../../../.superpowers/sdd/2026-09-20-avatar-fit-v3/quadrupeds/{figure}-{item}-before-after-large.png",
        },
    }
    with path.with_suffix(".json").open("w", encoding="utf-8", newline="\n") as sidecar:
        sidecar.write(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n")


def write_repairs() -> None:
    SOURCE_PATH.mkdir(parents=True, exist_ok=True)
    descriptions = {
        "head": "Body-specific depth split: chain or antler mounting sits behind fur/antler; only the restrained pendant or crystal faces remain in front.",
        "body": "Body-specific silhouette mask removes detached loops, oversized collar sections and straps through limbs while retaining the original painted material.",
        "adornment": "Four original ornaments isolated and fitted independently; only the curved front band remains, with dark opening, rear crown and dangling gaps removed.",
    }
    for figure in FIGURES:
        config = recipe(figure)
        layers = repaired_layers(figure)
        for key, image in layers.items():
            item, plane = key.rsplit("-", 1)
            source_front = layer_name(figure, item)
            original_names = [source_front]
            if item == "body" and plane == "rear" and config[item].get("retainOriginalRear"):
                original_names = [layer_name(figure, item, "rear")]
            save_layer(
                figure,
                item,
                plane,
                image,
                descriptions[item],
                config[item],
                original_names,
            )


def preview_repairs(output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    contact_rows: list[Image.Image] = []
    for figure in FIGURES:
        base, before_layers = source_layers(figure)
        after_layers = repaired_layers(figure)
        figure_cards: list[Image.Image] = []
        for item in FIGURES[figure]["items"]:
            before = composite(base, before_layers, [f"{item}-rear", f"{item}-front"])
            after = composite(base, after_layers, [f"{item}-rear", f"{item}-front"])
            before_light = on_light(before)
            after_light = on_light(after)
            compare = Image.new("RGB", (base.width * 2, base.height), "white")
            compare.paste(before_light, (0, 0))
            compare.paste(after_light, (base.width, 0))
            compare.save(output / f"{figure}-{item}-before-after-large.png")
            before_256 = before_light.resize((256, round(256 * base.height / base.width)), Image.Resampling.LANCZOS)
            after_256 = after_light.resize((256, round(256 * base.height / base.width)), Image.Resampling.LANCZOS)
            small = Image.new("RGB", (512, max(before_256.height, after_256.height)), "white")
            small.paste(before_256, (0, 0))
            small.paste(after_256, (256, 0))
            small.save(output / f"{figure}-{item}-before-after-256.png")
            figure_cards.extend([fit_card(before_light, (256, 320)), fit_card(after_light, (256, 320))])
        before_full = composite(
            base,
            before_layers,
            [
                *(f"{item}-rear" for item in FIGURES[figure]["items"]),
                *(f"{item}-front" for item in FIGURES[figure]["items"]),
            ],
        )
        after_full = composite(
            base,
            after_layers,
            [
                *(f"{item}-rear" for item in FIGURES[figure]["items"]),
                *(f"{item}-front" for item in FIGURES[figure]["items"]),
            ],
        )
        on_light(before_full).save(output / f"{figure}-full-before-large.png")
        on_light(after_full).save(output / f"{figure}-full-after-large.png")
        full_compare = Image.new("RGB", (base.width * 2, base.height), "white")
        full_compare.paste(on_light(before_full), (0, 0))
        full_compare.paste(on_light(after_full), (base.width, 0))
        full_compare.save(output / f"{figure}-full-before-after-large.png")
        row = Image.new("RGB", (256 * len(figure_cards), 320), "white")
        for index, card in enumerate(figure_cards):
            row.paste(card, (256 * index, 0))
        contact_rows.append(row)
    contact = Image.new("RGB", (1536, 320 * len(contact_rows)), "white")
    for index, row in enumerate(contact_rows):
        contact.paste(row, (0, 320 * index))
    contact.save(output / "quadrupeds-12-pairs-before-after.png")


def evidence_sheets(output: Path) -> None:
    """Write one durable, labelled 256 px before/after sheet per figure."""
    output.mkdir(parents=True, exist_ok=True)
    labels = {
        "head": "Kopf",
        "body": "Koerper",
        "adornment": "Beinschmuck",
    }
    for figure in FIGURES:
        base, before_layers = source_layers(figure)
        after_layers = repaired_layers(figure)
        rendered: list[tuple[str, Image.Image]] = []
        for item in FIGURES[figure]["items"]:
            before = on_light(composite(base, before_layers, [f"{item}-rear", f"{item}-front"]))
            after = on_light(composite(base, after_layers, [f"{item}-rear", f"{item}-front"]))
            height = round(256 * base.height / base.width)
            rendered.extend(
                [
                    (f"{labels[item]} - vorher", before.resize((256, height), Image.Resampling.LANCZOS)),
                    (f"{labels[item]} - nachher", after.resize((256, height), Image.Resampling.LANCZOS)),
                ]
            )
        header_height = 34
        label_height = 26
        card_height = max(card.height for _, card in rendered)
        sheet = Image.new("RGB", (256 * len(rendered), header_height + label_height + card_height), (248, 249, 245))
        draw = ImageDraw.Draw(sheet)
        title = f"{figure}: drei Zubehoer-Paare, Kartenbreite 256 px"
        draw.text((10, 10), title, fill=(24, 30, 38))
        for index, (label, card) in enumerate(rendered):
            x = index * 256
            draw.rectangle((x, header_height, x + 255, header_height + label_height + card_height - 1), outline=(188, 194, 200))
            draw.text((x + 8, header_height + 7), label, fill=(35, 42, 50))
            sheet.paste(card, (x, header_height + label_height))
        sheet.save(output / f"{figure}-pairs-256.png")


def verify_repairs(evidence_output: Path) -> None:
    """Verify immutable inputs, generated pixels, sidecars and durable sheets."""
    checked_layers = 0
    checked_sources = 0
    for figure in FIGURES:
        base_name = f"{figure}.png"
        base_path = SOURCE_PATH / base_name
        if base_path.read_bytes() != source_bytes(base_name):
            raise AssertionError(f"base changed from {SOURCE_REVISION}: {base_name}")
        checked_sources += 1
        config = recipe(figure)
        if not str(config.get("sourceRevision", "")).startswith(SOURCE_REVISION):
            raise AssertionError(f"recipe source revision mismatch: {figure}")
        for key, expected in repaired_layers(figure).items():
            item, plane = key.rsplit("-", 1)
            name = layer_name(figure, item, plane)
            path = SOURCE_PATH / name
            actual = Image.open(path).convert("RGBA")
            if actual.size != expected.size or not np.array_equal(np.asarray(actual), np.asarray(expected)):
                raise AssertionError(f"generated pixels differ: {name}")
            meta = json.loads(path.with_suffix(".json").read_text(encoding="utf-8"))
            if meta.get("originalCommit") != "24ce5a38b561c6012d7307603fc378ca339ab58c":
                raise AssertionError(f"source commit missing: {name}")
            if meta.get("registration") != {"scale": 1, "x": 0, "y": 0}:
                raise AssertionError(f"registration is not identity: {name}")
            if meta.get("sourceSha256") != sha256(path.read_bytes()):
                raise AssertionError(f"generated checksum mismatch: {name}")
            for original in meta.get("originalSources", []):
                if original.get("sha256") != sha256(source_bytes(original["path"])):
                    raise AssertionError(f"original checksum mismatch: {name}")
                checked_sources += 1
            checked_layers += 1
        sheet_path = evidence_output / f"{figure}-pairs-256.png"
        with Image.open(sheet_path) as sheet:
            if sheet.width != 1536 or sheet.height <= 300:
                raise AssertionError(f"invalid comparison sheet: {sheet_path.name}")
    print(json.dumps({"layers": checked_layers, "sourceChecks": checked_sources, "comparisonSheets": 4}))


def pilot_tiger(output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    base, layers = source_layers("tiger")
    before = composite(base, layers, ["adornment-front"])
    front = repair_tiger_adornment()
    after_layers = {"adornment-front": front}
    after = composite(base, after_layers, ["adornment-front"])
    on_light(before).save(output / "tiger-ring-before-large.png")
    on_light(after).save(output / "tiger-ring-after-large.png")
    before_256 = on_light(before).resize((256, round(256 * before.height / before.width)), Image.Resampling.LANCZOS)
    after_256 = on_light(after).resize((256, round(256 * after.height / after.width)), Image.Resampling.LANCZOS)
    before_256.save(output / "tiger-ring-before-256.png")
    after_256.save(output / "tiger-ring-after-256.png")
    comparison = Image.new("RGB", (base.width * 2, base.height), "white")
    comparison.paste(on_light(before), (0, 0))
    comparison.paste(on_light(after), (base.width, 0))
    comparison.save(output / "tiger-ring-before-after-large.png")
    small = Image.new("RGB", (512, max(before_256.height, after_256.height)), "white")
    small.paste(before_256, (0, 0))
    small.paste(after_256, (256, 0))
    small.save(output / "tiger-ring-before-after-256.png")
    front.save(output / "tiger-jungle-adornment-front-pilot.png")


def source_layers(figure: str) -> tuple[Image.Image, dict[str, Image.Image]]:
    base = source_image(f"{figure}.png")
    canvas = base.size
    layers: dict[str, Image.Image] = {}
    for item in FIGURES[figure]["items"]:
        rear = layer_name(figure, item, "rear")
        try:
            layers[f"{item}-rear"] = registered_source(rear, canvas)
        except subprocess.CalledProcessError:
            pass
        layers[f"{item}-front"] = registered_source(layer_name(figure, item), canvas)
    return base, layers


def checker(size: tuple[int, int], cell: int = 32) -> Image.Image:
    image = Image.new("RGBA", size, (245, 247, 250, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if ((x // cell) + (y // cell)) % 2:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=(223, 228, 235, 255))
    return image


def composite(base: Image.Image, layers: dict[str, Image.Image], keys: list[str]) -> Image.Image:
    output = Image.new("RGBA", base.size)
    for key in keys:
        if key.endswith("-rear") and key in layers:
            output.alpha_composite(layers[key])
    output.alpha_composite(base)
    for key in keys:
        if key.endswith("-front") and key in layers:
            output.alpha_composite(layers[key])
    return output


def on_light(image: Image.Image) -> Image.Image:
    background = Image.new("RGBA", image.size, (248, 249, 245, 255))
    background.alpha_composite(image)
    return background.convert("RGB")


def fit_card(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    result = image.copy()
    result.thumbnail(size, Image.Resampling.LANCZOS)
    card = Image.new("RGB", size, "white")
    card.paste(result.convert("RGB"), ((size[0] - result.width) // 2, (size[1] - result.height) // 2))
    return card


def inspect_sources(output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    cards: list[Image.Image] = []
    for figure in FIGURES:
        base, layers = source_layers(figure)
        all_keys = [
            *(f"{item}-rear" for item in FIGURES[figure]["items"]),
            *(f"{item}-front" for item in FIGURES[figure]["items"]),
        ]
        full = composite(base, layers, all_keys)
        on_light(full).save(output / f"{figure}-before-full-light.png")
        full.resize((256, round(256 * full.height / full.width)), Image.Resampling.LANCZOS).save(
            output / f"{figure}-before-256.png"
        )
        row = [fit_card(on_light(base), (320, 360))]
        for item in FIGURES[figure]["items"]:
            keys = [f"{item}-rear", f"{item}-front"]
            pair = composite(base, layers, keys)
            on_light(pair).save(output / f"{figure}-{item}-before-light.png")
            row.append(fit_card(on_light(pair), (320, 360)))
            for key in keys:
                if key not in layers:
                    continue
                layer = layers[key]
                visible = checker(layer.size)
                visible.alpha_composite(layer)
                visible.convert("RGB").save(output / f"{figure}-{key}-layer.png")
        row.append(fit_card(on_light(full), (320, 360)))
        strip = Image.new("RGB", (320 * len(row), 360), "white")
        for index, card in enumerate(row):
            strip.paste(card, (320 * index, 0))
        cards.append(strip)
    contact = Image.new("RGB", (1600, 360 * len(cards)), "white")
    for index, row in enumerate(cards):
        contact.paste(row, (0, 360 * index))
    contact.save(output / "quadrupeds-before-contact.png")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("inspect", "pilot-tiger", "preview", "evidence", "write", "verify"))
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    if args.command == "inspect":
        inspect_sources(args.output)
    elif args.command == "pilot-tiger":
        pilot_tiger(args.output)
    elif args.command == "preview":
        preview_repairs(args.output)
    elif args.command == "evidence":
        evidence_sheets(args.output)
    elif args.command == "write":
        write_repairs()
        preview_repairs(args.output)
        evidence_sheets(ROOT / "docs/design/avatar-fit-v3/quadrupeds")
    elif args.command == "verify":
        verify_repairs(ROOT / "docs/design/avatar-fit-v3/quadrupeds")


if __name__ == "__main__":
    main()
