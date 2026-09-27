const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT) || 3308,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nongsan_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Khởi tạo pool kết nối chính
let pool = null;

async function initDB() {
  try {
    // 1. Kết nối tạm để tạo Database nếu chưa tồn tại
    const rootConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });

    await rootConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await rootConnection.end();

    // 2. Tạo connection pool đến database vừa tạo
    pool = mysql.createPool(dbConfig);

    // 3. Tạo bảng users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        address VARCHAR(255) DEFAULT NULL,
        role ENUM('admin', 'customer') DEFAULT 'customer',
        status ENUM('active', 'locked') DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Tạo bảng categories
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        slug VARCHAR(150) NOT NULL UNIQUE,
        description TEXT DEFAULT NULL,
        image VARCHAR(255) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Tạo bảng products
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        price DECIMAL(12, 2) NOT NULL,
        original_price DECIMAL(12, 2) DEFAULT NULL,
        unit VARCHAR(50) DEFAULT 'kg',
        stock INT DEFAULT 100,
        origin VARCHAR(150) DEFAULT 'Việt Nam',
        harvest_date VARCHAR(100) DEFAULT 'Hái mới trong ngày',
        shelf_life VARCHAR(100) DEFAULT '5-7 ngày bảo quản lạnh',
        certification VARCHAR(100) DEFAULT 'VietGAP',
        image VARCHAR(500) NOT NULL,
        short_description VARCHAR(500) DEFAULT NULL,
        description LONGTEXT DEFAULT NULL,
        nutrition_info TEXT DEFAULT NULL,
        storage_guide TEXT DEFAULT NULL,
        is_featured TINYINT(1) DEFAULT 0,
        is_new TINYINT(1) DEFAULT 1,
        sold_count INT DEFAULT 0,
        rating DECIMAL(3, 1) DEFAULT 5.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Tạo bảng orders
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_code VARCHAR(50) NOT NULL UNIQUE,
        user_id INT DEFAULT NULL,
        customer_name VARCHAR(150) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_email VARCHAR(150) DEFAULT NULL,
        shipping_address VARCHAR(300) NOT NULL,
        note TEXT DEFAULT NULL,
        payment_method ENUM('cod', 'banking') DEFAULT 'cod',
        payment_status ENUM('unpaid', 'paid') DEFAULT 'unpaid',
        subtotal DECIMAL(12, 2) NOT NULL,
        shipping_fee DECIMAL(12, 2) DEFAULT 25000,
        discount_amount DECIMAL(12, 2) DEFAULT 0,
        total_amount DECIMAL(12, 2) NOT NULL,
        status ENUM('pending', 'processing', 'shipping', 'completed', 'cancelled') DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. Tạo bảng order_items
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT DEFAULT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_image VARCHAR(500) DEFAULT NULL,
        unit VARCHAR(50) DEFAULT 'kg',
        price DECIMAL(12, 2) NOT NULL,
        quantity INT NOT NULL,
        total_price DECIMAL(12, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. Cập nhật role trong users để hỗ trợ vai trò nông dân (farmer)
    try {
      await pool.query(`
        ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'customer', 'farmer', 'technician') DEFAULT 'customer';
      `);
    } catch (e) {
      // Bỏ qua nếu bảng đã cập nhật
    }

    // 9. Tạo bảng farming_lots (Lô nông sản / Vùng trồng VietGAP)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS farming_lots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lot_code VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        product_id INT DEFAULT NULL,
        area VARCHAR(100) DEFAULT '1.000 m² (Lô A2)',
        zone_code VARCHAR(100) DEFAULT 'VN-XX-YY-ZZZ',
        facility_name VARCHAR(255) DEFAULT 'Hợp tác xã / Trang trại Nông sản Sạch Xanh',
        location VARCHAR(255) DEFAULT 'Thôn/Ấp X, Xã Y, Huyện Z, Tỉnh/TP...',
        plant_variety VARCHAR(255) DEFAULT 'Rau muống lá tre (Hạt giống F1 Trang Nông, tỉ lệ nảy mầm >85%, có chứng nhận kiểm nghiệm kiểm dịch)',
        water_source VARCHAR(255) DEFAULT 'Nước giếng khoan đã qua hệ thống lắng lọc (Đạt chỉ tiêu vi sinh và kim loại nặng theo QCVN 01-1:2018/BYT)',
        technician_name VARCHAR(150) DEFAULT 'Kỹ sư nông học / Cán bộ VietGAP cơ sở',
        standard VARCHAR(100) DEFAULT 'TCVN 11892-1:2017',
        start_date DATE DEFAULT NULL,
        expected_harvest_date DATE DEFAULT NULL,
        status ENUM('in_progress', 'quarantine', 'harvested', 'completed') DEFAULT 'in_progress',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 10. Tạo bảng farming_logs (Nhật ký canh tác giọng nói / điện tử)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS farming_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lot_id INT NOT NULL,
        user_id INT DEFAULT NULL,
        log_date DATE NOT NULL,
        day_number INT DEFAULT 1,
        stage_id INT DEFAULT 1,
        stage_name VARCHAR(150) NOT NULL,
        session_of_day ENUM('morning', 'afternoon', 'evening', 'all_day') DEFAULT 'all_day',
        action_title VARCHAR(255) NOT NULL,
        action_detail TEXT NOT NULL,
        materials_used VARCHAR(255) DEFAULT NULL,
        dosage VARCHAR(150) DEFAULT NULL,
        voice_raw_text TEXT DEFAULT NULL,
        image_url VARCHAR(500) DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        is_quarantine_notice TINYINT(1) DEFAULT 0,
        is_harvest_test TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lot_id) REFERENCES farming_lots(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 11. Chèn dữ liệu mẫu (Seed Data) nếu chưa có
    await seedInitialData();

    console.log('✅ Cơ sở dữ liệu và các bảng đã được khởi tạo thành công!');
    return pool;
  } catch (error) {
    console.error('❌ Lỗi kết nối hoặc khởi tạo CSDL:', error.message);
    throw error;
  }
}

