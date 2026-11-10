"""Vẽ bản phác bố cục chánh điện bản 2 (1080x1920) để GPT / Flow render thành cảnh thật.

Bố cục theo tầng từ trên xuống (máy đặt gần bàn thờ):
  0–38%   tượng Phật rất to trên toà sen cao, hào quang khắc vàng, phướn và đèn lồng hai bên
  38–55%  bàn thờ 3 tầng đầy lễ vật (sen, tháp trái cây, nến, đèn, tháp vàng nhỏ)
  50–58%  lư hương đồng lớn chính giữa
  57–64%  bục gỗ thấp, 2 hàng nệm đỏ, mỗi hàng 8 (4 trái, 4 phải) = 16 ghế danh dự
  64–100% sàn gỗ trống + thảm đỏ giữa lối (code đặt đám đông)
Bản phác sạch: chỉ hình khối và màu, không vẽ hiệu ứng ánh sáng, không người, không chữ.

Chạy:  uv run --no-project --with pillow python themes/chua/tools/make-layout.py
Ra:    themes/chua/assets/ref/layout-guide.png
"""

from pathlib import Path
from PIL import Image, ImageDraw

W, H = 1080, 1920
VP = (540, 700)                 # điểm tụ của sàn và thảm
PLATFORM = (1100, 1235)         # bục nệm: mép trên, mép dưới
CUSHION_ROWS = (1150, 1205)     # y tâm 2 hàng nệm
CUSHION_X = (110, 210, 310, 410, 670, 770, 870, 970)
CENSER = (540, 1105)            # đáy lư hương (đặt trên mép bục)
OUT = Path(__file__).resolve().parents[1] / "assets" / "ref"

RED, RED_D, RED_L = (140, 22, 16), (78, 10, 6), (176, 34, 26)
GOLD, GOLD_D, GOLD_L = (214, 160, 70), (160, 112, 40), (250, 214, 140)
TEAK, TEAK_D, TEAK_L = (128, 72, 34), (70, 38, 16), (160, 100, 50)
PINK, PINK_D, GREEN, CREAM, ORANGE = (240, 150, 180), (214, 96, 140), (70, 120, 60), (250, 236, 205), (236, 140, 40)


