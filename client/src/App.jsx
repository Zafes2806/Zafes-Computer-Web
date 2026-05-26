import { Suspense, lazy, useEffect, useState } from 'react';
import Footer from './Components/Footer/Footer';
import Header from './Components/Header/Header';
import HomePage from './Components/HomePage/HomePage';

const Chatbot = lazy(() => import('./utils/Chatbot/Chatbot'));

function App() {
    const [shouldRenderChatbot, setShouldRenderChatbot] = useState(false);

    useEffect(() => {
        const scheduleIdleCallback = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 300));
        const cancelIdleCallback = window.cancelIdleCallback || window.clearTimeout;

        const idleCallbackId = scheduleIdleCallback(() => {
            setShouldRenderChatbot(true);
        });

        return () => cancelIdleCallback(idleCallbackId);
    }, []);

    return (
        <div>
            <header>
                <Header />
            </header>

            <main className="main">
                <HomePage />
            </main>

            {shouldRenderChatbot ? (
                <Suspense fallback={null}>
                    <Chatbot />
                </Suspense>
            ) : null}
            <footer>
                <Footer />
            </footer>
        </div>
    );
}

export default App;
