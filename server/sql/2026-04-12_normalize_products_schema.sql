USE `shop_pc`;

DROP PROCEDURE IF EXISTS `normalize_products_schema`;

DELIMITER $$

CREATE PROCEDURE `normalize_products_schema`()
BEGIN
    DECLARE old_sql_safe_updates INT DEFAULT 0;
    DECLARE has_status_column INT DEFAULT 0;
    DECLARE has_cpu_column INT DEFAULT 0;
    DECLARE has_main_column INT DEFAULT 0;
    DECLARE has_ram_column INT DEFAULT 0;
    DECLARE has_storage_column INT DEFAULT 0;
    DECLARE has_vga_column INT DEFAULT 0;
    DECLARE has_power_column INT DEFAULT 0;
    DECLARE has_case_column INT DEFAULT 0;
    DECLARE has_coolers_column INT DEFAULT 0;
    DECLARE has_any_legacy_column INT DEFAULT 0;

    SET old_sql_safe_updates = @@SQL_SAFE_UPDATES;
    SET SQL_SAFE_UPDATES = 0;

    CREATE TABLE IF NOT EXISTS `pc_configurations` (
      `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
      `productId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
      `cpu` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      `main` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      `ram` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      `storage` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      `vga` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      `power` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      `caseComputer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      `coolers` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      `createdAt` datetime NOT NULL,
      `updatedAt` datetime NOT NULL,
      PRIMARY KEY (`id`),
      UNIQUE KEY `pc_configurations_product_id_unique` (`productId`),
      CONSTRAINT `pc_configurations_product_fk` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    SELECT COUNT(*) INTO has_status_column
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'status';

    SELECT COUNT(*) INTO has_cpu_column
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'cpu';

    SELECT COUNT(*) INTO has_main_column
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'main';

    SELECT COUNT(*) INTO has_ram_column
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'ram';

    SELECT COUNT(*) INTO has_storage_column
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'storage';

    SELECT COUNT(*) INTO has_vga_column
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'vga';

    SELECT COUNT(*) INTO has_power_column
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'power';

    SELECT COUNT(*) INTO has_case_column
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'caseComputer';

    SELECT COUNT(*) INTO has_coolers_column
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'coolers';

    SET has_any_legacy_column =
        has_cpu_column + has_main_column + has_ram_column + has_storage_column
        + has_vga_column + has_power_column + has_case_column + has_coolers_column;

    IF has_any_legacy_column > 0 THEN
        SET @backfill_sql = '
            INSERT INTO `pc_configurations` (
              `id`,
              `productId`,
              `cpu`,
              `main`,
              `ram`,
              `storage`,
              `vga`,
              `power`,
              `caseComputer`,
              `coolers`,
              `createdAt`,
              `updatedAt`
            )
            SELECT
              `id`,
              `id`,
              NULLIF(TRIM(COALESCE(`cpu`, '''')), ''''),
              NULLIF(TRIM(COALESCE(`main`, '''')), ''''),
              NULLIF(TRIM(COALESCE(`ram`, '''')), ''''),
              NULLIF(TRIM(COALESCE(`storage`, '''')), ''''),
              NULLIF(TRIM(COALESCE(`vga`, '''')), ''''),
              NULLIF(TRIM(COALESCE(`power`, '''')), ''''),
              NULLIF(TRIM(COALESCE(`caseComputer`, '''')), ''''),
              NULLIF(TRIM(COALESCE(`coolers`, '''')), ''''),
              `createdAt`,
              `updatedAt`
            FROM `products`
            WHERE `componentType` = ''pc''
              AND (
                NULLIF(TRIM(COALESCE(`cpu`, '''')), '''') IS NOT NULL
                OR NULLIF(TRIM(COALESCE(`main`, '''')), '''') IS NOT NULL
                OR NULLIF(TRIM(COALESCE(`ram`, '''')), '''') IS NOT NULL
                OR NULLIF(TRIM(COALESCE(`storage`, '''')), '''') IS NOT NULL
                OR NULLIF(TRIM(COALESCE(`vga`, '''')), '''') IS NOT NULL
                OR NULLIF(TRIM(COALESCE(`power`, '''')), '''') IS NOT NULL
                OR NULLIF(TRIM(COALESCE(`caseComputer`, '''')), '''') IS NOT NULL
                OR NULLIF(TRIM(COALESCE(`coolers`, '''')), '''') IS NOT NULL
              )
            ON DUPLICATE KEY UPDATE
              `cpu` = VALUES(`cpu`),
              `main` = VALUES(`main`),
              `ram` = VALUES(`ram`),
              `storage` = VALUES(`storage`),
              `vga` = VALUES(`vga`),
              `power` = VALUES(`power`),
              `caseComputer` = VALUES(`caseComputer`),
              `coolers` = VALUES(`coolers`),
              `updatedAt` = VALUES(`updatedAt`)';

        PREPARE stmt FROM @backfill_sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;

    IF has_status_column = 0 THEN
        ALTER TABLE `products`
          ADD COLUMN `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active'
          AFTER `componentType`;
    END IF;

    UPDATE `products`
    SET `status` = 'active'
    WHERE `status` IS NULL OR TRIM(`status`) = '';

    IF has_cpu_column = 1 THEN
        ALTER TABLE `products` DROP COLUMN `cpu`;
    END IF;

    IF has_main_column = 1 THEN
        ALTER TABLE `products` DROP COLUMN `main`;
    END IF;

    IF has_ram_column = 1 THEN
        ALTER TABLE `products` DROP COLUMN `ram`;
    END IF;

    IF has_storage_column = 1 THEN
        ALTER TABLE `products` DROP COLUMN `storage`;
    END IF;

    IF has_vga_column = 1 THEN
        ALTER TABLE `products` DROP COLUMN `vga`;
    END IF;

    IF has_power_column = 1 THEN
        ALTER TABLE `products` DROP COLUMN `power`;
    END IF;

    IF has_case_column = 1 THEN
        ALTER TABLE `products` DROP COLUMN `caseComputer`;
    END IF;

    IF has_coolers_column = 1 THEN
        ALTER TABLE `products` DROP COLUMN `coolers`;
    END IF;

    SET SQL_SAFE_UPDATES = old_sql_safe_updates;
END $$

DELIMITER ;

CALL `normalize_products_schema`();

DROP PROCEDURE IF EXISTS `normalize_products_schema`;

SELECT 'Schema normalization completed' AS message;
