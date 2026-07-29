import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/axios";
import BrandMark from "./BrandMark";

function SiteHeader() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        if (!user) return;
        API.get("/cart").then((response) => setCartCount(response.data.cart?.length || 0)).catch(() => setCartCount(0));
    }, []);

    const logout = async () => {
        try { await API.post("/auth/logout"); } catch { /* local session is cleared either way */ }
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    return <nav className="nav">
        <Link to="/" className="logo brand-link"><BrandMark /></Link>
        <div className="nav-links"><Link to="/#browse">Browse</Link><Link to="/#how">How it works</Link><Link to="/#about">About</Link>{user?.role === "admin" && <Link className="admin-nav-link" to="/admin">Admin</Link>}</div>
        <div className="nav-actions">
            {user ? <><Link className="auth-link" to="/library">Library</Link><button className="auth-link auth-button" onClick={logout}>Log out</button></> : <><Link className="auth-link" to="/login">Log in</Link><Link className="signup-link" to="/register">Sign up</Link></>}
            <Link className="cart-btn" to="/cart"><span aria-hidden="true">🛒</span><span>Cart</span><span className="cart-count mono">{cartCount}</span></Link>
        </div>
    </nav>;
}

export default SiteHeader;
