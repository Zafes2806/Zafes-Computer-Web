import { Spin } from 'antd';
import { Navigate, useLocation } from 'react-router-dom';

import { useStore } from '../../hooks/useStore';

function PrivateRoute({ children }) {
    const location = useLocation();
    const { isAuthenticated, isAuthLoading, dataUser } = useStore();

    if (isAuthLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (dataUser?.isAdmin) {
        return <Navigate to="/admin" replace />;
    }

    return children;
}

export default PrivateRoute;
