const API_PREFIX = '/api';

const authBase = `${API_PREFIX}/auth`;
const adminBase = `${API_PREFIX}/admin`;
const usersBase = `${API_PREFIX}/users`;
const contactsBase = `${API_PREFIX}/contacts`;
const componentTypesBase = `${API_PREFIX}/component-types`;
const specDefinitionsBase = `${API_PREFIX}/spec-definitions`;
const categoriesBase = `${API_PREFIX}/categories`;
const productsBase = `${API_PREFIX}/products`;
const recentlyViewedBase = `${API_PREFIX}/recently-viewed`;
const reviewsBase = `${API_PREFIX}/reviews`;
const uploadsBase = `${API_PREFIX}/uploads`;
const cartBase = `${API_PREFIX}/cart/items`;
const ordersBase = `${API_PREFIX}/orders`;
const buildPcBase = `${API_PREFIX}/build-pc/items`;
const blogsBase = `${API_PREFIX}/blogs`;

export const API_PATHS = {
    auth: {
        login: `${authBase}/login`,
        register: `${authBase}/register`,
        me: `${authBase}/me`,
        refresh: `${authBase}/refresh`,
        logout: `${authBase}/logout`,
        google: `${authBase}/google`,
        forgotPassword: `${authBase}/forgot-password`,
        resetPassword: `${authBase}/reset-password`,
        mergeSession: `${authBase}/merge-session`,
    },
    admin: {
        dashboard: `${adminBase}/dashboard`,
        orders: `${adminBase}/orders`,
        orderStatus: (orderId) => `${adminBase}/orders/${orderId}`,
        paymentAttemptRefundProcessed: (attemptId) => `${adminBase}/payment-attempts/${attemptId}/refund`,
        reviews: `${adminBase}/reviews`,
        reviewById: (id) => `${adminBase}/reviews/${id}`,
        reviewRestore: (id) => `${adminBase}/reviews/${id}/restore`,
        reviewPermanent: (id) => `${adminBase}/reviews/${id}?force=true`,
        stats: {
            orders: `${adminBase}/stats/orders`,
            charts: `${adminBase}/stats/charts`,
        },
    },
    users: {
        collection: usersBase,
        me: `${usersBase}/me`,
        byId: (id) => `${usersBase}/${id}`,
        permanentDelete: (id) => `${usersBase}/${id}?force=true`,
        restore: (id) => `${usersBase}/${id}/restore`,
    },
    contacts: {
        collection: contactsBase,
        byId: (id) => `${contactsBase}/${id}`,
        restore: (id) => `${contactsBase}/${id}/restore`,
        permanentDelete: (id) => `${contactsBase}/${id}?force=true`,
    },
    componentTypes: {
        collection: componentTypesBase,
        byCode: (code) => `${componentTypesBase}/${code}`,
        restore: (code) => `${componentTypesBase}/${code}/restore`,
        permanentDelete: (code) => `${componentTypesBase}/${code}?force=true`,
    },
    specDefinitions: {
        collection: specDefinitionsBase,
        reorder: `${specDefinitionsBase}/reorder`,
        byId: (id) => `${specDefinitionsBase}/${id}`,
        restore: (id) => `${specDefinitionsBase}/${id}/restore`,
        permanentDelete: (id) => `${specDefinitionsBase}/${id}?force=true`,
    },
    categories: {
        collection: categoriesBase,
        componentFilters: `${categoriesBase}/component-filters`,
        availability: (id) => `${categoriesBase}/${id}/availability`,
        byId: (id) => `${categoriesBase}/${id}`,
        restore: (id) => `${categoriesBase}/${id}/restore`,
        permanentDelete: (id) => `${categoriesBase}/${id}?force=true`,
        products: (id) => `${categoriesBase}/${id}/products`,
    },
    products: {
        collection: productsBase,
        search: `${productsBase}/search`,
        searchByCategory: `${productsBase}/search/by-category`,
        filterOptions: `${productsBase}/filter-options`,
        hotSale: `${productsBase}/promotions/hot-sale`,
        groupedByCategory: `${productsBase}/groups/by-category`,
        components: `${productsBase}/by-component-type`,
        byId: (id) => `${productsBase}/${id}`,
        restore: (id) => `${productsBase}/${id}/restore`,
        permanentDelete: (id) => `${productsBase}/${id}?force=true`,
    },
    recentlyViewed: {
        collection: recentlyViewedBase,
    },
    reviews: {
        collection: reviewsBase,
        byId: (id) => `${reviewsBase}/${id}`,
    },
    uploads: {
        single: `${uploadsBase}/single`,
        multiple: `${uploadsBase}/multiple`,
    },
    cart: {
        items: cartBase,
        itemById: (cartItemId) => `${cartBase}/${cartItemId}`,
        importFromBuildPc: `${API_PREFIX}/cart/imports/build-pc`,
    },
    orders: {
        collection: ordersBase,
        byId: (orderCode) => `${ordersBase}/${orderCode}`,
        cancel: (orderCode) => `${ordersBase}/${orderCode}/cancellations`,
        complete: (orderCode) => `${ordersBase}/${orderCode}/completions`,
        paymentAttempts: (orderCode) => `${ordersBase}/${orderCode}/payments`,
        returnRequest: (orderCode) => `${ordersBase}/${orderCode}/return-requests`,
    },
    buildPc: {
        items: buildPcBase,
        itemByProductId: (productId) => `${buildPcBase}/by-product/${productId}`,
    },
    blogs: {
        collection: blogsBase,
        byId: (id) => `${blogsBase}/${id}`,
        restore: (id) => `${blogsBase}/${id}/restore`,
        permanentDelete: (id) => `${blogsBase}/${id}?force=true`,
    },
    chatbot: {
        replies: `${API_PREFIX}/chatbot/replies`,
    },
};
