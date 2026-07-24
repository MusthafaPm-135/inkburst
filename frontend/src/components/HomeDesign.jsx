import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getComics } from "../api/comics";
import ComicCard from "../components/ComicCard";
import "../styles/Home.css";

function HomeDesign() {
    const navigate = useNavigate();
    const [comics, setComics] = useState([]);

    useEffect(() => {
        loadComics();
    }, []);

    const loadComics = async () => {
        try {
            const data = await getComics();
            setComics(data);
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <>
        <nav className="nav">

    <a href="/" className="logo">
        <span className="dot"></span>
        INKBURST
    </a>

    <div className="nav-links">
        <a href="#browse">Browse</a>
        <a href="#how">How it works</a>
        <a href="#top">About</a>
    </div>

    <button
        className="cart-btn"
        onClick={() => navigate("/cart")}
    >
        🛒 Cart
    </button>

</nav>
<section className="hero">

    <div className="burst">
        <span>
            SOFT
            <br />
            COPIES
            <br />
            ONLY
        </span>
    </div>

    <div className="hero-eyebrow mono">
        No paper. No shipping. Just panels.
    </div>

    <h1>
        YOUR NEXT
        <br />
        OBSESSION IS
        <br />
        ONE CLICK AWAY.
    </h1>

    <p>
        Digital-only comics from independent creators —
        delivered instantly, readable anywhere,
        and never out of print.
    </p>

    <div className="hero-actions">

        <button
            className="btn-primary"
            onClick={() =>
                document
                    .getElementById("browse")
                    .scrollIntoView({ behavior: "smooth" })
            }
        >
            Start Reading
        </button>

        <button
            className="btn-ghost"
            onClick={() =>
                document
                    .getElementById("how")
                    .scrollIntoView({ behavior: "smooth" })
            }
        >
            How It Works
        </button>

    </div>

</section>
<section
    className="section"
    id="browse"
>

    <div className="section-head">
        <h2>Browse the Stack</h2>
    </div>

    <div className="grid">

    {comics.map((comic) => (

        <ComicCard
            key={comic.id}
            comic={comic}
        />

    ))}

</div>

</section>
<section className="section" id="how">

    <div className="section-head">
        <h2>How It Works</h2>
    </div>

    <div className="steps">

        <div className="step">
            <div className="num mono">01</div>
            <h3>Choose a Comic</h3>
            <p>
                Browse hundreds of premium comics and select your favourite.
            </p>
        </div>

        <div className="step">
            <div className="num mono">02</div>
            <h3>Secure Checkout</h3>
            <p>
                Login and pay securely using Razorpay, UPI, Cards or Net Banking.
            </p>
        </div>

        <div className="step">
            <div className="num mono">03</div>
            <h3>Read Forever</h3>
            <p>
                Purchased comics instantly appear in your Library where you can
                download them anytime.
            </p>
        </div>

    </div>

</section>
<footer>

    <a href="/" className="logo">
        <span className="dot"></span>
        INKBURST
    </a>

    <div className="mono">
        © 2026 Inkburst Digital Comics
    </div>

</footer>
        </>
    );
}

export default HomeDesign;