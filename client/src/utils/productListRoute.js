export const PRODUCT_LIST_PATH = '/products';

export function isComponentCatalogCategory(categoryName = '') {
    const normalized = categoryName.toLowerCase();
    return normalized.includes('linh kiện') || normalized.includes('linh kien');
}

export function createCategoryListPath(category = {}) {
    return createProductListPath({ category: category.id });
}

export function createProductListPath(params = {}) {
    const query = new URLSearchParams();
    const { category, componentType, search } = params;

    if (search) {
        query.set('search', search);
    }

    const queryString = query.toString();
    if (componentType) {
        if (category && category !== 'all') {
            query.set('category', category);
        }

        const componentQueryString = query.toString();
        const componentSegment = encodeURIComponent(String(componentType));
        return componentQueryString ? `/components/${componentSegment}?${componentQueryString}` : `/components/${componentSegment}`;
    }

    if (category && category !== 'all') {
        const categorySegment = encodeURIComponent(String(category));
        return queryString ? `/categories/${categorySegment}?${queryString}` : `/categories/${categorySegment}`;
    }

    return queryString ? `${PRODUCT_LIST_PATH}?${queryString}` : PRODUCT_LIST_PATH;
}
