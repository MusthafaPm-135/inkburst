import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Navbar() {
    const navigate = useNavigate();
    // 1. Add state to track if the mobile menu is open or closed
    const [isOpen, setIsOpen] = useState(false);

    // Close the menu when a link is clicked
    const handleLinkClick = () => {
        setIsOpen(false);
    };

    return (
        <nav className="nav">
            <a
                href="/"
                className="logo"
            >
                <span className="dot"></span>
                KEYRA COMICS
            </a>

            {/* 2. Dynamically add 'active' class when isOpen is true */}
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

            <div className="nav-actions" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <button
                    className="cart-btn"
                    onClick={() => navigate("/cart")}
                >
                    🛒
                    <span>Cart</span>
                    <span className="cart-count mono">
                        0
                    </span>
                </button>

                {/* 3. Hamburger Toggle Button (Hidden on desktop via CSS if desired) */}
                <button 
                    className="hamburger-btn" 
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle navigation menu"
                    style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "var(--text-h)" }}
                >
                    {isOpen ? "✕" : "☰"}
                </button>
            </div>
        </nav>
    );
}

export default Navbar;