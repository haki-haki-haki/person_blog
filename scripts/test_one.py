"""快速测试单张图片 - 宽版"""
import sys, os
from PIL import Image, ImageEnhance, ImageFilter

WIDTH = 100      # 更宽
CONTRAST = 2.5   # 更高对比度
BRIGHTNESS = 1.1
SHARPEN = True
INVERT = False
CHAR_SET = "@%#*+=-:. "

img_path = os.path.join(os.path.dirname(__file__), "..", "img", "Naruto_1_寄到春日信_来自小红书网页版.jpg")

img = Image.open(img_path).convert('L')
aspect = img.height / img.width
height = int(WIDTH * aspect * 0.55)
img = img.resize((WIDTH, height), Image.LANCZOS)
img = ImageEnhance.Contrast(img).enhance(CONTRAST)
img = ImageEnhance.Brightness(img).enhance(BRIGHTNESS)
if SHARPEN:
    img = img.filter(ImageFilter.SHARPEN)

pixels = list(img.getdata())
cl = len(CHAR_SET)
result = ""
for i, px in enumerate(pixels):
    result += CHAR_SET[int(px / 255 * (cl - 1))]
    if (i + 1) % WIDTH == 0:
        result += "\n"

print(result)
print(f"\n--- {WIDTH}x{height}, contrast={CONTRAST} ---")
