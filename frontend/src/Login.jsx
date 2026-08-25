import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import API from "../api/axios";

function Login() {
    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    // Normal email/password login
    const login = async (e) => {
        e.preventDefault();

        try {
            const res = await API.post(
                "/auth/login",
                form,
                {
                    withCredentials: true
                }
            );

            if (res.data.token) {
                localStorage.setItem("token", res.data.token);
            }

            alert("Welcome " + res.data.user.username);

            navigate("/");
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Login failed"
            );
        }
    };

    // Google login
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await API.post(
                "/auth/google",
                {
                    credential: credentialResponse.credential
                },
                {
                    withCredentials: true
                }
            );

            if (res.data.token) {
                localStorage.setItem("token", res.data.token);
            }

            alert("Welcome " + res.data.user.username);

            navigate("/");
        } catch (error) {
            console.error("Google login error:", error);

            alert(
                error.response?.data?.message ||
                "Google login failed"
            );
        }
    };

    const handleGoogleError = () => {
        alert("Google login failed. Please try again.");
    };

    return (
        <div>
            <h2>Login</h2>

            <form onSubmit={login}>
                <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                />

                <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    required
                />

                <button type="submit">
                    Login
                </button>
            </form>

            <div style={{ margin: "20px 0" }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px"
                    }}
                >
                    <span style={{ flex: 1 }}>────────</span>
                    <span>OR</span>
                    <span style={{ flex: 1 }}>────────</span>
                </div>
            </div>

            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
            />
        </div>
    );
}

export default Login;