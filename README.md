# Chùa ảo · TikTok LIVE

Không gian đi chùa online với overlay dọc **1080 × 1920**: người xem xuất hiện trong chánh điện, tương tác bằng bình luận, thả tim và tặng quà. Dự án sử dụng **TikTok Live Kit** làm bộ lõi, kết hợp theme **Chùa ảo** với nhân vật, hiệu ứng và giọng đọc tiếng Việt.

Thư mục này đã chứa cả bộ lõi và theme. Hướng dẫn bên dưới dành cho Windows; các lệnh PowerShell được chạy từ thư mục gốc của dự án.

## Tính năng

- Nhận sự kiện TikTok LIVE qua TikFinity hoặc kết nối trực tiếp; hỗ trợ tự kết nối lại.
- Nhân vật Phật tử mang ảnh đại diện người xem, di chuyển và thực hiện các hoạt cảnh trong chánh điện.
- Hiệu ứng dâng hương, lễ bái, dâng sen, đại lễ; camera tập trung vào người tặng quà, thẻ tri ân và hiệu ứng sen cho đại lễ.
- Lệnh chat để lạy Phật, xin xăm và thả đèn nguyện. Xin xăm và lạy Phật qua chat không yêu cầu tặng quà.
- Bảng vàng, ghế danh dự theo thứ hạng, danh hiệu và mục tiêu tương tác.
- Nhạc nền, tiếng chuông, tiếng mõ, giọng đọc tiếng Việt và nội dung định kỳ.
- Bảng điều khiển để chỉnh luật, thử người xem/quà giả, xem thống kê và tải CSV.

## Yêu cầu

- **Node.js 20 trở lên**, kèm npm. Có thể dùng pnpm nếu đã cài.
- **Chrome hoặc Microsoft Edge** nếu mở overlay bằng `overlay.bat`.
- Kết nối Internet để cài thư viện, nhận sự kiện live và tạo giọng đọc trực tuyến.
- Khi phát sóng: phần mềm phát như TikTok LIVE Studio hoặc OBS, cùng quyền LIVE tương ứng của tài khoản.

Kiểm tra Node.js và npm:

```powershell
node --version
npm --version
```

## Cài đặt và chạy

### 1. Cài thư viện cho bộ lõi

Chạy một lần khi mới tải dự án, hoặc sau khi cập nhật thư viện:

```powershell
npm --prefix .\tiktok-live-kit install
```

Nếu dùng pnpm, vào thư mục `tiktok-live-kit` rồi chạy `pnpm install`.

### 2. Khởi động Chùa ảo

```powershell
.\tiktok-live-pgd-main\run.bat
```

Hoặc bấm đúp **`run.bat` trong `tiktok-live-pgd-main`**. Script tìm bộ lõi ở thư mục bên cạnh, thiết lập đường dẫn theme/dữ liệu/cấu hình, mở server và bảng điều khiển. Giữ cửa sổ server mở trong suốt thời gian sử dụng.

`tiktok-live-kit/run.bat` khởi động bộ lõi với theme mặc định `template`. Để mở chùa, dùng script trong `tiktok-live-pgd-main` như trên. Nếu một server của kit đang chiếm cổng 3939, tắt server đó trước khi khởi động chùa.

