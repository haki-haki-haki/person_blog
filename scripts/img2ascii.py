"""
图片转ASCII字符画工具
可调整参数：输出宽度、字符集、亮度反转、对比度增强等
"""
import sys
import os
from PIL import Image, ImageEnhance, ImageFilter
import json

# ============ 可调参数 ============
OUTPUT_WIDTH = 600         # ASCII 输出宽度（字符列数）- 超高分辨率铺满屏幕
CONTRAST = 3.5             # 对比度增强 (1.0=原图, >1增强)
BRIGHTNESS = 0.95          # 亮度 (1.0=原图)
SHARPEN = True             # 是否锐化
DETAIL_ENHANCE = True      # 细节增强
INVERT = False             # 是否反转黑白（白底黑字 → 黑底白字？）
CHAR_SET = "@%#&$*+=;:,.<>[]{}|/\\~^`'\"0123456789abcdefghijklmnopqrstuvwxyz"    # 62级灰度，极高细节
# CHAR_SET = " .,-:;=+*$&#%@"  # 如果反转用这个

# ============ 工具函数 ============
def image_to_ascii(image_path, width=OUTPUT_WIDTH):
    """将图片转为ASCII字符串"""
    img = Image.open(image_path).convert('L')  # 转灰度

    aspect = img.height / img.width
    height = int(width * aspect * 0.55)

    img = img.resize((width, height), Image.LANCZOS)

    if DETAIL_ENHANCE:
        img = img.filter(ImageFilter.DETAIL)

    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(CONTRAST)

    enhancer = ImageEnhance.Brightness(img)
    img = enhancer.enhance(BRIGHTNESS)

    if SHARPEN:
        img = img.filter(ImageFilter.SHARPEN)
        img = img.filter(ImageFilter.SHARPEN)

    pixels = img.get_flattened_data()
    char_len = len(CHAR_SET)

    ascii_str = ""
    for i, px in enumerate(pixels):
        if INVERT:
            px = 255 - px
        idx = int(px / 255 * (char_len - 1))
        ascii_str += CHAR_SET[idx]
        if (i + 1) % width == 0:
            ascii_str += "\n"

    return ascii_str


def main():
    img_dir = os.path.join(os.path.dirname(__file__), "..", "img")
    out_dir = os.path.join(os.path.dirname(__file__), "..", "src", "assets", "ascii_art")
    os.makedirs(out_dir, exist_ok=True)

    results = []

    for fname in sorted(os.listdir(img_dir)):
        if fname.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.webp')):
            img_path = os.path.join(img_dir, fname)
            print(f"转换: {fname} ...")

            ascii_art = image_to_ascii(img_path)

            base = os.path.splitext(fname)[0]
            out_path = os.path.join(out_dir, f"{base}.txt")
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(ascii_art)

            pre_path = os.path.join(out_dir, f"{base}.html.txt")
            with open(pre_path, "w", encoding="utf-8") as f:
                f.write(ascii_art)

            results.append({
                "file": fname,
                "output": f"ascii_art/{base}.txt",
                "lines": ascii_art.count("\n"),
                "chars": len(ascii_art),
            })
            print(f"  → {out_path}  ({ascii_art.count(chr(10))} 行)")

    index_path = os.path.join(out_dir, "index.json")
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n全部完成！共 {len(results)} 张图片")
    print(f"输出目录: {out_dir}")
    print(f"参数: 宽度={OUTPUT_WIDTH}, 对比度={CONTRAST}, "
          f"亮度={BRIGHTNESS}, 字符集长度={len(CHAR_SET)}")


if __name__ == "__main__":
    main()