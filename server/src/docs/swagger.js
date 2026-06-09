const swaggerUi = require('swagger-ui-express');

const { PRODUCT_COMPONENT_TYPES } = require('../constants/componentTypes');
const {
    buildPublicSwaggerSpec,
    swaggerUiSetupOptions,
} = require('./swaggerUi');

const currentApiPaths = new Set([
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/google',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/me',
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/auth/merge-session',
    '/api/users',
    '/api/users/me',
    '/api/users/{userId}',
    '/api/users/{userId}/restore',
    '/api/products',
    '/api/products/{id}',
    '/api/products/{id}/restore',
    '/api/products/groups/by-category',
    '/api/products/search/by-category',
    '/api/products/search',
    '/api/products/promotions/hot-sale',
    '/api/products/by-component-type',
    '/api/products/filter-options',
    '/api/categories',
    '/api/categories/{id}',
    '/api/categories/{id}/restore',
    '/api/categories/component-filters',
    '/api/categories/{id}/products',
    '/api/component-types',
    '/api/component-types/{code}',
    '/api/component-types/{code}/restore',
    '/api/cart/items',
    '/api/cart/items/{cartItemId}',
    '/api/cart/imports/build-pc',
    '/api/build-pc/items',
    '/api/build-pc/items/by-product/{productId}',
    '/api/orders',
    '/api/orders/{orderCode}',
    '/api/orders/{orderCode}/cancellations',
    '/api/orders/{orderCode}/payments',
    '/api/orders/{orderCode}/return-requests',
    '/api/payments/momo/return',
    '/api/payments/momo/ipn',
    '/api/payments/vnpay/return',
    '/api/admin/dashboard',
    '/api/admin/stats/orders',
    '/api/admin/stats/charts',
    '/api/admin/orders',
    '/api/admin/orders/{orderId}',
    '/api/admin/payment-attempts/{attemptId}/refund',
    '/api/reviews',
    '/api/admin/reviews',
    '/api/admin/reviews/{id}',
    '/api/admin/reviews/{id}/restore',
    '/api/blogs',
    '/api/blogs/{id}',
    '/api/blogs/{id}/restore',
    '/api/contacts',
    '/api/contacts/{id}',
    '/api/contacts/{id}/restore',
    '/api/spec-definitions',
    '/api/spec-definitions/{id}',
    '/api/spec-definitions/{id}/restore',
    '/api/uploads/single',
    '/api/uploads/multiple',
    '/api/wishlist',
    '/api/chatbot/replies',
]);

const protectedSecurity = [{ bearerAuth: [] }, { cookieAuth: [] }];

const createSchemaRef = (name) => ({
    $ref: `#/components/schemas/${name}`,
});

const jsonRequestBody = (schemaName, description, required = true) => ({
    required,
    description,
    content: {
        'application/json': {
            schema: createSchemaRef(schemaName),
        },
    },
});

const multipartRequestBody = (schema, description) => ({
    required: true,
    description,
    content: {
        'multipart/form-data': {
            schema,
        },
    },
});

const successResponse = (description = 'Thành công') => ({
    description,
    content: {
        'application/json': {
            schema: createSchemaRef('ApiResponse'),
        },
    },
});

const errorResponse = (description) => ({
    description,
    content: {
        'application/json': {
            schema: createSchemaRef('ErrorResponse'),
        },
    },
});

const resolveSchema = (schema) => (typeof schema === 'string' ? createSchemaRef(schema) : schema);

const arrayOf = (schema) => ({
    type: 'array',
    items: resolveSchema(schema),
});

const successEnvelopeSchema = (metadataSchema, statusCodeExample = 200) => ({
    allOf: [
        createSchemaRef('ApiResponse'),
        {
            type: 'object',
            properties: {
                statusCode: {
                    type: 'integer',
                    example: statusCodeExample,
                },
                metadata: resolveSchema(metadataSchema),
            },
        },
    ],
});

const successResponseWithMetadata = (description, metadataSchema, statusCodeExample = 200) => ({
    description,
    content: {
        'application/json': {
            schema: successEnvelopeSchema(metadataSchema, statusCodeExample),
        },
    },
});

const jsonResponseWithSchema = (description, schema) => ({
    description,
    content: {
        'application/json': {
            schema: resolveSchema(schema),
        },
    },
});

const redirectResponse = (description) => ({
    description,
});

const emptyResponse = (description) => ({
    description,
});

const pathParam = (name, description) => ({
    name,
    in: 'path',
    required: true,
    description,
    schema: {
        type: 'string',
    },
});

const queryParam = (name, description, type = 'string', example) => ({
    name,
    in: 'query',
    required: false,
    description,
    schema: {
        type,
    },
    ...(example !== undefined ? { example } : {}),
});

const operation = ({
    tags,
    summary,
    description,
    security,
    parameters,
    requestBody,
    responses,
}) => ({
    tags,
    summary,
    ...(description ? { description } : {}),
    ...(security ? { security } : {}),
    ...(parameters ? { parameters } : {}),
    ...(requestBody ? { requestBody } : {}),
    responses:
        responses ||
        {
            200: successResponse(),
            400: errorResponse('Dữ liệu không hợp lệ'),
            500: errorResponse('Lỗi server'),
        },
});

const recycleBinParameters = [
    queryParam('includeDeleted', 'Đặt `true` để xem cả dữ liệu đã soft delete', 'boolean', true),
    queryParam('status', 'Lọc trạng thái: `active`, `inactive`, `deleted` hoặc `all`', 'string', 'active'),
];

const productListParameters = [
    queryParam('page', 'Trang hiện tại', 'integer', 1),
    queryParam('limit', 'Số lượng mỗi trang', 'integer', 20),
    ...recycleBinParameters,
];

const dateRangeParameters = [
    queryParam('startDate', 'Ngày bắt đầu, ví dụ `2026-03-01`', 'string', '2026-03-01'),
    queryParam('endDate', 'Ngày kết thúc, ví dụ `2026-03-21`', 'string', '2026-03-21'),
];

const searchParameters = [
    queryParam('search', 'Từ khóa tìm kiếm theo tên sản phẩm', 'string', 'RTX'),
    queryParam('minPrice', 'Giá tối thiểu', 'number', 1000000),
    queryParam('maxPrice', 'Giá tối đa', 'number', 50000000),
    queryParam('sort', 'Kiểu sắp xếp: `newest`, `price-asc`, `price-desc`, `discount`', 'string', 'newest'),
    queryParam('productIds', 'Danh sách id sản phẩm, cách nhau bởi dấu phẩy', 'string'),
];

const paths = {};

