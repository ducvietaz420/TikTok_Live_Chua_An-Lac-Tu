# Live đi chùa online từng bước

Ba thứ chạy cùng lúc khi live:

```
TikTok LIVE ──(quà, tim, chat)──> TikFinity Desktop ──ws://127.0.0.1:21213──> Chùa (run.bat, cổng 3939)
                                   (hoặc kết nối trực tiếp, không cần TikFinity)          │
LIVE Studio / OBS <───────────── hình overlay http://localhost:3939/overlay ─────────────┘
```

## Chọn cách phát

Trước khi live, xác định: **dùng gì để đưa hình chùa lên sóng**, và **tài khoản đang được phép gì**.

| Cách | Cần | Mỗi lần live bật | Làm theo |
|---|---|---|---|
| **A. LIVE Studio quay cửa sổ** | Tài khoản dùng được LIVE Studio | `run.bat` + `overlay.bat` + Studio | Bước 2A |
| **B. OBS → Virtual Camera → LIVE Studio** (mượt nhất, nên dùng) | Tài khoản dùng được LIVE Studio, có OBS | `run.bat` + OBS + Studio | Bước 2B |
| **C. OBS phát bằng khoá phát** | Tài khoản có khoá phát (stream key) | `run.bat` + OBS | Bước 2B, phần C |

Tài khoản chưa dùng được Studio (báo "Không có quyền truy cập") thì làm "Phiên mở khoá" bên dưới trước. Cách nào cũng phải để `run.bat` chạy suốt buổi live.

## 0. Cần có trước

| Thứ | Ghi chú |
|---|---|
| Tài khoản TikTok **có quyền LIVE Studio** | LIVE Studio góc trên bên phải phải **không còn** chữ "Không có quyền truy cập". Tài khoản mới: **phát LIVE bằng điện thoại một phiên khoảng 25 phút** thì TikTok mới mở quyền Studio (xem mục "Phiên mở khoá" bên dưới) |
| TikTok LIVE Studio | Đã cài (cách A, B) |
| OBS Studio | Cách B, C: tải ở obsproject.com |
| TikFinity Desktop (khuyên dùng) | Tải bản Windows ở trang chủ TikFinity (tikfinity.zerody.one). Ổn định hơn kết nối trực tiếp |
| Kit `..\tiktok-live-kit` | Đã có, `run.bat` tự tìm |

## Phiên mở khoá: live điện thoại 25 phút (làm một lần cho tài khoản mới)

Tranh thủ phiên này để thử phần **nối dữ liệu**: quà, tim, chat của buổi live điện thoại vẫn chạy vào chùa trên máy tính.

1. Máy tính: chạy `run.bat` (bước 1), mở overlay `http://localhost:3939/overlay` để xem chùa phản ứng.
2. Điện thoại: mở TikTok, bấm **+** → **LIVE**, đặt tiêu đề rồi **Phát trực tiếp**. Giữ đủ khoảng 25 phút.
3. Máy tính: nối dữ liệu như bước 3 (TikFinity đăng nhập đúng tài khoản kênh, hoặc **Trực tiếp** với tên kênh).
4. Nhờ người quen vào chat «xin xăm», «lạy Phật», thả tim, tặng quà nhỏ: overlay trên máy tính phải có người vào chùa, lạy, gieo quẻ, dâng hương.
5. Hết phiên, mở lại LIVE Studio: chữ "Không có quyền truy cập" mất là dùng được Studio.

Muốn người xem thấy luôn chùa trong phiên điện thoại thì quay camera điện thoại vào màn hình máy tính đang mở overlay (tạm thời, hình không đẹp bằng Studio).

### Điện thoại phát màn hình chùa (máy tính cắm mạng dây, điện thoại không có 4G)

