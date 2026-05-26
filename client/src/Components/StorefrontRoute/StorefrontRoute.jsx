import { Navigate } from 'react-router-dom';

import { useStore } from '../../hooks/useStore';

function StorefrontRoute({ children }) {
    const { dataUser } = useStore();

    if (dataUser?.isAdmin) {
        return <Navigate to="/admin" replace />;
    }

    return children;
}

export default StorefrontRoute;
