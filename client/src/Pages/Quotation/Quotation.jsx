import React, { useEffect, useState } from 'react';
import PrintImage from '../../Components/PrintImage/PrintImage';
import { requestGetBuildPcItems } from '../../api';
import Footer from '../../Components/Footer/Footer';
import { getGuestBuildPc } from '../../utils/guestStorage';
import { useStore } from '../../hooks/useStore';

function Quotation() {
    const { isAuthenticated } = useStore();
    const [dataCart, setDataCart] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            if (isAuthenticated) {
                const res = await requestGetBuildPcItems();
                setDataCart(res.metadata || []);
                return;
            }

            setDataCart(getGuestBuildPc());
        };
        fetchData();
    }, [isAuthenticated]);

    return (
        <div className="quotation-page">
            <PrintImage dataCart={dataCart} />
            <footer>
                <Footer />
            </footer>
        </div>
    );
}

export default Quotation;