def make():
    img = Image.new("RGB", (W, H), RED_D)
    d = ImageDraw.Draw(img)

    # vách sau: sơn son, ô khắc vàng
    d.rectangle([0, 0, W, 1100], fill=RED)
    for x in range(30, W, 90):
        for y in range(30, 700, 110):
            d.rectangle([x, y, x + 64, y + 86], outline=GOLD_D, width=2)
            d.ellipse([x + 20, y + 26, x + 44, y + 50], outline=GOLD_D, width=2)

    # phướn đỏ và đèn lồng hai bên
    for x0 in (40, 960):
        d.rectangle([x0, 0, x0 + 80, 760], fill=RED_L, outline=GOLD, width=3)
        for y in range(60, 740, 120):
            d.rectangle([x0 + 18, y, x0 + 62, y + 70], outline=GOLD, width=2)
    for x, y in ((190, 110), (890, 110), (220, 300), (860, 300)):
        d.line([(x, 0), (x, y - 40)], fill=GOLD_D, width=3)
        d.ellipse([x - 34, y - 40, x + 34, y + 40], fill=(200, 30, 24), outline=GOLD, width=3)
        d.rectangle([x - 14, y + 38, x + 14, y + 52], fill=GOLD)

    # hào quang khắc vàng (viền, không phát sáng)
    d.ellipse([540 - 250, 330 - 250, 540 + 250, 330 + 250], outline=GOLD, width=10)
    d.ellipse([540 - 215, 330 - 215, 540 + 215, 330 + 215], outline=GOLD_D, width=4)
    d.ellipse([540 - 120, 230 - 120, 540 + 120, 230 + 120], outline=GOLD, width=6)

    # tượng Phật rất to: thân, chân kiết già, đầu, nhục kế, tay ấn thiền
    d.ellipse([330, 470, 750, 640], fill=GOLD)                                  # chân
    d.polygon([(370, 520), (420, 300), (660, 300), (710, 520)], fill=GOLD)      # thân
    d.polygon([(420, 300), (460, 300), (400, 540), (370, 520)], fill=GOLD_D)    # nếp áo trái
    d.ellipse([480, 500, 600, 560], fill=GOLD_L)                                # tay ấn thiền
    d.rectangle([515, 270, 565, 305], fill=GOLD)                                # cổ
    d.ellipse([470, 140, 610, 290], fill=GOLD_L)                                # đầu
    d.ellipse([505, 95, 575, 165], fill=GOLD_D)                                 # nhục kế
    d.ellipse([462, 190, 482, 255], fill=GOLD)                                  # tai
    d.ellipse([598, 190, 618, 255], fill=GOLD)

    # toà sen cao: 2 lớp cánh vàng hồng
    for i in range(-6, 7):
        d.ellipse([540 + i * 44 - 36, 600, 540 + i * 44 + 36, 690], fill=PINK if i % 2 else GOLD)
    for i in range(-5, 6):
        d.ellipse([540 + i * 46 - 38, 650, 540 + i * 46 + 38, 740], fill=GOLD if i % 2 else PINK_D)
    d.rectangle([290, 720, 790, 750], fill=GOLD_D)

    # bàn thờ 3 tầng
    for (x0, y0, x1, y1) in ((230, 750, 850, 830), (170, 830, 910, 930), (120, 930, 960, 1060)):
        d.rectangle([x0, y0, x1, y1], fill=RED_L, outline=GOLD, width=4)
        d.rectangle([x0 + 10, y0 + 10, x1 - 10, y0 + 22], fill=GOLD)
        for x in range(x0 + 30, x1 - 30, 70):
            d.rectangle([x, y0 + 32, x + 46, y1 - 10], outline=GOLD_D, width=2)

    # lễ vật: bình sen to, tháp trái cây, nến, đèn dầu, tháp vàng nhỏ
    for x in (260, 820):
        d.polygon([(x - 26, 830), (x + 26, 830), (x + 18, 760), (x - 18, 760)], fill=GOLD)
        for dx, dy in ((-50, -60), (0, -90), (50, -60), (-30, -110), (30, -110), (0, -40)):
            d.ellipse([x + dx - 26, 760 + dy - 20, x + dx + 26, 760 + dy + 20], fill=PINK)
        d.ellipse([x - 70, 700, x + 70, 740], fill=GREEN)
    for x in (380, 700):
        for k, w in enumerate((50, 40, 30, 20)):
            d.ellipse([x - w, 820 - k * 26 - 22, x + w, 820 - k * 26 + 4], fill=ORANGE if k % 2 else (230, 190, 50))
    for x in range(250, 860, 60):
        if abs(x - 540) < 60:
            continue
        d.rectangle([x - 5, 892, x + 5, 928], fill=CREAM)
        d.ellipse([x - 7, 878, x + 7, 896], fill=GOLD_L)
    for x in (300, 780):
        d.polygon([(x, 870), (x - 22, 930), (x + 22, 930)], fill=GOLD)
        d.polygon([(x, 845), (x - 14, 880), (x + 14, 880)], fill=GOLD)
    for x in (200, 470, 610, 880):
        d.ellipse([x - 24, 1000, x + 24, 1030], fill=GOLD)
        d.ellipse([x - 6, 984, x + 6, 1002], fill=GOLD_L)

    # bục gỗ thấp với 2 hàng nệm (chừa giữa cho lư hương và thảm)
    d.rectangle([0, PLATFORM[0], W, PLATFORM[1]], fill=TEAK_L)
    d.rectangle([0, PLATFORM[1] - 14, W, PLATFORM[1]], fill=TEAK_D)
    for y in CUSHION_ROWS:
        for x in CUSHION_X:
            d.ellipse([x - 44, y - 16 + 4, x + 44, y + 16 + 4], fill=RED_D)
            d.ellipse([x - 44, y - 16, x + 44, y + 16], fill=RED_L)
            d.ellipse([x - 16, y - 6, x + 16, y + 6], outline=GOLD, width=2)

    # sàn gỗ + thảm đỏ hoa văn tụ về VP
    y0 = PLATFORM[1]
    d.rectangle([0, y0, W, H], fill=TEAK)
    for k in range(-22, 23):
        x_far = VP[0] + k * 26
        x_near = VP[0] + (x_far - VP[0]) * (H - VP[1]) / (y0 - VP[1])
        d.line([(x_far, y0), (x_near, H)], fill=TEAK_D, width=2)
    y, step = y0, 14.0
    while y < H:
        d.line([(0, y), (W, y)], fill=(108, 60, 28), width=1)
        step *= 1.08
        y += step
    half = lambda yy: 0.13 * (yy - VP[1])
    d.polygon([(540 - half(y0), y0), (540 + half(y0), y0), (540 + half(H), H), (540 - half(H), H)], fill=(170, 26, 22))
    for sgn in (-1, 1):
        d.line([(540 + sgn * half(y0) * 0.8, y0), (540 + sgn * half(H) * 0.8, H)], fill=GOLD, width=3)

    # lư hương đồng lớn chính giữa, đặt trên bục
    cx, cy = CENSER
    d.ellipse([cx - 120, cy - 10, cx + 120, cy + 20], fill=(60, 34, 14))           # bóng
    for lx in (-70, 0, 70):                                                        # 3 chân
        d.polygon([(cx + lx - 14, cy - 40), (cx + lx + 14, cy - 40), (cx + lx + 8, cy + 6), (cx + lx - 8, cy + 6)], fill=GOLD_D)
    d.ellipse([cx - 110, cy - 150, cx + 110, cy - 30], fill=(170, 116, 44))        # thân lư
    d.ellipse([cx - 110, cy - 168, cx + 110, cy - 126], fill=GOLD)                 # miệng lư
    for ex in (-1, 1):                                                             # quai
        d.rectangle([cx + ex * 110 - (14 if ex > 0 else 0), cy - 200, cx + ex * 110 + (0 if ex > 0 else 14), cy - 140], fill=GOLD_D)
    d.rectangle([cx - 60, cy - 120, cx + 60, cy - 70], outline=GOLD_L, width=3)    # hoa văn thân
    for k in range(-4, 5):                                                         # nhang cắm
        x = cx + k * 9
        d.line([(x, cy - 160), (x + k * 2, cy - 250)], fill=(190, 60, 40), width=3)
        d.ellipse([x + k * 2 - 3, cy - 256, x + k * 2 + 3, cy - 248], fill=(255, 140, 60))
    return img


OUT.mkdir(parents=True, exist_ok=True)
make().save(OUT / "layout-guide.png")
print("đã ghi", OUT / "layout-guide.png")
