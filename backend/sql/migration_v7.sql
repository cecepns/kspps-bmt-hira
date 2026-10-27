-- Migration File v7 for KSPPS BMT HIRA
-- Description: Adds 'titik_koordinat' to 'daftar_prospek' and 'survey_pembiayaan' tables for GPS location feature

USE `bmt_hira`;

-- 1. Add titik_koordinat to daftar_prospek table
ALTER TABLE `daftar_prospek` ADD COLUMN `titik_koordinat` VARCHAR(255) DEFAULT NULL AFTER `no_hp`;

-- 2. Add titik_koordinat to survey_pembiayaan table
ALTER TABLE `survey_pembiayaan` ADD COLUMN `titik_koordinat` VARCHAR(255) DEFAULT NULL AFTER `no_hp`;

-- End of Migration v7
