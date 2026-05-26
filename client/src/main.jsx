import { Suspense, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { adminRoutes, privateRoutes, publicRoutes } from './routes/index.jsx';
import './App.css';

import { Provider } from './store/Provider.jsx';
import PrivateRoute from './Components/PrivateRoute/PrivateRoute.jsx';
import AdminRoute from './Components/AdminRoute/AdminRoute.jsx';
import StorefrontRoute from './Components/StorefrontRoute/StorefrontRoute.jsx';
import NotFound from './Pages/NotFound/NotFound.jsx';
import RouteLoading from './Components/RouteLoading/RouteLoading.jsx';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Provider>
            <Router>
                <Routes>
                    {publicRoutes.map((route, index) => (
                        <Route
                            key={index}
                            path={route.path}
                            element={
                                <Suspense fallback={<RouteLoading />}>
                                    <StorefrontRoute>{route.component}</StorefrontRoute>
                                </Suspense>
                            }
                        />
                    ))}
                    {privateRoutes.map((route, index) => (
                        <Route
                            key={`private-${index}`}
                            path={route.path}
                            element={
                                <Suspense fallback={<RouteLoading />}>
                                    <PrivateRoute>{route.component}</PrivateRoute>
                                </Suspense>
                            }
                        />
                    ))}
                    {adminRoutes.map((route, index) => (
                        <Route
                            key={`admin-${index}`}
                            path={route.path}
                            element={
                                <Suspense fallback={<RouteLoading />}>
                                    <AdminRoute>{route.component}</AdminRoute>
                                </Suspense>
                            }
                        />
                    ))}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Router>
        </Provider>
    </StrictMode>,
);
