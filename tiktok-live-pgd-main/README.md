# Đi chùa online · TikTok LIVE

> **English:** an online temple visit for TikTok LIVE, built as a theme for [TikTok Live Kit](https://github.com/duycuf/tiktok-live-kit). Viewers walk into a peaceful temple hall, light incense and send good wishes, with a Vietnamese voice. Clone the kit next to this repo and run `run.bat`. Content and docs are in Vietnamese. MIT licensed.

Không gian đi chùa online trên TikTok LIVE: người xem bước vào chánh điện, thắp nén hương, gửi lời cầu an cho gia đình.
Engine là [TikTok Live Kit](https://github.com/duycuf/tiktok-live-kit). Repo này chỉ giữ phần riêng của chùa.

## Chạy

1. Clone kit vào thư mục **cạnh** repo này, rồi chạy `run.bat` trong kit một lần để cài thư viện:
   ```
   10-code\
     tiktok-live-kit\   (engine)
     tiktok-live-pgd\   (repo này)
   ```
   Kit để chỗ khác thì đặt biến `KIT_DIR` trỏ tới nó.
2. Chạy `run.bat` ở đây → bảng điều khiển http://localhost:3939, overlay http://localhost:3939/overlay (1080 × 1920).
3. Lên sóng: mượt nhất là **OBS** (nguồn Browser `http://localhost:3939/overlay`) rồi **Virtual Camera** sang TikTok LIVE Studio, hoặc OBS phát thẳng nếu tài khoản có khoá phát. Đơn giản hơn: chạy `overlay.bat` rồi cho LIVE Studio quay cửa sổ chùa. Chọn cách nào, cài từng bước, nối TikFinity: [GO-LIVE.md](GO-LIVE.md).

`run.bat` gọi server của kit với ba biến: `KIT_THEMES_DIR` (thư mục `themes/` ở đây), `KIT_DATA_DIR` (`data/`: luật đã chỉnh, phiên live, giọng đọc, không vào git) và `KIT_CONFIG` (`config.json`).

## Có gì

| Đường dẫn | Nội dung |
|---|---|
| `themes/chua/theme.json` | Hành động theo quà, danh hiệu, mục tiêu, giọng đọc, nội dung định kỳ, tiếng hiệu ứng |
| `themes/chua/scene.json` | Bố cục chánh điện đã đo trên ảnh nền: đường chân trời, phối cảnh, sàn, lối đi, 16 ghế danh dự, lư hương, 2 hàng đầu luôn kín người |
| `themes/chua/assets/` | Ảnh nền, nhân vật, nhạc nền (`music/`), tiếng hiệu ứng (`sfx/`) |
| `brand/` | Ảnh đại diện kênh (hoa sen, vẽ bằng `avatar.html`) |
| `GO-LIVE.md` | Hướng dẫn lên live từng bước, lỗi hay gặp |
| `overlay.bat` | Mở chùa thành cửa sổ Chrome cho LIVE Studio quay (gọi `overlay.bat` của kit) |
| `AGENTS.md` | Dặn AI (Claude Code, Codex…) khi làm việc trong repo này, gồm việc hỏi cách phát trước khi hướng dẫn live |
| `themes/chua/ASSETS.md` | Prompt tạo ảnh nền và các asset khác |
| `themes/chua/CREDITS.md` | Nguồn và giấy phép của từng asset |
| `themes/chua/tools/make-layout.py` | Vẽ bản phác bố cục để làm tham chiếu khi gen ảnh nền |

Sửa cảnh, luật, giọng đọc: xem `docs/THEME.vi.md` trong kit.

## Giấy phép

[MIT](LICENSE): dùng, sửa, làm kênh riêng thoải mái, chỉ cần giữ dòng bản quyền. Asset lấy từ nơi khác giữ giấy phép gốc (MIT, CC0), nguồn từng file ở [CREDITS.md](themes/chua/CREDITS.md). Ảnh và nhạc tạo bằng AI: tự kiểm tra điều khoản của công cụ đó nếu dùng thương mại.
