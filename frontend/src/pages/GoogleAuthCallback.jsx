import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/axios";
import BrandMark from "../components/BrandMark";
import "./Storefront.css";

function GoogleAuthCallback() {
    const navigate = useNavigate(); const [params] = useSearchParams(); const [message, setMessage] = useState("Signing you in with Google…");
    useEffect(() => { const code = params.get("code"); if (!code) { setMessage("Google sign-in could not be completed. Please try again."); return; } API.post("/auth/google/exchange", { code }).then(({ data }) => { localStorage.setItem("user", JSON.stringify(data.user)); localStorage.setItem("token", data.token); navigate(data.user?.role === "admin" ? "/admin" : "/", { replace: true }); }).catch((error) => setMessage(error.response?.data?.message || "Google sign-in could not be completed. Please try again.")); }, [navigate, params]);
    return <main className="account-page"><section className="account-card"><Link className="account-logo brand-link" to="/"><BrandMark height="44px" /></Link><h1>One moment…</h1><p className="account-copy">{message}</p>{message !== "Signing you in with Google…" && <Link className="store-button" to="/login">Back to log in</Link>}</section></main>;
}
export default GoogleAuthCallback;
