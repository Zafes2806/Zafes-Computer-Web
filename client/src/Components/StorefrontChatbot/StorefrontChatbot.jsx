import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const Chatbot = lazy(() => import('../../utils/Chatbot/Chatbot'));

const HIDDEN_PATHS = new Set(['/login', '/register', '/forgot-password']);

function StorefrontChatbot() {
    const { pathname } = useLocation();
    const [shouldRenderChatbot, setShouldRenderChatbot] = useState(false);

    useEffect(() => {
        const scheduleIdleCallback = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 300));
        const cancelIdleCallback = window.cancelIdleCallback || window.clearTimeout;

        const idleCallbackId = scheduleIdleCallback(() => {
            setShouldRenderChatbot(true);
        });

        return () => cancelIdleCallback(idleCallbackId);
    }, []);

    if (!shouldRenderChatbot || pathname.startsWith('/admin') || HIDDEN_PATHS.has(pathname)) {
        return null;
    }

    return (
        <Suspense fallback={null}>
            <Chatbot />
        </Suspense>
    );
}

export default StorefrontChatbot;
