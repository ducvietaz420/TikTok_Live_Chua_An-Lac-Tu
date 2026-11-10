# Nguồn asset của theme chùa

| Asset | Nguồn | Giấy phép |
|---|---|---|
| `assets/bg-key.jpg` | duycuf gen bằng GPT | MIT, © 2026 duycuf |
| `assets/bg-honor-seats.png` | Chỉnh khu vực đệm bằng công cụ imagegen tích hợp từ `bg-key.jpg`, theo yêu cầu bố trí top 3; ghép riêng phần sàn để giữ nguyên tượng, bàn thờ và lư hương | Nguồn ảnh gốc như trên; phần chỉnh sửa tạo bằng AI |
| `assets/chars/monk-left.png`, `monk-right.png` | Hai sư thầy hư cấu tạo bằng công cụ imagegen tích hợp, tham chiếu ánh sáng của ảnh chánh điện; PNG trong suốt, dùng riêng cho NPC | Ảnh tạo bằng AI theo yêu cầu người dùng |
| `assets/chars/devotee.png` (Phật tử, 32 khung) | duycuf gen bằng Google Flow theo `FLOW-BRIEF.md`, cắt bằng `pnpm assets:cut --auto` của kit | MIT, © 2026 duycuf |
| `assets/fx/halo.png`, `rays.png`, `sparkle.png` | duycuf gen bằng Google Flow, chuyển nền đen thành trong suốt bằng `pnpm assets:alpha` của kit | MIT, © 2026 duycuf |
| `assets/ref/ref-vibe.png`, `ref-flow-3-ban.png` (ảnh tham chiếu, không dùng trên live) | duycuf gen bằng Google Flow | MIT, © 2026 duycuf |
| `assets/ref/layout-guide.png` | vẽ bằng `tools/make-layout.py` | MIT, © 2026 duycuf |
| `brand/avatar.png`, `avatar-text.png` (ảnh đại diện kênh) | vẽ bằng `brand/avatar.html` | MIT, © 2026 duycuf |
| `assets/cdo/*` (icon lễ phẩm, sen bay, cánh sen; nhân vật cũ không còn dùng) | [kentjuno/chanh-dien-online](https://github.com/kentjuno/chanh-dien-online), tạo bằng Google Flow | MIT, © 2026 Kent Juno (xem `assets/cdo/LICENSE`) |
| `assets/music/music1.mp3`, `music2.mp3` | [kentjuno/chanh-dien-online](https://github.com/kentjuno/chanh-dien-online), tạo bằng Gemini | MIT, © 2026 Kent Juno |
| `assets/sfx/mo.mp3` (mõ) | Freesound [Mokugyo.wav](https://freesound.org/people/jonopodmore/sounds/607215/), jonopodmore | CC0 |
| `assets/sfx/chuong.mp3` (chuông nhỏ) | Freesound [NEPTUN-Solo-07 Tibetan Singing Bowl](https://freesound.org/people/the_very_Real_Horst/sounds/240934/), the_very_Real_Horst | CC0 |
| `assets/sfx/chuong-lon.mp3` (chuông lớn) | Freesound [temple_bell_002.wav](https://freesound.org/people/tec_studio/sounds/668647/), tec_studio | CC0 |
| `assets/sfx/sen.mp3` (chuông bát nhỏ) | Freesound [Small bowl.wav](https://freesound.org/people/airtaxi/sounds/76888/), airtaxi | CC0 |

Tiếng hiệu ứng lấy từ bản nghe thử 128kbps của Freesound (11/2026), đã cắt ngắn, làm nhỏ dần ở cuối và chỉnh âm lượng cho đều.

Tác giả gốc lưu ý: ảnh tạo bằng Google Flow, nhạc tạo bằng Gemini; kiểm tra điều khoản của các dịch vụ đó trước khi dùng thương mại.
