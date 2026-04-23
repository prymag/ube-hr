ALTER TABLE `Position` ADD COLUMN `reportsToId` INTEGER NULL;
ALTER TABLE `Position` ADD CONSTRAINT `Position_reportsToId_fkey` FOREIGN KEY (`reportsToId`) REFERENCES `Position`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX `Position_reportsToId_idx` ON `Position`(`reportsToId`);
