USE `shop_pc`;

DROP PROCEDURE IF EXISTS `normalize_admin_lifecycle_schema`;

DELIMITER $$

CREATE PROCEDURE `normalize_admin_lifecycle_schema`()
BEGIN
    DECLARE old_sql_safe_updates INT DEFAULT 0;
    DECLARE has_users_status INT DEFAULT 0;
    DECLARE has_category_status INT DEFAULT 0;
    DECLARE has_blogs_status INT DEFAULT 0;
    DECLARE has_blogs_published_at INT DEFAULT 0;
    DECLARE has_blogs_deleted_at INT DEFAULT 0;
    DECLARE has_contact_status INT DEFAULT 0;
    DECLARE has_contact_admin_note INT DEFAULT 0;
    DECLARE has_contact_handled_at INT DEFAULT 0;
    DECLARE has_contact_deleted_at INT DEFAULT 0;
    DECLARE has_review_table INT DEFAULT 0;
    DECLARE has_legacy_review_table INT DEFAULT 0;
    DECLARE has_review_status INT DEFAULT 0;
    DECLARE has_review_reviewed_at INT DEFAULT 0;
    DECLARE has_review_reviewed_by INT DEFAULT 0;
    DECLARE has_review_deleted_at INT DEFAULT 0;
    DECLARE has_spec_status INT DEFAULT 0;

    SET old_sql_safe_updates = @@SQL_SAFE_UPDATES;
    SET SQL_SAFE_UPDATES = 0;

    SELECT COUNT(*) INTO has_users_status
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status';

    IF has_users_status = 0 THEN
        ALTER TABLE `users`
            ADD COLUMN `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active'
            AFTER `password`;
    END IF;

    UPDATE `users`
    SET `status` = 'active'
    WHERE `status` IS NULL OR TRIM(`status`) = '';

    SELECT COUNT(*) INTO has_category_status
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'category' AND COLUMN_NAME = 'status';

    IF has_category_status = 0 THEN
        ALTER TABLE `category`
            ADD COLUMN `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active'
            AFTER `image`;
    END IF;

    UPDATE `category`
    SET `status` = 'active'
    WHERE `status` IS NULL OR TRIM(`status`) = '';

    SELECT COUNT(*) INTO has_blogs_status
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blogs' AND COLUMN_NAME = 'status';

    IF has_blogs_status = 0 THEN
        ALTER TABLE `blogs`
            ADD COLUMN `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft'
            AFTER `image`;
    END IF;

    SELECT COUNT(*) INTO has_blogs_published_at
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blogs' AND COLUMN_NAME = 'publishedAt';

    IF has_blogs_published_at = 0 THEN
        ALTER TABLE `blogs`
            ADD COLUMN `publishedAt` datetime NULL DEFAULT NULL
            AFTER `status`;
    END IF;

    SELECT COUNT(*) INTO has_blogs_deleted_at
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blogs' AND COLUMN_NAME = 'deletedAt';

    IF has_blogs_deleted_at = 0 THEN
        ALTER TABLE `blogs`
            ADD COLUMN `deletedAt` datetime NULL DEFAULT NULL
            AFTER `updatedAt`;
    END IF;

    UPDATE `blogs`
    SET
        `status` = 'published',
        `publishedAt` = COALESCE(`publishedAt`, `createdAt`, `updatedAt`, NOW())
    WHERE `status` IS NULL OR TRIM(`status`) = '' OR `status` = 'draft';

    SELECT COUNT(*) INTO has_contact_status
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contact' AND COLUMN_NAME = 'status';

    IF has_contact_status = 0 THEN
        ALTER TABLE `contact`
            ADD COLUMN `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new'
            AFTER `deliveryOption`;
    END IF;

    SELECT COUNT(*) INTO has_contact_admin_note
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contact' AND COLUMN_NAME = 'adminNote';

    IF has_contact_admin_note = 0 THEN
        ALTER TABLE `contact`
            ADD COLUMN `adminNote` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL
            AFTER `status`;
    END IF;

    SELECT COUNT(*) INTO has_contact_handled_at
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contact' AND COLUMN_NAME = 'handledAt';

    IF has_contact_handled_at = 0 THEN
        ALTER TABLE `contact`
            ADD COLUMN `handledAt` datetime NULL DEFAULT NULL
            AFTER `adminNote`;
    END IF;

    SELECT COUNT(*) INTO has_contact_deleted_at
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contact' AND COLUMN_NAME = 'deletedAt';

    IF has_contact_deleted_at = 0 THEN
        ALTER TABLE `contact`
            ADD COLUMN `deletedAt` datetime NULL DEFAULT NULL
            AFTER `updatedAt`;
    END IF;

    UPDATE `contact`
    SET `status` = 'new'
    WHERE `status` IS NULL OR TRIM(`status`) = '';

    SELECT COUNT(*) INTO has_review_table
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_reviews';

    SELECT COUNT(*) INTO has_legacy_review_table
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productpreview';

    IF has_review_table = 0 AND has_legacy_review_table > 0 THEN
        RENAME TABLE `productpreview` TO `product_reviews`;
    END IF;

    SELECT COUNT(*) INTO has_review_status
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_reviews' AND COLUMN_NAME = 'status';

    IF has_review_status = 0 THEN
        ALTER TABLE `product_reviews`
            ADD COLUMN `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending'
            AFTER `content`;
    END IF;

    SELECT COUNT(*) INTO has_review_reviewed_at
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_reviews' AND COLUMN_NAME = 'reviewedAt';

    IF has_review_reviewed_at = 0 THEN
        ALTER TABLE `product_reviews`
            ADD COLUMN `reviewedAt` datetime NULL DEFAULT NULL
            AFTER `status`;
    END IF;

    SELECT COUNT(*) INTO has_review_reviewed_by
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_reviews' AND COLUMN_NAME = 'reviewedBy';

    IF has_review_reviewed_by = 0 THEN
        ALTER TABLE `product_reviews`
            ADD COLUMN `reviewedBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL
            AFTER `reviewedAt`;
    END IF;

    SELECT COUNT(*) INTO has_review_deleted_at
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_reviews' AND COLUMN_NAME = 'deletedAt';

    IF has_review_deleted_at = 0 THEN
        ALTER TABLE `product_reviews`
            ADD COLUMN `deletedAt` datetime NULL DEFAULT NULL
            AFTER `updatedAt`;
    END IF;

    UPDATE `product_reviews`
    SET
        `status` = 'approved',
        `reviewedAt` = COALESCE(`reviewedAt`, `createdAt`, `updatedAt`, NOW())
    WHERE `status` IS NULL OR TRIM(`status`) = '' OR `status` = 'pending';

    SELECT COUNT(*) INTO has_spec_status
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'spec_definitions' AND COLUMN_NAME = 'status';

    IF has_spec_status = 0 THEN
        ALTER TABLE `spec_definitions`
            ADD COLUMN `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active'
            AFTER `sortOrder`;
    END IF;

    UPDATE `spec_definitions`
    SET `status` = 'active'
    WHERE `status` IS NULL OR TRIM(`status`) = '';

    SET SQL_SAFE_UPDATES = old_sql_safe_updates;
END $$

DELIMITER ;

CALL `normalize_admin_lifecycle_schema`();

DROP PROCEDURE IF EXISTS `normalize_admin_lifecycle_schema`;

SELECT 'Admin lifecycle schema normalization completed' AS message;