const swaggerSpec = {
    openapi: '3.0.3',
    info: {
        title: 'Zafes Computer API',
        version: '1.0.0',
        description:
            'Swagger dùng để test toàn bộ API của server Zafes Computer. Với API cần đăng nhập, bạn có thể dùng cookie sau khi login hoặc copy `metadata.token` từ response login rồi bấm `Authorize` theo chuẩn Bearer Token.',
    },
    servers: [
        {
            url: '/',
            description: 'Current server',
        },
    ],
    tags: [
        { name: 'Auth', description: 'Xác thực và tài khoản người dùng' },
        { name: 'Users', description: 'Quản lý người dùng và dashboard admin' },
        { name: 'Products', description: 'Sản phẩm và bộ lọc' },
        { name: 'Categories', description: 'Danh mục' },
        { name: 'Component Types', description: 'Loại linh kiện' },
        { name: 'Cart', description: 'Giỏ hàng và build PC' },
        { name: 'Orders', description: 'Thanh toán và đơn hàng' },
        { name: 'Reviews', description: 'Đánh giá sản phẩm' },
        { name: 'Blogs', description: 'Bài viết' },
        { name: 'Contacts', description: 'Liên hệ tư vấn' },
        { name: 'Spec Definitions', description: 'Định nghĩa thuộc tính linh kiện' },
        { name: 'Uploads', description: 'Upload ảnh' },
        { name: 'Chatbot', description: 'Chatbot' },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Dán access token nhận từ API login/register/google login',
            },
            cookieAuth: {
                type: 'apiKey',
                in: 'cookie',
                name: 'token',
                description: 'Cookie đăng nhập hiện tại',
            },
        },
        schemas: {
            ApiResponse: {
                type: 'object',
                properties: {
                    statusCode: {
                        type: 'integer',
                        example: 200,
                    },
                    message: {
                        type: 'string',
                        example: 'Success',
                    },
                    metadata: {
                        nullable: true,
                    },
                },
            },
            PlainMessageResponse: {
                type: 'object',
                properties: {
                    message: {
                        type: 'string',
                        example: 'Thành công',
                    },
                },
            },
            ErrorResponse: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        example: false,
                    },
                    message: {
                        type: 'string',
                        example: 'Dữ liệu không hợp lệ',
                    },
                },
            },
            RegisterRequest: {
                type: 'object',
                required: ['fullName', 'phone', 'address', 'email', 'password'],
                properties: {
                    fullName: { type: 'string', example: 'Nguyen Van A' },
                    phone: { type: 'string', example: '0123456789' },
                    address: { type: 'string', example: '123 Nguyen Trai, Ha Noi' },
                    email: { type: 'string', format: 'email', example: 'user@example.com' },
                    password: { type: 'string', example: '123456' },
                },
            },
            CreateUserRequest: {
                type: 'object',
                required: ['fullName', 'email', 'password', 'role'],
                properties: {
                    fullName: { type: 'string', example: 'Nguyen Van Admin' },
                    email: { type: 'string', format: 'email', example: 'admin@example.com' },
                    password: { type: 'string', example: '123456' },
                    role: {
                        oneOf: [{ type: 'boolean' }, { type: 'string', enum: ['true', 'false'] }],
                        example: true,
                    },
                    phone: { type: 'string', example: '0987654321' },
                    address: { type: 'string', example: '456 Le Loi, Da Nang' },
                },
            },
            LoginRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'user@example.com' },
                    password: { type: 'string', example: '123456' },
                },
            },
            GoogleLoginRequest: {
                type: 'object',
                required: ['credential'],
                properties: {
                    credential: {
                        type: 'string',
                        description: 'Google ID token nhận từ frontend',
                    },
                },
            },
            ForgotPasswordRequest: {
                type: 'object',
                required: ['email'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'user@example.com' },
                },
            },
            ResetPasswordRequest: {
                type: 'object',
                required: ['otp', 'newPassword'],
                properties: {
                    otp: { type: 'string', example: '123456' },
                    newPassword: { type: 'string', example: '654321' },
                },
            },
            MergeSessionRequest: {
                type: 'object',
                properties: {
                    cartItems: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                productId: { type: 'string', format: 'uuid' },
                                quantity: { type: 'integer', minimum: 1, example: 1 },
                            },
                        },
                    },
                    buildPcItems: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                productId: { type: 'string', format: 'uuid' },
                                quantity: { type: 'integer', minimum: 1, example: 1 },
                            },
                        },
                    },
                },
            },
            UpdateUserProfileRequest: {
                type: 'object',
                properties: {
                    fullName: { type: 'string', example: 'Nguyen Van B' },
                    address: { type: 'string', example: '456 Le Loi, Da Nang' },
                    phone: { type: 'string', example: '0987654321' },
                },
            },
            UpdateUserRequest: {
                type: 'object',
                minProperties: 1,
                properties: {
                    fullName: { type: 'string', example: 'Nguyen Van B' },
                    address: { type: 'string', example: '456 Le Loi, Da Nang', nullable: true },
                    phone: { type: 'string', example: '0987654321', nullable: true },
                    password: {
                        type: 'string',
                        minLength: 6,
                        example: 'temp123456',
                        description: 'Mật khẩu mới; bỏ trống nếu không đổi',
                    },
                    role: {
                        oneOf: [{ type: 'boolean' }, { type: 'string', enum: ['true', 'false'] }],
                        example: true,
                    },
                    status: {
                        type: 'string',
                        enum: ['active', 'locked'],
                        example: 'locked',
                    },
                },
            },
            ProductSpecInput: {
                type: 'object',
                properties: {
                    specKey: { type: 'string', example: 'socket' },
                    specValue: { type: 'string', example: 'AM5' },
                },
            },
            PcConfiguration: {
                type: 'object',
                properties: {
                    cpu: { type: 'string', nullable: true },
                    motherboard: { type: 'string', nullable: true },
                    ram: { type: 'string', nullable: true },
                    storage: { type: 'string', nullable: true },
                    gpu: { type: 'string', nullable: true },
                    power: { type: 'string', nullable: true },
                    computerCase: { type: 'string', nullable: true },
                    cooler: { type: 'string', nullable: true },
                },
            },
            ProductCreateRequest: {
                type: 'object',
                required: ['name', 'price', 'description', 'images', 'category', 'stock', 'componentType'],
                properties: {
                    name: { type: 'string', example: 'RTX 4060 Ti' },
                    price: { type: 'integer', example: 12990000 },
                    description: { type: 'string', example: 'Card do hoa cho gaming' },
                    images: { type: 'string', example: 'https://example.com/product.jpg' },
                    category: { type: 'string', format: 'uuid' },
                    stock: { type: 'integer', example: 25 },
                    discount: { type: 'integer', example: 10 },
                    status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
                    componentType: {
                        type: 'string',
                        enum: PRODUCT_COMPONENT_TYPES,
                        example: 'vga',
                    },
                    pcConfiguration: {
                        allOf: [createSchemaRef('PcConfiguration')],
                        nullable: true,
                        description: 'Bắt buộc khi `componentType = pc`',
                    },
                    specs: {
                        type: 'array',
                        items: createSchemaRef('ProductSpecInput'),
                    },
                },
            },
            ProductUpdateRequest: {
                allOf: [createSchemaRef('ProductCreateRequest')],
            },
            ProductStatusRequest: {
                type: 'object',
                required: ['status'],
                properties: {
                    status: {
                        type: 'string',
                        enum: ['active', 'inactive'],
                    },
                },
            },
            CategoryCreateRequest: {
                type: 'object',
                required: ['name', 'image'],
                properties: {
                    name: { type: 'string', example: 'Card đồ họa' },
                    image: { type: 'string', example: 'https://example.com/category.jpg' },
                },
            },
            CategoryUpdateRequest: {
                allOf: [createSchemaRef('CategoryCreateRequest')],
            },
            CategoryStatusRequest: {
                type: 'object',
                required: ['status'],
                properties: {
                    status: { type: 'string', enum: ['active', 'inactive'], example: 'inactive' },
                },
            },
            ComponentTypeCreateRequest: {
                type: 'object',
                required: ['code', 'name'],
                properties: {
                    code: { type: 'string', example: 'vga' },
                    name: { type: 'string', example: 'Card đồ họa' },
                    isBuildPcAllowed: { type: 'boolean', example: true },
                    status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
                },
            },
            ComponentTypeUpdateRequest: {
                type: 'object',
                properties: {
                    name: { type: 'string', example: 'Card đồ họa' },
                    isBuildPcAllowed: { type: 'boolean', example: true },
                    status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
                },
            },
            ComponentTypeStatusRequest: {
                type: 'object',
                required: ['status'],
                properties: {
                    status: { type: 'string', enum: ['active', 'inactive'], example: 'inactive' },
                },
            },
            CartItemRequest: {
                type: 'object',
                required: ['productId', 'quantity'],
                properties: {
                    productId: { type: 'string', format: 'uuid' },
                    quantity: { type: 'integer', example: 1 },
                },
            },
            CartItemQuantityRequest: {
                type: 'object',
                required: ['quantity'],
                properties: {
                    quantity: { type: 'integer', minimum: 1, example: 1 },
                },
            },
            ProductWatchRequest: {
                type: 'object',
                required: ['productId'],
                properties: {
                    productId: { type: 'string', format: 'uuid' },
                },
            },
            CheckoutRequest: {
                type: 'object',
                required: ['fullName', 'phone', 'address', 'email', 'paymentMethod'],
                properties: {
                    fullName: { type: 'string', example: 'Nguyen Van A' },
                    phone: { type: 'string', example: '0123456789' },
                    address: { type: 'string', example: '123 Nguyen Trai, Ha Noi' },
                    email: { type: 'string', format: 'email', example: 'user@example.com' },
                    paymentMethod: { type: 'string', enum: ['COD', 'MOMO', 'VNPAY'], example: 'COD' },
                    items: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                productId: { type: 'string', format: 'uuid' },
                                quantity: { type: 'integer', minimum: 1, example: 1 },
                            },
                        },
                    },
                },
            },
            CheckoutMetadata: {
                type: 'object',
                required: ['orderCode', 'paymentMethod'],
                properties: {
                    orderCode: { type: 'string', example: 'PAY1742547600000123' },
                    paymentMethod: { type: 'string', enum: ['COD', 'MOMO', 'VNPAY'], example: 'MOMO' },
                    provider: { type: 'string', enum: ['MOMO', 'VNPAY'], nullable: true },
                    paymentUrl: {
                        type: 'string',
                        nullable: true,
                        example: 'https://test-payment.momo.vn/v2/gateway/pay/...',
                    },
                },
            },
            ReturnOrderRequest: {
                type: 'object',
                required: ['reason'],
                properties: {
                    reason: {
                        type: 'string',
                        example: 'Sản phẩm bị lỗi và tôi muốn trả hàng/hoàn tiền',
                    },
                },
            },
            UpdateOrderStatusRequest: {
                type: 'object',
                required: ['status'],
                properties: {
                    status: {
                        type: 'string',
                        enum: [
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
                            'refunded',
                        ],
                        example: 'return_in_progress',
                    },
                },
            },
            BlogCreateRequest: {
                type: 'object',
                required: ['title', 'content', 'image'],
                properties: {
                    title: { type: 'string', example: 'Top 5 VGA đáng mua' },
                    content: { type: 'string', example: 'Nội dung bài viết...' },
                    image: { type: 'string', example: 'https://example.com/blog.jpg' },
                },
            },
            BlogUpdateRequest: {
                allOf: [createSchemaRef('BlogCreateRequest')],
            },
            BlogStatusRequest: {
                type: 'object',
                required: ['status'],
                properties: {
                    status: { type: 'string', enum: ['draft', 'published', 'archived'], example: 'published' },
                },
            },
            ContactCreateRequest: {
                type: 'object',
                required: ['fullName', 'phone', 'purchaseIntent', 'purpose', 'budget', 'deliveryOption'],
                properties: {
                    fullName: { type: 'string', example: 'Nguyen Van A' },
                    phone: { type: 'string', example: '0123456789' },
                    purchaseIntent: { type: 'string', example: 'Mua PC gaming' },
                    purpose: { type: 'string', example: 'Choi game va hoc tap' },
                    budget: { type: 'string', example: '20-30 trieu' },
                    deliveryOption: { type: 'string', example: 'Giao tan noi' },
                    option1: { type: 'string', description: 'Alias cũ của purchaseIntent' },
                    option2: { type: 'string', description: 'Alias cũ của purpose' },
                    option3: { type: 'string', description: 'Alias cũ của budget' },
                    option4: { type: 'string', description: 'Alias cũ của deliveryOption' },
                },
            },
            ContactUpdateRequest: {
                type: 'object',
                minProperties: 1,
                properties: {
                    status: {
                        type: 'string',
                        enum: ['new', 'contacted', 'resolved', 'archived'],
                        example: 'contacted',
                    },
                    adminNote: {
                        type: 'string',
                        nullable: true,
                        maxLength: 1000,
                        example: 'Đã gọi tư vấn cấu hình.',
                    },
                },
            },
            ProductReviewCreateRequest: {
                type: 'object',
                required: ['productId', 'rating', 'content'],
                properties: {
                    productId: { type: 'string', format: 'uuid' },
                    rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                    content: { type: 'string', example: 'San pham rat tot' },
                },
            },
            ReviewStatusUpdateRequest: {
                type: 'object',
                required: ['status'],
                properties: {
                    status: {
                        type: 'string',
                        enum: ['pending', 'approved', 'hidden'],
                        example: 'approved',
                    },
                },
            },
            SpecDefinitionCreateRequest: {
                type: 'object',
                required: ['componentType', 'specKey', 'label'],
                properties: {
                    componentType: {
                        type: 'string',
                        enum: PRODUCT_COMPONENT_TYPES.filter((item) => item !== 'pc'),
                        example: 'cpu',
                    },
                    specKey: { type: 'string', example: 'socket' },
                    label: { type: 'string', example: 'Socket' },
                    options: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['AM4', 'AM5'],
                    },
                },
            },
            SpecDefinitionUpdateRequest: {
                type: 'object',
                properties: {
                    componentType: {
                        type: 'string',
                        enum: PRODUCT_COMPONENT_TYPES.filter((item) => item !== 'pc'),
                        example: 'cpu',
                    },
                    specKey: { type: 'string', example: 'socket' },
                    label: { type: 'string', example: 'Socket CPU' },
                    options: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['AM4', 'AM5', 'LGA1700'],
                    },
                },
            },
            SpecDefinitionStatusRequest: {
                type: 'object',
                required: ['status'],
                properties: {
                    status: { type: 'string', enum: ['active', 'inactive'], example: 'inactive' },
                },
            },
            ChatRequest: {
                type: 'object',
                required: ['question'],
                properties: {
                    question: { type: 'string', example: 'Tu van giup toi mot bo PC 20 trieu' },
                },
            },
        },
    },
    paths,
};

