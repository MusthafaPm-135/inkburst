import { useState } from "react";
import API from "./api/axios";

function Signup(){

    const [form,setForm] = useState({
        username:"",
        email:"",
        password:""
    });


    const handleChange = (e)=>{
        setForm({
            ...form,
            [e.target.name]:e.target.value
        });
    };


    const register = async(e)=>{

        e.preventDefault();

        try{

            const res = await API.post(
                "/auth/register",
                form
            );

            alert(res.data.message);

        }catch(error){

            alert(
                error.response?.data?.message ||
                "Registration failed"
            );

        }

    };


    return(
        <div>

            <h2>Create Account</h2>

            <form onSubmit={register}>

                <input
                name="username"
                placeholder="Username"
                onChange={handleChange}
                />

                <input
                name="email"
                placeholder="Email"
                onChange={handleChange}
                />

                <input
                name="password"
                type="password"
                placeholder="Password"
                onChange={handleChange}
                />

                <button>
                    Register
                </button>

            </form>

        </div>
    );
}


export default Signup;