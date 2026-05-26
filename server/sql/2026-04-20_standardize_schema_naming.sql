USE `shop_pc`;

DROP PROCEDURE IF EXISTS `rename_table_if_exists`;
DROP PROCEDURE IF EXISTS `rename_column_if_exists`;
DROP PROCEDURE IF EXISTS `drop_index_if_exists`;
DROP PROCEDURE IF EXISTS `add_index_if_missing`;
DROP PROCEDURE IF EXISTS `drop_foreign_key_if_exists`;
DROP PROCEDURE IF EXISTS `add_foreign_key_if_missing`;
DROP PROCEDURE IF EXISTS `standardize_schema_naming`;

DELIMITER $$

CREATE PROCEDURE `rename_table_if_exists`(
    IN old_table_name VARCHAR(64),
    IN new_table_name VARCHAR(64)
)
BEGIN
    DECLARE old_table_exists INT DEFAULT 0;
    DECLARE new_table_exists INT DEFAULT 0;

    SELECT COUNT(*)
    INTO old_table_exists
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = old_table_name;

    SELECT COUNT(*)
    INTO new_table_exists
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = new_table_name;

    IF old_table_exists > 0 AND new_table_exists = 0 THEN
        SET @rename_table_sql = CONCAT(
            'RENAME TABLE `',
            old_table_name,
            '` TO `',
            new_table_name,
            '`'
        );
        PREPARE stmt FROM @rename_table_sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$

CREATE PROCEDURE `rename_column_if_exists`(
    IN table_name_value VARCHAR(64),
    IN old_column_name VARCHAR(64),
    IN new_column_name VARCHAR(64),
    IN column_definition TEXT
)
BEGIN
    DECLARE table_exists_count INT DEFAULT 0;
    DECLARE old_column_exists INT DEFAULT 0;
    DECLARE new_column_exists INT DEFAULT 0;

    SELECT COUNT(*)
    INTO table_exists_count
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = table_name_value;

    IF table_exists_count > 0 THEN
        SELECT COUNT(*)
        INTO old_column_exists
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name_value
          AND COLUMN_NAME = old_column_name;

        SELECT COUNT(*)
        INTO new_column_exists
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name_value
          AND COLUMN_NAME = new_column_name;

        IF old_column_exists > 0 AND new_column_exists = 0 THEN
            SET @rename_column_sql = CONCAT(
                'ALTER TABLE `',
                table_name_value,
                '` CHANGE COLUMN `',
                old_column_name,
                '` `',
                new_column_name,
                '` ',
                column_definition
            );
            PREPARE stmt FROM @rename_column_sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        END IF;
    END IF;
END $$

CREATE PROCEDURE `drop_index_if_exists`(
    IN table_name_value VARCHAR(64),
    IN index_name_value VARCHAR(64)
)
BEGIN
    DECLARE table_exists_count INT DEFAULT 0;
    DECLARE index_exists_count INT DEFAULT 0;

    SELECT COUNT(*)
    INTO table_exists_count
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = table_name_value;

    IF table_exists_count > 0 THEN
        SELECT COUNT(*)
        INTO index_exists_count
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name_value
          AND INDEX_NAME = index_name_value;

        IF index_exists_count > 0 THEN
            SET @drop_index_sql = CONCAT(
                'ALTER TABLE `',
                table_name_value,
                '` DROP INDEX `',
                index_name_value,
                '`'
            );
            PREPARE stmt FROM @drop_index_sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        END IF;
    END IF;
END $$

CREATE PROCEDURE `add_index_if_missing`(
    IN table_name_value VARCHAR(64),
    IN index_name_value VARCHAR(64),
    IN alter_clause TEXT
)
BEGIN
    DECLARE table_exists_count INT DEFAULT 0;
    DECLARE index_exists_count INT DEFAULT 0;

    SELECT COUNT(*)
    INTO table_exists_count
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = table_name_value;

    IF table_exists_count > 0 THEN
        SELECT COUNT(*)
        INTO index_exists_count
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name_value
          AND INDEX_NAME = index_name_value;

        IF index_exists_count = 0 THEN
            SET @add_index_sql = CONCAT(
                'ALTER TABLE `',
                table_name_value,
                '` ',
                alter_clause
            );
            PREPARE stmt FROM @add_index_sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        END IF;
    END IF;
