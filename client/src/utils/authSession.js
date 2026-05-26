import cookies from 'js-cookie';

export const AUTH_SESSION_MARKER_COOKIE = 'logged';
const AUTH_SESSION_MARKER_KEY = 'auth_session_marker';
const AUTH_ACCESS_TOKEN_KEY = 'token';

export function hasAuthSessionMarker() {
    return Boolean(
        cookies.get(AUTH_SESSION_MARKER_COOKIE) ||
            window.localStorage.getItem(AUTH_SESSION_MARKER_KEY) ||
            window.localStorage.getItem(AUTH_ACCESS_TOKEN_KEY),
    );
}

export function getBrowserAccessToken() {
    return window.localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);
}

export function markBrowserAuthState(accessToken = '') {
    cookies.set(AUTH_SESSION_MARKER_COOKIE, '1', {
        path: '/',
        sameSite: 'lax',
    });
    window.localStorage.setItem(AUTH_SESSION_MARKER_KEY, '1');
    if (accessToken) {
        window.localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, accessToken);
    }
}

export function clearBrowserAuthState() {
    cookies.remove(AUTH_SESSION_MARKER_COOKIE, { path: '/' });
    window.localStorage.removeItem(AUTH_SESSION_MARKER_KEY);
    window.localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY);
}

export function redirectToLoginIfNeeded() {
    if (window.location.pathname !== '/login') {
        window.location.replace('/login');
    }
}
