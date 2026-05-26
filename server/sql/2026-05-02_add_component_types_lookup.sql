USE `shop_pc`;

SET @OLD_SQL_SAFE_UPDATES = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

DROP PROCEDURE IF EXISTS `add_index_if_missing`;
DROP PROCEDURE IF EXISTS `add_foreign_key_if_missing`;
DROP PROCEDURE IF EXISTS `drop_index_if_exists`;
DROP PROCEDURE IF EXISTS `drop_column_if_exists`;
DROP PROCEDURE IF EXISTS `assert_no_unknown_component_types`;

DELIMITER $$

CREATE PROCEDURE `add_index_if_missing`(
    IN table_name_value VARCHAR(64),
    IN index_name_value VARCHAR(64),
    IN alter_statement TEXT
)
BEGIN
    DECLARE index_exists INT DEFAULT 0;

    SELECT COUNT(*)
    INTO index_exists
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name_value
      AND INDEX_NAME = index_name_value;

    IF index_exists = 0 THEN
        SET @add_index_sql = CONCAT('ALTER TABLE `', table_name_value, '` ', alter_statement);
        PREPARE stmt FROM @add_index_sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$

CREATE PROCEDURE `add_foreign_key_if_missing`(
    IN table_name_value VARCHAR(64),
    IN constraint_name_value VARCHAR(64),
    IN alter_statement TEXT
)
BEGIN
    DECLARE constraint_exists INT DEFAULT 0;

    SELECT COUNT(*)
    INTO constraint_exists
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name_value
      AND CONSTRAINT_NAME = constraint_name_value
      AND CONSTRAINT_TYPE = 'FOREIGN KEY';

    IF constraint_exists = 0 THEN
        SET @add_fk_sql = CONCAT('ALTER TABLE `', table_name_value, '` ', alter_statement);
        PREPARE stmt FROM @add_fk_sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$

CREATE PROCEDURE `drop_index_if_exists`(
    IN table_name_value VARCHAR(64),
    IN index_name_value VARCHAR(64)
)
BEGIN
    DECLARE index_exists INT DEFAULT 0;

    SELECT COUNT(*)
    INTO index_exists
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name_value
      AND INDEX_NAME = index_name_value;

    IF index_exists > 0 THEN
        SET @drop_index_sql = CONCAT('ALTER TABLE `', table_name_value, '` DROP INDEX `', index_name_value, '`');
        PREPARE stmt FROM @drop_index_sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$

CREATE PROCEDURE `drop_column_if_exists`(
    IN table_name_value VARCHAR(64),
    IN column_name_value VARCHAR(64)
)
BEGIN
    DECLARE column_exists INT DEFAULT 0;

    SELECT COUNT(*)
    INTO column_exists
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name_value
      AND COLUMN_NAME = column_name_value;

    IF column_exists > 0 THEN
        SET @drop_column_sql = CONCAT('ALTER TABLE `', table_name_value, '` DROP COLUMN `', column_name_value, '`');
        PREPARE stmt FROM @drop_column_sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$

CREATE PROCEDURE `assert_no_unknown_component_types`()
BEGIN
    DECLARE invalid_count INT DEFAULT 0;

    SELECT COUNT(*)
    INTO invalid_count
    FROM (
        SELECT component_type FROM products
        UNION
        SELECT component_type FROM spec_definitions
        UNION
        SELECT component_type FROM build_pc_cart_items
    ) component_values
    LEFT JOIN component_types ON component_types.code = component_values.component_type
    WHERE component_values.component_type IS NOT NULL
      AND component_types.code IS NULL;

    IF invalid_count > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Unknown component_type values exist. Fix them before adding component_types foreign keys.';
    END IF;
END $$

DELIMITER ;

