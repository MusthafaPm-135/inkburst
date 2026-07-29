import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Navbar() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const handleLinkClick = () => {
        setIsOpen(false);
    };

    return (
        <nav className="nav">
            <a href="/" className="logo">
                {/* <span className="dot"></span> */ }
                {/* KEYRA COMICS */ }
                <img 
                    src={LOGO_URL} 
                    alt="KEYRA COMICS" 
                    className="site-logo-image" 
                    style={{ height: "40px", width: "auto", display: "block" }} 
                />
            </a>

            <div className={`nav-links ${isOpen ? "active" : ""}`}>
                <a href="#browse" onClick={handleLinkClick}>
                    Browse
                </a>
                <a href="#how" onClick={handleLinkClick}>
                    How It Works
                </a>
                <a href="#top" onClick={handleLinkClick}>
                    About
                </a>
            </div>

            <div className="nav-actions">
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