const schemas = swaggerSpec.components.schemas;

Object.assign(schemas, {
    AuthTokens: {
        type: 'object',
        properties: {
            token: { type: 'string' },
            refreshToken: { type: 'string' },
        },
    },
    AuthEncryptedMetadata: {
        type: 'string',
        description: 'Chuỗi AES chứa thông tin user',
    },
    User: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            fullName: { type: 'string' },
            phone: { type: 'string', nullable: true },
            address: { type: 'string', nullable: true },
            email: { type: 'string', format: 'email' },
            isAdmin: { type: 'boolean' },
            authProvider: { type: 'string', enum: ['google', 'email'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
        },
    },
    Category: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            image: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
        },
    },
    ComponentType: {
        type: 'object',
        properties: {
            code: { type: 'string', example: 'vga' },
            name: { type: 'string', example: 'Card đồ họa' },
            isBuildPcAllowed: { type: 'boolean', example: true },
            status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
        },
    },
    ProductSpec: {
        type: 'object',
        properties: {
            specKey: { type: 'string' },
            specValue: { type: 'string' },
        },
    },
    Product: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            price: { type: 'number' },
            description: { type: 'string' },
            discount: { type: 'integer' },
            images: { type: 'string' },
            categoryId: { type: 'string', format: 'uuid' },
            stock: { type: 'integer' },
            status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
            pcConfiguration: {
                allOf: [createSchemaRef('PcConfiguration')],
                nullable: true,
            },
            componentType: {
                type: 'string',
                enum: PRODUCT_COMPONENT_TYPES,
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
        },
    },
    ProductWithSpecs: {
        allOf: [
            createSchemaRef('Product'),
            {
                type: 'object',
                properties: {
                    specs: arrayOf('ProductSpec'),
                },
            },
        ],
    },
    ProductListMetadata: {
        type: 'object',
        properties: {
            products: arrayOf('Product'),
            pagination: {
                type: 'object',
                properties: {
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    totalPages: { type: 'integer' },
                },
            },
        },
    },
    ProductGroupedByCategory: {
        type: 'object',
        properties: {
            category: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                },
            },
            products: arrayOf('Product'),
        },
    },
    ProductReview: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            productId: { type: 'string', format: 'uuid' },
            rating: { type: 'integer' },
            content: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'approved', 'hidden'], example: 'pending' },
            reviewedAt: { type: 'string', format: 'date-time', nullable: true },
            reviewedByUserId: { type: 'string', format: 'uuid', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
        },
    },
    ProductReviewWithUser: {
        allOf: [
            createSchemaRef('ProductReview'),
            {
                type: 'object',
                properties: {
                    user: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            name: { type: 'string' },
                        },
                    },
                },
            },
        ],
    },
    ProductReviewAdminItem: {
        allOf: [
            createSchemaRef('ProductReview'),
            {
                type: 'object',
                properties: {
                    availableStatuses: {
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: ['pending', 'approved', 'hidden'],
                        },
                    },
                    user: {
                        type: 'object',
                        nullable: true,
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            name: { type: 'string' },
                            email: { type: 'string', format: 'email' },
                            deletedAt: { type: 'string', format: 'date-time', nullable: true },
                        },
                    },
                    product: {
                        type: 'object',
                        nullable: true,
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            name: { type: 'string' },
                            images: { type: 'string', nullable: true },
                            deletedAt: { type: 'string', format: 'date-time', nullable: true },
                        },
                    },
                },
            },
        ],
    },
    ProductDetailMetadata: {
        type: 'object',
        properties: {
            product: createSchemaRef('ProductWithSpecs'),
            reviews: arrayOf('ProductReviewWithUser'),
        },
    },
    CartItemDetailed: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            quantity: { type: 'integer' },
            totalPrice: { type: 'integer' },
            product: {
                allOf: [
                    createSchemaRef('Product'),
                    {
                        type: 'object',
                        properties: {
                            isComponent: { type: 'boolean' },
                        },
                    },
                ],
            },
        },
    },
    BuildPcCartItemDetailed: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            quantity: { type: 'integer' },
            totalPrice: { type: 'integer' },
            componentType: { type: 'string' },
            images: { type: 'string' },
            product: createSchemaRef('Product'),
        },
    },
    OrderUserProduct: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            quantity: { type: 'integer' },
            images: { type: 'string' },
            product: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    price: { type: 'integer' },
                    images: { type: 'string' },
                },
            },
        },
    },
    UserOrder: {
        type: 'object',
        properties: {
            orderCode: { type: 'string' },
            orderDate: { type: 'string', format: 'date-time' },
            totalAmount: { type: 'integer' },
            status: {
                type: 'string',
                enum: ['pending_payment', 'pending', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled', 'return_requested', 'return_in_progress', 'returned', 'refunded'],
            },
            canCancel: { type: 'boolean' },
            canRequestReturn: { type: 'boolean' },
            returnReason: { type: 'string', nullable: true },
            deliveredAt: { type: 'string', format: 'date-time', nullable: true },
            completedAt: { type: 'string', format: 'date-time', nullable: true },
            cancelledAt: { type: 'string', format: 'date-time', nullable: true },
            returnRequestedAt: { type: 'string', format: 'date-time', nullable: true },
            returnedAt: { type: 'string', format: 'date-time', nullable: true },
            refundedAt: { type: 'string', format: 'date-time', nullable: true },
            paymentMethod: { type: 'string' },
            products: arrayOf('OrderUserProduct'),
        },
    },
    OrderDetailProduct: {
        type: 'object',
        properties: {
            productId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            price: { type: 'integer' },
            quantity: { type: 'integer' },
            images: { type: 'string' },
            lineTotal: { type: 'integer' },
        },
    },
    OrderDetailMetadata: {
        type: 'object',
        properties: {
            fullName: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            paymentMethod: { type: 'string' },
            totalPrice: { type: 'integer' },
            status: {
                type: 'string',
                enum: ['pending_payment', 'pending', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled', 'return_requested', 'return_in_progress', 'returned', 'refunded'],
            },
            returnReason: { type: 'string', nullable: true },
            deliveredAt: { type: 'string', format: 'date-time', nullable: true },
            completedAt: { type: 'string', format: 'date-time', nullable: true },
            cancelledAt: { type: 'string', format: 'date-time', nullable: true },
            returnRequestedAt: { type: 'string', format: 'date-time', nullable: true },
            returnedAt: { type: 'string', format: 'date-time', nullable: true },
            refundedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            products: arrayOf('OrderDetailProduct'),
        },
    },
    AdminOrderProduct: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            price: { type: 'integer' },
            image: { type: 'string' },
            color: { type: 'string' },
            size: { type: 'string' },
            quantity: { type: 'integer' },
        },
    },
    AdminOrder: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            orderCode: { type: 'string' },
            userId: { type: 'string', format: 'uuid' },
            fullName: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            totalPrice: { type: 'integer' },
            status: {
                type: 'string',
                enum: ['pending_payment', 'pending', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled', 'return_requested', 'return_in_progress', 'returned', 'refunded'],
            },
            availableStatuses: {
                type: 'array',
                items: {
                    type: 'string',
                    enum: ['pending_payment', 'pending', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled', 'return_requested', 'return_in_progress', 'returned', 'refunded'],
                },
            },
            returnReason: { type: 'string', nullable: true },
            deliveredAt: { type: 'string', format: 'date-time', nullable: true },
            completedAt: { type: 'string', format: 'date-time', nullable: true },
            cancelledAt: { type: 'string', format: 'date-time', nullable: true },
            returnRequestedAt: { type: 'string', format: 'date-time', nullable: true },
            returnedAt: { type: 'string', format: 'date-time', nullable: true },
            refundedAt: { type: 'string', format: 'date-time', nullable: true },
            paymentMethod: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            products: arrayOf('AdminOrderProduct'),
        },
    },
    DashboardStatistics: {
        type: 'object',
        properties: {
            totalUsers: { type: 'integer' },
            totalProducts: { type: 'integer' },
            totalRevenue: { type: 'integer' },
            totalWatching: { type: 'integer' },
        },
    },
    DashboardTopProduct: {
        allOf: [
            createSchemaRef('Product'),
            {
                type: 'object',
                properties: {
                    totalSold: { type: 'integer' },
                    quantity: { type: 'integer' },
                },
            },
        ],
    },
    DashboardOrderSummary: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            orderCode: { type: 'string' },
            fullName: { type: 'string' },
            totalPrice: { type: 'integer' },
            status: { type: 'string' },
            paymentMethod: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
        },
    },
    DashboardMetadata: {
        type: 'object',
        properties: {
            statistics: createSchemaRef('DashboardStatistics'),
            recentOrders: arrayOf('DashboardOrderSummary'),
            topProducts: arrayOf('DashboardTopProduct'),
        },
    },
    OrderStatPoint: {
        type: 'object',
        properties: {
            date: { type: 'string', example: '2026-03-21' },
            count: { type: 'integer' },
        },
    },
    PieChartItem: {
        type: 'object',
        properties: {
            type: { type: 'string' },
            value: { type: 'integer' },
        },
    },
    OrderPieChartItem: {
        type: 'object',
        properties: {
            status: { type: 'string' },
            value: { type: 'integer' },
        },
    },
    PieChartMetadata: {
        type: 'object',
        properties: {
            categoryStats: arrayOf('PieChartItem'),
            orderStats: arrayOf('OrderPieChartItem'),
        },
    },
    Blog: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            content: { type: 'string' },
            image: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'published', 'archived'], example: 'published' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
        },
    },
    Contact: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            fullName: { type: 'string' },
            phone: { type: 'string' },
            purchaseIntent: { type: 'string' },
            purpose: { type: 'string' },
            budget: { type: 'string' },
            deliveryOption: { type: 'string' },
            status: { type: 'string', enum: ['new', 'contacted', 'resolved', 'archived'], example: 'new' },
            adminNote: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
        },
    },
    SpecDefinition: {
        type: 'object',
        properties: {
            id: { type: 'integer' },
            componentType: { type: 'string' },
            specKey: { type: 'string' },
            label: { type: 'string' },
            options: {
                type: 'array',
                items: { type: 'string' },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
        },
    },
    UploadSingleMetadata: {
        type: 'object',
        properties: {
            message: { type: 'string' },
            image: { type: 'string' },
        },
    },
    UploadMultipleMetadata: {
        type: 'object',
        properties: {
            message: { type: 'string' },
            images: {
                type: 'array',
                items: { type: 'string' },
            },
        },
    },
    AdminAccessMetadata: {
        type: 'object',
        properties: {
            message: { type: 'boolean', example: true },
        },
    },
});

