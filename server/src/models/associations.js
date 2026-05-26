const Category = require('./category.model');
const Product = require('./products.model');
const User = require('./users.model');
const CartItem = require('./cart.model');
const Order = require('./order.model');
const OrderItem = require('./orderItem.model');
const PaymentAttempt = require('./paymentAttempt.model');
const BuildPcCart = require('./buildPcCart.model');
const UserWatchProduct = require('./userWatchProduct.model');
const ProductReview = require('./productReview.model');
const ProductSpec = require('./productSpec.model');
const PcConfiguration = require('./pcConfiguration.model');
const ComponentType = require('./componentType.model');
const SpecDefinition = require('./specDefinition.model');

let associationsInitialized = false;

function initializeModelAssociations() {
    // Register once to avoid duplicate alias errors during dev/test reloads.
    if (associationsInitialized) {
        return;
    }

    associationsInitialized = true;

    Category.hasMany(Product, {
        foreignKey: 'categoryId',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
    });
    Product.belongsTo(Category, {
        foreignKey: 'categoryId',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
    });

    ComponentType.hasMany(Product, {
        foreignKey: 'componentType',
        sourceKey: 'code',
        as: 'products',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
    });
    Product.belongsTo(ComponentType, {
        foreignKey: 'componentType',
        targetKey: 'code',
        as: 'componentTypeInfo',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
    });

    User.hasMany(CartItem, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
    CartItem.belongsTo(User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });

    Product.hasMany(CartItem, {
        foreignKey: 'productId',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
    });
    CartItem.belongsTo(Product, {
        foreignKey: 'productId',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
    });

    User.hasMany(Order, {
        foreignKey: 'userId',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
    });
    Order.belongsTo(User, {
        foreignKey: 'userId',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
    });

    Order.hasMany(OrderItem, {
        foreignKey: 'orderId',
        as: 'items',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
    OrderItem.belongsTo(Order, {
        foreignKey: 'orderId',
        as: 'order',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });

    Order.hasMany(PaymentAttempt, {
        foreignKey: 'orderId',
        as: 'paymentAttempts',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
    PaymentAttempt.belongsTo(Order, {
        foreignKey: 'orderId',
        as: 'order',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });

    Product.hasMany(OrderItem, {
        foreignKey: 'productId',
        as: 'orderItems',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
    });
    OrderItem.belongsTo(Product, {
        foreignKey: 'productId',
        as: 'product',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
    });

    User.hasMany(BuildPcCart, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
    BuildPcCart.belongsTo(User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });

    Product.hasMany(BuildPcCart, {
        foreignKey: 'productId',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
    });
    BuildPcCart.belongsTo(Product, {
        foreignKey: 'productId',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
    });

    ComponentType.hasMany(BuildPcCart, {
        foreignKey: 'componentType',
        sourceKey: 'code',
        as: 'buildPcCartItems',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
    });
    BuildPcCart.belongsTo(ComponentType, {
        foreignKey: 'componentType',
        targetKey: 'code',
        as: 'componentTypeInfo',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
    });

    User.hasMany(UserWatchProduct, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
    UserWatchProduct.belongsTo(User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });

    Product.hasMany(UserWatchProduct, {
        foreignKey: 'productId',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
    });
    UserWatchProduct.belongsTo(Product, {
        foreignKey: 'productId',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
    });

    User.hasMany(ProductReview, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
    ProductReview.belongsTo(User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });

    Product.hasMany(ProductReview, {
        foreignKey: 'productId',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
    });
    ProductReview.belongsTo(Product, {
        foreignKey: 'productId',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
    });

    Order.hasMany(ProductReview, {
        foreignKey: 'orderId',
        as: 'reviews',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
    ProductReview.belongsTo(Order, {
        foreignKey: 'orderId',
        as: 'order',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });

    Product.hasMany(ProductSpec, {
        foreignKey: 'productId',
        as: 'specs',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });

    ComponentType.hasMany(SpecDefinition, {
        foreignKey: 'componentType',
        sourceKey: 'code',
        as: 'specDefinitions',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
    });
    SpecDefinition.belongsTo(ComponentType, {
        foreignKey: 'componentType',
        targetKey: 'code',
        as: 'componentTypeInfo',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
    });
    ProductSpec.belongsTo(Product, {
        foreignKey: 'productId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });

    Product.hasOne(PcConfiguration, {
        foreignKey: 'productId',
        as: 'pcConfiguration',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
    PcConfiguration.belongsTo(Product, {
        foreignKey: 'productId',
        as: 'product',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
}

module.exports = initializeModelAssociations;
