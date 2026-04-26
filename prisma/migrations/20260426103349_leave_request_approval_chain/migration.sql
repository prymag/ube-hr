/*
  Warnings:

  - Added the required column `stage` to the `LeaveApprovalStep` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `LeaveApprovalStep` ADD COLUMN `stage` ENUM('MANAGER', 'ADMIN') NOT NULL,
    MODIFY `status` ENUM('PENDING', 'PENDING_MANAGER', 'PENDING_ADMIN', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `LeaveRequest` ADD COLUMN `durationDays` DOUBLE NOT NULL DEFAULT 0,
    MODIFY `status` ENUM('PENDING', 'PENDING_MANAGER', 'PENDING_ADMIN', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING_MANAGER';
