import classNames from 'classnames/bind';
import styles from './Footer.module.scss';

const cx = classNames.bind(styles);

function Footer() {
    return (
        <div className={cx('wrapper')}>
            <div className={cx('container')}>
                <div className={cx('footer-sections')}>
                    <div className={cx('footer-section')}>
                        <h3 className={cx('section-title')}>GIỚI THIỆU ZAFES COMPUTER</h3>
                        <ul className={cx('section-links')}>
                            <li>
                                <a href="#">Giới thiệu công ty</a>
                            </li>
                            <li>
                                <a href="#">Thông tin liên hệ</a>
                            </li>
                            <li>
                                <a href="#">Tin tức</a>
                            </li>
                        </ul>
                    </div>

                    <div className={cx('footer-section')}>
                        <h3 className={cx('section-title')}>HỖ TRỢ KHÁCH HÀNG</h3>
                        <ul className={cx('section-links')}>
                            <li>
                                <a href="#">Hướng dẫn mua hàng trực tuyến</a>
                            </li>
                            <li>
                                <a href="#">Hướng dẫn thanh toán</a>
                            </li>
                            <li>
                                <a href="#">Góp ý, Khiếu Nại</a>
                            </li>
                        </ul>
                    </div>

                    <div className={cx('footer-section')}>
                        <h3 className={cx('section-title')}>CHÍNH SÁCH CHUNG</h3>
                        <ul className={cx('section-links')}>
                            <li>
                                <a href="#">Chính sách vận chuyển</a>
                            </li>
                            <li>
                                <a href="#">Chính sách thanh toán</a>
                            </li>
                            <li>
                                <a href="#">Chính sách bảo hành</a>
                            </li>
                            <li>
                                <a href="#">Chính sách đổi trả</a>
                            </li>
                            <li>
                                <a href="#">Bảo mật thông tin khách hàng</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Footer;
