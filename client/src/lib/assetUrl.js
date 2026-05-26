import { resolveAssetBaseUrl } from '../utils/apiBaseUrl';

const assetBaseUrl = resolveAssetBaseUrl();

export function resolveAssetUrl(value) {
    if (typeof value !== 'string') {
        return value ?? '';
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
        return '';
    }

    if (
        trimmedValue.startsWith('http://')
        || trimmedValue.startsWith('https://')
        || trimmedValue.startsWith('data:')
        || trimmedValue.startsWith('blob:')
    ) {
        return trimmedValue;
    }

    if (trimmedValue.startsWith('/')) {
        return `${assetBaseUrl}${trimmedValue}`;
    }

    return `${assetBaseUrl}/${trimmedValue.replace(/^\/+/, '')}`;
}

export function getFirstResolvedImage(value) {
    if (typeof value !== 'string' || !value.trim()) {
        return '';
    }

    const [firstImage] = value.split(',');
    return resolveAssetUrl(firstImage || '');
}
