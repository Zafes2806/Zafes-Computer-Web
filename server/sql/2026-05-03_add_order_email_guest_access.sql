ALTER TABLE `orders`
    ADD COLUMN `email` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL AFTER `address`,
    ADD COLUMN `guest_access_token_hash` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL AFTER `payment_method`,
    ADD COLUMN `guest_access_token_expires_at` DATETIME NULL AFTER `guest_access_token_hash`,
    ADD KEY `orders_email_idx` (`email`),
    ADD KEY `orders_guest_access_token_expires_at_idx` (`guest_access_token_expires_at`);
