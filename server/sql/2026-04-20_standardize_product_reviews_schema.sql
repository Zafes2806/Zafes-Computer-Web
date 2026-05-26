USE `shop_pc`;

DROP PROCEDURE IF EXISTS `standardize_product_reviews_schema`;

DELIMITER $$

CREATE PROCEDURE `standardize_product_reviews_schema`()
BEGIN
    DECLARE has_review_table INT DEFAULT 0;
    DECLARE has_legacy_review_table INT DEFAULT 0;
    DECLARE has_old_unique_index INT DEFAULT 0;
    DECLARE has_old_product_index INT DEFAULT 0;
    DECLARE has_old_status_index INT DEFAULT 0;
    DECLARE has_new_unique_index INT DEFAULT 0;
    DECLARE has_new_product_index INT DEFAULT 0;
    DECLARE has_new_status_index INT DEFAULT 0;

    SELECT COUNT(*) INTO has_review_table
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_reviews';

    SELECT COUNT(*) INTO has_legacy_review_table
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productpreview';

    IF has_review_table = 0 AND has_legacy_review_table > 0 THEN
        RENAME TABLE `productpreview` TO `product_reviews`;
    END IF;

    SELECT COUNT(*) INTO has_old_unique_index
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_reviews' AND INDEX_NAME = 'productPreview_user_product_unique';

    SELECT COUNT(*) INTO has_old_product_index
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_reviews' AND INDEX_NAME = 'productPreview_product_fk';

    SELECT COUNT(*) INTO has_old_status_index
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_reviews' AND INDEX_NAME = 'productPreview_status_idx';

    SELECT COUNT(*) INTO has_new_unique_index
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_reviews' AND INDEX_NAME = 'product_reviews_user_product_unique';

    SELECT COUNT(*) INTO has_new_product_index
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_reviews' AND INDEX_NAME = 'product_reviews_product_idx';

    SELECT COUNT(*) INTO has_new_status_index
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_reviews' AND INDEX_NAME = 'product_reviews_status_idx';

    IF has_old_unique_index > 0 AND has_new_unique_index = 0 THEN
        ALTER TABLE `product_reviews`
            RENAME INDEX `productPreview_user_product_unique` TO `product_reviews_user_product_unique`;
    END IF;

    IF has_old_product_index > 0 AND has_new_product_index = 0 THEN
        ALTER TABLE `product_reviews`
            RENAME INDEX `productPreview_product_fk` TO `product_reviews_product_idx`;
    END IF;

    IF has_old_status_index > 0 AND has_new_status_index = 0 THEN
        ALTER TABLE `product_reviews`
            RENAME INDEX `productPreview_status_idx` TO `product_reviews_status_idx`;
    END IF;
END $$

DELIMITER ;

CALL `standardize_product_reviews_schema`();

DROP PROCEDURE IF EXISTS `standardize_product_reviews_schema`;

SELECT 'Product review schema standardized' AS message;
