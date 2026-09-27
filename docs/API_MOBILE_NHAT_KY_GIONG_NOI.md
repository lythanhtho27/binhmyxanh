# TÀI LIỆU BACKEND API - APP MOBILE "NHẬT KÝ SỐ BẰNG GIỌNG NÓI"
**Hệ Thống Nông Sản Bình Mỹ Xanh (Chuẩn VietGAP)**

---

## 1. Cấu hình chung & Môi trường

- **Base URL cục bộ (Máy tính):** `http://localhost:3000/api`
- **Base URL Android Emulator:** `http://10.0.2.2:3000/api`
- **Base URL Thiết bị Android thật (cùng mạng Wi-Fi):** `http://<IP_MAY_TINH>:3000/api` (ví dụ: `http://192.168.1.5:3000/api`)
- **Định dạng dữ liệu:** `application/json; charset=utf-8`
- **CORS:** Đã kích hoạt cho mọi nguồn (`Access-Control-Allow-Origin: *`)

---

## 2. Tài khoản thử nghiệm (Test Accounts)

| Vai trò | Số điện thoại | Email | Mật khẩu |
| :--- | :--- | :--- | :--- |
| **Nông dân VietGAP** | `0987654321` | `nongdan@binhmyxanh.vn` | `123456` |
| **Quản trị viên / Kỹ sư** | `0901234567` | `admin@nongsan.vn` | `admin123` |

---

## 3. Danh sách các API Endpoint

### 🔑 Nhóm 1: Xác Thực & Đăng Nhập (Authentication)

#### 1. Đăng nhập Mobile (Số điện thoại / Email)
- **Endpoint:** `POST /api/auth/login`
- **Body JSON:**
```json
{
  "phone": "0987654321",
  "password": "123456"
}
```
*(Có thể dùng `username` hoặc `email` thay cho `phone`)*

- **Response thành công (200 OK):**
```json
{
  "success": true,
  "message": "Chào mừng Bác Ba (Nông dân VietGAP) đăng nhập thành công!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 3,
    "full_name": "Bác Ba (Nông dân VietGAP)",
    "email": "nongdan@binhmyxanh.vn",
    "phone": "0987654321",
    "role": "farmer",
    "address": "Khu nông nghiệp công nghệ cao Bình Mỹ, Củ Chi"
  }
}
```

#### 2. Lấy thông tin tài khoản hiện tại
- **Endpoint:** `GET /api/auth/me`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Response:** Thông tin chi tiết của người dùng.

---

### 🎙️ Nhóm 2: Bóc Tách Giọng Nói (Speech-to-Text Parser)

#### Bóc tách chuỗi câu nói thành thực thể VietGAP
- **Endpoint:** `POST /api/voice/parse`
- **Mục đích:** Khi nông dân nói xong, app gửi câu văn bản lên endpoint này để nhận về thông tin đã được trích xuất (Ngày, Giai đoạn, Hoạt động, Vật tư, Liều lượng) hiển thị lên màn hình cho nông dân xác nhận trước khi lưu.
- **Body JSON:**
```json
{
  "voice_text": "Hôm nay ngày 10 cây có hai lá thật, nhổ cỏ dại và tưới thúc đợt 1 bằng đạm cá vi sinh tỷ lệ 1 trên 300",
  "lot_id": 1
}
```
- **Response thành công (200 OK):**
```json
{
  "success": true,
  "message": "Bóc tách dữ liệu giọng nói thành công",
  "parsed": {
    "day_number": 10,
    "stage_id": 3,
    "stage_name": "Giai đoạn 3: Chăm sóc & Cây con phát triển",
    "session_of_day": "morning",
    "action_title": "Tỉa dặm luống & Tưới thúc đợt 1",
    "action_detail": "Hôm nay ngày 10 cây có hai lá thật, nhổ cỏ dại và tưới thúc đợt 1 bằng đạm cá vi sinh tỷ lệ 1 trên 300",
    "materials_used": "Đạm cá ủ vi sinh thủy phân",
    "dosage": "Tỉ lệ pha 1:300",
    "voice_raw_text": "Hôm nay ngày 10 cây có hai lá thật...",
    "is_quarantine_notice": 0,
    "is_harvest_test": 0,
    "notes": "Ghi chép từ nhật ký giọng nói mobile"
  }
}
```