END $$

CREATE PROCEDURE `drop_foreign_key_if_exists`(
    IN table_name_value VARCHAR(64),
    IN foreign_key_name VARCHAR(64)
)
BEGIN
    DECLARE table_exists_count INT DEFAULT 0;
    DECLARE foreign_key_exists_count INT DEFAULT 0;

    SELECT COUNT(*)
    INTO table_exists_count
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = table_name_value;

    IF table_exists_count > 0 THEN
        SELECT COUNT(*)
        INTO foreign_key_exists_count
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name_value
          AND CONSTRAINT_NAME = foreign_key_name
          AND CONSTRAINT_TYPE = 'FOREIGN KEY';

        IF foreign_key_exists_count > 0 THEN
            SET @drop_fk_sql = CONCAT(
                'ALTER TABLE `',
                table_name_value,
                '` DROP FOREIGN KEY `',
                foreign_key_name,
                '`'
            );
            PREPARE stmt FROM @drop_fk_sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        END IF;
    END IF;
END $$

CREATE PROCEDURE `add_foreign_key_if_missing`(
    IN table_name_value VARCHAR(64),
    IN foreign_key_name VARCHAR(64),
    IN alter_clause TEXT
)
BEGIN
    DECLARE table_exists_count INT DEFAULT 0;
    DECLARE foreign_key_exists_count INT DEFAULT 0;

    SELECT COUNT(*)
    INTO table_exists_count
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = table_name_value;

    IF table_exists_count > 0 THEN
        SELECT COUNT(*)
        INTO foreign_key_exists_count
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name_value
          AND CONSTRAINT_NAME = foreign_key_name
          AND CONSTRAINT_TYPE = 'FOREIGN KEY';

        IF foreign_key_exists_count = 0 THEN
            SET @add_fk_sql = CONCAT(
                'ALTER TABLE `',
                table_name_value,
                '` ',
                alter_clause
            );
            PREPARE stmt FROM @add_fk_sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        END IF;
    END IF;
END $$

