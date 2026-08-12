-- Migration File v2 for KSPPS BMT HIRA
-- Description: Updates indexes and structures to support per-employee (marketing) filtering and consistency updates

USE `bmt_hira`;

-- 1. Ensure user_id indexes for performance on filtering by marketing / pegawai
ALTER TABLE `transaksi_harian` ADD INDEX IF NOT EXISTS `idx_user_id` (`user_id`);
ALTER TABLE `daftar_prospek` ADD INDEX IF NOT EXISTS `idx_user_id` (`user_id`);
ALTER TABLE `tidak_transaksi` ADD INDEX IF NOT EXISTS `idx_user_id` (`user_id`);
ALTER TABLE `tidak_dikunjungi` ADD INDEX IF NOT EXISTS `idx_user_id` (`user_id`);
ALTER TABLE `laporan_harian_kas` ADD INDEX IF NOT EXISTS `idx_user_id` (`user_id`);
ALTER TABLE `rincian_pecahan` ADD INDEX IF NOT EXISTS `idx_user_id` (`user_id`);

-- 2. Update default user jabatan values from Teller to Marketing
ALTER TABLE `users` MODIFY COLUMN `jabatan` VARCHAR(50) DEFAULT 'Marketing';

UPDATE `users` SET `jabatan` = 'Marketing' WHERE `jabatan` LIKE '%Teller%' OR `jabatan` IS NULL;

-- End of Migration v2
