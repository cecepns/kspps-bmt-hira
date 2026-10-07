-- Database SQL for KSPPS BMT Hira

CREATE DATABASE IF NOT EXISTS `bmt_hira` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `bmt_hira`;

-- 1. Tabel Users / Pegawai
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nama` VARCHAR(100) NOT NULL,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'pegawai') NOT NULL DEFAULT 'pegawai',
  `jabatan` VARCHAR(50) DEFAULT 'Marketing',
  `no_hp` VARCHAR(20) DEFAULT NULL,
  `status` ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabel Nasabah / Anggota
CREATE TABLE IF NOT EXISTS `nasabah` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `no_rek` VARCHAR(50) NOT NULL UNIQUE,
  `nama` VARCHAR(100) NOT NULL,
  `alamat` TEXT NOT NULL,
  `no_hp` VARCHAR(20) DEFAULT NULL,
  `titik_koordinat` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabel Transaksi Penarikan & Setoran (Slip)
CREATE TABLE IF NOT EXISTS `transaksi_harian` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tanggal` DATE NOT NULL,
  `nasabah_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `tipe` ENUM('setoran', 'penarikan') NOT NULL,
  `nominal` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `keterangan` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`nasabah_id`) REFERENCES `nasabah`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabel Daftar Prospek
CREATE TABLE IF NOT EXISTS `daftar_prospek` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tanggal` DATE NOT NULL,
  `user_id` INT NOT NULL,
  `nama` VARCHAR(100) NOT NULL,
  `alamat_tempat` VARCHAR(255) NOT NULL,
  `no_hp` VARCHAR(25) DEFAULT NULL,
  `hasil` VARCHAR(255) DEFAULT NULL,
  `keterangan` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabel Daftar Anggota Yang Tidak Transaksi
CREATE TABLE IF NOT EXISTS `tidak_transaksi` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tanggal` DATE NOT NULL,
  `user_id` INT NOT NULL,
  `no_rek` VARCHAR(50) NOT NULL,
  `nama` VARCHAR(100) NOT NULL,
  `alamat` TEXT NOT NULL,
  `keterangan` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabel Daftar Anggota Yang Tidak Dikunjungi
CREATE TABLE IF NOT EXISTS `tidak_dikunjungi` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tanggal` DATE NOT NULL,
  `user_id` INT NOT NULL,
  `no_rek` VARCHAR(50) NOT NULL,
  `nama` VARCHAR(100) NOT NULL,
  `alamat` TEXT NOT NULL,
  `keterangan` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Tabel Survey & Penagihan Pembiayaan
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