CREATE PROCEDURE `standardize_schema_naming`()
BEGIN
    DECLARE old_foreign_key_checks INT DEFAULT 1;

    SET old_foreign_key_checks = @@FOREIGN_KEY_CHECKS;
    SET FOREIGN_KEY_CHECKS = 0;

    CALL `rename_table_if_exists`('blogs', 'blog_posts');
    CALL `rename_table_if_exists`('buildpccart', 'build_pc_cart_items');
    CALL `rename_table_if_exists`('cart', 'cart_items');
    CALL `rename_table_if_exists`('category', 'categories');
    CALL `rename_table_if_exists`('contact', 'contacts');
    CALL `rename_table_if_exists`('otps', 'otp_codes');
    CALL `rename_table_if_exists`('userwatchproduct', 'wishlist_items');

    CALL `drop_foreign_key_if_exists`('build_pc_cart_items', 'buildPcCart_product_fk');
    CALL `drop_foreign_key_if_exists`('build_pc_cart_items', 'buildPcCart_user_fk');
    CALL `drop_foreign_key_if_exists`('build_pc_cart_items', 'build_pc_cart_items_product_fk');
    CALL `drop_foreign_key_if_exists`('build_pc_cart_items', 'build_pc_cart_items_user_fk');
    CALL `drop_foreign_key_if_exists`('cart_items', 'cart_product_fk');
    CALL `drop_foreign_key_if_exists`('cart_items', 'cart_user_fk');
    CALL `drop_foreign_key_if_exists`('cart_items', 'cart_items_product_fk');
    CALL `drop_foreign_key_if_exists`('cart_items', 'cart_items_user_fk');
    CALL `drop_foreign_key_if_exists`('order_items', 'order_items_order_fk');
    CALL `drop_foreign_key_if_exists`('order_items', 'order_items_product_fk');
    CALL `drop_foreign_key_if_exists`('orders', 'orders_user_fk');
    CALL `drop_foreign_key_if_exists`('pc_configurations', 'pc_configurations_product_fk');
    CALL `drop_foreign_key_if_exists`('product_reviews', 'product_reviews_product_fk');
    CALL `drop_foreign_key_if_exists`('product_reviews', 'product_reviews_user_fk');
    CALL `drop_foreign_key_if_exists`('product_specs', 'product_specs_ibfk_1');
    CALL `drop_foreign_key_if_exists`('product_specs', 'product_specs_product_fk');
    CALL `drop_foreign_key_if_exists`('products', 'products_category_fk');
    CALL `drop_foreign_key_if_exists`('refresh_tokens', 'refresh_tokens_user_fk');
    CALL `drop_foreign_key_if_exists`('wishlist_items', 'userWatchProduct_product_fk');
    CALL `drop_foreign_key_if_exists`('wishlist_items', 'userWatchProduct_user_fk');
    CALL `drop_foreign_key_if_exists`('wishlist_items', 'wishlist_items_product_fk');
    CALL `drop_foreign_key_if_exists`('wishlist_items', 'wishlist_items_user_fk');

    CALL `rename_column_if_exists`('blog_posts', 'image', 'cover_image', 'varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');
    CALL `rename_column_if_exists`('blog_posts', 'publishedAt', 'published_at', 'datetime DEFAULT NULL');
    CALL `rename_column_if_exists`('blog_posts', 'createdAt', 'created_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('blog_posts', 'updatedAt', 'updated_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('blog_posts', 'deletedAt', 'deleted_at', 'datetime DEFAULT NULL');

    CALL `rename_column_if_exists`('build_pc_cart_items', 'productId', 'product_id', 'char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL');
    CALL `rename_column_if_exists`('build_pc_cart_items', 'componentType', 'component_type', 'varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');
    CALL `rename_column_if_exists`('build_pc_cart_items', 'userId', 'user_id', 'char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL');
    CALL `rename_column_if_exists`('build_pc_cart_items', 'totalPrice', 'total_price', 'int NOT NULL');
    CALL `rename_column_if_exists`('build_pc_cart_items', 'createdAt', 'created_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('build_pc_cart_items', 'updatedAt', 'updated_at', 'datetime NOT NULL');

    CALL `rename_column_if_exists`('cart_items', 'userId', 'user_id', 'char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL');
    CALL `rename_column_if_exists`('cart_items', 'productId', 'product_id', 'char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL');
    CALL `rename_column_if_exists`('cart_items', 'totalPrice', 'total_price', 'int NOT NULL');
    CALL `rename_column_if_exists`('cart_items', 'createdAt', 'created_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('cart_items', 'updatedAt', 'updated_at', 'datetime NOT NULL');

    CALL `rename_column_if_exists`('categories', 'createdAt', 'created_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('categories', 'updatedAt', 'updated_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('categories', 'deletedAt', 'deleted_at', 'datetime DEFAULT NULL');

    CALL `rename_column_if_exists`('contacts', 'fullName', 'full_name', 'varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');
    CALL `rename_column_if_exists`('contacts', 'purchaseIntent', 'purchase_intent', 'text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');
    CALL `rename_column_if_exists`('contacts', 'deliveryOption', 'delivery_option', 'text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');
    CALL `rename_column_if_exists`('contacts', 'adminNote', 'admin_note', 'text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL');
    CALL `rename_column_if_exists`('contacts', 'handledAt', 'handled_at', 'datetime DEFAULT NULL');
    CALL `rename_column_if_exists`('contacts', 'createdAt', 'created_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('contacts', 'updatedAt', 'updated_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('contacts', 'deletedAt', 'deleted_at', 'datetime DEFAULT NULL');

    CALL `rename_column_if_exists`('order_items', 'orderId', 'order_id', 'char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL');
    CALL `rename_column_if_exists`('order_items', 'productId', 'product_id', 'char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL');
    CALL `rename_column_if_exists`('order_items', 'productName', 'product_name', 'varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');
    CALL `rename_column_if_exists`('order_items', 'productImage', 'product_images', 'text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');
    CALL `rename_column_if_exists`('order_items', 'productSnapshot', 'product_snapshot', 'json DEFAULT NULL');
    CALL `rename_column_if_exists`('order_items', 'unitPrice', 'unit_price', 'int NOT NULL');
    CALL `rename_column_if_exists`('order_items', 'lineTotal', 'line_total', 'int NOT NULL');
    CALL `rename_column_if_exists`('order_items', 'createdAt', 'created_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('order_items', 'updatedAt', 'updated_at', 'datetime NOT NULL');

    CALL `rename_column_if_exists`('orders', 'idPayment', 'order_code', 'varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');
    CALL `rename_column_if_exists`('orders', 'userId', 'user_id', 'char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL');
    CALL `rename_column_if_exists`('orders', 'fullName', 'full_name', 'varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');
    CALL `rename_column_if_exists`('orders', 'totalPrice', 'total_price', 'int NOT NULL');
    CALL `rename_column_if_exists`('orders', 'returnReason', 'return_reason', 'text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL');
    CALL `rename_column_if_exists`('orders', 'deliveredAt', 'delivered_at', 'datetime DEFAULT NULL');
    CALL `rename_column_if_exists`('orders', 'completedAt', 'completed_at', 'datetime DEFAULT NULL');
    CALL `rename_column_if_exists`('orders', 'cancelledAt', 'cancelled_at', 'datetime DEFAULT NULL');
    CALL `rename_column_if_exists`('orders', 'returnRequestedAt', 'return_requested_at', 'datetime DEFAULT NULL');
    CALL `rename_column_if_exists`('orders', 'returnedAt', 'returned_at', 'datetime DEFAULT NULL');
    CALL `rename_column_if_exists`('orders', 'refundedAt', 'refunded_at', 'datetime DEFAULT NULL');
    CALL `rename_column_if_exists`('orders', 'typePayment', 'payment_method', 'varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');
    CALL `rename_column_if_exists`('orders', 'createdAt', 'created_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('orders', 'updatedAt', 'updated_at', 'datetime NOT NULL');

    CALL `rename_column_if_exists`('otp_codes', 'createdAt', 'created_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('otp_codes', 'updatedAt', 'updated_at', 'datetime NOT NULL');

    CALL `rename_column_if_exists`('pc_configurations', 'productId', 'product_id', 'char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL');
    CALL `rename_column_if_exists`('pc_configurations', 'main', 'motherboard', 'text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL');
    CALL `rename_column_if_exists`('pc_configurations', 'vga', 'gpu', 'text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL');
    CALL `rename_column_if_exists`('pc_configurations', 'caseComputer', 'computer_case', 'text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL');
    CALL `rename_column_if_exists`('pc_configurations', 'coolers', 'cooler', 'text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL');
    CALL `rename_column_if_exists`('pc_configurations', 'createdAt', 'created_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('pc_configurations', 'updatedAt', 'updated_at', 'datetime NOT NULL');

    CALL `rename_column_if_exists`('product_reviews', 'userId', 'user_id', 'char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL');
    CALL `rename_column_if_exists`('product_reviews', 'productId', 'product_id', 'char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL');
    CALL `rename_column_if_exists`('product_reviews', 'reviewedAt', 'reviewed_at', 'datetime DEFAULT NULL');
    CALL `rename_column_if_exists`('product_reviews', 'reviewedBy', 'reviewed_by_user_id', 'char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL');
    CALL `rename_column_if_exists`('product_reviews', 'createdAt', 'created_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('product_reviews', 'updatedAt', 'updated_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('product_reviews', 'deletedAt', 'deleted_at', 'datetime DEFAULT NULL');

    CALL `rename_column_if_exists`('product_specs', 'productId', 'product_id', 'char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL');
    CALL `rename_column_if_exists`('product_specs', 'specKey', 'spec_key', 'varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');
    CALL `rename_column_if_exists`('product_specs', 'specValue', 'spec_value', 'varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');

    CALL `rename_column_if_exists`('products', 'categoryId', 'category_id', 'char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL');
    CALL `rename_column_if_exists`('products', 'componentType', 'component_type', 'varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');
    CALL `rename_column_if_exists`('products', 'createdAt', 'created_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('products', 'updatedAt', 'updated_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('products', 'deletedAt', 'deleted_at', 'datetime DEFAULT NULL');

    CALL `rename_column_if_exists`('refresh_tokens', 'userId', 'user_id', 'char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL');
    CALL `rename_column_if_exists`('refresh_tokens', 'tokenHash', 'token_hash', 'varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');
    CALL `rename_column_if_exists`('refresh_tokens', 'expiresAt', 'expires_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('refresh_tokens', 'createdAt', 'created_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('refresh_tokens', 'updatedAt', 'updated_at', 'datetime NOT NULL');

    CALL `rename_column_if_exists`('spec_definitions', 'componentType', 'component_type', 'varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');
    CALL `rename_column_if_exists`('spec_definitions', 'specKey', 'spec_key', 'varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');
    CALL `rename_column_if_exists`('spec_definitions', 'sortOrder', 'display_order', 'int NOT NULL DEFAULT ''0''');
    CALL `rename_column_if_exists`('spec_definitions', 'createdAt', 'created_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('spec_definitions', 'updatedAt', 'updated_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('spec_definitions', 'deletedAt', 'deleted_at', 'datetime DEFAULT NULL');

    CALL `rename_column_if_exists`('users', 'fullName', 'full_name', 'varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');
    CALL `rename_column_if_exists`('users', 'isAdmin', 'is_admin', 'tinyint(1) NOT NULL DEFAULT ''0''');
    CALL `rename_column_if_exists`('users', 'typeLogin', 'auth_provider', 'enum(''google'',''email'') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL');
    CALL `rename_column_if_exists`('users', 'createdAt', 'created_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('users', 'updatedAt', 'updated_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('users', 'deletedAt', 'deleted_at', 'datetime DEFAULT NULL');

    CALL `rename_column_if_exists`('wishlist_items', 'userId', 'user_id', 'char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL');
    CALL `rename_column_if_exists`('wishlist_items', 'productId', 'product_id', 'char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL');
    CALL `rename_column_if_exists`('wishlist_items', 'createdAt', 'created_at', 'datetime NOT NULL');
    CALL `rename_column_if_exists`('wishlist_items', 'updatedAt', 'updated_at', 'datetime NOT NULL');

    CALL `drop_index_if_exists`('blog_posts', 'blogs_status_idx');
    CALL `drop_index_if_exists`('blog_posts', 'blogs_publishedAt_idx');

    CALL `drop_index_if_exists`('build_pc_cart_items', 'buildPcCart_user_product_unique');
    CALL `drop_index_if_exists`('build_pc_cart_items', 'buildPcCart_product_fk');
    CALL `drop_index_if_exists`('build_pc_cart_items', 'build_pc_cart_items_product_fk');

    CALL `drop_index_if_exists`('cart_items', 'cart_user_product_unique');
    CALL `drop_index_if_exists`('cart_items', 'cart_product_fk');
    CALL `drop_index_if_exists`('cart_items', 'cart_items_product_fk');

    CALL `drop_index_if_exists`('categories', 'category_status_idx');
    CALL `drop_index_if_exists`('contacts', 'contact_status_idx');

    CALL `drop_index_if_exists`('order_items', 'order_items_orderId_idx');
    CALL `drop_index_if_exists`('order_items', 'order_items_productId_idx');

    CALL `drop_index_if_exists`('orders', 'orders_idPayment_unique');
    CALL `drop_index_if_exists`('orders', 'orders_userId_idx');
    CALL `drop_index_if_exists`('orders', 'orders_createdAt_idx');
    CALL `drop_index_if_exists`('orders', 'orders_status_deliveredAt_idx');

    CALL `drop_index_if_exists`('product_specs', 'product_specs_product_key');
    CALL `drop_index_if_exists`('product_specs', 'product_specs_specKey_idx');
    CALL `drop_index_if_exists`('product_specs', 'product_specs_spec_key_value_product_idx');

    CALL `drop_index_if_exists`('products', 'products_categoryId_idx');
    CALL `drop_index_if_exists`('products', 'products_componentType_idx');
    CALL `drop_index_if_exists`('products', 'products_discount_deleted_created_idx');
    CALL `drop_index_if_exists`('products', 'products_category_deleted_created_idx');
    CALL `drop_index_if_exists`('products', 'products_component_deleted_created_idx');
    CALL `drop_index_if_exists`('products', 'products_category_component_deleted_created_idx');
    CALL `drop_index_if_exists`('products', 'products_discount_status_deleted_created_idx');
    CALL `drop_index_if_exists`('products', 'products_category_status_deleted_created_idx');
    CALL `drop_index_if_exists`('products', 'products_component_status_deleted_created_idx');
    CALL `drop_index_if_exists`('products', 'products_category_component_status_deleted_created_idx');

    CALL `drop_index_if_exists`('spec_definitions', 'spec_def_type_key');

    CALL `drop_index_if_exists`('wishlist_items', 'userWatchProduct_user_product_unique');
    CALL `drop_index_if_exists`('wishlist_items', 'userWatchProduct_product_fk');
    CALL `drop_index_if_exists`('wishlist_items', 'wishlist_items_product_fk');

    CALL `add_index_if_missing`('blog_posts', 'blog_posts_status_idx', 'ADD INDEX `blog_posts_status_idx` (`status`)');
    CALL `add_index_if_missing`('blog_posts', 'blog_posts_published_at_idx', 'ADD INDEX `blog_posts_published_at_idx` (`published_at`)');

    CALL `add_index_if_missing`('build_pc_cart_items', 'build_pc_cart_items_user_product_unique', 'ADD UNIQUE INDEX `build_pc_cart_items_user_product_unique` (`user_id`, `product_id`)');
    CALL `add_index_if_missing`('build_pc_cart_items', 'build_pc_cart_items_product_idx', 'ADD INDEX `build_pc_cart_items_product_idx` (`product_id`)');

    CALL `add_index_if_missing`('cart_items', 'cart_items_user_product_unique', 'ADD UNIQUE INDEX `cart_items_user_product_unique` (`user_id`, `product_id`)');
    CALL `add_index_if_missing`('cart_items', 'cart_items_product_idx', 'ADD INDEX `cart_items_product_idx` (`product_id`)');

    CALL `add_index_if_missing`('categories', 'categories_status_idx', 'ADD INDEX `categories_status_idx` (`status`)');
    CALL `add_index_if_missing`('contacts', 'contacts_status_idx', 'ADD INDEX `contacts_status_idx` (`status`)');

    CALL `add_index_if_missing`('order_items', 'order_items_order_id_idx', 'ADD INDEX `order_items_order_id_idx` (`order_id`)');
    CALL `add_index_if_missing`('order_items', 'order_items_product_id_idx', 'ADD INDEX `order_items_product_id_idx` (`product_id`)');

    CALL `add_index_if_missing`('orders', 'orders_order_code_unique', 'ADD UNIQUE INDEX `orders_order_code_unique` (`order_code`)');
    CALL `add_index_if_missing`('orders', 'orders_user_id_idx', 'ADD INDEX `orders_user_id_idx` (`user_id`)');
    CALL `add_index_if_missing`('orders', 'orders_created_at_idx', 'ADD INDEX `orders_created_at_idx` (`created_at`)');
    CALL `add_index_if_missing`('orders', 'orders_status_delivered_at_idx', 'ADD INDEX `orders_status_delivered_at_idx` (`status`, `delivered_at`)');

    CALL `add_index_if_missing`('pc_configurations', 'pc_configurations_product_id_unique', 'ADD UNIQUE INDEX `pc_configurations_product_id_unique` (`product_id`)');

    CALL `add_index_if_missing`('product_reviews', 'product_reviews_user_product_unique', 'ADD UNIQUE INDEX `product_reviews_user_product_unique` (`user_id`, `product_id`)');
    CALL `add_index_if_missing`('product_reviews', 'product_reviews_product_idx', 'ADD INDEX `product_reviews_product_idx` (`product_id`)');
    CALL `add_index_if_missing`('product_reviews', 'product_reviews_status_idx', 'ADD INDEX `product_reviews_status_idx` (`status`)');

    CALL `add_index_if_missing`('product_specs', 'product_specs_product_id_spec_key_unique', 'ADD UNIQUE INDEX `product_specs_product_id_spec_key_unique` (`product_id`, `spec_key`)');
    CALL `add_index_if_missing`('product_specs', 'product_specs_spec_key_idx', 'ADD INDEX `product_specs_spec_key_idx` (`spec_key`)');
    CALL `add_index_if_missing`('product_specs', 'product_specs_spec_key_spec_value_product_id_idx', 'ADD INDEX `product_specs_spec_key_spec_value_product_id_idx` (`spec_key`, `spec_value`, `product_id`)');

    CALL `add_index_if_missing`('products', 'products_category_id_idx', 'ADD INDEX `products_category_id_idx` (`category_id`)');
    CALL `add_index_if_missing`('products', 'products_component_type_idx', 'ADD INDEX `products_component_type_idx` (`component_type`)');
    CALL `add_index_if_missing`('products', 'products_status_idx', 'ADD INDEX `products_status_idx` (`status`)');
    CALL `add_index_if_missing`('products', 'products_price_idx', 'ADD INDEX `products_price_idx` (`price`)');
    CALL `add_index_if_missing`('products', 'products_discount_status_deleted_at_created_at_idx', 'ADD INDEX `products_discount_status_deleted_at_created_at_idx` (`discount`, `status`, `deleted_at`, `created_at`)');
    CALL `add_index_if_missing`('products', 'products_category_id_status_deleted_at_created_at_idx', 'ADD INDEX `products_category_id_status_deleted_at_created_at_idx` (`category_id`, `status`, `deleted_at`, `created_at`)');
    CALL `add_index_if_missing`('products', 'products_component_type_status_deleted_at_created_at_idx', 'ADD INDEX `products_component_type_status_deleted_at_created_at_idx` (`component_type`, `status`, `deleted_at`, `created_at`)');
    CALL `add_index_if_missing`('products', 'products_category_id_component_type_status_deleted_at_created_at_idx', 'ADD INDEX `products_category_id_component_type_status_deleted_at_created_at_idx` (`category_id`, `component_type`, `status`, `deleted_at`, `created_at`)');

    CALL `add_index_if_missing`('refresh_tokens', 'refresh_tokens_token_hash_unique', 'ADD UNIQUE INDEX `refresh_tokens_token_hash_unique` (`token_hash`)');
    CALL `add_index_if_missing`('refresh_tokens', 'refresh_tokens_user_id_idx', 'ADD INDEX `refresh_tokens_user_id_idx` (`user_id`)');
    CALL `add_index_if_missing`('refresh_tokens', 'refresh_tokens_expires_at_idx', 'ADD INDEX `refresh_tokens_expires_at_idx` (`expires_at`)');

    CALL `add_index_if_missing`('spec_definitions', 'spec_definitions_component_type_spec_key_unique', 'ADD UNIQUE INDEX `spec_definitions_component_type_spec_key_unique` (`component_type`, `spec_key`)');
    CALL `add_index_if_missing`('spec_definitions', 'spec_definitions_status_idx', 'ADD INDEX `spec_definitions_status_idx` (`status`)');

    CALL `add_index_if_missing`('users', 'users_email_unique', 'ADD UNIQUE INDEX `users_email_unique` (`email`)');
    CALL `add_index_if_missing`('users', 'users_status_idx', 'ADD INDEX `users_status_idx` (`status`)');

    CALL `add_index_if_missing`('wishlist_items', 'wishlist_items_user_product_unique', 'ADD UNIQUE INDEX `wishlist_items_user_product_unique` (`user_id`, `product_id`)');
    CALL `add_index_if_missing`('wishlist_items', 'wishlist_items_product_idx', 'ADD INDEX `wishlist_items_product_idx` (`product_id`)');

    CALL `add_foreign_key_if_missing`('build_pc_cart_items', 'build_pc_cart_items_product_fk', 'ADD CONSTRAINT `build_pc_cart_items_product_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE');
    CALL `add_foreign_key_if_missing`('build_pc_cart_items', 'build_pc_cart_items_user_fk', 'ADD CONSTRAINT `build_pc_cart_items_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
    CALL `add_foreign_key_if_missing`('cart_items', 'cart_items_product_fk', 'ADD CONSTRAINT `cart_items_product_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE');
    CALL `add_foreign_key_if_missing`('cart_items', 'cart_items_user_fk', 'ADD CONSTRAINT `cart_items_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
    CALL `add_foreign_key_if_missing`('order_items', 'order_items_order_fk', 'ADD CONSTRAINT `order_items_order_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
    CALL `add_foreign_key_if_missing`('order_items', 'order_items_product_fk', 'ADD CONSTRAINT `order_items_product_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE');
    CALL `add_foreign_key_if_missing`('orders', 'orders_user_fk', 'ADD CONSTRAINT `orders_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE');
    CALL `add_foreign_key_if_missing`('pc_configurations', 'pc_configurations_product_fk', 'ADD CONSTRAINT `pc_configurations_product_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
    CALL `add_foreign_key_if_missing`('product_reviews', 'product_reviews_product_fk', 'ADD CONSTRAINT `product_reviews_product_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE');
    CALL `add_foreign_key_if_missing`('product_reviews', 'product_reviews_user_fk', 'ADD CONSTRAINT `product_reviews_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
    CALL `add_foreign_key_if_missing`('product_specs', 'product_specs_product_fk', 'ADD CONSTRAINT `product_specs_product_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
    CALL `add_foreign_key_if_missing`('products', 'products_category_fk', 'ADD CONSTRAINT `products_category_fk` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON UPDATE CASCADE');
    CALL `add_foreign_key_if_missing`('refresh_tokens', 'refresh_tokens_user_fk', 'ADD CONSTRAINT `refresh_tokens_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
    CALL `add_foreign_key_if_missing`('wishlist_items', 'wishlist_items_product_fk', 'ADD CONSTRAINT `wishlist_items_product_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE');
    CALL `add_foreign_key_if_missing`('wishlist_items', 'wishlist_items_user_fk', 'ADD CONSTRAINT `wishlist_items_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');

    SET FOREIGN_KEY_CHECKS = old_foreign_key_checks;
END $$

DELIMITER ;

CALL `standardize_schema_naming`();

DROP PROCEDURE IF EXISTS `standardize_schema_naming`;
DROP PROCEDURE IF EXISTS `add_foreign_key_if_missing`;
DROP PROCEDURE IF EXISTS `drop_foreign_key_if_exists`;
DROP PROCEDURE IF EXISTS `add_index_if_missing`;
DROP PROCEDURE IF EXISTS `drop_index_if_exists`;
DROP PROCEDURE IF EXISTS `rename_column_if_exists`;
DROP PROCEDURE IF EXISTS `rename_table_if_exists`;

SELECT 'Schema naming standardization completed' AS message;
