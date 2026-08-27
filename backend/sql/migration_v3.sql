-- Migration File v3 for KSPPS BMT HIRA
-- Description: Adds 'titik_koordinat' to nasabah and 'no_hp' to daftar_prospek

USE `bmt_hira`;

-- 1. Add titik_koordinat to nasabah table
ALTER TABLE `nasabah` ADD COLUMN IF NOT EXISTS `titik_koordinat` VARCHAR(255) DEFAULT NULL;

-- 2. Add no_hp to daftar_prospek table
ALTER TABLE `daftar_prospek` ADD COLUMN IF NOT EXISTS `no_hp` VARCHAR(25) DEFAULT NULL;

-- End of Migration v3
