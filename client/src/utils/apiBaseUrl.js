const DEFAULT_API_BASE_URL = 'http://localhost:3000';

function trimTrailingSlash(value) {
    return String(value || '').trim().replace(/\/+$/, '');
}

function readClientEnv(name) {
    return import.meta.env[name]?.trim() || '';
}

function resolveBaseUrl(value, fallback) {
    const normalizedValue = trimTrailingSlash(value);
    if (normalizedValue) {
        return normalizedValue;
    }

    return trimTrailingSlash(fallback);
}

export function resolveApiBaseUrl() {
    return resolveBaseUrl(readClientEnv('VITE_API_BASE_URL'), DEFAULT_API_BASE_URL);
}

export function resolveAssetBaseUrl() {
    return resolveBaseUrl(readClientEnv('VITE_ASSET_BASE_URL'), resolveApiBaseUrl());
}