| Địa chỉ mặc định | Công dụng |
|---|---|
| [localhost:3939](http://localhost:3939/) | Bảng điều khiển |
| [localhost:3939/overlay](http://localhost:3939/overlay) | Overlay Chùa ảo, 1080 × 1920 |
| [localhost:3939/overlay?safe](http://localhost:3939/overlay?safe) | Kiểm tra vùng an toàn khi hiển thị trên TikTok |
| [localhost:3939/overlay?scene](http://localhost:3939/overlay?scene) | Kiểm tra và căn chỉnh bố cục cảnh |
| [localhost:3939/api/health](http://localhost:3939/api/health) | Kiểm tra server và theme đang chạy |

Server mặc định lắng nghe tại `127.0.0.1:3939`. Khi chạy đúng dự án, `/api/health` trả về `app: "tiktok-live-kit"` và `theme: "chua"`.

### Chạy trực tiếp bằng PowerShell

Có thể dùng cách này để xem log ngay trong terminal, thay cho `run.bat`:

```powershell
$env:KIT_THEMES_DIR = Join-Path $PWD 'tiktok-live-pgd-main\themes'
$env:KIT_DATA_DIR = Join-Path $PWD 'tiktok-live-pgd-main\data'
$env:KIT_CONFIG = Join-Path $PWD 'tiktok-live-pgd-main\config.json'
node .\tiktok-live-kit\src\server.js
```

Nhấn `Ctrl+C` để dừng server chạy trong terminal.

## Sử dụng

### Thử hiệu ứng trước khi kết nối live

1. Mở bảng điều khiển, kiểm tra theme đang chọn là **Chùa ảo**.
2. Vào tab **Thử nghiệm**, thêm người xem giả hoặc thả đám đông 10 / 30 / 60 / 400 người.
3. Thử quà theo nhóm giá và các nút hiệu ứng: dâng hương, lễ bái, dâng sen, đại lễ, xin xăm, thả đèn.
4. Dùng **Đọc thử** để kiểm tra giọng đọc; mở overlay để kiểm tra hình và âm thanh.
5. Kết thúc thử nghiệm: chọn **Tắt** ở mục tự chạy. Khi cần bắt đầu lại số liệu, dùng **Phiên mới** trong tab **Thống kê**; nút này đưa bảng xếp hạng và số liệu phiên về 0.

Chế độ thử dùng sự kiện giả, có thể kiểm tra hiệu ứng mà chưa cần kết nối một buổi LIVE thật.

### Nguồn sự kiện và phần mềm phát

Trong tab **Live**, nhập tên kênh, chọn nguồn **Tự động**, **TikFinity** hoặc **Trực tiếp**, rồi bấm **Kết nối** khi kênh đang LIVE. Chế độ tự động thử TikFinity trước, sau đó thử kết nối trực tiếp. Địa chỉ TikFinity mặc định là `ws://127.0.0.1:21213/`.

Để mở overlay thành cửa sổ riêng, sau khi server đã chạy:

```powershell
.\tiktok-live-pgd-main\overlay.bat
```

Chọn cách đưa hình và âm thanh lên sóng theo [hướng dẫn LIVE Studio / OBS](tiktok-live-pgd-main/GO-LIVE.md). Bộ server này cung cấp overlay và nhận sự kiện; việc phát sóng do phần mềm phát đảm nhiệm.

### Tương tác mặc định

| Bình luận mẫu | Phản ứng |
|---|---|
| `xin xăm`, `gieo quẻ`, `xin quẻ` | Rút quẻ; mặc định mỗi người một quẻ mỗi ngày |
| `lạy Phật`, `nam mô`, `a di đà`, `🙏` | Nhân vật thực hiện lễ Phật |
| `cầu an`, `cầu cho gia đình bình an`, `cầu nguyện` | Thả đèn nguyện |

Các mốc quà mặc định được xét theo **giá một món quà**:

| Giá quà | Hoạt cảnh |
|---|---|
| 1–4 xu | Dâng hương |
| 5–9 xu | Lễ bái |
| 10–99 xu | Dâng sen |
| Từ 100 xu | Đại lễ |

Có thể chỉnh mốc quà, lệnh chat và thời gian chờ trong tab **Luật**. Luật quà riêng theo ID/tên có thể thay đổi kết quả so với bảng mặc định.

## Cấu trúc dự án

```text
live chùa gốc/
├── README.md
├── tiktok-live-kit/                 Bộ lõi Node.js
│   ├── src/                        HTTP, WebSocket, xử lý sự kiện, giọng đọc
│   ├── public/control/             Bảng điều khiển web
│   ├── public/sdk/                 SDK cảnh, nhân vật, hiệu ứng và âm thanh
│   ├── test/                       Kiểm thử bộ lõi
│   └── docs/                       Tài liệu làm theme và phát sóng
└── tiktok-live-pgd-main/            Dự án Chùa ảo
    ├── config.json                 Chọn theme chua và cổng 3939
    ├── run.bat                     Khởi động chùa bằng bộ lõi bên cạnh
    ├── overlay.bat                 Mở cửa sổ overlay
    ├── GO-LIVE.md                  Hướng dẫn phát sóng
    ├── brand/                      Tài nguyên nhận diện kênh
    ├── data/                       Dữ liệu tạo khi chạy
    └── themes/chua/
        ├── theme.json              Hành động, luật, giọng đọc, danh hiệu
        ├── scene.json              Bố cục, vị trí và ghế trong chánh điện
        ├── index.html              Trang overlay và thứ tự nạp script
        ├── theme.js                Giao diện và xử lý riêng của chùa
        ├── avatar-heads.js          Hiển thị avatar trên nhân vật
        ├── honor-seats.js           Ghế danh dự theo bảng vàng
        ├── gift-camera.js           Camera tập trung khi tặng quà
        ├── grand-tribute.js         Thẻ tri ân đại lễ
        ├── grand-lotus.js           Hiệu ứng sen đại lễ
        ├── assets/                 Ảnh nền, nhân vật, nhạc và tiếng hiệu ứng
        └── test/                   Kiểm thử riêng của theme
```

## Cấu hình và tùy chỉnh

Cấu hình của chùa nằm tại [tiktok-live-pgd-main/config.json](tiktok-live-pgd-main/config.json):

```json
{
  "theme": "chua",
  "port": 3939
}
```

Server nạp lần lượt cấu hình mặc định của kit, cấu hình dự án, rồi các lựa chọn đã lưu trong `data/settings.json`; giá trị nạp sau ghi đè giá trị trước. Luật và thiết lập theme đã lưu trên bảng điều khiển cũng được ưu tiên hơn mặc định trong `theme.json`.

| Biến môi trường | Công dụng |
|---|---|
| `KIT_DIR` | Đường dẫn tới bộ lõi nếu đặt ở nơi khác; dùng bởi các script `.bat` của chùa |
| `KIT_THEMES_DIR` | Thư mục chứa theme, được `run.bat` đặt thành `tiktok-live-pgd-main/themes` |
| `KIT_DATA_DIR` | Thư mục lưu dữ liệu, được `run.bat` đặt thành `tiktok-live-pgd-main/data` |
| `KIT_CONFIG` | File cấu hình dự án, được `run.bat` đặt thành `tiktok-live-pgd-main/config.json` |

Các địa chỉ và bước kiểm tra server trong script `.bat` dùng cổng **3939**. Nếu đổi cổng, cần điều chỉnh các địa chỉ đó và địa chỉ overlay tương ứng.

Để tùy chỉnh cảnh, sửa `themes/chua/scene.json`; để sửa luật mặc định, câu đọc, âm thanh và hành động, sửa `themes/chua/theme.json`. Các phần mở rộng hình ảnh nằm trong những file JavaScript của theme. Tham khảo [tài liệu làm theme tiếng Việt](tiktok-live-kit/docs/THEME.vi.md).

### Dữ liệu khi chạy

Khi khởi động bằng script của chùa, dữ liệu nằm trong `tiktok-live-pgd-main/data/`, gồm `settings.json`, `rules-chua.json`, `theme-settings-chua.json`, `session-chua.json`, thư viện quà và bộ nhớ đệm giọng đọc. Thư mục này được tạo khi chạy; nên sao lưu nếu cần giữ cấu hình và số liệu phiên. Không đưa dữ liệu phiên, khóa API hoặc token vào Git.

## Kiểm thử dành cho phát triển

Chạy kiểm thử bộ lõi:

```powershell
npm --prefix .\tiktok-live-kit test
```

Chạy kiểm thử riêng cho avatar và ghế danh dự:

```powershell
node --test .\tiktok-live-pgd-main\themes\chua\test\avatar-heads.test.cjs .\tiktok-live-pgd-main\themes\chua\test\seat-top.test.cjs
```

## Lỗi thường gặp

| Hiện tượng | Cách kiểm tra |
|---|---|
| Không tìm thấy `node` hoặc `npm` | Cài Node.js 20 trở lên và mở lại terminal. |
| Báo thiếu thư viện hoặc `Cannot find package` | Chạy lại `npm --prefix .\tiktok-live-kit install` từ thư mục gốc. |
| Không tìm thấy TikTok Live Kit | Giữ hai thư mục cạnh nhau như sơ đồ, hoặc đặt `KIT_DIR` tới bộ lõi trước khi chạy script. |
| Overlay hiện khung trống `template` | Kiểm tra `/api/health`, dừng server kit đang chạy và khởi động bằng `tiktok-live-pgd-main/run.bat`. |
| Không mở được bảng điều khiển / lỗi `EADDRINUSE` | Xem log cửa sổ server; kiểm tra có server khác đang dùng cổng 3939 hay không. |
| Không nhận quà, tim hoặc bình luận | Kiểm tra kênh đã LIVE, tên kênh và trạng thái nguồn trong tab Live; nếu dùng TikFinity, kiểm tra ứng dụng đó đã kết nối đúng kênh. |
| Không nghe thấy tiếng | Kiểm tra âm lượng, bật âm thanh trên overlay nếu trình duyệt yêu cầu, dùng Đọc thử và xem log giọng đọc của server. |
| Sửa JSON nhưng luật chưa đổi | Kiểm tra luật đã lưu trong tab Luật; file `data/rules-chua.json` được ưu tiên hơn luật mặc định của theme. |

## Tài liệu và giấy phép

- [README riêng của Chùa ảo](tiktok-live-pgd-main/README.md)
- [README TikTok Live Kit tiếng Việt](tiktok-live-kit/README.vi.md)
- [Hướng dẫn lên sóng](tiktok-live-pgd-main/GO-LIVE.md)
- [Tạo và chỉnh sửa theme](tiktok-live-kit/docs/THEME.vi.md)
- [Chuẩn bị tài nguyên hình ảnh và âm thanh](tiktok-live-kit/docs/ASSETS-GUIDE.vi.md)
- [Nguồn và giấy phép tài nguyên của chùa](tiktok-live-pgd-main/themes/chua/CREDITS.md)

Mã nguồn sử dụng giấy phép MIT theo [LICENSE của kit](tiktok-live-kit/LICENSE) và [LICENSE của theme](tiktok-live-pgd-main/LICENSE). Ảnh, nhạc và tiếng hiệu ứng tuân theo giấy phép riêng được ghi trong tài liệu nguồn tài nguyên.
