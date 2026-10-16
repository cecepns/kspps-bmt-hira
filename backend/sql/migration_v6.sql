-- Migration File v6 for KSPPS BMT HIRA
-- Description: Updates 'role' column in 'users' table to support 'admin', 'manager', and 'pegawai'

USE `bmt_hira`;

ALTER TABLE `users` 
MODIFY COLUMN `role` ENUM('admin', 'manager', 'pegawai') NOT NULL DEFAULT 'pegawai';
