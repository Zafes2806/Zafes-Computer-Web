USE `shop_pc`;

DROP PROCEDURE IF EXISTS `add_order_id_to_product_reviews`;

DELIMITER $$

CREATE PROCEDURE `add_order_id_to_product_reviews`()
BEGIN
    DECLARE has_order_id_column INT DEFAULT 0;
    DECLARE has_old_standard_unique_index INT DEFAULT 0;
    DECLARE has_old_legacy_unique_index INT DEFAULT 0;
    DECLARE has_new_unique_index INT DEFAULT 0;
    DECLARE has_order_index INT DEFAULT 0;
    DECLARE has_order_fk INT DEFAULT 0;
    DECLARE old_safe_updates INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET SQL_SAFE_UPDATES = old_safe_updates;
        RESIGNAL;
    END;

    SET old_safe_updates = @@SQL_SAFE_UPDATES;
    SET SQL_SAFE_UPDATES = 0;

    SELECT COUNT(*) INTO has_order_id_column
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_reviews'
      AND COLUMN_NAME = 'order_id';

    IF has_order_id_column = 0 THEN
        ALTER TABLE `product_reviews`
            ADD COLUMN `order_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL
            AFTER `product_id`;
    END IF;

    UPDATE `product_reviews` AS pr
    SET pr.`order_id` = (
        SELECT o.`id`
        FROM `orders` AS o
        INNER JOIN `order_items` AS oi
            ON oi.`order_id` = o.`id`
           AND oi.`product_id` = pr.`product_id`
        WHERE o.`user_id` = pr.`user_id`
          AND o.`status` IN ('delivered', 'completed')
        ORDER BY o.`created_at` DESC
        LIMIT 1
    )
    WHERE pr.`order_id` IS NULL;

    SELECT COUNT(*) INTO has_old_standard_unique_index
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_reviews'
      AND INDEX_NAME = 'product_reviews_user_product_unique';

    IF has_old_standard_unique_index > 0 THEN
        ALTER TABLE `product_reviews`
            DROP INDEX `product_reviews_user_product_unique`;
    END IF;

    SELECT COUNT(*) INTO has_old_legacy_unique_index
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_reviews'
      AND INDEX_NAME = 'productPreview_user_product_unique';

    IF has_old_legacy_unique_index > 0 THEN
        ALTER TABLE `product_reviews`
            DROP INDEX `productPreview_user_product_unique`;
    END IF;

    SELECT COUNT(*) INTO has_new_unique_index
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_reviews'
      AND INDEX_NAME = 'product_reviews_user_order_product_unique';

    IF has_new_unique_index = 0 THEN
        ALTER TABLE `product_reviews`
            ADD UNIQUE INDEX `product_reviews_user_order_product_unique` (`user_id`, `order_id`, `product_id`);
    END IF;

    SELECT COUNT(*) INTO has_order_index
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_reviews'
      AND INDEX_NAME = 'product_reviews_order_idx';

    IF has_order_index = 0 THEN
        ALTER TABLE `product_reviews`
            ADD INDEX `product_reviews_order_idx` (`order_id`);
    END IF;

    SELECT COUNT(*) INTO has_order_fk
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_reviews'
      AND CONSTRAINT_NAME = 'product_reviews_order_fk'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY';

    IF has_order_fk = 0 THEN
        ALTER TABLE `product_reviews`
            ADD CONSTRAINT `product_reviews_order_fk`
            FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;

    SET SQL_SAFE_UPDATES = old_safe_updates;
END $$

DELIMITER ;

CALL `add_order_id_to_product_reviews`();

DROP PROCEDURE IF EXISTS `add_order_id_to_product_reviews`;

SELECT 'Product review order linkage added' AS message;
