ALTER TABLE `payment_attempts`
    MODIFY COLUMN `status` ENUM(
        'pending',
        'succeeded',
        'failed',
        'expired',
        'requires_refund',
        'refunded'
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
    ADD COLUMN `refund_note` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `failure_reason`,
    ADD COLUMN `refunded_at` DATETIME DEFAULT NULL AFTER `refund_note`;
