import Header from '../../Components/Header/Header';
import Footer from '../../Components/Footer/Footer';
import { useParams } from 'react-router-dom';
import { requestGetBlogByIdPublic } from '../../api';
import { useEffect, useState } from 'react';

import classNames from 'classnames/bind';
import styles from './DetailBlogs.module.scss';
import SafeHtml from '../../Components/SafeHtml/SafeHtml';

const cx = classNames.bind(styles);

function DetailBlogs() {
    const { id } = useParams();

    const [blog, setBlog] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const res = await requestGetBlogByIdPublic(id);
            setBlog(res.metadata);
        };
        fetchData();
    }, [id]);

    return (
        <div>
            <header>
                <Header />
            </header>
            <main>
                <div className={cx('container')}>
                    <h1>{blog?.title}</h1>
                    <SafeHtml html={blog?.content} className={cx('content')} />
                </div>
            </main>
            <footer>
                <Footer />
            </footer>
        </div>
    );
}

export default DetailBlogs;
