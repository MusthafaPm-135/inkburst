import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/axios";
import BrandMark from "./BrandMark";

function SiteHeader() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const [cartCount, setCartCount] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        if (!user) return;
        API.get("/cart").then((response) => setCartCount(response.data.cart?.length || 0)).catch(() => setCartCount(0));
    }, []);

    const logout = async () => {
        try { await API.post("/auth/logout"); } catch { /* local session is cleared either way */ }
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        closeMenu();
        navigate("/");
    };

    const closeMenu = () => setIsMenuOpen(false);
    const goToSection = (section) => {
        closeMenu();
        if (location.pathname === "/") {
            document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
            return;
        }
        navigate(`/#${section}`);
    };

    return <nav className="nav">
        <Link to="/" className="logo brand-link">
    <BrandMark />
</Link>
        <div className={`nav-links ${isMenuOpen ? "active" : ""}`} id="site-navigation">
            <button className="nav-section-link" type="button" onClick={() => goToSection("browse")}>Browse</button>
            <button className="nav-section-link" type="button" onClick={() => goToSection("how")}>How it works</button>
            <button className="nav-section-link" type="button" onClick={() => goToSection("about")}>About</button>
            {!user && <><Link className="mobile-auth-link" to="/login" onClick={closeMenu}>Log in</Link><Link className="mobile-auth-link mobile-signup-link" to="/register" onClick={closeMenu}>Sign up</Link></>}
            {user && <button className="nav-section-link mobile-auth-link" type="button" onClick={logout}>Log out</button>}
            {user?.role === "admin" && <Link className="admin-nav-link" to="/admin" onClick={closeMenu}>Admin</Link>}
        </div>
        <div className="nav-actions">
            

{user ? (
    <>
        <Link className="auth-link" to="/library">
            Library
        </Link>

        <button className="auth-link auth-button" onClick={logout}>
            Log out
        </button>
    </>
) : (
    <>
        <Link className="auth-link" to="/login">
            Log in
        </Link>

        <Link className="signup-link" to="/register">
            Sign up
        </Link>
    </>
)}
            <Link className="cart-btn" to="/cart"><span aria-hidden="true">🛒</span><span>Cart</span><span className="cart-count mono">{cartCount}</span></Link>
            <button className="hamburger-btn" type="button" aria-label="Toggle navigation menu" aria-controls="site-navigation" aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((open) => !open)}>
                <span aria-hidden="true">{isMenuOpen ? "×" : "☰"}</span>
            </button>
        </div>
    </nav>;
}

export default SiteHeader;