1. Máy tính: **Cài đặt → Mạng & Internet → Điểm phát sóng di động**, chia sẻ từ **Ethernet** qua **Wi-Fi**, bật lên. Điện thoại vào Wi-Fi đó (tắt chia sẻ kết nối qua USB nếu đang bật).
2. `config.json` thêm địa chỉ của điểm phát sóng vào `host`: `"host": "127.0.0.1,192.168.137.1"` (chỉ mở cho mạng phát từ máy, mạng dây vẫn đóng). Chạy lại `run.bat`.
3. Điện thoại mở Chrome vào `http://192.168.137.1:3939/overlay`, chạm một lần để bật tiếng. Windows hỏi cho Node.js dùng mạng thì cho phép.
4. TikTok: **+ → LIVE → phát màn hình / chơi game trên điện thoại** → phát, rồi chuyển sang Chrome. Bảng điều khiển trên máy tính bấm **Kết nối** (Trực tiếp, tên kênh).
5. Live xong: tắt điểm phát sóng, xoá địa chỉ `192.168.137.1` khỏi `host` nếu không dùng nữa.

## 1. Mở chùa

1. Chạy `run.bat` trong thư mục này.
2. Một cửa sổ đen tên **"Chua ao - TikTok Live"** hiện ra: đó là server, **để nguyên, đừng tắt** suốt buổi live.
3. Trình duyệt tự mở **bảng điều khiển** `http://localhost:3939`.

## 2A. Đưa chùa vào LIVE Studio (quay cửa sổ)

1. Mở LIVE Studio, chọn khung **dọc (9:16)**. Bước thiết lập camera cứ bấm **Tiếp tục**, chùa không cần camera (vào màn hình chính thì ẩn nguồn camera đi).
2. Chạy **`overlay.bat`**: mở chùa thành một cửa sổ dọc riêng (không bị "ngủ" khi bị che, tự phát tiếng).
3. Studio: **Thêm nguồn → Quay màn hình cửa sổ**, chọn cửa sổ chùa (chrome.exe, tiêu đề "Chùa ảo"). Mục **Liên kết** TikTok không cho dùng với địa chỉ máy mình.
4. Kéo nguồn chùa phủ kín khung dọc. Đừng thu nhỏ (minimize) cửa sổ chùa; để nó nằm sau các cửa sổ khác vẫn được.
5. Tiếng chuông mõ, giọng đọc: Studio lấy tiếng máy tính trong phần cài đặt âm thanh. Bấm thử một nút hiệu ứng ở bảng điều khiển để nghe.
6. Các mục **Tiện ích** của Studio (mục tiêu, bảng xếp hạng…) không cần thêm, chùa đã có sẵn và thêm vào sẽ chồng lên.

## 2B. Đưa chùa vào OBS (cài một lần, OBS tự nhớ)

OBS tự vẽ chùa bằng nguồn Browser nên hình mượt hơn quay cửa sổ, và **không cần chạy `overlay.bat`**.

1. OBS → **Settings → Video**: độ phân giải gốc và đầu ra **1080 × 1920**, **30 FPS**.
2. **Sources → + → Browser**: URL `http://localhost:3939/overlay`, rộng **1080**, cao **1920**, tick **Control audio via OBS**. Chuột phải nguồn → **Interact**, bấm vào chùa một lần để bật tiếng.
3. Tiếng chuông mõ, giọng đọc: chuột phải nguồn → **Advanced Audio Properties** → cột Audio Monitoring chọn **Monitor and Output**.
4. **Cách B, qua LIVE Studio**: OBS bấm **Start Virtual Camera**. Mở LIVE Studio, khung **dọc (9:16)**, **Thêm nguồn → Camera → OBS Virtual Camera**, kéo phủ kín khung. Camera ảo chỉ mang hình, tiếng đi qua loa máy tính: bật thu âm thanh máy tính trong cài đặt âm thanh của Studio.
5. **Cách C, có khoá phát**: OBS → **Settings → Stream → Custom**, dán địa chỉ máy chủ và khoá phát TikTok cấp, rồi **Start Streaming**. Không cần Studio, tiếng đi thẳng qua OBS (bước 3 không bắt buộc).
6. Các mục **Tiện ích** của Studio không cần thêm, chùa đã có sẵn.

Các lần sau chỉ cần: chạy `run.bat` → mở OBS (cách B bấm lại **Start Virtual Camera**) → mở Studio. Chùa trắng hoặc đứng hình thì chuột phải nguồn Browser → **Refresh**.

## 3. Nối quà, tim, chat vào chùa

