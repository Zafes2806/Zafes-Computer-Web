import { Spin } from 'antd';

function RouteLoading() {
    return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
            <Spin size="large" />
        </div>
    );
}

export default RouteLoading;
