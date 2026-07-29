import { Navigate, Outlet, useLocation } from "react-router-dom";

function RequireAuth() {
    const location = useLocation();
    if (!localStorage.getItem("user")) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    return <Outlet />;
}

export default RequireAuth;
