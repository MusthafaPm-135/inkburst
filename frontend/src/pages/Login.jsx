import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API from "../api/axios";
import BrandMark from "../components/BrandMark";
import "./Storefront.css";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (event) => {
        event.preventDefault(); setBusy(true); setError("");
        try {
            const response = await API.post("/auth/login", form);
            localStorage.setItem("user", JSON.stringify(response.data.user));
            localStorage.setItem("token", response.data.token);
            navigate(response.data.user?.role === "admin" ? "/admin" : (location.state?.from || "/"));
        } catch (requestError) { setError(requestError.response?.data?.message || "Login failed. Please try again."); }
        finally { setBusy(false); }
    };

    return <main className="account-page"><section className="account-card"><Link className="account-logo brand-link" to="/"><BrandMark height="44px" /></Link><p className="eyebrow">WELCOME BACK</p><h1>Pick up where you left off.</h1><p className="account-copy">Log in to manage your cart and read your purchased comics.</p>{error && <p className="form-error">{error}</p>}<form onSubmit={submit} className="account-form"><label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Password<input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label><button className="store-button" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button></form><p>New here? <Link to="/register">Create an account</Link></p></section></main>;
}
export default Login;
