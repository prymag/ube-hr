-- CreateTable
CREATE TABLE `RolePermission` (
    `role` ENUM('USER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN') NOT NULL,
    `permission` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`role`, `permission`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
