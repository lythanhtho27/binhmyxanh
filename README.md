# 🌿 BÌNH MỸ XANH - NỀN TẢNG THƯƠNG MẠI ĐIỆN TỬ NÔNG SẢN SẠCH

Dự án website thương mại điện tử chuyên cung cấp rau củ quả, trái cây, nấm và nông sản hữu cơ đạt chuẩn **VietGAP & GlobalGAP** từ nông trại đến bàn ăn gia đình. Xây dựng bằng **Node.js (Express)** kết hợp cơ sở dữ liệu **MySQL / MariaDB**.

---

## 🎨 Giao diện & Trải nghiệm
- **Tone màu chủ đạo:** Xanh lá nhạt tươi mới (`#e8f5e9`, `#81c784`, `#2e7d32`), phong cách nông nghiệp sạch và gần gũi thiên nhiên.
- **Responsive:** Tương thích hoàn hảo trên máy tính bàn, máy tính bảng và điện thoại di động.
- **Hiệu ứng:** Slider trượt mượt mà cho sản phẩm mới, thông báo Toast thêm vào giỏ hàng tức thì không cần tải lại trang.

---

## 🌟 Chức năng Hệ thống

### 1. Phân hệ Khách hàng (User)
- **Trang chủ (`/`):**
  - Banner giới thiệu thương hiệu và thông điệp nông sản hữu cơ.
  - **Slide / Carousel** sản phẩm mới thu hoạch (có nút Next/Prev trượt mượt mà).
  - Danh mục nông sản nổi bật (Rau củ, Trái cây, Nấm, Hạt dinh dưỡng, Mật ong & Đặc sản).
  - Danh sách sản phẩm bán chạy có gắn nhãn chứng nhận VietGAP và % giảm giá.
  - Thanh tìm kiếm sản phẩm nhanh chóng.
  - Nút thêm nhanh vào giỏ hàng kèm Toast thông báo.
- **Trang chi tiết sản phẩm (`/products/:id`):**
  - Thiết kế tỉ mỉ, đầy đủ thông số như trang bán sách / sàn TMĐT cao cấp.
  - Hình ảnh sản phẩm lớn chất lượng cao kèm các huy hiệu chứng nhận.
  - Bảng thông số: Xuất xứ nơi trồng, Ngày thu hoạch, Hạn dùng, Quy cách đóng gói.
  - Giá bán, giá gốc gạch ngang và tỷ lệ tiết kiệm.
  - Bộ chọn số lượng (+ / -), nút "Thêm vào giỏ hàng" (AJAX) và "Mua ngay".
  - Các tab nội dung: *Mô tả & câu chuyện nông sản*, *Giá trị dinh dưỡng*, *Hướng dẫn bảo quản*, *Đánh giá nhận xét của khách hàng (5 sao)*.
  - Đề xuất các sản phẩm liên quan cùng danh mục ("Có thể bạn cũng thích").
- **Trang Giỏ hàng & Thanh toán (`/cart` & `/cart/checkout`):**
  - Hiển thị danh sách món đã chọn, cho phép tăng giảm số lượng hoặc xóa món.
  - Tự động tính miễn phí vận chuyển (FREESHIP) cho đơn từ 300.000đ trở lên.
  - Form đặt hàng: Họ tên, số điện thoại, email, địa chỉ giao hàng và ghi chú.
  - Hỗ trợ 2 phương thức:
    - **COD**: Thanh toán tiền mặt khi nhận hàng và kiểm tra nông sản.
    - **Chuyển khoản**: Tự động tạo mã **VietQR** kèm chính xác số tiền và mã đơn hàng để khách quét mã trên ứng dụng ngân hàng.
  - Trang xác nhận đơn hàng thành công (`/cart/success/:orderCode`).
- **Tài khoản người dùng (`/auth/...`):**
  - Đăng ký, Đăng nhập, Đăng xuất.
  - Trang quản lý thông tin cá nhân và xem lịch sử các đơn hàng đã đặt.

---

### 2. Phân hệ Quản trị (Admin)
- **Bảng điều khiển (`/admin`):**
  - Thống kê doanh thu, tổng số đơn hàng, đơn hàng chờ xác nhận, tổng số sản phẩm và khách hàng.
  - Bảng hiển thị các đơn hàng mới nhất cần xử lý.
- **Quản lý sản phẩm (`/admin/products`):**
  - Danh sách sản phẩm dạng bảng (Hình ảnh, Tên, Danh mục, Giá, Tồn kho, Xuất xứ, Trạng thái).
  - Tìm kiếm và lọc theo danh mục.
  - **Thêm sản phẩm mới** (Modal popup nhập tên, danh mục, giá, tồn kho, xuất xứ, hạn dùng, ảnh, mô tả, dinh dưỡng...).
  - **Sửa sản phẩm** (Modal popup cho phép cập nhật mọi thông tin).
  - **Xóa sản phẩm** (có hộp thoại xác nhận an toàn).
- **Quản lý đơn hàng (`/admin/orders`):**
  - Danh sách đơn hàng với các bộ lọc trạng thái: *Tất cả, Chờ xác nhận, Đang xử lý, Đang giao, Hoàn thành, Đã hủy*.
  - Xem chi tiết từng đơn hàng (`/admin/orders/:id`): thông tin người nhận, địa chỉ, danh sách món hàng, tổng tiền.
  - **Cập nhật trạng thái đơn hàng** (*Chờ xác nhận -> Đang xử lý -> Đang giao -> Hoàn thành*) và trạng thái thanh toán (*Chưa thanh toán / Đã thanh toán*).
- **Quản lý người dùng (`/admin/users`):**
  - Danh sách thành viên đăng ký trong hệ thống.
  - Phân quyền tài khoản (Thăng quyền Quản trị viên <-> Khách hàng thông thường).
  - Khóa hoặc Mở khóa tài khoản người dùng.

---

## 🔑 Tài khoản Thử Nghiệm

| Vai trò | Email | Mật khẩu | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@nongsan.vn` | `admin123` | Toàn quyền quản trị website và đơn hàng |
| **Khách hàng** | `khachhang@gmail.com` | `user123` | Tài khoản mua sắm mẫu đã có sẵn |

*(Bạn cũng có thể tự tạo tài khoản mới ngay trên giao diện Đăng ký).*

---

## 🚀 Hướng Dẫn Chạy Ứng Dụng

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Cấu hình cơ sở dữ liệu
File `.env` đã được cấu hình sẵn cho máy tính của bạn:
```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3308
DB_USER=root
DB_PASSWORD=
DB_NAME=nongsan_db
SESSION_SECRET=nongsan_organic_green_secret_key_2026
```
> **Đặc biệt:** Hệ thống có cơ chế **Auto-Migration**. Khi khởi chạy, hệ thống sẽ tự động tạo Database `nongsan_db`, tạo đầy đủ các bảng và chèn sẵn 5 danh mục cùng 11 sản phẩm nông sản mẫu chất lượng cao mà không cần phải import thủ công!

### 3. Khởi động Server
```bash
npm start
```
Truy cập trình duyệt:
- Trang mua hàng: **[http://localhost:3000](http://localhost:3000)**
- Trang quản trị Admin: **[http://localhost:3000/admin](http://localhost:3000/admin)**
