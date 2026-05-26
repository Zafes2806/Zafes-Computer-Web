import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

function NotFound() {
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
            <Result
                status="404"
                title="404"
                subTitle="Trang bạn đang tìm không tồn tại."
                extra={
                    <Button type="primary" onClick={() => navigate('/')}>
                        Quay về trang chủ
                    </Button>
                }
            />
        </div>
    );
}

export default NotFound;
