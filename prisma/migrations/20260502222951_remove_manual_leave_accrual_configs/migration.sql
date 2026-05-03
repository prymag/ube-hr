-- Remove accrual configs for manual leave types (MATERNITY, PATERNITY, BEREAVEMENT).
-- These types are granted manually and should never be processed by the monthly accrual job.
DELETE FROM `LeaveAccrualConfig` WHERE `leaveType` IN ('MATERNITY', 'PATERNITY', 'BEREAVEMENT');