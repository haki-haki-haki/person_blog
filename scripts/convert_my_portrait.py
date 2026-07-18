"""
图片转ASCII字符画工具 - 针对1.jpg优化
字体更小，字符更密集
"""
import sys
import os
from PIL import Image, ImageEnhance, ImageFilter
import json

OUTPUT_WIDTH = 120
CONTRAST = 2.5
BRIGHTNESS = 1.1
SHARPEN = True
CHAR_SET = "@%#*+=-:. "

def image_to_ascii(image_path, width=OUTPUT_WIDTH):
    img = Image.open(image_path).convert('L')
    aspect = img.height / img.width
    height = int(width * aspect * 0.5)
    img = img.resize((width, height), Image.LANCZOS)
    img = ImageEnhance.Contrast(img).enhance(CONTRAST)
    img = ImageEnhance.Brightness(img).enhance(BRIGHTNESS)
    if SHARPEN:
        img = img.filter(ImageFilter.SHARPEN)

    pixels = list(img.getdata())
    cl = len(CHAR_SET)
    ascii_str = ""
    for i, px in enumerate(pixels):
        ascii_str += CHAR_SET[int(px / 255 * (cl - 1))]
        if (i + 1) % width == 0:
            ascii_str += "\n"

    return ascii_str

def main():
    img_dir = os.path.join(os.path.dirname(__file__), "..", "img")
    out_dir = os.path.join(os.path.dirname(__file__), "..", "src", "assets")
    os.makedirs(out_dir, exist_ok=True)

    print(f"转换: 1.jpg ...")
    ascii_art = image_to_ascii(os.path.join(img_dir, "1.jpg"))
    out_path = os.path.join(out_dir, "my-portrait.txt")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(ascii_art)
    print(f"  → {out_path}  ({ascii_art.count(chr(10))} 行)")

    print(f"\n转换: 2.jpg ...")
    ascii_art = image_to_ascii(os.path.join(img_dir, "2.jpg"))
    out_path = os.path.join(out_dir, "my-portrait-left.txt")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(ascii_art)
    print(f"  → {out_path}  ({ascii_art.count(chr(10))} 行)")

    print(f"\n转换: 3.jpg (小尺寸) ...")
    ascii_art = image_to_ascii(os.path.join(img_dir, "3.jpg"), width=60)
    out_path = os.path.join(out_dir, "my-portrait-small.txt")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(ascii_art)
    print(f"  → {out_path}  ({ascii_art.count(chr(10))} 行)")

    print(f"\n参数: 宽度={OUTPUT_WIDTH}, 对比度={CONTRAST}, 字符集={CHAR_SET}")

if __name__ == "__main__":
    main()
