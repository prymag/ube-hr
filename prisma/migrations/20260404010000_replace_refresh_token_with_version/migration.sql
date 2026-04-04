-- AlterTable
ALTER TABLE `User` DROP COLUMN `refreshToken`;
ALTER TABLE `User` ADD COLUMN `refreshTokenVersion` INT NOT NULL DEFAULT 0;
