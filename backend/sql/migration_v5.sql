-- Migration File v5 for KSPPS BMT HIRA
-- Description: Adds 'transaksi_collector' table for tracking collector transaction count and total nominal

USE `bmt_hira`;

CREATE TABLE IF NOT EXISTS `transaksi_collector` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tanggal` DATE NOT NULL,
  `user_id` INT NOT NULL,
  `jumlah_transaksi` INT NOT NULL DEFAULT 0,
  `jumlah_nominal` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `keterangan` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_tanggal` (`tanggal`),
  INDEX `idx_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample seed
INSERT INTO `transaksi_collector` (`tanggal`, `user_id`, `jumlah_transaksi`, `jumlah_nominal`, `keterangan`) VALUES
(CURDATE(), 2, 12, 1850000.00, 'Setoran & penagihan wilayah pasar');
