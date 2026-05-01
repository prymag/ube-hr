-- AlterTable
ALTER TABLE `LeaveBalance` ADD COLUMN `lastAccruedMonth` INTEGER NULL,
    ADD COLUMN `lastAccruedYear` INTEGER NULL;

-- AlterTable
ALTER TABLE `LeaveBalanceAudit` ADD COLUMN `runId` VARCHAR(191) NULL;
