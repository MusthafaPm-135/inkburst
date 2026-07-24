import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function Login() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const login = async (e) => {

        e.preventDefault();

        try {

            const res = await API.post("/auth/login", form);

console.log("LOGIN RESPONSE:", res.data);

localStorage.setItem("token", res.data.token);
localStorage.setItem("user", JSON.stringify(res.data.user));

console.log("TOKEN:", localStorage.getItem("token"));

alert("Login Successful");

navigate("/cart");

        } catch (err) {

            alert(
                err.response?.data?.message ||
                "Login Failed"
            );

        }

    };

    return (

        <div>

            <h2>Login</h2>

            <form onSubmit={login}>

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    onChange={handleChange}
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
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