---

### 🌾 Nhóm 3: Lô Canh Tác (Farming Lots)

#### 1. Lấy danh sách các lô canh tác
- **Endpoint:** `GET /api/farming/lots`
- **Response:** Danh sách các lô (Lô A2 - Rau muống, Lô B1 - Cà chua bi...), tính sẵn tỷ lệ hoàn thành `%` chu kỳ VietGAP.

#### 2. Lấy chi tiết 1 lô kèm toàn bộ nhật ký 5 giai đoạn
- **Endpoint:** `GET /api/farming/lots/:id` (ví dụ: `/api/farming/lots/1`)
- **Response:** 
  - Thông tin nhận diện vùng trồng, mã số `RM-VG-2026-0901`, quy chuẩn `TCVN 11892-1:2017`.
  - Mảng `stages` gom nhóm sẵn từ Giai đoạn 1 đến Giai đoạn 5 cùng các nhật ký tương ứng.
  - Các cam kết an toàn VietGAP.

---

### 📝 Nhóm 4: Ghi & Quản Lý Nhật Ký (Farming Logs)

#### 1. Tạo nhật ký canh tác mới (Hỗ trợ 2 chế độ)
- **Endpoint:** `POST /api/farming/logs`
- **Headers:** `Authorization: Bearer <TOKEN>` *(tuỳ chọn)*

* **Cách A - Ghi nhanh trực tiếp từ Giọng nói:**
```json
{
  "lot_id": 1,
  "voice_text": "Ngày mười bốn kiểm tra sâu bệnh thấy có bọ nhảy, đã phun gừng tỏi ớt với dầu khoáng SK Enspray 40 ml"
}
```
*(Backend tự động chạy AI Parser để bóc tách ngày, giai đoạn và vật tư rồi lưu vào CSDL)*

* **Cách B - Gửi form đầy đủ sau khi nông dân xác nhận trên App:**
```json
{
  "lot_id": 1,
  "day_number": 14,
  "stage_id": 3,
  "stage_name": "Giai đoạn 3: Chăm sóc & Cây con phát triển",
  "session_of_day": "morning",
  "action_title": "Kiểm tra sâu bệnh IPM & Xử lý thảo mộc sinh học",
  "action_detail": "Phun dung dịch gừng tỏi ớt và dầu khoáng sinh học SK Enspray 99 EC xua đuổi bọ nhảy",
  "materials_used": "Dung dịch tỏi ớt, Dầu khoáng SK Enspray 99 EC",
  "dosage": "40 ml / bình 16L",
  "voice_text": "Ngày mười bốn kiểm tra sâu bệnh...",
  "image_url": "/uploads/farming/sau-benh-1.jpg"
}
```

#### 2. Chỉnh sửa nhật ký
- **Endpoint:** `PUT /api/farming/logs/:id`

#### 3. Xóa nhật ký
- **Endpoint:** `DELETE /api/farming/logs/:id`

#### 4. Thống kê tổng quan cho Dashboard Mobile
- **Endpoint:** `GET /api/farming/stats`
- **Response:** Tổng số lô, số lô đang cách ly, số lô đã thu hoạch, nhật ký gần đây nhất.

#### 5. Tải ảnh chụp hiện trường tại ruộng
- **Endpoint:** `POST /api/farming/upload-image`
- **Content-Type:** `multipart/form-data` (Field name: `image`)
- **Response:**
```json
{
  "success": true,
  "message": "Tải ảnh hiện trường thành công",
  "image_url": "/uploads/farming/farm-1727400000000.jpg"
}
```
