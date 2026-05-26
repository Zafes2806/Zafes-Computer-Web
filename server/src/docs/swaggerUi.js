const publicDescription = [
    'Tai lieu API cho backend Zafes Computer.',
    '',
    '### Cach dung nhanh',
    '1. Dang nhap bang `POST /api/auth/login` hoac `POST /api/auth/google`.',
    '2. Bam `Authorize` de dan Bearer token, hoac dung cookie dang nhap hien tai.',
    '3. Dung o `Filter` de tim nhanh endpoint theo domain.',
    '4. Giao dien nay chi hien thi route REST hien tai.',
].join('\n');

const swaggerCustomCss = `
html {
    background: #eef3f8;
}

body {
    background:
        radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 32%),
        radial-gradient(circle at top right, rgba(16, 185, 129, 0.08), transparent 28%),
        #eef3f8;
}

.swagger-ui {
    color: #0f172a;
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
}

.swagger-ui .topbar {
    display: none;
}

.swagger-ui .wrapper {
    max-width: 1240px;
}

.swagger-ui .information-container.wrapper {
    padding: 32px 20px 12px;
}

.swagger-ui .info {
    margin: 0 0 24px;
    padding: 28px 30px;
    border: 1px solid #d9e2ec;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
}

.swagger-ui .info .title {
    color: #0f172a;
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -0.03em;
}

.swagger-ui .info p,
.swagger-ui .info li,
.swagger-ui .info table {
    color: #475569;
    font-size: 14px;
    line-height: 1.7;
}

.swagger-ui .scheme-container {
    margin: 0 0 24px;
    padding: 16px 20px;
    border: 1px solid #d9e2ec;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 10px 32px rgba(15, 23, 42, 0.06);
}

.swagger-ui .btn.authorize {
    border-color: #0f766e;
    color: #0f766e;
}

.swagger-ui .btn.authorize svg {
    fill: #0f766e;
}

.swagger-ui .filter-container {
    margin: 0 0 20px;
}

.swagger-ui .filter-container input {
    min-width: 280px;
    border: 1px solid #cbd5e1;
    border-radius: 14px;
    background: #fff;
}

.swagger-ui .opblock-tag {
    margin: 0 0 16px;
    padding: 18px 12px;
    border-bottom: 1px solid #d7e1ea;
    color: #0f172a;
    font-size: 21px;
    font-weight: 700;
}

.swagger-ui .opblock {
    margin: 0 0 16px;
    border: 1px solid #d9e2ec;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

.swagger-ui .opblock .opblock-summary {
    align-items: center;
    padding: 10px 14px;
}

.swagger-ui .opblock .opblock-summary-method {
    min-width: 88px;
    border-radius: 999px;
    font-weight: 700;
}

.swagger-ui .opblock .opblock-summary-path {
    color: #0f172a;
    font-weight: 600;
}

.swagger-ui .opblock .opblock-summary-description {
    color: #475569;
    font-size: 13px;
}

.swagger-ui .opblock-body {
    background: #ffffff;
}

.swagger-ui .parameters-container,
.swagger-ui .responses-wrapper,
.swagger-ui .opblock-section-header,
.swagger-ui .model-container,
.swagger-ui .try-out,
.swagger-ui .execute-wrapper {
    background: #ffffff;
}

.swagger-ui .responses-inner h4,
.swagger-ui .responses-inner h5,
.swagger-ui .opblock-section-header h4,
.swagger-ui .parameters-container .parameters-col_description input {
    color: #0f172a;
}

.swagger-ui table thead tr td,
.swagger-ui table thead tr th {
    color: #334155;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.swagger-ui .response-col_status {
    font-weight: 700;
}

.swagger-ui section.models {
    margin-top: 28px;
    border: 1px solid #d9e2ec;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}

.swagger-ui section.models h4 {
    color: #0f172a;
    font-size: 18px;
    font-weight: 700;
}

@media (max-width: 900px) {
    .swagger-ui .information-container.wrapper {
        padding: 20px 12px 8px;
    }

    .swagger-ui .info {
        padding: 20px;
        border-radius: 18px;
    }

    .swagger-ui .info .title {
        font-size: 26px;
    }

    .swagger-ui .scheme-container {
        padding: 14px;
        border-radius: 16px;
    }
}
`;

function buildPublicSwaggerSpec(swaggerSpec) {
    return {
        ...swaggerSpec,
        info: {
            ...swaggerSpec.info,
            description: publicDescription,
        },
    };
}

const swaggerUiSetupOptions = {
    explorer: true,
    customSiteTitle: 'Zafes Computer API Docs',
    customCss: swaggerCustomCss,
    swaggerOptions: {
        deepLinking: true,
        defaultModelsExpandDepth: -1,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true,
        operationsSorter: 'alpha',
        persistAuthorization: true,
        showCommonExtensions: false,
        showExtensions: false,
        tryItOutEnabled: true,
        validatorUrl: null,
    },
};

module.exports = {
    buildPublicSwaggerSpec,
    swaggerUiSetupOptions,
};