CREATE TABLE IF NOT EXISTS `component_types` (
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_product_type` tinyint(1) NOT NULL DEFAULT '1',
  `is_build_pc_allowed` tinyint(1) NOT NULL DEFAULT '1',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`code`),
  KEY `component_types_status_idx` (`status`),
  KEY `component_types_build_pc_allowed_idx` (`is_build_pc_allowed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL `drop_index_if_exists`('component_types', 'component_types_display_order_idx');
CALL `drop_column_if_exists`('component_types', 'display_order');

INSERT INTO `component_types`
(`code`, `name`, `is_product_type`, `is_build_pc_allowed`, `status`, `created_at`, `updated_at`, `deleted_at`)
VALUES
('cpu', 'CPU', 1, 1, 'active', NOW(), NOW(), NULL),
('mainboard', 'Bo mạch chủ', 1, 1, 'active', NOW(), NOW(), NULL),
('ram', 'RAM', 1, 1, 'active', NOW(), NOW(), NULL),
('ssd', 'SSD', 1, 1, 'active', NOW(), NOW(), NULL),
('hdd', 'Ổ cứng HDD', 1, 1, 'active', NOW(), NOW(), NULL),
('vga', 'Card đồ họa', 1, 1, 'active', NOW(), NOW(), NULL),
('power', 'Nguồn máy tính', 1, 1, 'active', NOW(), NOW(), NULL),
('case', 'Vỏ case', 1, 1, 'active', NOW(), NOW(), NULL),
('cooler', 'Tản nhiệt', 1, 1, 'active', NOW(), NOW(), NULL),
('monitor', 'Màn hình', 1, 1, 'active', NOW(), NOW(), NULL),
('keyboard', 'Bàn phím', 1, 1, 'active', NOW(), NOW(), NULL),
('mouse', 'Chuột', 1, 1, 'active', NOW(), NOW(), NULL),
('headset', 'Tai nghe', 1, 1, 'active', NOW(), NOW(), NULL),
('pc', 'PC nguyên bộ', 1, 0, 'active', NOW(), NOW(), NULL)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `is_product_type` = VALUES(`is_product_type`),
  `is_build_pc_allowed` = VALUES(`is_build_pc_allowed`),
  `status` = VALUES(`status`),
  `deleted_at` = NULL;

UPDATE build_pc_cart_items
INNER JOIN products ON products.id = build_pc_cart_items.product_id
SET build_pc_cart_items.component_type = products.component_type;

CALL `assert_no_unknown_component_types`();

DELETE build_pc_cart_items
FROM build_pc_cart_items
INNER JOIN products ON products.id = build_pc_cart_items.product_id
INNER JOIN component_types ON component_types.code = products.component_type
WHERE component_types.is_build_pc_allowed = 0;

DELETE older
FROM build_pc_cart_items older
INNER JOIN build_pc_cart_items newer
  ON newer.user_id = older.user_id
 AND newer.component_type = older.component_type
 AND (
    newer.updated_at > older.updated_at
    OR (newer.updated_at = older.updated_at AND newer.id > older.id)
 );

CALL `add_index_if_missing`(
    'build_pc_cart_items',
    'build_pc_cart_items_user_component_type_unique',
    'ADD UNIQUE INDEX `build_pc_cart_items_user_component_type_unique` (`user_id`, `component_type`)'
);

CALL `add_foreign_key_if_missing`(
    'products',
    'products_component_type_fk',
    'ADD CONSTRAINT `products_component_type_fk` FOREIGN KEY (`component_type`) REFERENCES `component_types` (`code`) ON UPDATE CASCADE'
);

CALL `add_foreign_key_if_missing`(
    'spec_definitions',
    'spec_definitions_component_type_fk',
    'ADD CONSTRAINT `spec_definitions_component_type_fk` FOREIGN KEY (`component_type`) REFERENCES `component_types` (`code`) ON UPDATE CASCADE'
);

CALL `add_foreign_key_if_missing`(
    'build_pc_cart_items',
    'build_pc_cart_items_component_type_fk',
    'ADD CONSTRAINT `build_pc_cart_items_component_type_fk` FOREIGN KEY (`component_type`) REFERENCES `component_types` (`code`) ON UPDATE CASCADE'
);

DROP PROCEDURE IF EXISTS `add_index_if_missing`;
DROP PROCEDURE IF EXISTS `add_foreign_key_if_missing`;
DROP PROCEDURE IF EXISTS `drop_index_if_exists`;
DROP PROCEDURE IF EXISTS `drop_column_if_exists`;
DROP PROCEDURE IF EXISTS `assert_no_unknown_component_types`;

SET SQL_SAFE_UPDATES = @OLD_SQL_SAFE_UPDATES;