### Cách A: qua TikFinity (khuyên dùng)

1. Mở **TikFinity Desktop**, đăng nhập bằng **chính tài khoản TikTok của kênh**.
2. Nếu trong cài đặt TikFinity có mục WebSocket / API: bật lên, cổng **21213** (thường bật sẵn).
3. Lên sóng trước (Studio bấm **Phát trực tiếp**, cách C thì OBS bấm **Start Streaming**). TikFinity sẽ tự bắt được buổi live (hiện trạng thái đã kết nối).
4. Ở bảng điều khiển chùa: chọn **TikFinity Desktop**, gõ tên kênh (để hiển thị), bấm **Kết nối**. Chấm trạng thái chuyển xanh là xong.

### Cách B: kết nối trực tiếp (không cần TikFinity)

1. Lên sóng trước (Studio hoặc OBS).
2. Ở bảng điều khiển: chọn **Trực tiếp**, gõ **tên kênh** (phần sau chữ @, không gõ @), bấm **Kết nối**.

Mẹo: chọn **Tự động** và gõ sẵn tên kênh. Có TikFinity thì kit dùng TikFinity, không có thì tự chuyển sang trực tiếp. Mất kết nối thì kit tự thử lại.

## 4. Thử trước khi lên sóng (khi chưa live)

- Bảng điều khiển, tab **Thử nghiệm**: bấm các nút **hiệu ứng** (dâng hương, lễ bái, dâng sen, đại lễ), các nút quà, **Đọc thử** giọng. Thả 60 người để xem cảnh đông, thả 400 người để thử máy có chịu nổi.
- **Tự chạy** cho người ảo vào chùa liên tục. Nhớ bấm **Tắt** và bấm **Phiên mới** (tab **Thống kê**) trước khi lên sóng thật.
- Tab **Hướng dẫn** trong bảng điều khiển tóm tắt các bước lên live.
- Muốn xem vùng TikTok che: mở `http://localhost:3939/overlay?safe`.

## 5. Lên sóng

1. Studio: đặt tiêu đề (ví dụ *"Chùa online · gõ «xin xăm» để gieo quẻ"*), chủ đề, rồi **Phát trực tiếp**. Cách C: đặt tiêu đề trên TikTok rồi OBS bấm **Start Streaming**.
2. Kết nối ở bước 3.
3. Theo dõi bảng điều khiển: dòng "sự kiện gần nhất" chạy là quà, tim, chat đang vào.

## Lỗi hay gặp

| Hiện tượng | Làm gì |
|---|---|
| Studio báo "Không có quyền truy cập", không bấm phát được | Tài khoản chưa có quyền LIVE Studio, phải đủ điều kiện của TikTok trước |
| Bảng điều khiển báo "Không thấy TikFinity ở ws://127.0.0.1:21213" | TikFinity chưa mở, chưa đăng nhập, hoặc chưa bật WebSocket. Hoặc chuyển sang **Trực tiếp** |
| Kết nối trực tiếp báo lỗi | Kênh chưa lên sóng, hoặc gõ sai tên kênh (không gõ @) |
| Overlay im lặng | Bấm vào overlay một lần ("Chạm để nghe chuông mõ"), kiểm tra âm lượng trong phần cài đặt theme |
| Giọng đọc lúc có lúc không | Dịch vụ đọc của Microsoft chập chờn; câu lỗi bị bỏ qua, live vẫn chạy |
| Lỡ tắt cửa sổ đen | Chạy lại `run.bat`, rồi bấm Kết nối lại. OBS: chuột phải nguồn Browser → Refresh |
| Cách B: Studio có hình chùa nhưng không có tiếng | Camera ảo không mang tiếng: nguồn Browser trong OBS chọn **Monitor and Output**, bật thu âm thanh máy tính trong Studio |
| Cách B: Studio không thấy "OBS Virtual Camera" | Bật **Start Virtual Camera** trong OBS trước rồi mới mở Studio, hoặc mở lại Studio |
| OBS: chùa trắng, không có hình | Chưa chạy `run.bat`, hoặc gõ sai URL. Chạy `run.bat` rồi Refresh nguồn |
