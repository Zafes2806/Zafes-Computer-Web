import { Spin } from 'antd';
import { Navigate, useLocation } from 'react-router-dom';

import { useStore } from '../../hooks/useStore';

function AdminRoute({ children }) {
    const location = useLocation();
    const { dataUser, isAuthenticated, isAuthLoading } = useStore();

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

    if (!dataUser?.isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default AdminRoute;
