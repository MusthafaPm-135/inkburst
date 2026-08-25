import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BrandMark from "./BrandMark";
import API from "../api/axios";

function Navbar() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState(null);

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("keyra-theme") || "system";
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("keyra-theme", theme);
    }, [theme]);

    const cycleTheme = () => {
        setTheme((current) => {
            if (current === "system") return "light";
            if (current === "light") return "dark";
            return "system";
        });
    };

    const themeLabel =
        theme === "system"
            ? "Device"
            : theme === "light"
            ? "Light"
            : "Dark";

    const themeIcon =
        theme === "system"
            ? "💻"
            : theme === "light"
            ? "☀️"
            : "🌙";

    const loadUser = async () => {
        const savedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (savedUser) {
            setUser(JSON.parse(savedUser));
            return;
        }

        if (!token) {
            setUser(null);
            return;
        }

        try {
            const res = await API.get("/auth/me", {
                withCredentials: true
            });

            if (res.data.user) {
                setUser(res.data.user);
                localStorage.setItem("user", JSON.stringify(res.data.user));
            }
        } catch (error) {
            setUser(null);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        }
    };

    useEffect(() => {
        loadUser();

        const handleAuthChange = () => {
            loadUser();
        };

        window.addEventListener("authChanged", handleAuthChange);

        return () => {
            window.removeEventListener("authChanged", handleAuthChange);
        };
    }, []);

    const handleLinkClick = () => {
        setIsOpen(false);
    };

    const logout = async () => {
        try {
            await API.post("/auth/logout", {}, { withCredentials: true });
        } catch (error) {
            console.error("Logout error:", error);
        }

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        window.dispatchEvent(new Event("authChanged"));
        navigate("/login");
    };

    return (
        <nav className="nav">
            <a href="/" className="logo brand-link">
                <BrandMark height="40px" />
            </a>

            <div className={`nav-links ${isOpen ? "active" : ""}`}>
                <a href="/#browse" onClick={handleLinkClick}>
                    Browse
                </a>
                <a href="/#how" onClick={handleLinkClick}>
                    How It Works
                </a>
                <a href="/#top" onClick={handleLinkClick}>
                    About
                </a>
            </div>

            <div className="nav-actions">
                <button
                    type="button"
                    className="theme-toggle-btn"
                    onClick={cycleTheme}
                    title="Switch theme"
                >
                    <span>{themeIcon}</span>
                    <span>{themeLabel}</span>
                </button>

                {user ? (
                    <>
                        <button onClick={() => navigate("/library")}>
                            Library
                        </button>

                        {user.role === "admin" && (
                            <button onClick={() => navigate("/admin")}>
                                Admin
                            </button>
                        )}

                        <button onClick={logout}>
                            Log Out
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={() => navigate("/login")}>
                            Log In
                        </button>

                        <button onClick={() => navigate("/signup")}>
                            Sign Up
                        </button>
                    </>
                )}

                <button
                    className="cart-btn"
                    onClick={() => navigate("/cart")}
                >
                    🛒
                    <span>Cart</span>
                    <span className="cart-count mono">0</span>
                </button>

                <button
                    className="hamburger-btn"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle navigation menu"
                >
                    {isOpen ? "✕" : "☰"}
                </button>
            </div>
        </nav>
    );
}

export default Navbar;