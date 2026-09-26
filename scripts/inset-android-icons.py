"""Inset Android adaptive icon artwork without changing canvas dimensions.

Run with: python scripts/inset-android-icons.py
Requires Pillow (python -m pip install Pillow).
"""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SCALE = 0.68
ICONS = (
    ROOT / "assets/images/android-icon-foreground.png",
    ROOT / "assets/images/android-icon-monochrome.png",
)


def inset_icon(path: Path) -> None:
    with Image.open(path) as source:
        artwork = source.convert("RGBA")
        width, height = artwork.size
        bounds = artwork.getchannel("A").getbbox()
        if bounds and all((bounds[0] >= width * 0.16,
                           bounds[1] >= height * 0.16,
                           bounds[2] <= width * 0.84,
                           bounds[3] <= height * 0.84)):
            print(f"Already inset: {path.relative_to(ROOT)}")
            return
        scaled = artwork.resize(
            (round(width * SCALE), round(height * SCALE)), Image.Resampling.LANCZOS
        )
        canvas = Image.new("RGBA", artwork.size, (0, 0, 0, 0))
        canvas.alpha_composite(scaled, ((width - scaled.width) // 2, (height - scaled.height) // 2))
        canvas.save(path)
        print(f"Inset {path.relative_to(ROOT)} to {SCALE:.0%} of its original size")


for icon in ICONS:
    inset_icon(icon)
