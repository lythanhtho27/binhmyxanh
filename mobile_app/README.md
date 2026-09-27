# Ứng Dụng Mobile "Nhật Ký Số Bằng Giọng Nói" (Flutter / Android)
**Hệ Sinh Thái Nông Sản Sạch Chuẩn VietGAP - Bình Mỹ Xanh**

---

## 1. Giới thiệu dự án
Ứng dụng di động giúp nông dân ghi chép nhật ký canh tác chuẩn VietGAP hoàn toàn bằng **giọng nói tiếng Việt**:
- **Không cần bấm phím chữ nhỏ:** Nông dân tay lấm bùn đất chỉ cần chạm nút Micro to và nói tự nhiên.
- **Tự động bóc tách thực thể (AI Entity Extraction):** Phân tích câu nói thành *Ngày canh tác, Giai đoạn VietGAP (1 đến 5), Hoạt động, Vật tư, Liều lượng*.
- **Đồng bộ thời gian thực:** Dữ liệu tự động đẩy lên Web Express.js / MySQL để cập nhật ngay vào Tab "Nhật ký canh tác" và tem QR của sản phẩm.

---

## 2. Cấu trúc thư mục mã nguồn (`lib/`)

```
lib/
├── main.dart                      # Điểm khởi chạy ứng dụng & kiểm tra phiên đăng nhập
├── models/
│   ├── user_model.dart            # Mô hình tài khoản nông hộ / kỹ thuật viên
│   ├── farming_lot_model.dart     # Mô hình lô canh tác VietGAP & thanh tiến độ %
│   └── farming_log_model.dart     # Mô hình nhật ký canh tác & 5 giai đoạn
├── services/
│   ├── api_service.dart           # Giao tiếp HTTP REST API với Backend Express.js
│   └── speech_service.dart        # Thu âm micro & chuyển giọng nói thành văn bản
└── screens/
    ├── login_screen.dart          # Màn hình đăng nhập nông hộ (hỗ trợ nút Đăng nhập nhanh Bác Ba)
    ├── home_screen.dart           # Dashboard nông hộ, danh sách lô đất, nút Micro to
    ├── voice_log_screen.dart      # Màn hình ghi âm giọng nói & hộp thoại xem trước AI
    └── lot_detail_screen.dart     # Chi tiết 5 giai đoạn vòng đời canh tác VietGAP
```

---

## 3. Hướng dẫn chạy ứng dụng

### Bước 1: Khởi động Backend Express.js
Đảm bảo Backend đang chạy tại cổng `3000`:
```bash
# Tại thư mục gốc của dự án:
node server.js
```

### Bước 2: Chạy ứng dụng Flutter
```bash
# Chuyển vào thư mục mobile_app:
cd mobile_app

# Lấy các thư viện cần thiết:
flutter pub get

# Chạy ứng dụng trên thiết bị (Android Emulator, Thiết bị thật hoặc Windows Desktop):
flutter run
```

---

## 4. Tài khoản kiểm thử (Demo)

* **Số điện thoại:** `0987654321` (hoặc Email: `nongdan@binhmyxanh.vn`)
* **Mật khẩu:** `123456`
* *(Có sẵn nút **"Đăng nhập nhanh Bác Ba (Mẫu)"** trên màn hình đăng nhập để vào ngay).*

---

## 5. Các câu nói mẫu để thử nghiệm

1. **Giai đoạn 1 (Làm đất):**
   > *"Hôm nay ngày một cày bừa phơi ải đất rải ba mươi lăm ký vôi nông nghiệp khử trùng đất"*
2. **Giai đoạn 3 (Chăm sóc & Đạm cá):**
   > *"Sáng ngày mười cây có hai lá thật, tỉa dặm luống và tưới thúc đợt một bằng đạm cá vi sinh tỷ lệ một trên ba trăm"*
3. **Giai đoạn 3 (Xử lý sâu bệnh thảo mộc):**
   > *"Ngày mười bốn kiểm tra sâu bệnh phát hiện bọ nhảy mép bờ luống, phun tỏi ớt gừng với dầu khoáng SK Enspray bốn mươi ml"*
4. **Giai đoạn 4 (Cách ly bắt buộc):**
   > *"Ngày hai mươi mốt bắt đầu thời kỳ cách ly bắt buộc trước thu hoạch, ngừng tuyệt đối phân bón chỉ tưới nước sạch"*
5. **Giai đoạn 5 (Kiểm nghiệm an toàn & Thu hoạch):**
   > *"Ngày hai mươi lăm test nhanh nitrat và thuốc bảo vệ thực vật kết quả âm tính cho phép thu hoạch"*
