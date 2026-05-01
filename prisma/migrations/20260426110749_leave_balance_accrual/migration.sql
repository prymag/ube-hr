-- AlterTable
ALTER TABLE `LeaveAccrualConfig` ADD COLUMN `monthlyRate` DOUBLE NOT NULL DEFAULT 0,
    MODIFY `daysPerYear` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `LeaveBalance` ADD COLUMN `debt` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `lastAccruedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `LeaveBalanceAudit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `leaveType` ENUM('ANNUAL', 'SICK', 'UNPAID', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT', 'OTHER') NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `debtDelta` DOUBLE NOT NULL DEFAULT 0,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LeaveBalanceAudit` ADD CONSTRAINT `LeaveBalanceAudit_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
