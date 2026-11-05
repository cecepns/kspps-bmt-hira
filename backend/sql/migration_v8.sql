-- Migration File v8 for KSPPS BMT HIRA
-- Description: Adds 'target_canvasing' table for marketing canvasing targets set by managers

USE `bmt_hira`;

CREATE TABLE IF NOT EXISTS `target_canvasing` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `nama_marketing` VARCHAR(100) NOT NULL,
  `cabang` VARCHAR(100) NOT NULL,
  `periode_bulan` DATE NOT NULL,
  `target_nasabah` INT DEFAULT 0,
  `target_nominal` DECIMAL(15,2) DEFAULT 0.00,
  `realisasi_nasabah` INT DEFAULT 0,
  `realisasi_nominal` DECIMAL(15,2) DEFAULT 0.00,
  `keterangan` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_periode` (`periode_bulan`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- End of Migration v8

