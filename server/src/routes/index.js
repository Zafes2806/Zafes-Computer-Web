const adminRoutes = require('./admin.routes');
const authRoutes = require('./auth.routes');
const blogsRoutes = require('./blogs.routes');
const buildPcCartRoutes = require('./buildPcCart.routes');
const cartRoutes = require('./cart.routes');
const categoryRoutes = require('./category.routes');
const chatbotRoutes = require('./chatbot.routes');
const componentTypesRoutes = require('./componentTypes.routes');
const contactRoutes = require('./contact.routes');
const ordersRoutes = require('./orders.routes');
const paymentRoutes = require('./payment.routes');
const productRoutes = require('./products.routes');
const reviewRoutes = require('./review.routes');
const specDefinitionsRoutes = require('./specDefinitions.routes');
const uploadRoutes = require('./upload.routes');
const userRoutes = require('./users.routes');
const recentlyViewedRoutes = require('./wishlist.routes');

function routes(app) {
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/chatbot', chatbotRoutes);
    app.use('/api/component-types', componentTypesRoutes);
    app.use('/api/build-pc', buildPcCartRoutes);
    app.use('/api/orders', ordersRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/blogs', blogsRoutes);
    app.use('/api/contacts', contactRoutes);
    app.use('/api/reviews', reviewRoutes);
    app.use('/api/spec-definitions', specDefinitionsRoutes);
    app.use('/api/uploads', uploadRoutes);
    app.use('/api/recently-viewed', recentlyViewedRoutes);
}

module.exports = routes;
