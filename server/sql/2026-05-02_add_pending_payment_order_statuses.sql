ALTER TABLE `orders`
    MODIFY COLUMN `status` ENUM(
        'pending_payment',
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
