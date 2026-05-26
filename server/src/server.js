require('./utils/nodeCompatibility');
const config = require('./config/env');

const express = require('express');
const http = require('http');
const app = express();
const port = config.app.port;

const { connectDB } = require('./config/index');
const initializeModelAssociations = require('./models/associations');
initializeModelAssociations();
const routes = require('./routes/index');
const { setupSwagger } = require('./docs/swagger');
const { startOrderLifecycleJobs } = require('./services/orderLifecycle.service');

const compression = require('compression');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');

const clientOrigins = config.app.clientOrigins;
const rateLimitWindowMs = config.security.rateLimitWindowMs;
const rateLimitMax = config.security.rateLimitMax;
const rateLimitReadMax = config.security.rateLimitReadMax;

function isPaymentCallbackPath(requestPath) {
    return requestPath === '/api/payments/momo/return'
        || requestPath === '/api/payments/momo/ipn'
        || requestPath === '/api/payments/vnpay/return';
}

const apiReadLimiter = rateLimit({
    windowMs: rateLimitWindowMs,
    max: rateLimitReadMax,
    standardHeaders: true,
    legacyHeaders: false,
    skip(req) {
        const requestPath = req.originalUrl.split('?')[0];
        return req.method !== 'GET'
            || requestPath.startsWith('/api/auth')
            || isPaymentCallbackPath(requestPath);
    },
    message: {
        success: false,
        message: 'Bạn đã xem quá nhiều dữ liệu trong thời gian ngắn. Vui lòng thử lại sau ít phút.',
    },
});

const apiWriteLimiter = rateLimit({
    windowMs: rateLimitWindowMs,
    max: rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    skip(req) {
        const requestPath = req.originalUrl.split('?')[0];
        return req.method === 'GET'
            || requestPath.startsWith('/api/auth')
            || isPaymentCallbackPath(requestPath);
    },
    message: {
        success: false,
        message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.',
    },
});

const authLimiter = rateLimit({
    windowMs: rateLimitWindowMs,
    max: Math.max(rateLimitMax, 100),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau ít phút.',
    },
});

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(cors({ origin: clientOrigins, credentials: true }));
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api', apiReadLimiter);
app.use('/api', apiWriteLimiter);
app.use('/api/auth', authLimiter);

setupSwagger(app);

routes(app);

const uploadsDirectory = path.resolve(__dirname, './uploads');
const clientDistDirectory = path.resolve(__dirname, '../../client/dist');
const clientIndexPath = path.join(clientDistDirectory, 'index.html');

app.use('/uploads', express.static(uploadsDirectory));

if (fs.existsSync(clientDistDirectory)) {
    app.use(express.static(clientDistDirectory));

    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
            return next();
        }

        const acceptsHtml = req.accepts(['html', 'json']) === 'html';
        if (!acceptsHtml) {
            return next();
        }

        return res.sendFile(clientIndexPath);
    });
}

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        let message = err.message || 'Tải tệp lên không hợp lệ';

        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'Kích thước ảnh tối đa là 5MB';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Số lượng tệp tải lên vượt quá giới hạn cho phép';
        }

        return res.status(400).json({
            success: false,
            message,
        });
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Lỗi server',
    });
});

function startHttpServer() {
    return new Promise((resolve, reject) => {
        const server = http.createServer(app);

        server.once('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                reject(new Error(`Cổng ${port} đang được sử dụng. Hãy dừng tiến trình cũ hoặc đổi biến môi trường PORT.`));
                return;
            }

            reject(error);
        });

        server.listen(port, () => resolve(server));
    });
}

async function bootstrap() {
    await connectDB();

    const server = await startHttpServer();
    startOrderLifecycleJobs();
    console.log(`Server listening on port ${port}`);
    return server;
}

bootstrap().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
});
