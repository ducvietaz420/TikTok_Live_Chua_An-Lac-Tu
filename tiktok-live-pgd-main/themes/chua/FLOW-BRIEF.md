# Brief cho tác nhân Flow: tờ hoạt hình Phật tử (kiểu vẽ 2D)

Chỉ một nhân vật Phật tử dùng chung cho cả đám đông. Code tự lật trái phải theo từng người.

Cách dùng: mở tác nhân trong Flow, **kéo `assets/bg-key.jpg` vào làm ảnh tham chiếu màu**, dán nguyên khối dưới đây. Nếu Flow cho chọn, bật **phóng to 2K hoặc 4K** (ảnh mặc định 1376 × 768 thì mỗi người chỉ cao khoảng 130px, lên live hơi mờ). Tải về lưu `assets/raw/devotee.png`.

```
Create ONE 16:9 animation model sheet (sprite sheet) of a single character for a 2.5D live-stream game set in the Vietnamese Buddhist temple hall of the attached reference image. Use the reference only for colours and lighting.

CHARACTER: a Vietnamese Buddhist lay devotee, a middle-aged woman with black hair in a neat low bun, wearing a traditional muted grey-blue lay robe (áo tràng lam) and simple dark slippers.

ART STYLE: high-quality 2D illustrated game art, like a polished mobile game: clean thin dark-brown lineart, soft cel shading with gentle gradients, warm golden rim light from the altar ahead, graceful natural anatomy about 7 heads tall, calm and respectful postures. Not chibi, not photorealistic, no thick black outlines, no flat colouring.

LAYOUT: exactly 30 drawings of the SAME person in a strict invisible grid of 6 columns and 5 rows. Each drawing centered in its own cell with clear empty space around it, feet or knees on the bottom line of the cell. All 30 at the same scale (a standing figure fills about 85% of the cell height), same camera slightly above the person, identical face, hair, robe and proportions.
BACKGROUND: perfectly flat pure chroma green (#00FF00) everywhere. No floor, no cushion, no shadow, no gradient.
ABSOLUTELY NO text, numbers, row labels, captions, grid lines or frames anywhere.

"Seen from behind" means the camera is directly behind her: we see the back of the head, the bun and the back of the robe; the face is NOT visible; with palms joined in front of the chest only the two elbows show at the sides.

Row 1, walking away from the camera, seen from behind, 6-frame walk cycle with clearly alternating legs and the robe hem swinging, palms joined: 1) left foot forward, long stride; 2) left foot planted, body slightly lower; 3) right leg passing; 4) right foot forward, long stride; 5) right foot planted, body slightly lower; 6) left leg passing. Every frame visibly different.
Row 2, walking toward the camera, seen from the front, calm gentle face, eyes lowered, palms joined, the same 6-frame walk cycle.
Row 3, walking to the right, seen exactly from the side, palms joined, the same 6-frame walk cycle with long visible strides.
Row 4, bowing toward a Buddha statue far ahead, seen from behind, ALL SIX KNEELING, never standing: 1) kneeling, sitting back on the heels, back straight, palms joined at the chest; 2) kneeling upright, joined palms raised above the head; 3) kneeling, torso bent forward about 45 degrees; 4) kneeling, torso low, both hands flat on the floor in front of the knees; 5) full prostration, forehead and forearms on the floor, from behind we see the rounded back, the bun and the soles of the feet; 6) kneeling upright again, palms joined, head slightly bowed.
Row 5, seen from behind: 1) standing upright, palms joined; 2) going down to kneel, one knee touching the floor; 3) standing, holding three lit incense sticks in front of the chest; 4) standing, incense raised to the forehead, bowing slightly; 5) kneeling, holding a red bamboo fortune-stick cup against the chest; 6) kneeling, the cup tilted forward mid-shake with one stick sliding out.

FINAL CHECK: no number or letter anywhere; exactly 6 columns × 5 rows of the same woman at the same scale; rows 1, 4 and 5 seen from behind with the face hidden; all of row 4 kneeling; walk frames visibly different; background perfectly flat green. Regenerate if any check fails.
```

## Sau khi tải về

Chạy công cụ cắt tờ của kit (`pnpm assets:cut ... --auto`, cách dùng ở `docs/ASSETS-GUIDE.vi.md` của kit): tách nền xanh, bỏ chữ số lẻ nếu có, cắt 30 khung, rồi khai báo nhân vật cùng các động tác lạy, dâng hương, xin xăm, đi vào / đi ra / đi ngang trong `theme.json`.

Nếu tác nhân vẽ lệch lưới, bảo nó gen lại, hoặc tách thành 2 ảnh: hàng 1–3 (đi) và hàng 4–5 (tại chỗ), rồi ghép lại.
