import { useNavigate } from "react-router-dom";

function Navbar() {
    const navigate = useNavigate();

    return (
        <nav className="nav">

            <a
                href="/"
                className="logo"
            >
                <span className="dot"></span>
                KEYRA COMICS
            </a>

            <div className="nav-links">

                <a href="#browse">
                    Browse
                </a>

                <a href="#how">
                    How It Works
                </a>

                <a href="#top">
                    About
                </a>

            </div>

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

        </nav>
    );
}

export default Navbar;
