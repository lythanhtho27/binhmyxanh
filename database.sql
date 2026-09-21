-- Khởi tạo cơ sở dữ liệu cho website Bình Mỹ Xanh
CREATE DATABASE IF NOT EXISTS `nongsan_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `nongsan_db`;

-- Bảng Người dùng (Users)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `address` VARCHAR(255) DEFAULT NULL,
  `role` ENUM('admin', 'customer') DEFAULT 'customer',
  `status` ENUM('active', 'locked') DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Danh mục sản phẩm (Categories)
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) NOT NULL UNIQUE,
  `description` TEXT DEFAULT NULL,
  `image` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Sản phẩm (Products)
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `price` DECIMAL(12, 2) NOT NULL,
  `original_price` DECIMAL(12, 2) DEFAULT NULL,
  `unit` VARCHAR(50) DEFAULT 'kg',
  `stock` INT DEFAULT 100,
  `origin` VARCHAR(150) DEFAULT 'Việt Nam',
  `harvest_date` VARCHAR(100) DEFAULT 'Hái mới trong ngày',
  `shelf_life` VARCHAR(100) DEFAULT '5-7 ngày bảo quản lạnh',
  `certification` VARCHAR(100) DEFAULT 'VietGAP',
  `image` VARCHAR(500) NOT NULL,
  `short_description` VARCHAR(500) DEFAULT NULL,
  `description` LONGTEXT DEFAULT NULL,
  `nutrition_info` TEXT DEFAULT NULL,
  `storage_guide` TEXT DEFAULT NULL,
  `is_featured` TINYINT(1) DEFAULT 0,
  `is_new` TINYINT(1) DEFAULT 1,
  `sold_count` INT DEFAULT 0,
  `rating` DECIMAL(3, 1) DEFAULT 5.0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Đơn hàng (Orders)
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_code` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` INT DEFAULT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `customer_phone` VARCHAR(20) NOT NULL,
  `customer_email` VARCHAR(150) DEFAULT NULL,
  `shipping_address` VARCHAR(300) NOT NULL,
  `note` TEXT DEFAULT NULL,
  `payment_method` ENUM('cod', 'banking') DEFAULT 'cod',
  `payment_status` ENUM('unpaid', 'paid') DEFAULT 'unpaid',
  `subtotal` DECIMAL(12, 2) NOT NULL,
  `shipping_fee` DECIMAL(12, 2) DEFAULT 25000,
  `discount_amount` DECIMAL(12, 2) DEFAULT 0,
  `total_amount` DECIMAL(12, 2) NOT NULL,
  `status` ENUM('pending', 'processing', 'shipping', 'completed', 'cancelled') DEFAULT 'pending',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Chi tiết đơn hàng (Order Items)
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `product_id` INT DEFAULT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `product_image` VARCHAR(500) DEFAULT NULL,
  `unit` VARCHAR(50) DEFAULT 'kg',
  `price` DECIMAL(12, 2) NOT NULL,
  `quantity` INT NOT NULL,
  `total_price` DECIMAL(12, 2) NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
