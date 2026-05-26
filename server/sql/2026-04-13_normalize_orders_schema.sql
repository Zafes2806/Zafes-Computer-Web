USE `shop_pc`;

DROP PROCEDURE IF EXISTS `normalize_orders_schema`;

DELIMITER $$

CREATE PROCEDURE `normalize_orders_schema`()
BEGIN
    DECLARE has_return_reason INT DEFAULT 0;
    DECLARE has_delivered_at INT DEFAULT 0;
    DECLARE has_completed_at INT DEFAULT 0;
    DECLARE has_cancelled_at INT DEFAULT 0;
    DECLARE has_return_requested_at INT DEFAULT 0;
    DECLARE has_returned_at INT DEFAULT 0;
    DECLARE has_refunded_at INT DEFAULT 0;

    ALTER TABLE `orders`
        MODIFY COLUMN `status` ENUM(
            'pending',
            'confirmed',
            'shipping',
            'delivered',
            'completed',
            'cancelled',
            'return_requested',
            'return_in_progress',
            'returned',
            'refunded'
        ) NOT NULL DEFAULT 'pending';

    SELECT COUNT(*) INTO has_return_reason
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'returnReason';

    IF has_return_reason = 0 THEN
        ALTER TABLE `orders`
            ADD COLUMN `returnReason` TEXT NULL
            AFTER `status`;
    END IF;

    SELECT COUNT(*) INTO has_delivered_at
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'deliveredAt';

    IF has_delivered_at = 0 THEN
        ALTER TABLE `orders`
            ADD COLUMN `deliveredAt` DATETIME NULL DEFAULT NULL
            AFTER `returnReason`;
    END IF;

    SELECT COUNT(*) INTO has_completed_at
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'completedAt';

    IF has_completed_at = 0 THEN
        ALTER TABLE `orders`
            ADD COLUMN `completedAt` DATETIME NULL DEFAULT NULL
            AFTER `deliveredAt`;
    END IF;

    SELECT COUNT(*) INTO has_cancelled_at
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'cancelledAt';

    IF has_cancelled_at = 0 THEN
        ALTER TABLE `orders`
            ADD COLUMN `cancelledAt` DATETIME NULL DEFAULT NULL
            AFTER `completedAt`;
    END IF;

    SELECT COUNT(*) INTO has_return_requested_at
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'returnRequestedAt';

    IF has_return_requested_at = 0 THEN
        ALTER TABLE `orders`
            ADD COLUMN `returnRequestedAt` DATETIME NULL DEFAULT NULL
            AFTER `cancelledAt`;
    END IF;

    SELECT COUNT(*) INTO has_returned_at
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'returnedAt';

    IF has_returned_at = 0 THEN
        ALTER TABLE `orders`
            ADD COLUMN `returnedAt` DATETIME NULL DEFAULT NULL
            AFTER `returnRequestedAt`;
    END IF;

    SELECT COUNT(*) INTO has_refunded_at
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'refundedAt';

    IF has_refunded_at = 0 THEN
        ALTER TABLE `orders`
            ADD COLUMN `refundedAt` DATETIME NULL DEFAULT NULL
            AFTER `returnedAt`;
END IF;

    ALTER TABLE `orders`
        MODIFY COLUMN `userId` CHAR(36)
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_bin
        NULL;
END $$

DELIMITER ;

CALL `normalize_orders_schema`();

DROP PROCEDURE IF EXISTS `normalize_orders_schema`;

SELECT 'Orders schema normalization completed' AS message;
