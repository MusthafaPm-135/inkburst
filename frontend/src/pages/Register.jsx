import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import BrandMark from "../components/BrandMark";
import GoogleAuthButton from "../components/GoogleAuthButton";
import "./Storefront.css";

function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: "", email: "", password: "" });
    const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
    const submit = async (event) => { event.preventDefault(); setBusy(true); setError(""); try { await API.post("/auth/register", form); navigate("/login", { state: { message: "Account created. Please log in." } }); } catch (requestError) { setError(requestError.response?.data?.message || "Could not create your account."); } finally { setBusy(false); } };
    return <main className="account-page"><section className="account-card"><Link className="account-logo brand-link" to="/"><BrandMark height="44px" /></Link><p className="eyebrow">NEW READER</p><h1>Build your comic shelf.</h1><p className="account-copy">Create an account to purchase and read digital comics.</p>{error && <p className="form-error">{error}</p>}<GoogleAuthButton /><div className="auth-divider"><span>or sign up with email</span></div><form className="account-form" onSubmit={submit}><label>Name<input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label><label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Password <small>(at least 6 characters)</small><input required minLength="6" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label><button className="store-button" disabled={busy}>{busy ? "Creating…" : "Create account"}</button></form><p>Already a reader? <Link to="/login">Log in</Link></p></section></main>;
}
export default Register;