-- 8. Tabel Laporan Harian Kas (Penerimaan & Pengeluaran)
CREATE TABLE IF NOT EXISTS `laporan_harian_kas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tanggal` DATE NOT NULL,
  `user_id` INT NOT NULL,
  `kas_kantor` DECIMAL(15,2) DEFAULT 0.00,
  `kolektor` DECIMAL(15,2) DEFAULT 0.00,
  `penerimaan_sibela` DECIMAL(15,2) DEFAULT 0.00,
  `penerimaan_lain` DECIMAL(15,2) DEFAULT 0.00,
  `pengeluaran_sibela` DECIMAL(15,2) DEFAULT 0.00,
  `pengeluaran_pinjaman` DECIMAL(15,2) DEFAULT 0.00,
  `pengeluaran_operasional` DECIMAL(15,2) DEFAULT 0.00,
  `pengeluaran_lain` DECIMAL(15,2) DEFAULT 0.00,
  `total_kas_masuk` DECIMAL(15,2) DEFAULT 0.00,
  `total_kas_keluar` DECIMAL(15,2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Tabel Kas Disetor (Rincian Pecahan Uang Tunai)
CREATE TABLE IF NOT EXISTS `rincian_pecahan` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tanggal` DATE NOT NULL,
  `user_id` INT NOT NULL,
  `p100k` INT DEFAULT 0,
  `p50k` INT DEFAULT 0,
  `p20k` INT DEFAULT 0,
  `p10k` INT DEFAULT 0,
  `p5k` INT DEFAULT 0,
  `p2k` INT DEFAULT 0,
  `p1k` INT DEFAULT 0,
  `p500` INT DEFAULT 0,
  `p200` INT DEFAULT 0,
  `p100` INT DEFAULT 0,
  `jumlah_total` DECIMAL(15,2) DEFAULT 0.00,
  `selisih` DECIMAL(15,2) DEFAULT 0.00,
  `teller_name` VARCHAR(100) DEFAULT NULL,
  `mengetahui_name` VARCHAR(100) DEFAULT NULL,
  `manager_name` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Tabel Transaksi Collector (Input Transaksi & Nominal Collector)
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

-- Seed Sample Data Initial (Password: admin123 / pegawai123 - plain or hashed demo fallback)
INSERT INTO `users` (`id`, `nama`, `username`, `password`, `role`, `jabatan`, `no_hp`) VALUES
(1, 'Administrator BMT', 'admin', 'admin123', 'admin', 'Manager Cabang', '081234567890'),
(2, 'Ahmad Teller', 'ahmad', 'pegawai123', 'pegawai', 'Marketing', '089876543210')
ON DUPLICATE KEY UPDATE `id`=`id`;

INSERT INTO `nasabah` (`id`, `no_rek`, `nama`, `alamat`, `no_hp`, `titik_koordinat`) VALUES
(1, '101.01.001', 'Budi Santoso', 'Jl. Merdeka No. 12, Bandung', '0811111111', '-6.917464, 107.619123'),
(2, '101.01.002', 'Siti Aminah', 'Pasar Baru Blok A No. 4', '0822222222', '-6.921345, 107.604567'),
(3, '101.01.003', 'Toko Berkah Raya', 'Jl. Sunda No. 45', '0833333333', '-6.920123, 107.615432')
ON DUPLICATE KEY UPDATE `id`=`id`;

INSERT INTO `transaksi_harian` (`tanggal`, `nasabah_id`, `user_id`, `tipe`, `nominal`, `keterangan`) VALUES
(CURDATE(), 1, 2, 'setoran', 150000.00, 'Setoran Harian Sibela'),
(CURDATE(), 2, 2, 'setoran', 50000.00, 'Setoran Tabungan'),
(CURDATE(), 3, 2, 'penarikan', 200000.00, 'Penarikan Tunai');

INSERT INTO `daftar_prospek` (`tanggal`, `user_id`, `nama`, `alamat_tempat`, `no_hp`, `hasil`, `keterangan`) VALUES
(CURDATE(), 2, 'Warung Ibu Hani', 'Jl. Cihampelas No. 8', '085728042009', 'Tertarik', 'Buka simpanan minggu depan');

INSERT INTO `tidak_transaksi` (`tanggal`, `user_id`, `no_rek`, `nama`, `alamat`, `keterangan`) VALUES
(CURDATE(), 2, '101.01.005', 'Deden Supriatna', 'Jl. Asia Afrika', 'Toko Tutup');

INSERT INTO `tidak_dikunjungi` (`tanggal`, `user_id`, `no_rek`, `nama`, `alamat`, `keterangan`) VALUES
(CURDATE(), 2, '101.01.008', 'Rina Marlina', 'Kopo Sayati', 'Hujan Deras / Akses Banjir');

INSERT INTO `survey_pembiayaan` (`tanggal`, `user_id`, `nama`, `alamat`, `no_hp`, `jenis_layanan`, `jumlah_plafond`, `hasil_survey`, `keterangan`) VALUES
(CURDATE(), 2, 'Hj. Rohimah (Toko Sembako)', 'Pasar Baru Timur No. 15', '085728042009', 'Survey Pembiayaan', 15000000.00, 'Usaha berjalan 5 tahun, omset stabil, jaminan BPKB motor', 'Rekomendasi disetujui plafond 15jt'),
(CURDATE(), 2, 'Pak Bambang Irawan', 'Jl. Sukajadi No. 77', '081234567891', 'Penagihan Pembiayaan', 5000000.00, 'Janji bayar tanggal 5 bulan depan', 'Kunjungan penagihan angsuran ke-3');

INSERT INTO `laporan_harian_kas` (`tanggal`, `user_id`, `kas_kantor`, `kolektor`, `penerimaan_sibela`, `pengeluaran_sibela`, `total_kas_masuk`, `total_kas_keluar`) VALUES
(CURDATE(), 2, 500000.00, 200000.00, 150000.00, 200000.00, 850000.00, 200000.00);

INSERT INTO `rincian_pecahan` (`tanggal`, `user_id`, `p100k`, `p50k`, `p20k`, `p10k`, `p5k`, `p2k`, `p1k`, `p500`, `p200`, `p100`, `jumlah_total`, `teller_name`, `mengetahui_name`, `manager_name`) VALUES
(CURDATE(), 2, 5, 5, 4, 10, 4, 0, 0, 0, 0, 0, 850000.00, 'Ahmad Teller', 'Koordinator Kolektor', 'Administrator BMT');

INSERT INTO `transaksi_collector` (`tanggal`, `user_id`, `jumlah_transaksi`, `jumlah_nominal`, `keterangan`) VALUES
(CURDATE(), 2, 12, 1850000.00, 'Setoran & penagihan wilayah pasar');
