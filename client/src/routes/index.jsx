import { lazy } from 'react';

const App = lazy(() => import('../App'));
const Admin = lazy(() => import('../Pages/Admin/Index'));
const BuildPc = lazy(() => import('../Pages/BuildPc/BuildPc'));
const Cart = lazy(() => import('../Pages/Cart/Cart'));
const DetailProduct = lazy(() => import('../Pages/DetailProduct/DetailProduct'));
const ForgotPassword = lazy(() => import('../Pages/ForgotPassword/ForgotPassword'));
const Index = lazy(() => import('../Pages/InfoUser'));
const LoginUser = lazy(() => import('../Pages/LoginUser/LoginUser'));
const RegisterUser = lazy(() => import('../Pages/Register/RegisterUser'));
const Checkout = lazy(() => import('../Pages/Checkout/PaymentSuccess'));
const ProductListing = lazy(() => import('../Pages/Category/Category'));
const Quotation = lazy(() => import('../Pages/Quotation/Quotation'));
const DetailBlogs = lazy(() => import('../Pages/DetailBlogs/DetailBlogs'));
const Contact = lazy(() => import('../Pages/Contact/Contact'));
const Blogs = lazy(() => import('../Pages/Blogs/Blogs'));
const SearchProduct = lazy(() => import('../Pages/SearchProduct/SearchProduct'));

export const publicRoutes = [
    { path: '/', component: <App /> },
    { path: '/login', component: <LoginUser /> },
    { path: '/register', component: <RegisterUser /> },
    { path: '/forgot-password', component: <ForgotPassword /> },
    { path: '/products', component: <ProductListing /> },
    { path: '/products/:id', component: <DetailProduct /> },
    { path: '/components', component: <ProductListing /> },
    { path: '/components/:componentType', component: <ProductListing /> },
    { path: '/categories/:id', component: <ProductListing /> },
    { path: '/blogs/:id', component: <DetailBlogs /> },
    { path: '/build-pc', component: <BuildPc /> },
    { path: '/orders/:orderCode/payment', component: <Checkout /> },
    { path: '/contact', component: <Contact /> },
    { path: '/blogs', component: <Blogs /> },
    { path: '/search/:category/:nameProduct', component: <SearchProduct /> },
    { path: '/cart', component: <Cart /> },
    { path: '/quotation', component: <Quotation /> },
];

export const privateRoutes = [
    { path: '/profile', component: <Index /> },
    { path: '/orders', component: <Index /> },
    { path: '/recently-viewed', component: <Index /> },
];

export const adminRoutes = [{ path: '/admin', component: <Admin /> }];