Object.assign(paths, {
    '/api/auth/register': {
        post: operation({
            tags: ['Auth'],
            summary: 'Đăng ký tài khoản',
            requestBody: jsonRequestBody('RegisterRequest', 'Thông tin đăng ký'),
            responses: {
                200: successResponseWithMetadata('Đăng ký thành công và trả token', 'AuthTokens'),
                400: errorResponse('Thông tin đăng ký không hợp lệ'),
            },
        }),
    },
    '/api/auth/login': {
        post: operation({
            tags: ['Auth'],
            summary: 'Đăng nhập',
            requestBody: jsonRequestBody('LoginRequest', 'Thông tin đăng nhập'),
            responses: {
                200: successResponseWithMetadata('Đăng nhập thành công', 'AuthTokens'),
                400: errorResponse('Sai email hoặc mật khẩu'),
            },
        }),
    },
    '/api/auth/me': {
        get: operation({
            tags: ['Auth'],
            summary: 'Lấy thông tin xác thực hiện tại',
            security: protectedSecurity,
            responses: {
                200: successResponseWithMetadata('Lấy thông tin user hiện tại', 'AuthEncryptedMetadata'),
                401: errorResponse('Chưa đăng nhập'),
            },
        }),
    },
    '/api/auth/refresh': {
        post: operation({
            tags: ['Auth'],
            summary: 'Làm mới access token',
            description: 'Cần cookie `refreshToken` hợp lệ.',
            responses: {
                200: successResponseWithMetadata(
                    'Refresh token thành công',
                    {
                        type: 'object',
                        properties: {
                            token: { type: 'string' },
                        },
                    },
                ),
                401: errorResponse('Refresh token không hợp lệ'),
            },
        }),
    },
    '/api/auth/logout': {
        post: operation({
            tags: ['Auth'],
            summary: 'Đăng xuất',
            security: protectedSecurity,
            responses: {
                200: successResponse('Đăng xuất thành công'),
                401: errorResponse('Chưa đăng nhập'),
            },
        }),
    },
    '/api/auth/google': {
        post: operation({
            tags: ['Auth'],
            summary: 'Đăng nhập bằng Google',
            requestBody: jsonRequestBody('GoogleLoginRequest', 'Google credential token'),
            responses: {
                200: successResponseWithMetadata('Đăng nhập Google thành công', 'AuthTokens'),
                400: errorResponse('Credential không hợp lệ'),
            },
        }),
    },
    '/api/auth/forgot-password': {
        post: operation({
            tags: ['Auth'],
            summary: 'Gửi OTP quên mật khẩu',
            requestBody: jsonRequestBody('ForgotPasswordRequest', 'Email lấy lại mật khẩu'),
            responses: {
                200: jsonResponseWithSchema('Gửi OTP thành công', 'PlainMessageResponse'),
                400: errorResponse('Email không hợp lệ hoặc không tồn tại'),
            },
        }),
    },
    '/api/auth/reset-password': {
        post: operation({
            tags: ['Auth'],
            summary: 'Đặt lại mật khẩu bằng OTP',
            description: 'Cần có cookie `tokenResetPassword` từ bước quên mật khẩu.',
            requestBody: jsonRequestBody('ResetPasswordRequest', 'OTP và mật khẩu mới'),
            responses: {
                200: jsonResponseWithSchema('Đặt lại mật khẩu thành công', 'PlainMessageResponse'),
                400: errorResponse('OTP không hợp lệ'),
            },
        }),
    },
    '/api/auth/merge-session': {
        post: operation({
            tags: ['Auth'],
            summary: 'Gộp giỏ hàng guest vào tài khoản sau đăng nhập',
            security: protectedSecurity,
            requestBody: jsonRequestBody('MergeSessionRequest', 'Danh sách item local cần gộp vào tài khoản'),
            responses: {
                200: successResponse('Gộp session thành công'),
                400: errorResponse('Dữ liệu session không hợp lệ'),
                401: errorResponse('Chưa đăng nhập'),
            },
        }),
    },
    '/api/users/me': {
        put: operation({
            tags: ['Users'],
            summary: 'Cập nhật thông tin người dùng hiện tại',
            security: protectedSecurity,
            requestBody: jsonRequestBody('UpdateUserProfileRequest', 'Thông tin cần cập nhật'),
            responses: {
                200: successResponseWithMetadata('Cập nhật thông tin thành công', { type: 'object' }),
                401: errorResponse('Chưa đăng nhập'),
            },
        }),
    },
    '/api/admin/dashboard': {
        get: operation({
            tags: ['Users'],
            summary: 'Lấy thống kê dashboard admin',
            security: protectedSecurity,
            parameters: dateRangeParameters,
            responses: {
                200: successResponseWithMetadata('Lấy dashboard thành công', 'DashboardMetadata'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
    },
    '/api/admin/stats/orders': {
        get: operation({
            tags: ['Users'],
            summary: 'Lấy thống kê đơn hàng theo ngày',
            security: protectedSecurity,
            parameters: dateRangeParameters,
            responses: {
                200: successResponseWithMetadata('Lấy thống kê đơn hàng thành công', arrayOf('OrderStatPoint')),
                401: errorResponse('Không có quyền admin'),
            },
        }),
    },
    '/api/users': {
        post: operation({
            tags: ['Users'],
            summary: 'Admin tạo người dùng',
            security: protectedSecurity,
            requestBody: jsonRequestBody('CreateUserRequest', 'Thông tin người dùng mới'),
            responses: {
                200: successResponseWithMetadata('Tạo người dùng thành công', 'User'),
                400: errorResponse('Dữ liệu người dùng không hợp lệ'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
        get: operation({
            tags: ['Users'],
            summary: 'Lấy danh sách người dùng',
            security: protectedSecurity,
            parameters: recycleBinParameters,
            responses: {
                200: successResponseWithMetadata('Lấy danh sách người dùng thành công', arrayOf('User')),
                401: errorResponse('Không có quyền admin'),
            },
        }),
    },
    '/api/users/{userId}': {
        patch: operation({
            tags: ['Users'],
            summary: 'Admin cập nhật thông tin, quyền, trạng thái hoặc đặt lại mật khẩu của user',
            security: protectedSecurity,
            parameters: [pathParam('userId', 'ID user')],
            requestBody: jsonRequestBody('UpdateUserRequest', 'Body chứa ít nhất một trường cần cập nhật'),
            responses: {
                200: successResponse('Cập nhật user thành công'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
        delete: operation({
            tags: ['Users'],
            summary: 'Xóa mềm người dùng hoặc xóa vĩnh viễn với `force=true`',
            security: protectedSecurity,
            parameters: [
                pathParam('userId', 'ID user'),
                queryParam('force', 'Đặt `true` để xóa vĩnh viễn người dùng trong thùng rác', 'boolean', false),
            ],
            responses: {
                200: successResponse('Xóa người dùng thành công'),
                401: errorResponse('Không có quyền admin'),
                404: errorResponse('Không tìm thấy người dùng'),
            },
        }),
    },
    '/api/users/{userId}/restore': {
        patch: operation({
            tags: ['Users'],
            summary: 'Khôi phục người dùng',
            security: protectedSecurity,
            parameters: [pathParam('userId', 'ID user')],
            responses: {
                200: successResponse('Khôi phục người dùng thành công'),
                401: errorResponse('Không có quyền admin'),
                404: errorResponse('Không tìm thấy người dùng'),
            },
        }),
    },
    '/api/admin/stats/charts': {
        get: operation({
            tags: ['Users'],
            summary: 'Biểu đồ tròn thống kê',
            security: protectedSecurity,
            responses: {
                200: successResponseWithMetadata('Lấy dữ liệu biểu đồ thành công', 'PieChartMetadata'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
    },
});

Object.assign(paths, {
    '/api/products': {
        ...(paths['/api/products'] || {}),
        post: operation({
            tags: ['Products'],
            summary: 'Tạo sản phẩm',
            security: protectedSecurity,
            requestBody: jsonRequestBody('ProductCreateRequest', 'Dữ liệu tạo sản phẩm'),
            responses: {
                201: successResponseWithMetadata('Tạo sản phẩm thành công', 'Product', 201),
                400: errorResponse('Dữ liệu sản phẩm không hợp lệ'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
        get: operation({
            tags: ['Products'],
            summary: 'Lấy danh sách sản phẩm',
            parameters: productListParameters,
            responses: {
                200: successResponseWithMetadata('Lấy danh sách sản phẩm thành công', 'ProductListMetadata'),
                400: errorResponse('Query không hợp lệ'),
            },
        }),
    },
    '/api/products/{id}': {
        ...(paths['/api/products/{id}'] || {}),
        put: operation({
            tags: ['Products'],
            summary: 'Cập nhật sản phẩm',
            security: protectedSecurity,
            parameters: [pathParam('id', 'ID sản phẩm')],
            requestBody: jsonRequestBody('ProductUpdateRequest', 'Dữ liệu cập nhật sản phẩm'),
            responses: {
                200: successResponseWithMetadata('Cập nhật sản phẩm thành công', 'Product'),
                400: errorResponse('Dữ liệu sản phẩm không hợp lệ'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
        patch: operation({
            tags: ['Products'],
            summary: 'Cập nhật trạng thái kinh doanh sản phẩm',
            security: protectedSecurity,
            parameters: [pathParam('id', 'ID sản phẩm')],
            requestBody: jsonRequestBody('ProductStatusRequest', 'Body chứa `status`: `active` hoặc `inactive`'),
            responses: {
                200: successResponseWithMetadata('Cập nhật trạng thái sản phẩm thành công', 'Product'),
                400: errorResponse('Dữ liệu trạng thái không hợp lệ'),
                401: errorResponse('Không có quyền admin'),
                404: errorResponse('Không tìm thấy sản phẩm'),
            },
        }),
        delete: operation({
            tags: ['Products'],
            summary: 'Xóa mềm sản phẩm hoặc xóa vĩnh viễn với `force=true`',
            security: protectedSecurity,
            parameters: [
                pathParam('id', 'ID sản phẩm'),
                queryParam('force', 'Đặt `true` để xóa vĩnh viễn sản phẩm trong thùng rác', 'boolean', false),
            ],
            responses: {
                200: successResponse('Xóa sản phẩm thành công'),
                401: errorResponse('Không có quyền admin'),
                404: errorResponse('Không tìm thấy sản phẩm'),
            },
        }),
        get: operation({
            tags: ['Products'],
            summary: 'Lấy chi tiết sản phẩm',
            parameters: [pathParam('id', 'ID sản phẩm')],
            responses: {
                200: successResponseWithMetadata('Lấy chi tiết sản phẩm thành công', 'ProductDetailMetadata'),
                404: errorResponse('Không tìm thấy sản phẩm'),
            },
        }),
    },
    '/api/products/{id}/restore': {
        patch: operation({
            tags: ['Products'],
            summary: 'Khôi phục sản phẩm',
            security: protectedSecurity,
            parameters: [pathParam('id', 'ID sản phẩm')],
            responses: {
                200: successResponse('Khôi phục sản phẩm thành công'),
                401: errorResponse('Không có quyền admin'),
                404: errorResponse('Không tìm thấy sản phẩm'),
            },
        }),
    },
    '/api/products/groups/by-category': {
        get: operation({
            tags: ['Products'],
            summary: 'Lấy sản phẩm nhóm theo danh mục',
            responses: {
                200: successResponseWithMetadata('Lấy nhóm sản phẩm thành công', arrayOf('ProductGroupedByCategory')),
            },
        }),
    },
    '/api/products/by-component-type': {
        get: operation({
            tags: ['Products'],
            summary: 'Lấy sản phẩm theo loại linh kiện',
            parameters: [queryParam('componentType', 'Loại linh kiện', 'string', 'vga')],
            responses: {
                200: successResponse('Lấy sản phẩm theo loại thành công'),
                400: errorResponse('Loại linh kiện không hợp lệ'),
            },
        }),
    },
    '/api/products/search/by-category': {
        get: operation({
            tags: ['Products'],
            summary: 'Tìm kiếm sản phẩm trong một danh mục',
            parameters: [queryParam('id', 'ID danh mục', 'string'), ...searchParameters],
            responses: {
                200: successResponse('Lấy danh sách sản phẩm theo danh mục thành công'),
            },
        }),
    },
    '/api/products/search': {
        get: operation({
            tags: ['Products'],
            summary: 'Tìm kiếm sản phẩm',
            parameters: searchParameters,
            responses: {
                200: successResponse('Tìm kiếm sản phẩm thành công'),
            },
        }),
    },
    '/api/products/promotions/hot-sale': {
        get: operation({
            tags: ['Products'],
            summary: 'Lấy sản phẩm hot sale',
            responses: {
                200: successResponse('Lấy sản phẩm hot sale thành công'),
            },
        }),
    },
    '/api/build-pc/items': {
        ...(paths['/api/build-pc/items'] || {}),
        post: operation({
            tags: ['Cart'],
            summary: 'Thêm sản phẩm vào giỏ build PC',
            security: protectedSecurity,
            requestBody: jsonRequestBody('CartItemRequest', 'productId và quantity'),
            responses: {
                200: successResponseWithMetadata('Thêm vào giỏ build PC thành công', { type: 'object' }),
                401: errorResponse('Chưa đăng nhập'),
            },
        }),
        get: operation({
            tags: ['Cart'],
            summary: 'Lấy giỏ build PC',
            security: protectedSecurity,
            responses: {
                200: successResponseWithMetadata('Lấy giỏ build PC thành công', arrayOf('BuildPcCartItemDetailed')),
                401: errorResponse('Chưa đăng nhập'),
            },
        }),
        delete: operation({
            tags: ['Cart'],
            summary: 'Xóa toàn bộ giỏ build PC',
            security: protectedSecurity,
            responses: {
                200: successResponse('Xóa giỏ build PC thành công'),
                401: errorResponse('Chưa đăng nhập'),
            },
        }),
    },
    '/api/build-pc/items/by-product/{productId}': {
        patch: operation({
            tags: ['Cart'],
            summary: 'Cập nhật số lượng trong giỏ build PC',
            security: protectedSecurity,
            parameters: [pathParam('productId', 'ID sản phẩm')],
            requestBody: jsonRequestBody('CartItemQuantityRequest', 'Body chứa `quantity`'),
            responses: {
                200: successResponse('Cập nhật số lượng thành công'),
                401: errorResponse('Chưa đăng nhập'),
            },
        }),
        delete: operation({
            tags: ['Cart'],
            summary: 'Xóa sản phẩm khỏi giỏ build PC',
            security: protectedSecurity,
            parameters: [pathParam('productId', 'ID sản phẩm')],
            responses: {
                200: successResponse('Xóa sản phẩm thành công'),
                401: errorResponse('Chưa đăng nhập'),
            },
        }),
    },
    '/api/wishlist': {
        post: operation({
            tags: ['Products'],
            summary: 'Thêm sản phẩm vào danh sách theo dõi',
            security: protectedSecurity,
            requestBody: jsonRequestBody('ProductWatchRequest', 'productId cần theo dõi'),
            responses: {
                200: successResponse('Theo dõi sản phẩm thành công'),
                401: errorResponse('Chưa đăng nhập'),
            },
        }),
        get: operation({
            tags: ['Products'],
            summary: 'Lấy danh sách sản phẩm đã theo dõi',
            security: protectedSecurity,
            responses: {
                200: successResponse('Lấy danh sách theo dõi thành công'),
                401: errorResponse('Chưa đăng nhập'),
            },
        }),
    },
    '/api/categories': {
        ...(paths['/api/categories'] || {}),
        post: operation({
            tags: ['Categories'],
            summary: 'Tạo danh mục',
            security: protectedSecurity,
            requestBody: jsonRequestBody('CategoryCreateRequest', 'Thông tin danh mục'),
            responses: {
                201: successResponseWithMetadata('Tạo danh mục thành công', 'Category', 201),
                401: errorResponse('Không có quyền admin'),
            },
        }),
        get: operation({
            tags: ['Categories'],
            summary: 'Lấy danh sách danh mục',
            parameters: recycleBinParameters,
            responses: {
                200: successResponseWithMetadata('Lấy danh sách danh mục thành công', arrayOf('Category')),
            },
        }),
    },
    '/api/categories/{id}': {
        ...(paths['/api/categories/{id}'] || {}),
        delete: operation({
            tags: ['Categories'],
            summary: 'Xóa mềm danh mục hoặc xóa vĩnh viễn với `force=true`',
            security: protectedSecurity,
            parameters: [
                pathParam('id', 'ID danh mục'),
                queryParam('force', 'Đặt `true` để xóa vĩnh viễn danh mục trong thùng rác', 'boolean', false),
            ],
            responses: {
                200: successResponse('Xóa danh mục thành công'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
        put: operation({
            tags: ['Categories'],
            summary: 'Cập nhật danh mục',
            security: protectedSecurity,
            parameters: [pathParam('id', 'ID danh mục')],
            requestBody: jsonRequestBody('CategoryUpdateRequest', 'Dữ liệu cập nhật danh mục'),
            responses: {
                200: successResponseWithMetadata('Cập nhật danh mục thành công', 'Category'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
        patch: operation({
            tags: ['Categories'],
            summary: 'Cập nhật trạng thái danh mục',
            security: protectedSecurity,
            parameters: [pathParam('id', 'ID danh mục')],
            requestBody: jsonRequestBody('CategoryStatusRequest', 'Body chứa `status`'),
            responses: {
                200: successResponseWithMetadata('Cập nhật trạng thái danh mục thành công', 'Category'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
    },
    '/api/categories/{id}/restore': {
        patch: operation({
            tags: ['Categories'],
            summary: 'Khôi phục danh mục',
            security: protectedSecurity,
            parameters: [pathParam('id', 'ID danh mục')],
            responses: {
                200: successResponse('Khôi phục danh mục thành công'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
    },
});

Object.assign(paths, {
    '/api/component-types': {
        get: operation({
            tags: ['Component Types'],
            summary: 'Lấy danh sách loại linh kiện',
            parameters: [
                queryParam('page', 'Trang hiện tại', 'integer', 1),
                queryParam('limit', 'Số lượng mỗi trang', 'integer', 20),
                queryParam('status', 'Trạng thái: `active`, `inactive`, `deleted` hoặc `all`', 'string', 'active'),
                queryParam('includeDeleted', 'Đặt `true` để xem cả dữ liệu đã soft delete', 'boolean', false),
                queryParam('buildPcOnly', 'Đặt `true` để chỉ lấy loại được dùng trong build PC', 'boolean', false),
                queryParam('productOnly', 'Đặt `true` để chỉ lấy loại dùng cho sản phẩm', 'boolean', false),
                queryParam('search', 'Từ khóa tìm kiếm', 'string', 'card'),
            ],
            responses: {
                200: successResponseWithMetadata('Lấy danh sách loại linh kiện thành công', arrayOf('ComponentType')),
            },
        }),
        post: operation({
            tags: ['Component Types'],
            summary: 'Tạo loại linh kiện',
            security: protectedSecurity,
            requestBody: jsonRequestBody('ComponentTypeCreateRequest', 'Thông tin loại linh kiện'),
            responses: {
                201: successResponseWithMetadata('Tạo loại linh kiện thành công', 'ComponentType', 201),
                400: errorResponse('Dữ liệu loại linh kiện không hợp lệ'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
    },
    '/api/component-types/{code}': {
        put: operation({
            tags: ['Component Types'],
            summary: 'Cập nhật loại linh kiện',
            security: protectedSecurity,
            parameters: [pathParam('code', 'Mã loại linh kiện')],
            requestBody: jsonRequestBody('ComponentTypeUpdateRequest', 'Thông tin cần cập nhật'),
            responses: {
                200: successResponseWithMetadata('Cập nhật loại linh kiện thành công', 'ComponentType'),
                400: errorResponse('Dữ liệu loại linh kiện không hợp lệ'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
        patch: operation({
            tags: ['Component Types'],
            summary: 'Cập nhật trạng thái loại linh kiện',
            security: protectedSecurity,
            parameters: [pathParam('code', 'Mã loại linh kiện')],
            requestBody: jsonRequestBody('ComponentTypeStatusRequest', 'Body chứa `status`'),
            responses: {
                200: successResponseWithMetadata('Cập nhật trạng thái loại linh kiện thành công', 'ComponentType'),
                400: errorResponse('Dữ liệu trạng thái không hợp lệ'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
        delete: operation({
            tags: ['Component Types'],
            summary: 'Xóa mềm loại linh kiện hoặc xóa vĩnh viễn với `force=true`',
            security: protectedSecurity,
            parameters: [
                pathParam('code', 'Mã loại linh kiện'),
                queryParam('force', 'Đặt `true` để xóa vĩnh viễn loại linh kiện trong thùng rác', 'boolean', false),
            ],
            responses: {
                200: successResponse('Xóa loại linh kiện thành công'),
                401: errorResponse('Không có quyền admin'),
                404: errorResponse('Không tìm thấy loại linh kiện'),
            },
        }),
    },
    '/api/component-types/{code}/restore': {
        patch: operation({
            tags: ['Component Types'],
            summary: 'Khôi phục loại linh kiện',
            security: protectedSecurity,
            parameters: [pathParam('code', 'Mã loại linh kiện')],
            responses: {
                200: successResponseWithMetadata('Khôi phục loại linh kiện thành công', 'ComponentType'),
                401: errorResponse('Không có quyền admin'),
                404: errorResponse('Không tìm thấy loại linh kiện'),
            },
        }),
    },
});

Object.assign(paths, {
    '/api/categories/component-filters': {
        get: operation({
            tags: ['Categories'],
            summary: 'Lấy bộ lọc linh kiện và thông số theo danh mục',
            parameters: [
                queryParam('categoryId', 'ID danh mục', 'string'),
                queryParam('componentType', 'Loại linh kiện', 'string', 'pc'),
            ],
            responses: {
                200: successResponse('Lấy bộ lọc component thành công'),
            },
        }),
    },
    '/api/products/filter-options': {
        get: operation({
            tags: ['Categories'],
            summary: 'Lấy danh sách sản phẩm và bộ lọc tổng hợp',
            responses: {
                200: successResponse('Lấy sản phẩm và filter thành công'),
            },
        }),
    },
    '/api/categories/{id}/products': {
        get: operation({
            tags: ['Categories'],
            summary: 'Lấy sản phẩm theo danh mục',
            parameters: [pathParam('id', 'ID danh mục'), ...searchParameters],
            responses: {
                200: successResponse('Lấy sản phẩm theo danh mục thành công'),
            },
        }),
    },
    '/api/cart/items': {
        ...(paths['/api/cart/items'] || {}),
        post: operation({
            tags: ['Cart'],
            summary: 'Thêm sản phẩm vào giỏ hàng',
            security: protectedSecurity,
            requestBody: jsonRequestBody('CartItemRequest', 'productId và quantity'),
            responses: {
                201: successResponseWithMetadata(
                    'Thêm vào giỏ hàng thành công',
                    {
                        type: 'object',
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            userId: { type: 'string', format: 'uuid' },
                            productId: { type: 'string', format: 'uuid' },
                            quantity: { type: 'integer' },
                            totalPrice: { type: 'integer' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                        },
                    },
                    201,
                ),
                401: errorResponse('Chưa đăng nhập'),
            },
        }),
        get: operation({
            tags: ['Cart'],
            summary: 'Lấy giỏ hàng',
            security: protectedSecurity,
            responses: {
                200: successResponseWithMetadata('Lấy giỏ hàng thành công', arrayOf('CartItemDetailed')),
                401: errorResponse('Chưa đăng nhập'),
            },
        }),
    },
    '/api/cart/items/{cartItemId}': {
        delete: operation({
            tags: ['Cart'],
            summary: 'Xóa một item trong giỏ hàng',
            security: protectedSecurity,
            parameters: [pathParam('cartItemId', 'ID cart item')],
            responses: {
                200: successResponse('Xóa sản phẩm trong giỏ thành công'),
                401: errorResponse('Chưa đăng nhập'),
            },
        }),
        patch: operation({
            tags: ['Cart'],
            summary: 'Cập nhật số lượng sản phẩm trong giỏ hàng',
            security: protectedSecurity,
            parameters: [pathParam('cartItemId', 'ID cart item')],
            requestBody: jsonRequestBody('CartItemQuantityRequest', 'Body chứa `quantity`'),
            responses: {
                200: successResponse('Cập nhật số lượng thành công'),
                401: errorResponse('Chưa đăng nhập'),
            },
        }),
    },
    '/api/cart/imports/build-pc': {
        post: operation({
            tags: ['Cart'],
            summary: 'Chuyển toàn bộ build PC sang giỏ hàng',
            security: protectedSecurity,
            responses: {
                200: successResponse('Chuyển build PC sang giỏ hàng thành công'),
                401: errorResponse('Chưa đăng nhập'),
            },
        }),
    },
    '/api/orders': {
        ...(paths['/api/orders'] || {}),
        post: operation({
            tags: ['Orders'],
            summary: 'Checkout đơn hàng',
            security: protectedSecurity,
            requestBody: jsonRequestBody('CheckoutRequest', 'Thông tin giao hàng và phương thức thanh toán'),
            responses: {
                200: successResponseWithMetadata('Checkout thành công hoặc trả URL thanh toán', 'CheckoutMetadata'),
                400: errorResponse('Thông tin checkout không hợp lệ'),
                401: errorResponse('Chưa đăng nhập'),
            },
        }),
        get: operation({
            tags: ['Orders'],
            summary: 'Lấy danh sách đơn hàng của user hiện tại',
            security: protectedSecurity,
            responses: {
                200: successResponseWithMetadata('Lấy danh sách đơn hàng thành công', arrayOf('UserOrder')),
                401: errorResponse('Chưa đăng nhập'),
            },
        }),
    },
    '/api/orders/{orderCode}': {
        get: operation({
            tags: ['Orders'],
            summary: 'Lấy chi tiết đơn hàng',
            security: protectedSecurity,
            parameters: [pathParam('orderCode', 'Mã đơn hàng')],
            responses: {
                200: successResponseWithMetadata('Lấy chi tiết đơn hàng thành công', 'OrderDetailMetadata'),
                401: errorResponse('Chưa đăng nhập'),
                404: errorResponse('Không tìm thấy đơn hàng'),
            },
        }),
    },
    '/api/orders/{orderCode}/cancellations': {
        post: operation({
            tags: ['Orders'],
            summary: 'Hủy đơn hàng của user',
            security: protectedSecurity,
            parameters: [pathParam('orderCode', 'Mã đơn hàng')],
            responses: {
                200: successResponse('Hủy đơn hàng thành công'),
                401: errorResponse('Chưa đăng nhập'),
                404: errorResponse('Không tìm thấy đơn hàng'),
            },
        }),
    },
    '/api/orders/{orderCode}/payments': {
        post: operation({
            tags: ['Orders'],
            summary: 'Tạo lại liên kết thanh toán cho đơn đang chờ thanh toán',
            security: protectedSecurity,
            parameters: [pathParam('orderCode', 'Mã đơn hàng')],
            responses: {
                200: successResponseWithMetadata('Tạo lại liên kết thanh toán thành công', 'CheckoutMetadata'),
                400: errorResponse('Đơn hàng không còn chờ thanh toán'),
                401: errorResponse('Chưa đăng nhập'),
                404: errorResponse('Không tìm thấy đơn hàng'),
            },
        }),
    },
    '/api/orders/{orderCode}/return-requests': {
        post: operation({
            tags: ['Orders'],
            summary: 'Người dùng gửi yêu cầu trả hàng/hoàn tiền',
            security: protectedSecurity,
            parameters: [pathParam('orderCode', 'Mã đơn hàng')],
            requestBody: jsonRequestBody('ReturnOrderRequest', 'Lý do trả hàng/hoàn tiền'),
            responses: {
                200: successResponse('Gửi yêu cầu trả hàng/hoàn tiền thành công'),
                400: errorResponse('Đơn hàng không hợp lệ hoặc không thể trả hàng'),
                401: errorResponse('Chưa đăng nhập'),
                404: errorResponse('Không tìm thấy đơn hàng'),
            },
        }),
    },
    '/api/admin/orders': {
        get: operation({
            tags: ['Orders'],
            summary: 'Lấy danh sách đơn hàng cho admin',
            security: protectedSecurity,
            responses: {
                200: successResponseWithMetadata('Lấy danh sách đơn hàng thành công', arrayOf('AdminOrder')),
                401: errorResponse('Không có quyền admin'),
            },
        }),
    },
    '/api/admin/orders/{orderId}': {
        patch: operation({
            tags: ['Orders'],
            summary: 'Cập nhật trạng thái đơn hàng',
            security: protectedSecurity,
            parameters: [pathParam('orderId', 'ID bảng order')],
            requestBody: jsonRequestBody('UpdateOrderStatusRequest', 'Body chứa `status`'),
            responses: {
                200: successResponse('Cập nhật trạng thái thành công'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
    },
    '/api/admin/payment-attempts/{attemptId}/refund': {
        patch: operation({
            tags: ['Orders'],
            summary: 'Đánh dấu giao dịch đã xử lý hoàn tiền',
            security: protectedSecurity,
            parameters: [pathParam('attemptId', 'ID payment attempt')],
            requestBody: {
                required: false,
                description: 'Ghi chú nội bộ sau khi admin đã xử lý hoàn tiền thực tế',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                refundNote: {
                                    type: 'string',
                                    maxLength: 1000,
                                    nullable: true,
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: successResponse('Đã đánh dấu hoàn tiền thành công'),
                400: errorResponse('Dữ liệu hoàn tiền không hợp lệ'),
                401: errorResponse('Không có quyền admin'),
                404: errorResponse('Không tìm thấy giao dịch thanh toán'),
            },
        }),
    },
    '/api/payments/momo/ipn': {
        post: operation({
            tags: ['Orders'],
            summary: 'IPN webhook từ MoMo',
            requestBody: {
                required: false,
                description: 'Payload IPN do MoMo gửi về server',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            additionalProperties: true,
                        },
                    },
                },
            },
            responses: {
                204: emptyResponse('MoMo IPN thành công'),
            },
        }),
    },
    '/api/payments/momo/return': {
        get: operation({
            tags: ['Orders'],
            summary: 'Return URL từ MoMo',
            parameters: [
                queryParam('orderInfo', 'Thông tin order'),
                queryParam('resultCode', 'Mã kết quả từ MoMo'),
                queryParam('extraData', 'Dữ liệu extraData từ MoMo'),
            ],
            responses: {
                302: redirectResponse('Redirect về frontend'),
            },
        }),
    },
    '/api/payments/vnpay/return': {
        get: operation({
            tags: ['Orders'],
            summary: 'Callback từ VNPay',
            parameters: [
                queryParam('vnp_ResponseCode', 'Mã phản hồi VNPay'),
                queryParam('vnp_OrderInfo', 'Thông tin đơn hàng'),
            ],
            responses: {
                302: redirectResponse('Redirect về frontend'),
            },
        }),
    },
});

Object.assign(paths, {
    '/api/reviews': {
        post: operation({
            tags: ['Reviews'],
            summary: 'Tạo đánh giá sản phẩm',
            security: protectedSecurity,
            requestBody: jsonRequestBody('ProductReviewCreateRequest', 'Thông tin đánh giá'),
            responses: {
                201: successResponseWithMetadata('Đánh giá sản phẩm thành công', 'ProductReview', 201),
                400: errorResponse('Chỉ user đã mua hàng với đơn đã giao/hoàn thành mới được đánh giá'),
                401: errorResponse('Chưa đăng nhập'),
            },
        }),
        get: operation({
            tags: ['Reviews'],
            summary: 'Lấy đánh giá của user hiện tại',
            security: protectedSecurity,
            responses: {
                200: successResponseWithMetadata('Lấy danh sách đánh giá thành công', arrayOf('ProductReview')),
                401: errorResponse('Chưa đăng nhập'),
            },
        }),
    },
    '/api/admin/reviews': {
        get: operation({
            tags: ['Reviews'],
            summary: 'Admin lấy toàn bộ đánh giá sản phẩm',
            security: protectedSecurity,
            parameters: [
                queryParam('page', 'Trang hiện tại', 'integer', 1),
                queryParam('limit', 'Số lượng mỗi trang', 'integer', 20),
                queryParam('status', 'Trạng thái: `pending`, `approved`, `hidden`, `deleted`, `all`', 'string', 'pending'),
                queryParam('includeDeleted', 'Đặt `true` để lấy cả dữ liệu trong thùng rác', 'boolean', false),
                queryParam('search', 'Từ khóa theo user, email, tên sản phẩm hoặc nội dung đánh giá', 'string', 'RTX 4060'),
                queryParam('rating', 'Lọc theo số sao', 'integer', 5),
                queryParam('startDate', 'Ngày bắt đầu, ví dụ `2026-04-01`', 'string', '2026-04-01'),
                queryParam('endDate', 'Ngày kết thúc, ví dụ `2026-04-20`', 'string', '2026-04-20'),
            ],
            responses: {
                200: successResponseWithMetadata(
                    'Lấy danh sách đánh giá sản phẩm thành công',
                    arrayOf('ProductReviewAdminItem'),
                ),
                401: errorResponse('Không có quyền admin'),
            },
        }),
    },
    '/api/admin/reviews/{id}': {
        delete: operation({
            tags: ['Reviews'],
            summary: 'Admin xóa đánh giá sản phẩm hoặc xóa vĩnh viễn với `force=true`',
            security: protectedSecurity,
            parameters: [
                pathParam('id', 'Mã đánh giá sản phẩm'),
                queryParam('force', 'Đặt `true` để xóa vĩnh viễn đánh giá trong thùng rác', 'boolean', false),
            ],
            responses: {
                200: successResponse('Xóa đánh giá sản phẩm thành công'),
                400: errorResponse('Không tìm thấy đánh giá sản phẩm'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
        patch: operation({
            tags: ['Reviews'],
            summary: 'Admin cập nhật trạng thái đánh giá',
            security: protectedSecurity,
            parameters: [pathParam('id', 'Mã đánh giá sản phẩm')],
            requestBody: jsonRequestBody('ReviewStatusUpdateRequest', 'Trạng thái đánh giá cần cập nhật'),
            responses: {
                200: successResponseWithMetadata('Cập nhật trạng thái đánh giá thành công', 'ProductReviewAdminItem'),
                400: errorResponse('Không thể chuyển trạng thái đánh giá theo luồng hiện tại'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
    },
    '/api/admin/reviews/{id}/restore': {
        patch: operation({
            tags: ['Reviews'],
            summary: 'Admin khôi phục đánh giá từ thùng rác',
            security: protectedSecurity,
            parameters: [pathParam('id', 'Mã đánh giá sản phẩm')],
            responses: {
                200: successResponseWithMetadata('Khôi phục đánh giá sản phẩm thành công', 'ProductReviewAdminItem'),
                400: errorResponse('Không tìm thấy đánh giá sản phẩm'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
    },
    '/api/blogs': {
        ...(paths['/api/blogs'] || {}),
        post: operation({
            tags: ['Blogs'],
            summary: 'Tạo blog',
            security: protectedSecurity,
            requestBody: jsonRequestBody('BlogCreateRequest', 'Thông tin bài viết'),
            responses: {
                201: successResponseWithMetadata('Tạo blog thành công', 'Blog', 201),
                401: errorResponse('Không có quyền admin'),
            },
        }),
        get: operation({
            tags: ['Blogs'],
            summary: 'Lấy danh sách blog',
            responses: {
                200: successResponseWithMetadata('Lấy danh sách blog thành công', arrayOf('Blog')),
            },
        }),
    },
    '/api/blogs/{id}': {
        put: operation({
            tags: ['Blogs'],
            summary: 'Cập nhật blog',
            security: protectedSecurity,
            parameters: [pathParam('id', 'ID bài viết')],
            requestBody: jsonRequestBody('BlogUpdateRequest', 'Dữ liệu cập nhật blog'),
            responses: {
                200: successResponse('Cập nhật blog thành công'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
        get: operation({
            tags: ['Blogs'],
            summary: 'Lấy chi tiết blog',
            parameters: [pathParam('id', 'ID bài viết')],
            responses: {
                200: successResponseWithMetadata('Lấy chi tiết blog thành công', 'Blog'),
            },
        }),
        patch: operation({
            tags: ['Blogs'],
            summary: 'Cập nhật trạng thái blog',
            security: protectedSecurity,
            parameters: [pathParam('id', 'ID bài viết')],
            requestBody: jsonRequestBody('BlogStatusRequest', 'Body chứa `status`'),
            responses: {
                200: successResponseWithMetadata('Cập nhật trạng thái blog thành công', 'Blog'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
        delete: operation({
            tags: ['Blogs'],
            summary: 'Xóa blog hoặc xóa vĩnh viễn với `force=true`',
            security: protectedSecurity,
            parameters: [
                pathParam('id', 'ID bài viết'),
                queryParam('force', 'Đặt `true` để xóa vĩnh viễn blog trong thùng rác', 'boolean', false),
            ],
            responses: {
                200: successResponse('Xóa blog thành công'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
    },
    '/api/blogs/{id}/restore': {
        patch: operation({
            tags: ['Blogs'],
            summary: 'Khôi phục blog',
            security: protectedSecurity,
            parameters: [pathParam('id', 'ID bài viết')],
            responses: {
                200: successResponseWithMetadata('Khôi phục blog thành công', 'Blog'),
                401: errorResponse('Không có quyền admin'),
                404: errorResponse('Không tìm thấy blog'),
            },
        }),
    },
    '/api/contacts': {
        post: operation({
            tags: ['Contacts'],
            summary: 'Tạo liên hệ tư vấn',
            requestBody: jsonRequestBody('ContactCreateRequest', 'Thông tin liên hệ'),
            responses: {
                201: successResponseWithMetadata('Tạo liên hệ thành công', 'Contact', 201),
                400: errorResponse('Thiếu thông tin liên hệ'),
            },
        }),
        get: operation({
            tags: ['Contacts'],
            summary: 'Lấy danh sách liên hệ',
            security: protectedSecurity,
            responses: {
                200: successResponseWithMetadata('Lấy danh sách liên hệ thành công', arrayOf('Contact')),
                401: errorResponse('Không có quyền admin'),
            },
        }),
    },
    '/api/contacts/{id}': {
        get: operation({
            tags: ['Contacts'],
            summary: 'Lấy chi tiết liên hệ',
            security: protectedSecurity,
            parameters: [
                pathParam('id', 'ID liên hệ'),
                queryParam('includeDeleted', 'Đặt `false` để không lấy dữ liệu đã xóa mềm', 'boolean', true),
            ],
            responses: {
                200: successResponseWithMetadata('Lấy chi tiết liên hệ thành công', 'Contact'),
                401: errorResponse('Không có quyền admin'),
                404: errorResponse('Không tìm thấy liên hệ'),
            },
        }),
        patch: operation({
            tags: ['Contacts'],
            summary: 'Cập nhật trạng thái hoặc ghi chú liên hệ',
            security: protectedSecurity,
            parameters: [pathParam('id', 'ID liên hệ')],
            requestBody: jsonRequestBody('ContactUpdateRequest', 'Body chứa `status`, `adminNote` hoặc cả hai'),
            responses: {
                200: successResponseWithMetadata('Cập nhật liên hệ thành công', 'Contact'),
                400: errorResponse('Dữ liệu liên hệ không hợp lệ'),
                401: errorResponse('Không có quyền admin'),
                404: errorResponse('Không tìm thấy liên hệ'),
            },
        }),
        delete: operation({
            tags: ['Contacts'],
            summary: 'Xóa mềm liên hệ hoặc xóa vĩnh viễn với `force=true`',
            security: protectedSecurity,
            parameters: [
                pathParam('id', 'ID liên hệ'),
                queryParam('force', 'Đặt `true` để xóa vĩnh viễn liên hệ trong thùng rác', 'boolean', false),
            ],
            responses: {
                200: successResponse('Xóa liên hệ thành công'),
                401: errorResponse('Không có quyền admin'),
                404: errorResponse('Không tìm thấy liên hệ'),
            },
        }),
    },
    '/api/contacts/{id}/restore': {
        patch: operation({
            tags: ['Contacts'],
            summary: 'Khôi phục liên hệ',
            security: protectedSecurity,
            parameters: [pathParam('id', 'ID liên hệ')],
            responses: {
                200: successResponseWithMetadata('Khôi phục liên hệ thành công', 'Contact'),
                401: errorResponse('Không có quyền admin'),
                404: errorResponse('Không tìm thấy liên hệ'),
            },
        }),
    },
    '/api/spec-definitions': {
        get: operation({
            tags: ['Spec Definitions'],
            summary: 'Lấy danh sách định nghĩa thuộc tính',
            parameters: [
                queryParam('componentType', 'Loại linh kiện', 'string', 'cpu'),
                ...recycleBinParameters,
            ],
            responses: {
                200: successResponseWithMetadata('Lấy danh sách spec definitions thành công', arrayOf('SpecDefinition')),
            },
        }),
        post: operation({
            tags: ['Spec Definitions'],
            summary: 'Tạo định nghĩa thuộc tính',
            security: protectedSecurity,
            requestBody: jsonRequestBody('SpecDefinitionCreateRequest', 'Thông tin thuộc tính'),
            responses: {
                201: successResponseWithMetadata('Tạo thuộc tính thành công', 'SpecDefinition', 201),
                401: errorResponse('Không có quyền admin'),
            },
        }),
    },
    '/api/spec-definitions/{id}': {
        put: operation({
            tags: ['Spec Definitions'],
            summary: 'Cập nhật định nghĩa thuộc tính',
            security: protectedSecurity,
            parameters: [pathParam('id', 'ID định nghĩa thuộc tính')],
            requestBody: jsonRequestBody('SpecDefinitionUpdateRequest', 'Thông tin cần cập nhật'),
            responses: {
                200: successResponseWithMetadata('Cập nhật thuộc tính thành công', 'SpecDefinition'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
        patch: operation({
            tags: ['Spec Definitions'],
            summary: 'Cập nhật trạng thái định nghĩa thuộc tính',
            security: protectedSecurity,
            parameters: [pathParam('id', 'ID định nghĩa thuộc tính')],
            requestBody: jsonRequestBody('SpecDefinitionStatusRequest', 'Body chứa `status`'),
            responses: {
                200: successResponseWithMetadata('Cập nhật trạng thái thuộc tính thành công', 'SpecDefinition'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
        delete: operation({
            tags: ['Spec Definitions'],
            summary: 'Xóa mềm định nghĩa thuộc tính hoặc xóa vĩnh viễn với `force=true`',
            security: protectedSecurity,
            parameters: [
                pathParam('id', 'ID định nghĩa thuộc tính'),
                queryParam('force', 'Đặt `true` để xóa vĩnh viễn thuộc tính trong thùng rác', 'boolean', false),
            ],
            responses: {
                200: successResponse('Xóa thuộc tính thành công'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
    },
    '/api/spec-definitions/{id}/restore': {
        patch: operation({
            tags: ['Spec Definitions'],
            summary: 'Khôi phục định nghĩa thuộc tính',
            security: protectedSecurity,
            parameters: [pathParam('id', 'ID định nghĩa thuộc tính')],
            responses: {
                200: successResponse('Khôi phục thuộc tính thành công'),
                401: errorResponse('Không có quyền admin'),
            },
        }),
    },
    '/api/uploads/single': {
        post: operation({
            tags: ['Uploads'],
            summary: 'Upload một ảnh',
            security: protectedSecurity,
            requestBody: multipartRequestBody(
                {
                    type: 'object',
                    required: ['image'],
                    properties: {
                        image: {
                            type: 'string',
                            format: 'binary',
                        },
                    },
                },
                'Form-data với field `image`',
            ),
            responses: {
                200: jsonResponseWithSchema('Upload ảnh thành công', 'UploadSingleMetadata'),
                400: errorResponse('Thiếu file'),
                401: errorResponse('Chưa đăng nhập admin'),
                403: errorResponse('Không có quyền admin'),
            },
        }),
    },
    '/api/uploads/multiple': {
        post: operation({
            tags: ['Uploads'],
            summary: 'Upload nhiều ảnh',
            security: protectedSecurity,
            requestBody: multipartRequestBody(
                {
                    type: 'object',
                    required: ['images'],
                    properties: {
                        images: {
                            type: 'array',
                            items: {
                                type: 'string',
                                format: 'binary',
                            },
                        },
                    },
                },
                'Form-data với field `images`',
            ),
            responses: {
                200: jsonResponseWithSchema('Upload nhiều ảnh thành công', 'UploadMultipleMetadata'),
                400: errorResponse('Thiếu file'),
                401: errorResponse('Chưa đăng nhập admin'),
                403: errorResponse('Không có quyền admin'),
            },
        }),
    },
    '/api/chatbot/replies': {
        post: operation({
            tags: ['Chatbot'],
            summary: 'Gửi câu hỏi cho chatbot',
            requestBody: jsonRequestBody('ChatRequest', 'Câu hỏi chatbot'),
            responses: {
                200: successResponse('Chatbot trả lời thành công'),
            },
        }),
    },
});

function pruneSwaggerSpecToCurrentRoutes(spec) {
    spec.paths = Object.fromEntries(
        Object.entries(spec.paths || {})
            .filter(([pathKey]) => currentApiPaths.has(pathKey)),
    );

    return spec;
}

pruneSwaggerSpecToCurrentRoutes(swaggerSpec);

const publicSwaggerSpec = buildPublicSwaggerSpec(swaggerSpec);

function setupSwagger(app) {
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(publicSwaggerSpec);
    });

    app.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(publicSwaggerSpec, swaggerUiSetupOptions),
    );
}

module.exports = {
    publicSwaggerSpec,
    swaggerSpec,
    setupSwagger,
    paths,
    helpers: {
        operation,
        jsonRequestBody,
        multipartRequestBody,
        successResponse,
        errorResponse,
        redirectResponse,
        emptyResponse,
        pathParam,
        queryParam,
        protectedSecurity,
        recycleBinParameters,
        productListParameters,
        dateRangeParameters,
        searchParameters,
    },
};
