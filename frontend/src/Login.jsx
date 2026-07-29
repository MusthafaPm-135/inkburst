import { useState } from "react";
import { useNavigate } from "react-router-dom"; // 1. ADD THIS IMPORT
import API from "../api/axios"; // (Make sure this path is correct based on where your Login.jsx is!)

function Login() {
    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const navigate = useNavigate(); // 2. INITIALIZE THE HOOK HERE

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

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

            // You nailed this part! The token is saved safely.
            localStorage.setItem("token", res.data.token);

            alert("Welcome " + res.data.user.username);

            // Now this will work perfectly!
            navigate("/");

        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Login failed"
            );
        }
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
                />
                <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                />
                <button type="submit">
                    Login
                </button>
            </form>
        </div>
    );
}

export default Login;