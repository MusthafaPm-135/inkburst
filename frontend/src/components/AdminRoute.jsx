import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import API from "../api/axios";

function AdminRoute({ children }) {
    const [status, setStatus] = useState("checking");

    useEffect(() => {
        API.get("/auth/me")
            .then((response) => {
                setStatus(response.data.user?.role === "admin" ? "allowed" : "denied");
            })
            .catch((error) => {
                setStatus(error.response?.status === 401 ? "login" : "denied");
            });
    }, []);

    if (status === "checking") {
        return <p style={{ padding: "2rem" }}>Checking access…</p>;
    }

    if (status === "allowed") {
        return children;
    }

    return <Navigate to={status === "login" ? "/login" : "/"} replace />;
}

export default AdminRoute;
