#!/usr/bin/env python3
"""Deterministic classical raster fitting for the four winged avatar figures.

Inputs always come from the immutable source revision.  Final equipment layers
use the base figure's full canvas with identity registration.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[2]
SOURCE_REVISION = "24ce5a3"
SOURCE_DIR = "docs/design/avatar-shop-sources"
RECIPE_DIR = "docs/design/avatar-fit-recipes/wings"
PUBLISHED_DIR = "docs/design/avatar-fit-v3/wings"
DEFAULT_OUTPUT = ROOT / ".superpowers/sdd/2026-09-20-avatar-fit-v3/wings"

FIGURES = {
    "dragon": {
        "set": "crystal",
        "layers": {
            "head": "dragon-crystal-head-front.png",
            "body": "dragon-crystal-body-front.png",
            "adornment": "dragon-crystal-adornment-front.png",
        },
    },
    "dragon-crystal": {
        "set": "crystal",
        "layers": {
            "head": "dragon-crystal-crystal-head-front.png",
            "body": "dragon-crystal-crystal-body-front.png",
            "adornment": "dragon-crystal-crystal-adornment-front.png",
        },
    },
    "griffin-storm": {
        "set": "storm",
        "layers": {
            "head": "griffin-storm-storm-head-front.png",
            "body": "griffin-storm-storm-body-front.png",
            "adornment": "griffin-storm-storm-adornment-front.png",
        },
    },
    "phoenix": {
        "set": "sun",
        "layers": {
            "head": "phoenix-sun-head-front.png",
            "body": "phoenix-sun-body-front.png",
            "adornment": "phoenix-sun-adornment-front.png",
        },
    },
}

# All coordinates are on the unchanged native base canvas.  Polygons describe
# only occlusion or allowed equipment regions, never body repainting.
RECIPES = {
    "dragon": {
        "head": {
            "rear": [
                [(415, 425), (455, 410), (485, 468), (448, 495)],
                [(565, 425), (610, 410), (615, 480), (575, 500)],
            ],
        },
        "body": {
            "rear": [
                [(315, 650), (360, 615), (415, 682), (395, 742), (345, 720)],
                [(550, 625), (620, 595), (670, 662), (642, 725), (588, 700)],
            ],
            "soften": 5,
        },
        "adornment": {
            "edge": 37,
        },
    },
    "dragon-crystal": {
        "head": {
            "rear": [
                [(415, 425), (455, 410), (485, 468), (448, 495)],
                [(565, 425), (610, 410), (615, 480), (575, 500)],
            ],
        },
        "body": {
            "rear": [
                [(315, 650), (360, 615), (415, 682), (395, 742), (345, 720)],
                [(550, 625), (620, 595), (670, 662), (642, 725), (588, 700)],
            ],
            "soften": 5,
        },
        "adornment": {
            "edge": 37,
        },
    },
    "griffin-storm": {
        "head": {
            "allowed": [[(245, 355), (525, 345), (535, 515), (445, 675), (245, 680), (235, 475)]],
            "rear": [
                [(245, 355), (310, 330), (350, 405), (305, 445)],
                [(440, 335), (520, 315), (550, 405), (480, 445)],
            ],
        },
        "body": {
            "rear": [
                [(455, 165), (1190, 80), (1180, 550), (1080, 585), (980, 620),
                 (865, 650), (755, 680), (650, 690), (570, 645), (520, 570), (480, 450)],
            ],
            "rearOccluded": [
                [(538, 938), (653, 905), (668, 949), (542, 980)],
                [(534, 929), (542, 929), (542, 968), (534, 968)],
            ],
        },
        "adornment": {
            "discard": [
                [(250, 520), (760, 520), (800, 1284), (250, 1284)],
                [(780, 650), (1225, 650), (1225, 1284), (780, 1284)],
            ],
            "discardHard": [
                [(994, 344), (1016, 344), (1016, 371), (994, 371)],
            ],
            "edge": 31,
        },
    },
    "phoenix": {
        "head": {
            "rear": [[(650, 275), (720, 245), (775, 320), (700, 355)]],
        },
        "body": {
            "rear": [
                [(408, 505), (470, 470), (520, 540), (465, 590)],
                [(680, 465), (755, 430), (770, 545), (705, 570)],
            ],
        },
        "adornment": {
            "rear": [
                [(250, 170), (300, 135), (345, 250), (295, 275)],
                [(335, 315), (385, 275), (435, 395), (380, 420)],
                [(430, 455), (480, 420), (515, 535), (465, 560)],
                [(650, 145), (700, 120), (735, 245), (685, 265)],
                [(690, 300), (745, 280), (785, 405), (730, 425)],
                [(660, 480), (720, 455), (755, 575), (700, 595)],
            ],
        },
    },
}

ITEM_RESULTS = {
    "dragon": {
        "head": "The side chain now passes behind the neck scales while the central rune pendant remains on the upper breast.",
        "body": "Both forelegs locally occlude the lower shoulder plates, while the linked central plate and dark under-straps remain attached to the breast.",
        "adornment": "Deep ornament pixels pass behind the wing membranes; only contour caps and crystals remain in front along both wing edges.",
    },
    "dragon-crystal": {
        "head": "The side chain now passes behind the crystal neck scales while the central rune pendant remains on the upper breast.",
        "body": "Both forelegs locally occlude the lower shoulder plates, while the linked central plate and dark under-straps remain attached to the breast.",
        "adornment": "Deep ornament pixels pass behind the luminous membranes; only contour caps and crystals remain in front along both wing edges.",
    },
    "griffin-storm": {
        "head": "The forehead loop was removed; the necklace now begins at the feathered neck and terminates in one breast pendant.",
        "body": "The near wing occludes the upper flank armor, and the lower belly strap now passes behind the body without a floating span; attached buckles remain visible.",
        "adornment": "Lower chains crossing the torso and hindquarters and one isolated gold fragment were removed; the remaining caps and jewels follow the wing-tip groups.",
    },
    "phoenix": {
        "head": "A crest feather passes in front of the lower crown band, giving the crown a seated rear edge while preserving the face.",
        "body": "Side branches pass behind selected breast and wing-root feathers while the central sun jewel remains attached on the breast.",
        "adornment": "Six feather-shaped occlusions alternate the gold cuffs behind and in front of the selected wing-feather bundles.",
    },
}

FIGURE_LABELS = {
    "dragon": "Einfacher Drache",
    "dragon-crystal": "Kristalldrache",
    "griffin-storm": "Sturmgreif",
    "phoenix": "Phoenix",
}

ITEM_LABELS = {
    "head": "Kopf / Hals",
    "body": "Koerper",
    "adornment": "Fluegelzier",
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


def source_layers(figure: str) -> tuple[Image.Image, dict[str, Image.Image]]:
    base = source_image(f"{figure}.png")
    layers = {
        item: registered_source(name, base.size)
        for item, name in FIGURES[figure]["layers"].items()
    }
    return base, layers


def polygon_mask(
    size: tuple[int, int],
    polygons: list[list[tuple[int, int]]] | None,
    blur: float = 0,
) -> np.ndarray:
    mask = Image.new("L", size)
    if polygons:
        draw = ImageDraw.Draw(mask)
        for polygon in polygons:
            draw.polygon(polygon, fill=255)
    if blur:
        mask = mask.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(mask, dtype=np.float32) / 255.0


def rgba_with_alpha(image: Image.Image, alpha: np.ndarray) -> Image.Image:
    pixels = np.asarray(image).copy()
    pixels[:, :, 3] = alpha.astype(np.uint8)
    return Image.fromarray(pixels, "RGBA")


def eroded_body_mask(base: Image.Image, width: int) -> np.ndarray:
    alpha = np.asarray(base.getchannel("A"))
    binary = Image.fromarray(np.where(alpha > 20, 255, 0).astype(np.uint8), "L")
    filter_size = max(3, width | 1)
    eroded = binary.filter(ImageFilter.MinFilter(filter_size)).filter(ImageFilter.GaussianBlur(4))
    return np.asarray(eroded, dtype=np.float32) / 255.0


def dilated_body_mask(base: Image.Image, width: int) -> np.ndarray:
    alpha = np.asarray(base.getchannel("A"))
    binary = Image.fromarray(np.where(alpha > 8, 255, 0).astype(np.uint8), "L")
    filter_size = max(3, width | 1)
    dilated = binary.filter(ImageFilter.MaxFilter(filter_size)).filter(ImageFilter.GaussianBlur(3))
    return np.asarray(dilated, dtype=np.float32) / 255.0


def split_layer(
    base: Image.Image,
    layer: Image.Image,
    recipe: dict,
) -> tuple[Image.Image, Image.Image]:
    alpha = np.asarray(layer.getchannel("A"))
    allowed_spec = recipe.get("allowed")
    allowed = polygon_mask(base.size, allowed_spec, 5) if allowed_spec else np.ones(alpha.shape, dtype=np.float32)
    discard = polygon_mask(base.size, recipe.get("discard"), 5)
    discard = np.maximum(discard, polygon_mask(base.size, recipe.get("discardHard")))
    allowed *= 1.0 - discard
    if recipe.get("attachment"):
        allowed *= dilated_body_mask(base, int(recipe["attachment"]))
    alpha = alpha.astype(np.float32) * allowed
    rear = polygon_mask(base.size, recipe.get("rear"), float(recipe.get("soften", 10)))
    rear_occluded = polygon_mask(base.size, recipe.get("rearOccluded"))
    rear = np.maximum(rear, rear_occluded)
    if recipe.get("edge"):
        rear = np.maximum(rear, eroded_body_mask(base, int(recipe["edge"])))
    rear_alpha = np.clip(alpha * rear, 0, 255).astype(np.uint8)
    if recipe.get("rearOccluded"):
        body_alpha = np.asarray(base.getchannel("A"), dtype=np.float32) / 255.0
        rear_alpha = np.where(
            rear_occluded > 0,
            rear_alpha.astype(np.float32) * body_alpha,
            rear_alpha,
        ).astype(np.uint8)
    front_alpha = np.clip(alpha * (1.0 - rear), 0, 255).astype(np.uint8)
    return rgba_with_alpha(layer, rear_alpha), rgba_with_alpha(layer, front_alpha)


def fitted_layers(figure: str) -> tuple[Image.Image, dict[str, dict[str, Image.Image]]]:
    base, sources = source_layers(figure)
    layers = {}
    for item in ("head", "body", "adornment"):
        rear, front = split_layer(base, sources[item], RECIPES[figure][item])
        layers[item] = {"rear": rear, "front": front, "source": sources[item]}
    return base, layers


def composite(base: Image.Image, layers: dict[str, Image.Image], items: list[str]) -> Image.Image:
    output = base.copy()
    for item in items:
        output.alpha_composite(layers[item])
    return output


def fitted_composite(
    base: Image.Image,
    layers: dict[str, dict[str, Image.Image]],
    items: list[str],
) -> Image.Image:
    output = Image.new("RGBA", base.size)
    for item in items:
        output.alpha_composite(layers[item]["rear"])
    output.alpha_composite(base)
    for item in items:
        output.alpha_composite(layers[item]["front"])
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


def load_font(size: int) -> ImageFont.ImageFont:
    try:
        return ImageFont.truetype("DejaVuSans.ttf", size)
    except OSError:
        return ImageFont.load_default()


def inspect_sources(output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    rows: list[Image.Image] = []
    for figure in FIGURES:
        base, layers = source_layers(figure)
        full = composite(base, layers, ["head", "body", "adornment"])
        on_light(full).save(output / f"{figure}-before-full-light.png")
        card = on_light(full).resize(
            (256, round(256 * full.height / full.width)), Image.Resampling.LANCZOS
        )
        card.save(output / f"{figure}-before-256.png")
        cells = [fit_card(on_light(base), (330, 400))]
        for item in ("head", "body", "adornment"):
            pair = composite(base, layers, [item])
            on_light(pair).save(output / f"{figure}-{item}-before-light.png")
            cells.append(fit_card(on_light(pair), (330, 400)))
        cells.append(fit_card(on_light(full), (330, 400)))
        row = Image.new("RGB", (330 * len(cells), 400), "white")
        for index, cell in enumerate(cells):
            row.paste(cell, (330 * index, 0))
        rows.append(row)
    contact = Image.new("RGB", (330 * 5, 400 * len(rows)), "white")
    for index, row in enumerate(rows):
        contact.paste(row, (0, 400 * index))
    contact.save(output / "wings-before-contact.png")


def save_preview(output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    contact_rows: list[Image.Image] = []
    detail_rows: list[Image.Image] = []
    for figure in FIGURES:
        base, before_layers = source_layers(figure)
        _, after_layers = fitted_layers(figure)
        row_cells: list[Image.Image] = []
        detail_cells: list[Image.Image] = []
        for item in ("head", "body", "adornment"):
            before = composite(base, before_layers, [item])
            after = fitted_composite(base, after_layers, [item])
            on_light(before).save(output / f"{figure}-{item}-before-light.png")
            on_light(after).save(output / f"{figure}-{item}-after-light.png")
            before_256 = on_light(before).resize(
                (256, round(256 * before.height / before.width)), Image.Resampling.LANCZOS
            )
            after_256 = on_light(after).resize(
                (256, round(256 * after.height / after.width)), Image.Resampling.LANCZOS
            )
            before_256.save(output / f"{figure}-{item}-before-256.png")
            after_256.save(output / f"{figure}-{item}-after-256.png")
            pair = Image.new("RGB", (660, 400), "white")
            pair.paste(fit_card(on_light(before), (330, 400)), (0, 0))
            pair.paste(fit_card(on_light(after), (330, 400)), (330, 0))
            pair.save(output / f"{figure}-{item}-before-after.png")
            before_alpha = np.asarray(before_layers[item].getchannel("A")) > 8
            after_alpha = (
                np.asarray(after_layers[item]["rear"].getchannel("A")) > 8
            ) | (
                np.asarray(after_layers[item]["front"].getchannel("A")) > 8
            )
            ys, xs = np.where(before_alpha | after_alpha)
            pad = 45
            left = max(0, int(xs.min()) - pad)
            top = max(0, int(ys.min()) - pad)
            right = min(base.width, int(xs.max()) + 1 + pad)
            bottom = min(base.height, int(ys.max()) + 1 + pad)
            before_detail = on_light(before).crop((left, top, right, bottom))
            after_detail = on_light(after).crop((left, top, right, bottom))
            detail_height = max(before_detail.height, after_detail.height)
            detail = Image.new("RGB", (before_detail.width + after_detail.width, detail_height), "white")
            detail.paste(before_detail, (0, 0))
            detail.paste(after_detail, (before_detail.width, 0))
            detail.save(output / f"{figure}-{item}-detail-before-after.png")
            detail_cells.append(fit_card(detail, (700, 420)))
            row_cells.append(pair)
        before_full = composite(base, before_layers, ["head", "body", "adornment"])
        after_full = fitted_composite(base, after_layers, ["head", "body", "adornment"])
        on_light(before_full).save(output / f"{figure}-before-full-light.png")
        on_light(after_full).save(output / f"{figure}-after-full-light.png")
        after_full.resize(
            (256, round(256 * after_full.height / after_full.width)), Image.Resampling.LANCZOS
        ).save(output / f"{figure}-after-256.png")
        full_pair = Image.new("RGB", (660, 400), "white")
        full_pair.paste(fit_card(on_light(before_full), (330, 400)), (0, 0))
        full_pair.paste(fit_card(on_light(after_full), (330, 400)), (330, 0))
        full_pair.save(output / f"{figure}-full-before-after.png")
        row = Image.new("RGB", (660 * 4, 400), "white")
        for index, pair in enumerate([*row_cells, full_pair]):
            row.paste(pair, (660 * index, 0))
        contact_rows.append(row)
        detail_row = Image.new("RGB", (700 * 3, 420), "white")
        for index, detail_cell in enumerate(detail_cells):
            detail_row.paste(detail_cell, (700 * index, 0))
        detail_rows.append(detail_row)
    contact = Image.new("RGB", (660 * 4, 400 * len(contact_rows)), "white")
    for index, row in enumerate(contact_rows):
        contact.paste(row, (0, 400 * index))
    contact.save(output / "wings-before-after-contact.png")
    detail_contact = Image.new("RGB", (700 * 3, 420 * len(detail_rows)), "white")
    for index, row in enumerate(detail_rows):
        detail_contact.paste(row, (0, 420 * index))
    detail_contact.save(output / "wings-detail-before-after-contact.png")


def png_bytes(image: Image.Image) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG", optimize=True, compress_level=9)
    return buffer.getvalue()


def save_png(image: Image.Image, path: Path) -> bytes:
    data = png_bytes(image)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return data


def save_published_evidence() -> None:
    destination = ROOT / PUBLISHED_DIR
    destination.mkdir(parents=True, exist_ok=True)
    title_font = load_font(34)
    label_font = load_font(25)
    small_font = load_font(20)
    card_sources: list[tuple[str, str, Image.Image]] = []

    for figure in FIGURES:
        base, before_layers = source_layers(figure)
        _, after_layers = fitted_layers(figure)
        page = Image.new("RGB", (1400, 1740), (248, 249, 245))
        draw = ImageDraw.Draw(page)
        draw.text((45, 25), f"{FIGURE_LABELS[figure]} - Vorher / Nachher", fill=(27, 38, 52), font=title_font)
        draw.text((265, 78), "VORHER", fill=(86, 95, 108), font=label_font)
        draw.text((965, 78), "NACHHER", fill=(39, 103, 84), font=label_font)
        for row_index, item in enumerate(("head", "body", "adornment")):
            top = 120 + row_index * 535
            draw.text((45, top), ITEM_LABELS[item], fill=(27, 38, 52), font=label_font)
            before = on_light(composite(base, before_layers, [item]))
            after = on_light(fitted_composite(base, after_layers, [item]))
            page.paste(fit_card(before, (650, 485)), (30, top + 38))
            page.paste(fit_card(after, (650, 485)), (720, top + 38))
            card_sources.append((FIGURE_LABELS[figure], ITEM_LABELS[item], after))
        page.save(destination / f"{figure}-before-after.png", optimize=True)

    card_sheet = Image.new("RGB", (1080, 1720), (248, 249, 245))
    draw = ImageDraw.Draw(card_sheet)
    draw.text((35, 18), "Alle 12 Paare - echte 256-Pixel-Kompositionen", fill=(27, 38, 52), font=title_font)
    for index, (figure_label, item_label, after) in enumerate(card_sources):
        row = index // 3
        column = index % 3
        left = column * 360
        top = 80 + row * 405
        draw.text((left + 30, top), figure_label, fill=(27, 38, 52), font=small_font)
        draw.text((left + 30, top + 25), item_label, fill=(86, 95, 108), font=small_font)
        card = after.resize((256, round(256 * after.height / after.width)), Image.Resampling.LANCZOS)
        card_sheet.paste(card, (left + 52, top + 55))
    card_sheet.save(destination / "all-pairs-after-256.png", optimize=True)


def output_names(front_name: str) -> tuple[str, str]:
    if not front_name.endswith("-front.png"):
        raise ValueError(f"Unexpected front layer name: {front_name}")
    return front_name.replace("-front.png", "-rear.png"), front_name


def apply_changes(output: Path) -> None:
    source_root = ROOT / SOURCE_DIR
    recipe_root = ROOT / RECIPE_DIR
    recipe_root.mkdir(parents=True, exist_ok=True)
    output.mkdir(parents=True, exist_ok=True)

    for figure, figure_spec in FIGURES.items():
        base_name = f"{figure}.png"
        base_original = source_bytes(base_name)
        base_path = source_root / base_name
        if base_path.read_bytes() != base_original:
            raise RuntimeError(f"Base figure differs from {SOURCE_REVISION}: {base_name}")

        base, fitted = fitted_layers(figure)
        recipe_items = {}
        for item, front_name in figure_spec["layers"].items():
            input_bytes = source_bytes(front_name)
            input_meta = source_json(front_name.removesuffix(".png") + ".json")
            rear_name, final_front_name = output_names(front_name)
            rear_path = source_root / rear_name
            front_path = source_root / final_front_name
            rear_bytes = save_png(fitted[item]["rear"], rear_path)
            front_bytes = save_png(fitted[item]["front"], front_path)
            if fitted[item]["rear"].getchannel("A").getbbox() is None:
                raise RuntimeError(f"Empty rear layer: {figure}/{item}")
            if fitted[item]["front"].getchannel("A").getbbox() is None:
                raise RuntimeError(f"Empty front layer: {figure}/{item}")
            recipe_items[item] = {
                "input": {
                    "path": f"{SOURCE_DIR}/{front_name}",
                    "sha256": sha256(input_bytes),
                    "registration": input_meta.get("registration", {"scale": 1, "x": 0, "y": 0}),
                },
                "operations": RECIPES[figure][item],
                "outputs": {
                    "rear": {"path": f"{SOURCE_DIR}/{rear_name}", "sha256": sha256(rear_bytes)},
                    "front": {"path": f"{SOURCE_DIR}/{final_front_name}", "sha256": sha256(front_bytes)},
                },
            }

        recipe = {
            "schema": "avatar-classical-fit-recipe-v1",
            "figure": figure,
            "set": figure_spec["set"],
            "sourceRevision": SOURCE_REVISION,
            "sourceCapture": "git show <sourceRevision>:<path> with binary stdout capture",
            "base": {
                "path": f"{SOURCE_DIR}/{base_name}",
                "sha256": sha256(base_original),
                "unchangedByteForByte": True,
                "canvas": {"width": base.width, "height": base.height},
            },
            "method": "Pillow and NumPy alpha masks; original equipment pixels only; no generative image step",
            "items": recipe_items,
        }
        recipe_path = recipe_root / f"{figure}.json"
        recipe_path.write_bytes((json.dumps(recipe, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))

        for item, front_name in figure_spec["layers"].items():
            rear_name, final_front_name = output_names(front_name)
            source_hash = recipe_items[item]["input"]["sha256"]
            common = {
                "reference": base_name,
                "generator": "classical-raster-edit/pillow-numpy",
                "editedOn": "2026-09-20",
                "provenance": (
                    f"Classical alpha-mask edit of {front_name}, captured byte-for-byte from Git revision "
                    f"{SOURCE_REVISION}; no generated or repainted pixels."
                ),
                "inputSourceFile": front_name,
                "sourceRevision": SOURCE_REVISION,
                "sourceSha256": source_hash,
                "baseSourceSha256": sha256(base_original),
                "recipe": f"../avatar-fit-recipes/wings/{figure}.json",
                "registration": {"scale": 1, "x": 0, "y": 0},
                "canvas": {"width": base.width, "height": base.height},
                "qa": {
                    "status": "fit-pass-complete-pending-user-acceptance",
                    "method": "Full-resolution light-background composition, item detail pair, complete set and 256 px card inspected from immutable original inputs.",
                    "evidence": f"../../../.superpowers/sdd/2026-09-20-avatar-fit-v3/wings/{figure}-{item}-before-after.png",
                    "detailEvidence": f"../../../.superpowers/sdd/2026-09-20-avatar-fit-v3/wings/{figure}-{item}-detail-before-after.png",
                    "result": ITEM_RESULTS[figure][item],
                    "limits": "Internal visual fit pass only; personal user acceptance and product WebP build remain separate.",
                },
            }
            for plane, name in (("rear", rear_name), ("front", final_front_name)):
                path = source_root / name
                meta = {
                    "sourceFile": name,
                    **common,
                    "plane": plane,
                    "outputSha256": sha256(path.read_bytes()),
                }
                path.with_suffix(".json").write_bytes(
                    (json.dumps(meta, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
                )

    save_preview(output)
    save_published_evidence()


def verify_changes(output: Path) -> None:
    source_root = ROOT / SOURCE_DIR
    recipe_root = ROOT / RECIPE_DIR
    checked_pairs = 0
    for figure, figure_spec in FIGURES.items():
        base_name = f"{figure}.png"
        base_original = source_bytes(base_name)
        if (source_root / base_name).read_bytes() != base_original:
            raise RuntimeError(f"Base figure changed: {base_name}")
        base, fitted = fitted_layers(figure)
        recipe_path = recipe_root / f"{figure}.json"
        recipe = json.loads(recipe_path.read_text(encoding="utf-8"))
        if recipe["base"]["sha256"] != sha256(base_original):
            raise RuntimeError(f"Recipe base hash mismatch: {figure}")
        for item, front_name in figure_spec["layers"].items():
            rear_name, final_front_name = output_names(front_name)
            for plane, name in (("rear", rear_name), ("front", final_front_name)):
                path = source_root / name
                actual = path.read_bytes()
                expected = png_bytes(fitted[item][plane])
                if actual != expected:
                    raise RuntimeError(f"Non-deterministic or stale layer: {name}")
                with Image.open(io.BytesIO(actual)) as image:
                    if image.size != base.size or image.mode != "RGBA":
                        raise RuntimeError(f"Canvas/mode mismatch: {name}")
                    if image.getchannel("A").getbbox() is None:
                        raise RuntimeError(f"Empty layer: {name}")
                metadata = json.loads(path.with_suffix(".json").read_text(encoding="utf-8"))
                if metadata.get("registration") != {"scale": 1, "x": 0, "y": 0}:
                    raise RuntimeError(f"Registration is not identity: {name}")
                if metadata.get("canvas") != {"width": base.width, "height": base.height}:
                    raise RuntimeError(f"Metadata canvas mismatch: {name}")
                if metadata.get("outputSha256") != sha256(actual):
                    raise RuntimeError(f"Metadata output hash mismatch: {name}")
                if metadata.get("sourceSha256") != sha256(source_bytes(front_name)):
                    raise RuntimeError(f"Metadata input hash mismatch: {name}")
                recipe_hash = recipe["items"][item]["outputs"][plane]["sha256"]
                if recipe_hash != sha256(actual):
                    raise RuntimeError(f"Recipe output hash mismatch: {name}")
            checked_pairs += 1
    expected_evidence = [
        output / "wings-before-after-contact.png",
        output / "wings-detail-before-after-contact.png",
        *(output / f"{figure}-after-full-light.png" for figure in FIGURES),
        *(output / f"{figure}-after-256.png" for figure in FIGURES),
        *(
            output / f"{figure}-{item}-{state}-256.png"
            for figure in FIGURES
            for item in ("head", "body", "adornment")
            for state in ("before", "after")
        ),
        *(
            output / f"{figure}-{item}-detail-before-after.png"
            for figure in FIGURES
            for item in ("head", "body", "adornment")
        ),
    ]
    missing = [str(path) for path in expected_evidence if not path.is_file()]
    if missing:
        raise RuntimeError(f"Missing evidence: {missing}")
    published = [
        ROOT / PUBLISHED_DIR / "all-pairs-after-256.png",
        *(ROOT / PUBLISHED_DIR / f"{figure}-before-after.png" for figure in FIGURES),
    ]
    missing_published = [str(path) for path in published if not path.is_file()]
    if missing_published:
        raise RuntimeError(f"Missing published evidence: {missing_published}")
    print(json.dumps({
        "sourceRevision": SOURCE_REVISION,
        "figures": len(FIGURES),
        "pairs": checked_pairs,
        "outputLayers": checked_pairs * 2,
        "basesByteIdentical": True,
        "deterministicPngs": True,
        "identityRegistration": True,
        "evidenceFilesChecked": len(expected_evidence) + len(published),
    }, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("inspect", "preview", "apply", "verify"))
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    if args.command == "inspect":
        inspect_sources(args.output)
    elif args.command == "preview":
        save_preview(args.output)
    elif args.command == "apply":
        apply_changes(args.output)
    elif args.command == "verify":
        verify_changes(args.output)


if __name__ == "__main__":
    main()
