import { Navigate, Outlet, useLocation } from "react-router-dom";

function AdminRoute() {
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!localStorage.getItem("token")) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (user?.role !== "admin") {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}

export default AdminRoute;
