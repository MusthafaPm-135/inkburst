import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function GoogleCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        const finishGoogleLogin = async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get("code");

            if (!code) {
                alert("Google login failed. Missing code.");
                navigate("/login");
                return;
            }

            try {
                const res = await API.post(
                    "/auth/google/exchange",
                    { code },
                    { withCredentials: true }
                );

                if (res.data.token) {
                    localStorage.setItem("token", res.data.token);
                }

                if (res.data.user) {
                    localStorage.setItem("user", JSON.stringify(res.data.user));
                }

                window.dispatchEvent(new Event("authChanged"));

                navigate("/");
            } catch (error) {
                console.error("Google callback error:", error);
                alert(
                    error.response?.data?.message ||
                    "Google login failed"
                );
                navigate("/login");
            }
        };

        finishGoogleLogin();
    }, [navigate]);

    return (
        <div style={{ padding: "40px", textAlign: "center" }}>
            <h2>Signing you in...</h2>
        </div>
    );
}

export default GoogleCallback;