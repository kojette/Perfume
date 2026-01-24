import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';

    if (!isLoggedIn) {
        alert('로그인이 필요합니다.');
        return <Navigate to = "/login" replace />;
    }

    if (!isAdmin) {
        alert('관리자 권한이 필요합니다.');
        return <Navigate to = '/' replace />;
    }

    return children;
};

export default AdminRoute;