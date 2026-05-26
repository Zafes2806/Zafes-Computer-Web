CREATE TABLE IF NOT EXISTS `payment_attempts` (
    `id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    `order_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    `order_code` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `provider` ENUM('MOMO', 'VNPAY') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `amount` INT NOT NULL,
    `status` ENUM('pending', 'succeeded', 'failed', 'expired', 'requires_refund', 'refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
    `gateway_request_id` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `gateway_transaction_id` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `payment_url` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `failure_reason` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `refund_note` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `refunded_at` DATETIME DEFAULT NULL,
    `raw_request` JSON DEFAULT NULL,
    `raw_response` JSON DEFAULT NULL,
    `raw_callback` JSON DEFAULT NULL,
    `created_at` DATETIME NOT NULL,
    `updated_at` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    KEY `payment_attempts_order_id_idx` (`order_id`),
    KEY `payment_attempts_order_code_idx` (`order_code`),
    KEY `payment_attempts_status_updated_at_idx` (`status`, `updated_at`),
    UNIQUE KEY `payment_attempts_provider_request_unique` (`provider`, `gateway_request_id`),
    CONSTRAINT `payment_attempts_order_fk`
        FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
