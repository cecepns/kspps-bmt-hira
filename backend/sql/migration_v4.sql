-- Migration File v4 for KSPPS BMT HIRA
-- Description: Adds 'survey_pembiayaan' table to record financing survey and collection visits

USE `bmt_hira`;

-- 1. Create table survey_pembiayaan
CREATE TABLE IF NOT EXISTS `survey_pembiayaan` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tanggal` DATE NOT NULL,
  `user_id` INT NOT NULL,
  `nama` VARCHAR(100) NOT NULL,
  `alamat` TEXT NOT NULL,
  `no_hp` VARCHAR(25) DEFAULT NULL,
  `jenis_layanan` ENUM('Survey Pembiayaan', 'Penagihan Pembiayaan') NOT NULL DEFAULT 'Survey Pembiayaan',
  `jumlah_plafond` DECIMAL(15,2) DEFAULT 0.00,
  `hasil_survey` TEXT DEFAULT NULL,
  `keterangan` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample Seed Data
INSERT INTO `survey_pembiayaan` (`tanggal`, `user_id`, `nama`, `alamat`, `no_hp`, `jenis_layanan`, `jumlah_plafond`, `hasil_survey`, `keterangan`) VALUES
(CURDATE(), 2, 'Hj. Rohimah (Toko Sembako)', 'Pasar Baru Timur No. 15', '085728042009', 'Survey Pembiayaan', 15000000.00, 'Usaha berjalan 5 tahun, omset stabil, jaminan BPKB motor', 'Rekomendasi disetujui plafond 15jt'),
(CURDATE(), 2, 'Pak Bambang Irawan', 'Jl. Sukajadi No. 77', '081234567891', 'Penagihan Pembiayaan', 5000000.00, 'Janji bayar tanggal 5 bulan depan', 'Kunjungan penagihan angsuran ke-3');

-- End of Migration v4
