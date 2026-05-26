# Quan hệ model hiện tại

Schema backend hiện tại lấy `orders` và `order_items` làm trung tâm cho nghiệp vụ mua hàng.

## User

- `User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' })`
- `User.hasMany(cart, { foreignKey: 'userId' })`
- `User.hasMany(Order, { foreignKey: 'userId' })`
- `User.hasMany(buildPcCart, { foreignKey: 'userId' })`
- `User.hasMany(userWatchProduct, { foreignKey: 'userId' })`
- `User.hasMany(productReview, { foreignKey: 'userId' })`

## Category

- `Category.hasMany(Product, { foreignKey: 'categoryId' })`

## ComponentType

- `ComponentType.hasMany(Product, { foreignKey: 'componentType', sourceKey: 'code', as: 'products' })`
- `ComponentType.hasMany(buildPcCart, { foreignKey: 'componentType', sourceKey: 'code', as: 'buildPcCartItems' })`
- `ComponentType.hasMany(SpecDefinition, { foreignKey: 'componentType', sourceKey: 'code', as: 'specDefinitions' })`

## Product

- `Product.belongsTo(Category, { foreignKey: 'categoryId' })`
- `Product.belongsTo(ComponentType, { foreignKey: 'componentType', targetKey: 'code', as: 'componentTypeInfo' })`
- `Product.hasMany(cart, { foreignKey: 'productId' })`
- `Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' })`
- `Product.hasMany(buildPcCart, { foreignKey: 'productId' })`
- `Product.hasMany(userWatchProduct, { foreignKey: 'productId' })`
- `Product.hasMany(productReview, { foreignKey: 'productId' })`
- `Product.hasMany(ProductSpec, { foreignKey: 'productId', as: 'specs' })`
- `Product.hasOne(pcConfiguration, { foreignKey: 'productId', as: 'pcConfiguration' })`

## PcConfiguration

- `pcConfiguration.belongsTo(Product, { foreignKey: 'productId', as: 'product' })`

## ProductSpec

- `ProductSpec.belongsTo(Product, { foreignKey: 'productId' })`

## Cart

- `cart.belongsTo(User, { foreignKey: 'userId' })`
- `cart.belongsTo(Product, { foreignKey: 'productId' })`

## Order

- `Order.belongsTo(User, { foreignKey: 'userId' })`
- `Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' })`
- `Order.hasMany(PaymentAttempt, { foreignKey: 'orderId', as: 'paymentAttempts' })`

## OrderItem

- `OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' })`
- `OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })`

## PaymentAttempt

- `PaymentAttempt.belongsTo(Order, { foreignKey: 'orderId', as: 'order' })`

## BuildPcCart

- `buildPcCart.belongsTo(User, { foreignKey: 'userId' })`
- `buildPcCart.belongsTo(Product, { foreignKey: 'productId' })`
- `buildPcCart.belongsTo(ComponentType, { foreignKey: 'componentType', targetKey: 'code', as: 'componentTypeInfo' })`

## SpecDefinition

- `SpecDefinition.belongsTo(ComponentType, { foreignKey: 'componentType', targetKey: 'code', as: 'componentTypeInfo' })`

## UserWatchProduct

- `userWatchProduct.belongsTo(User, { foreignKey: 'userId' })`
- `userWatchProduct.belongsTo(Product, { foreignKey: 'productId' })`

## ProductReview

- `productReview.belongsTo(User, { foreignKey: 'userId' })`
- `productReview.belongsTo(Product, { foreignKey: 'productId' })`

## RefreshToken

- `RefreshToken.belongsTo(User, { foreignKey: 'userId' })`
