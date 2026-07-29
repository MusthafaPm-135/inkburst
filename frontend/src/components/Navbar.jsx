import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Navbar() {
    const navigate = useNavigate();
    // 1. State to track if the mobile menu is open
    const [isOpen, setIsOpen] = useState(false);

    const handleLinkClick = () => {
        setIsOpen(false); // Close menu when a link is tapped
    };

    return (
        <nav className="nav">
            <a href="/" className="logo">
                <span className="dot"></span>
                KEYRA COMICS
            </a>

            {/* 2. Toggle 'active' class based on state */}
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

            <div className="nav-actions" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                    className="cart-btn"
                    onClick={() => navigate("/cart")}
                >
                    🛒
                    <span>Cart</span>
                    <span className="cart-count mono">0</span>
                </button>

                {/* 3. The Hamburger Menu Button */}
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