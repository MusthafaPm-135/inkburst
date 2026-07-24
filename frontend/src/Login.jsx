import { useState } from "react";
import API from "./api/axios";

function Login(){

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

            const res = await API.post(
                "/auth/login",
                form,
                {
                    withCredentials: true
                }
            );


            localStorage.setItem("token", res.data.token);

                alert("Welcome " + res.data.user.username);

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