async function seedInitialData() {
  // Kiểm tra bảng users
  const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
  if (users[0].count === 0) {
    const adminPass = await bcrypt.hash('admin123', 10);
    const userPass = await bcrypt.hash('user123', 10);

    await pool.query(`
      INSERT INTO users (full_name, email, password, phone, address, role, status) VALUES
      ('Quản Trị Viên', 'admin@nongsan.vn', ?, '0901234567', 'Trụ sở Bình Mỹ Xanh, Củ Chi, TP. Hồ Chí Minh', 'admin', 'active'),
      ('Nguyễn Văn An', 'khachhang@gmail.com', ?, '0912345678', 'Số 123 Đường Nguyễn Huệ, Quận 1, TP. HCM', 'customer', 'active')
    `, [adminPass, userPass]);
    console.log('🌱 Đã tạo tài khoản mẫu: Admin (admin@nongsan.vn / admin123), User (khachhang@gmail.com / user123)');
  }

  // Kiểm tra bảng categories
  const [categories] = await pool.query('SELECT COUNT(*) as count FROM categories');
  if (categories[0].count === 0) {
    await pool.query(`
      INSERT INTO categories (id, name, slug, description, image) VALUES
      (1, 'Rau Củ Hữu Cơ', 'rau-cu-huu-co', 'Rau củ tươi sạch chuẩn VietGAP, thu hoạch hàng ngày tại nông trại', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80'),
      (2, 'Trái Cây Tươi Ngon', 'trai-cay-tuoi-ngon', 'Trái cây đặc sản nhiệt đới ngọt mọng, an toàn không chất bảo quản', 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&auto=format&fit=crop&q=80'),
      (3, 'Nấm & Thảo Mộc', 'nam-thao-moc', 'Các loại nấm tươi giàu dinh dưỡng và thảo mộc tự nhiên cho sức khỏe', 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80'),
      (4, 'Hạt & Nông Sản Khô', 'hat-nong-san-kho', 'Các loại hạt dinh dưỡng, gạo đặc sản ST25 và nông sản sấy thăng hoa', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80'),
      (5, 'Mật Ong & Đặc Sản Quê', 'mat-ong-dac-san-que', 'Mật ong hoa rừng nguyên chất và đặc sản từ các vùng miền Việt Nam', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80')
    `);
    console.log('🌱 Đã chèn 5 danh mục nông sản mẫu.');
  }

  // Kiểm tra bảng products
  const [products] = await pool.query('SELECT COUNT(*) as count FROM products');
  if (products[0].count === 0) {
    await pool.query(`
      INSERT INTO products 
      (category_id, name, slug, price, original_price, unit, stock, origin, harvest_date, shelf_life, certification, image, short_description, description, nutrition_info, storage_guide, is_featured, is_new, sold_count, rating)
      VALUES
      (
        1,
        'Cà Chua Bi Cherry Đỏ Đà Lạt Hữu Cơ',
        'ca-chua-bi-cherry-do-da-lat',
        45000,
        55000,
        'Hộp 500g',
        150,
        'Đà Lạt, Lâm Đồng',
        'Thu hoạch sáng sớm hôm nay',
        '7 - 10 ngày trong ngăn mát',
        'VietGAP & Hữu Cơ',
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
        'Cà chua bi Cherry đỏ căng mọng, vị ngọt thanh giòn ngọt, giàu lycopene và vitamin C.',
        'Cà chua bi Cherry Đà Lạt được canh tác theo phương pháp hữu cơ hoàn toàn không sử dụng phân bón hóa học hay thuốc trừ sâu độc hại. Từng chùm cà chua chín cây tự nhiên dưới nắng gió mát lành của cao nguyên Đà Lạt, cho vị ngọt tự nhiên, giòn dai vỏ mỏng.',
        'Giàu Vitamin C, Vitamin A, Kali, Lycopene chống lão hóa và hỗ trợ làm đẹp da, tốt cho tim mạch.',
        'Bảo quản ở nhiệt độ phòng nơi thoáng mát hoặc bảo quản ngăn mát tủ lạnh (6-10 độ C) để giữ độ tươi giòn.',
        1, 1, 85, 4.9
      ),
      (
        1,
        'Bắp Cải Thảo Hữu Cơ Mộc Châu',
        'bap-cai-thao-huu-co-moc-chau',
        32000,
        40000,
        'Bắp ~1.2kg',
        120,
        'Mộc Châu, Sơn La',
        'Hái mới mỗi sáng',
        '10 - 14 ngày ngăn mát',
        'VietGAP',
        'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=800&auto=format&fit=crop&q=80',
        'Bắp cải thảo cuộn chặt, bẹ trắng giòn ngọt mát, thích hợp làm kim chi, nấu canh hoặc xào.',
        'Được trồng trên vùng đất mát lạnh Mộc Châu quanh năm mây mù bao phủ, bắp cải thảo có độ giòn ngọt đậm đà khác biệt. Cây phát triển tự nhiên với nguồn nước ngầm vùng núi đá vôi.',
        'Cung cấp nhiều chất xơ, vitamin K, vitamin C và folate tốt cho hệ tiêu hóa và tăng cường miễn dịch.',
        'Bọc kín bằng màng bọc thực phẩm hoặc túi giấy, bảo quản trong ngăn rau củ tủ lạnh.',
        1, 1, 64, 4.8
      ),
      (
        1,
        'Bông Cải Xanh Baby Hữu Cơ',
        'bong-cai-xanh-baby-huu-co',
        52000,
        65000,
        'Túi 500g',
        80,
        'Đà Lạt, Lâm Đồng',
        'Hái sáng sớm',
        '5 - 7 ngày',
        'GlobalGAP',
        'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=800&auto=format&fit=crop&q=80',
        'Bông cải xanh baby bông nhỏ mềm ngọt, cuống giòn sần sật, giàu sulforaphane chống oxy hóa.',
        'Bông cải xanh Baby được thu hoạch khi cây còn non, các nhánh hoa mềm mại, có thể ăn cả cuống mà không cần gọt vỏ. Món ăn yêu thích cho các bữa ăn healthy, luộc chấm kho quẹt hay làm salad.',
        'Chứa hàm lượng Sulforaphane cao, giàu canxi, sắt, vitamin A, C và K.',
        'Rửa sạch trước khi chế biến, bảo quản ngăn mát bọc túi kín có lỗ thoát khí.',
        1, 0, 92, 5.0
      ),
      (
        2,
        'Dâu Tây Giống Nhật Hana Mộc Châu',
        'dau-tay-hana-moc-chau',
        185000,
        220000,
        'Hộp 500g',
        50,
        'Mộc Châu, Sơn La',
        'Chín bói thu hoạch ngày',
        '3 - 5 ngày ngăn mát',
        'VietGAP Chuẩn Nhật',
        'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&auto=format&fit=crop&q=80',
        'Dâu tây giống Hana Nhật Bản quả đỏ au, mùi thơm nồng nàn, vị ngọt đậm pha chút chua nhẹ.',
        'Dâu tây giống Tochiotome/Hana được các kỹ sư đưa về trồng tại thung lũng Mộc Châu với công nghệ giá thể hồi lưu. Quả dâu chín đỏ tự nhiên trên luống, không chất kích thích, an toàn tuyệt đối cho trẻ em.',
        'Cực kỳ giàu Vitamin C, Axit Ellagic, Mangan và chất xơ, hỗ trợ tim mạch và trắng sáng da.',
        'Để nguyên cuống khi bảo quản tủ mát, chỉ rửa trước khi ăn để dâu không bị úng nước.',
        1, 1, 140, 4.9
      ),
      (
        2,
        'Xoài Cát Hòa Lộc Loại 1 Tiền Giang',
        'xoai-cat-hoa-loc-tien-giang',
        95000,
        115000,
        'Kg (2-3 trái)',
        110,
        'Cái Bè, Tiền Giang',
        'Chín cây tự nhiên',
        '5 - 7 ngày',
        'Chỉ dẫn địa lý OCOP',
        'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&auto=format&fit=crop&q=80',
        'Đệ nhất xoài Nam Bộ, thịt quả vàng tươi dẻo mịn, không xơ, hương thơm ngát vị ngọt sâu.',
        'Xoài cát Hòa Lộc nổi tiếng trứ danh xứ Tiền Giang phù sa màu mỡ. Từng trái xoài được bao bọc cẩn thận tránh côn trùng từ khi còn nhỏ trên cây. Thịt xoài dày, hạt nhỏ, vị ngọt đậm quyến rũ.',
        'Giàu vitamin A, C, E, enzyme tiêu hóa amylase và các carotenoid tự nhiên.',
        'Khi trái còn xanh để ngoài nhiệt độ phòng đến khi vỏ vàng ươm và tỏa mùi thơm thì dùng ngay hoặc để lạnh.',
        1, 0, 115, 5.0
      ),
      (
        2,
        'Bưởi Da Xanh Ruột Hồng Bến Tre',
        'buoi-da-xanh-ruot-hong-ben-tre',
        75000,
        90000,
        'Trái ~1.4kg - 1.6kg',
        95,
        'Bến Tre',
        'Mới hái từ vườn',
        '15 - 20 ngày',
        'VietGAP OCOP 4 sao',
        'https://images.unsplash.com/photo-1609230559795-3642faebdf80?w=800&auto=format&fit=crop&q=80',
        'Bưởi da xanh vỏ mỏng mướt, tép bưởi hồng đỏ căng mọng nước, vị ngọt thanh không đắng.',
        'Bưởi da xanh chính gốc Giồng Trôm - Bến Tre. Vỏ bưởi xanh bóng mỏng dính, các múi bưởi róc hạt dễ bóc, tép giòn tan, vị ngọt ngào thanh mát giải nhiệt tuyệt vời.',
        'Giàu chất chống oxy hóa, flavonoid naringenin giảm cholesterol, vitamin C dồi dào.',
        'Bảo quản nơi khô ráo thoáng mát. Bưởi để sau thu hoạch 3-5 ngày sẽ xuống nước càng ngọt đậm.',
        0, 1, 78, 4.8
      ),
      (
        3,
        'Nấm Hương Tươi Sa Pa Hữu Cơ',
        'nam-huong-tuoi-sa-pa',
        68000,
        80000,
        'Khay 300g',
        70,
        'Sa Pa, Lào Cai',
        'Hái trong ngày',
        '5 - 7 ngày ngăn mát',
        'Hữu cơ sạch',
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
        'Nấm hương tươi cùi dày mũ xòe đều, mùi thơm đặc trưng thanh khiết, vị ngọt thịt tự nhiên.',
        'Nấm hương được trồng trên phôi mùn cưa gỗ sồi tại khí hậu mát lạnh Sa Pa. Nấm tươi giữ trọn độ ẩm, mùi thơm nồng nàn hơn nấm khô, rất phù hợp cho món lẩu, xào chay mặn.',
        'Nguồn đạm thực vật chất lượng, giàu polysaccharides (lentinan) tăng sức đề kháng.',
        'Bọc giấy báo hoặc hộp nhựa có lót khăn giấy hút ẩm, bảo quản ngăn mát từ 2-5 độ C.',
        1, 1, 53, 4.9
      ),
      (
        3,
        'Nấm Đùi Gà Tươi Hữu Cơ',
        'nam-dui-ga-tuoi-huu-co',
        42000,
        50000,
        'Gói 500g',
        90,
        'Vĩnh Phúc',
        'Mới đóng gói',
        '7 - 10 ngày',
        'VietGAP',
        'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&auto=format&fit=crop&q=80',
        'Nấm đùi gà thân mập trắng ngần, giòn sần sật, vị ngọt bùi như thịt gà.',
        'Nấm đùi gà (King Oyster mushroom) có kết cấu chắc thịt giòn dai, thích hợp nướng mỡ hành, kho tiêu hoặc xào rau củ. Sản phẩm được nuôi trồng trong phòng lạnh khép kín vô trùng.',
        'Chứa nhiều protein, canxi, phốt pho, vitamin nhóm B và không chứa cholesterol.',
        'Bảo quản trong túi chân không ngăn mát tủ lạnh.',
        0, 0, 41, 4.7
      ),
      (
        4,
        'Hạt Điều Rang Muối Vỏ Lụa Bình Phước',
        'hat-dieu-rang-muoi-binh-phuoc',
        145000,
        170000,
        'Hũ 500g',
        200,
        'Bình Phước',
        'Mùa vụ mới nhất',
        '12 tháng',
        'OCOP 5 Sao',
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
        'Hạt điều size đại A1 cùi dày giòn rụm, rang củi thủ công lưu giữ trọn vị béo bùi đậm đà.',
        'Đặc sản Bình Phước trứ danh với phương pháp rang củi truyền thống cùng chút muối tinh giữ nguyên lớp vỏ lụa bảo vệ vị ngọt bùi tự nhiên của nhân hạt điều.',
        'Giàu chất béo không bão hòa đơn tốt cho tim mạch, magie, kẽm và protein chất lượng cao.',
        'Đậy kín nắp sau khi dùng, bảo quản nơi khô ráo thoáng mát, tránh ánh nắng trực tiếp.',
        1, 0, 210, 5.0
      ),
      (
        4,
        'Gạo Thơm ST25 Chính Hãng Ruộng Rươi',
        'gao-st25-ong-cua-ruong-ruoi',
        195000,
        230000,
        'Túi 5kg',
        160,
        'Sóc Trăng',
        'Vụ Đông Xuân mới',
        '12 tháng',
        'Gạo ngon nhất thế giới',
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
        'Gạo hạt dài trong veo, khi nấu tỏa hương lá dứa quyến rũ, cơm mềm dẻo đậm đà thơm ngon.',
        'Gạo ST25 được lai tạo bởi kỹ sư Hồ Quang Cua, canh tác tại vùng luân canh lúa - rươi hoàn toàn không dùng thuốc bảo vệ thực vật. Cơm để nguội vẫn giữ nguyên độ dẻo mềm óng ả.',
        'Hàm lượng đạm cao (protein > 10%), chỉ số đường huyết thấp phù hợp cho cả người ăn kiêng.',
        'Bảo quản trong chum gạo hoặc thùng kín nơi khô ráo, tránh ẩm ướt.',
        1, 1, 320, 5.0
      ),
      (
        5,
        'Mật Ong Hoa Cà Phê Nguyên Chất Đắk Lắk',
        'mat-ong-hoa-ca-phe-dak-lak',
        160000,
        190000,
        'Chai 1000ml',
        85,
        'Buôn Ma Thuột, Đắk Lắk',
        'Vụ hoa cà phê nở rộ',
        '24 tháng',
        '100% Tự nhiên',
        'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80',
        'Mật ong vàng óng đặc sánh, hương hoa cà phê Tây Nguyên thơm nồng, vị ngọt thanh tự nhiên.',
        'Được thu hoạch vào mùa hoa cà phê nở trắng bạt ngàn Tây Nguyên tháng 2 - 3 hàng năm. Những chú ong cần mẫn hút mật hoa tinh túy tạo nên giọt mật vàng óng, sánh mịn, không pha đường.',
        'Giàu enzyme tự nhiên, chất kháng khuẩn, vitamin B, khoáng chất giúp bồi bổ cơ thể và trị ho.',
        'Bảo quản ở nhiệt độ phòng, đậy kín nắp chai, KHÔNG để trong tủ lạnh tránh kết tinh đường tự nhiên.',
        1, 1, 180, 4.9
      )
    `);
    console.log('🌱 Đã chèn 11 sản phẩm nông sản mẫu chất lượng cao.');
  }

  // Kiểm tra tài khoản Nông Dân phục vụ Mobile App Nhật Ký Giọng Nói
  const [farmers] = await pool.query("SELECT * FROM users WHERE email = 'nongdan@binhmyxanh.vn' OR phone = '0987654321'");
  if (farmers.length === 0) {
    const farmerPass = await bcrypt.hash('123456', 10);
    await pool.query(`
      INSERT INTO users (full_name, email, password, phone, address, role, status) VALUES
      ('Bác Ba (Nông dân VietGAP)', 'nongdan@binhmyxanh.vn', ?, '0987654321', 'Khu nông nghiệp công nghệ cao Bình Mỹ, Củ Chi', 'farmer', 'active')
    `, [farmerPass]);
    console.log('🌱 Đã tạo tài khoản Nông dân mẫu: nongdan@binhmyxanh.vn (SĐT: 0987654321, MK: 123456)');
  }

  // Kiểm tra bảng farming_lots
  const [lots] = await pool.query('SELECT COUNT(*) as count FROM farming_lots');
  if (lots[0].count === 0) {
    const [prods] = await pool.query("SELECT id FROM products WHERE name LIKE '%Rau muống%' LIMIT 1");
    const productId = prods.length > 0 ? prods[0].id : null;

    const [lotResult] = await pool.query(`
      INSERT INTO farming_lots (lot_code, name, product_id, area, zone_code, facility_name, location, plant_variety, water_source, technician_name, standard, start_date, expected_harvest_date, status)
      VALUES
      ('RM-VG-2026-0901', 'Nhật Ký Canh Tác Rau Muống (Chuẩn VietGAP)', ?, '1.000 m² (Lô A2)', 'VN-XX-YY-ZZZ', 'Hợp tác xã / Trang trại Nông sản Sạch Xanh', 'Thôn/Ấp X, Xã Y, Huyện Z, Tỉnh/TP...', 'Rau muống lá tre (Hạt giống F1 Trang Nông, tỉ lệ nảy mầm >85%, có chứng nhận kiểm nghiệm kiểm dịch)', 'Nước giếng khoan đã qua hệ thống lắng lọc (Đạt chỉ tiêu vi sinh và kim loại nặng theo QCVN 01-1:2018/BYT)', 'Kỹ sư nông học / Cán bộ VietGAP cơ sở', 'TCVN 11892-1:2017', '2026-09-01', '2026-09-26', 'harvested')
    `, [productId]);

    const lotId = lotResult.insertId;

    await pool.query(`
      INSERT INTO farming_logs (lot_id, log_date, day_number, stage_id, stage_name, session_of_day, action_title, action_detail, materials_used, dosage, voice_raw_text, notes, is_quarantine_notice, is_harvest_test)
      VALUES
      (?, '2026-09-01', 1, 1, 'Giai đoạn 1: Chuẩn bị đất & Xử lý giá thể', 'morning', 'Khử trùng đất & Phơi ải', 'Cày bừa, phơi ải đất nhằm diệt mầm bệnh và trứng sâu tồn dư. Rải vôi nông nghiệp (CaCO3) với liều lượng 35 kg/1.000 m² để khử trùng đất và cân bằng độ pH (duy trì pH từ 6.0 – 6.5).', 'Vôi nông nghiệp (CaCO3)', '35 kg/1.000 m²', 'Hôm nay ngày một cày bừa phơi ải đất rải vôi nông nghiệp ba mươi lăm ký cân bằng pH', 'Duy trì pH 6.0 - 6.5', 0, 0),
      (?, '2026-09-02', 2, 1, 'Giai đoạn 1: Chuẩn bị đất & Xử lý giá thể', 'all_day', 'Bón lót & Phối trộn tầng canh tác', 'Bón lót toàn bộ diện tích: Phân chuồng ủ hoai mục bằng chế phẩm nấm đối kháng Trichoderma: 1.200 kg; Phân vi sinh hữu cơ Sông Gianh: 80 kg; Lân nung chảy Lâm Thao: 25 kg. Bừa đều trộn sâu vào tầng đất canh tác mặt (sâu 15 – 20 cm).', 'Phân chuồng Trichoderma, Phân hữu cơ Sông Gianh, Lân Lâm Thao', '1.200 kg phân chuồng + 80 kg Sông Gianh + 25 kg lân', 'Ngày hai bón lót phân chuồng ủ trichoderma một tấn hai, phân sông gianh tám mươi ký, lân hai mươi lăm ký', 'Trộn sâu tầng đất 15-20cm', 0, 0),
      (?, '2026-09-03', 3, 1, 'Giai đoạn 1: Chuẩn bị đất & Xử lý giá thể', 'afternoon', 'Lên luống & Tưới ẩm', 'Lên luống: Chiều rộng mặt luống 1,2 m; rãnh thoát nước rộng 30 cm, sâu 20 cm; chiều dài luống 25 m. Làm phẳng bề mặt luống, tưới ẩm đất chuẩn bị gieo.', 'Nước sạch qua lắng lọc', 'Tưới đẫm luống', 'Ngày ba lên luống rộng một mét hai rãnh ba mươi phân làm phẳng mặt luống tưới nước ẩm', 'Chuẩn bị gieo hạt', 0, 0),
      (?, '2026-09-04', 4, 2, 'Giai đoạn 2: Xử lý hạt & Gieo trồng', 'morning', 'Xử lý phá miên trạng hạt giống', 'Xử lý hạt giống bằng phương pháp vật lý: Ngâm hạt trong nước ấm theo tỉ lệ 2 sôi : 3 lạnh (khoảng 45°C – 50°C) trong 4 giờ để phá vỡ miên trạng vỏ hạt. Vớt ra, ủ ấm trong vải ẩm 12 giờ cho đến khi hạt nứt nanh đều.', 'Hạt giống F1 Trang Nông', '3,5 kg/1.000 m²', 'Sáng ngày bốn ngâm hạt hai sôi ba lạnh bốn tiếng rồi ủ ấm mười hai tiếng cho nứt nanh', 'Tỉ lệ nảy mầm >85%', 0, 0),
      (?, '2026-09-04', 4, 2, 'Giai đoạn 2: Xử lý hạt & Gieo trồng', 'afternoon', 'Gieo hạt & Che phủ giữ ẩm', 'Tiến hành gieo hạt theo hàng: Khoảng cách giữa các hàng 15 cm, hạt cách hạt 2 – 3 cm. Lượng hạt sử dụng: 3,5 kg/1.000 m². Phủ một lớp rơm mục / trấu sạch mỏng (dày khoảng 0,5 cm) để giữ ẩm và tránh xói đất khi tưới. Tưới phun sương bằng hệ thống béc tưới tự động, duy trì độ ẩm đất 75 – 80%.', 'Hạt giống nứt nanh, rơm mục/trấu sạch', '3,5 kg hạt, phủ trấu 0.5cm', 'Chiều ngày bốn gieo hạt theo hàng khoảng cách mười lăm phân phủ trấu mỏng rồi tưới phun sương', 'Độ ẩm đất 75-80%', 0, 0),
      (?, '2026-09-07', 7, 3, 'Giai đoạn 3: Chăm sóc & Cây con phát triển', 'morning', 'Cây mầm 2 lá mầm nhú khỏi mặt đất', 'Dỡ bỏ bớt lớp rơm/trấu dày để cây con đón ánh sáng quang hợp. Duy trì tưới nước 2 lần/ngày (sáng sớm trước 8:00 và chiều mát sau 16:30).', 'Nước giếng khoan lắng lọc', '2 lần/ngày', 'Ngày bảy mầm hai lá nhú lên dỡ bớt rơm trấu tưới nước sáng sớm với chiều mát', 'Cây bắt đầu quang hợp', 0, 0),
      (?, '2026-09-10', 10, 3, 'Giai đoạn 3: Chăm sóc & Cây con phát triển', 'morning', 'Cây có 2 lá thật & Tưới thúc đợt 1', 'Tỉa dặm những điểm quá dày, nhổ cỏ dại bằng tay dọc theo rãnh luống. Tưới thúc đợt 1: Dùng đạm cá ủ vi sinh (chế phẩm thủy phân hữu cơ) pha loãng theo tỉ lệ 1:300 tưới gốc nhằm kích thích rễ phát triển, thay thế phân đạm vô cơ hòa tan.', 'Đạm cá ủ vi sinh thủy phân hữu cơ', 'Tỉ lệ pha 1:300', 'Ngày mười cây hai lá thật tỉa dặm nhổ cỏ tưới thúc đạm cá vi sinh tỉ lệ một trên ba trăm', 'Kích thích bộ rễ phát triển', 0, 0),
      (?, '2026-09-14', 14, 3, 'Giai đoạn 3: Chăm sóc & Cây con phát triển', 'morning', 'Kiểm tra sâu bệnh IPM định kỳ', 'Ghi nhận: Xuất hiện bọ nhảy lác đác ở mép bờ luống (dưới ngưỡng gây hại). Biện pháp xử lý sinh học: Phun dung dịch chiết xuất từ gừng, tỏi, ớt kết hợp dầu khoáng nông nghiệp SK Enspray 99 EC (liều lượng 40 ml/bình 16 lít nước) xua đuổi côn trùng hại lá non. Không sử dụng thuốc trừ sâu hóa học tổng hợp.', 'Dung dịch thảo mộc gừng tỏi ớt, Dầu khoáng SK Enspray 99 EC', '40 ml / bình 16 lít nước', 'Ngày mười bốn kiểm tra sâu bệnh thấy có bọ nhảy mép bờ phun tỏi ớt gừng với dầu khoáng bốn mươi mi li', '100% thảo mộc sinh học', 0, 0),
      (?, '2026-09-16', 16, 4, 'Giai đoạn 4: Thúc sinh trưởng & Kiểm soát an toàn', 'morning', 'Bón thúc đợt 2 qua hệ thống tưới', 'Bón thúc đợt 2: Hòa tan 15 kg phân NPK hữu cơ sinh học khoáng (5-5-5 + TE) vào hệ thống tưới nhỏ giọt / tưới tràn mặt luống rãnh nông, sau đó tưới lại bằng nước sạch để tránh cháy lá.', 'Phân NPK hữu cơ sinh học khoáng (5-5-5 + TE)', '15 kg/1.000 m²', 'Ngày mười sáu bón thúc đợt hai hòa tan mười lăm ký phân hữu cơ khoáng tưới rãnh luống', 'Tưới xả nước sạch tránh cháy lá', 0, 0),
      (?, '2026-09-18', 18, 4, 'Giai đoạn 4: Thúc sinh trưởng & Kiểm soát an toàn', 'morning', 'Làm cỏ thủ công & Xới rãnh luống', 'Làm cỏ thủ công đợt 2, xới nhẹ rãnh luống giúp đất tơi xốp, giữ rễ thông thoáng.', 'Dụng cụ làm cỏ thủ công', 'Toàn bộ 1.000 m²', 'Ngày mười tám làm cỏ đợt hai xới nhẹ rãnh luống cho đất tơi xốp', 'Rễ thông thoáng', 0, 0),
      (?, '2026-09-20', 20, 4, 'Giai đoạn 4: Thúc sinh trưởng & Kiểm soát an toàn', 'morning', 'Đánh giá sinh trưởng & Nguy cơ nấm bệnh', 'Cây đạt chiều cao 15 – 18 cm, thân mập, lá xanh bóng tự nhiên, không có hiện tượng thân xốp ngậm nước do thừa đạm hóa học. Đánh giá nguy cơ nấm bệnh: Luống ráo, thoát nước tốt, không có dấu hiệu bệnh gỉ trắng hay lở cổ rễ.', 'Kiểm tra thực địa', 'Chiều cao 15-18 cm', 'Ngày hai mươi rau cao mười lăm mười tám phân thân mập lá xanh tốt không có nấm bệnh', 'Chuẩn bị bước vào cách ly', 0, 0),
      (?, '2026-09-21', 21, 4, 'Giai đoạn 4: Thúc sinh trưởng & Kiểm soát an toàn', 'morning', 'Bắt đầu thời kỳ cách ly bắt buộc trước thu hoạch', 'Ngừng tuyệt đối mọi hoạt động bón phân bón lá, phân hữu cơ hay chế phẩm sinh học xua đuổi côn trùng. Chỉ duy trì tưới nước sạch đã qua kiểm định để thanh lọc tồn dư muối khoáng trong mô thực vật và giữ ẩm nhẹ cho cây.', 'Nước sạch kiểm định', 'Tưới giữ ẩm nhẹ', 'Ngày hai mươi mốt bắt đầu thời kỳ cách ly ngừng tuyệt đối phân bón chế phẩm chỉ tưới nước sạch', 'Cách ly tối thiểu 5 ngày', 1, 0),
      (?, '2026-09-25', 25, 5, 'Giai đoạn 5: Thu hoạch & Đóng gói hoàn thiện', 'morning', 'Tiền thu hoạch - Kiểm nghiệm chỉ tiêu an toàn', 'Cán bộ kiểm nghiệm lấy mẫu ngẫu nhiên tại ruộng để test nhanh dư lượng Nitrat (NO3-) và hóa chất bảo vệ thực vật. Kết quả: Âm tính với nhóm thuốc lân hữu cơ/cúc tổng hợp; chỉ số NO3- nằm trong ngưỡng cho phép theo QCVN 8-2:2011/BYT (< 1.500 mg/kg). Cho phép thu hoạch.', 'Bộ kit test nhanh Nitrat & BVTV', 'Lấy mẫu ngẫu nhiên 5 điểm', 'Ngày hai mươi lăm test nhanh nitrat và thuốc bảo vệ thực vật kết quả âm tính cho phép thu hoạch', 'Đạt chuẩn xuất vườn QCVN 8-2:2011/BYT', 0, 1),
      (?, '2026-09-26', 26, 5, 'Giai đoạn 5: Thu hoạch & Đóng gói hoàn thiện', 'morning', 'Thu hoạch chính thức & Đóng gói bảo quản', 'Thời gian thu hái: Từ 5:00 đến 8:00 sáng khi trời còn mát, tránh để rau bị bốc hơi nước gây héo gãy. Dụng cụ: Dùng dao/kéo inox chuyên dụng đã khử trùng bằng cồn y tế 70°. Cắt cách mặt đất 3 – 4 cm để đảm bảo gốc rau sạch không dính bùn đất. Sơ chế 2 lần nước sạch luân lưu trên bồn inox an toàn thực phẩm. Đóng gói bó 500g/1kg màng thở, dán tem QR RM-VG-2026-0901, bảo quản kho lạnh 10°C - 12°C.', 'Dao inox cồn 70°, Màng thở rau củ, Tem QR RM-VG-2026-0901', 'Kho lạnh 10-12°C', 'Sáng sớm ngày hai mươi sáu thu hoạch cắt cách đất bốn phân sơ chế rửa sạch đóng gói dán tem qr', 'Hoàn tất quy trình VietGAP', 0, 0)
    `, [
      lotId, lotId, lotId, lotId, lotId, lotId, lotId,
      lotId, lotId, lotId, lotId, lotId, lotId, lotId
    ]);

    console.log('🌱 Đã khởi tạo dữ liệu mẫu cho Lô RM-VG-2026-0901 và 14 nhật ký canh tác.');
  }
}

function getPool() {
  if (!pool) {
    throw new Error('Database pool chưa được khởi tạo. Hãy gọi initDB() trước.');
  }
  return pool;
}

module.exports = {
  initDB,
  getPool
};
