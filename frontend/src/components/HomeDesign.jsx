import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import BrandMark from "../components/BrandMark";
import ComicCard from "../components/ComicCard";
import { getComics } from "../api/comics";
import "../styles/Home.css";

function HomeDesign() {
    const location = useLocation();
    const [comics, setComics] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getComics()
            .then((data) => setComics(data || []))
            .catch((err) => console.error("Error fetching comics:", err))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const sectionId = location.hash.slice(1);
        if (!sectionId) return;

        requestAnimationFrame(() => {
            document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
        });
    }, [location.hash]);

    return (
        <>
        <SiteHeader />
<section className="hero" id="top">

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

    <p className="hero-copy-box permanent-light-box">
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

    {loading ? (
        <p className="mono" style={{ textAlign: "center", padding: "40px 0" }}>Loading comics...</p>
    ) : comics && comics.length > 0 ? (
        <div className="grid">
            {comics.map((comic) => (
                <ComicCard key={comic.id} comic={comic} />
            ))}
        </div>
    ) : (
        <section className="coming-soon" aria-labelledby="coming-soon-title">
            <div className="coming-soon-burst" aria-hidden="true">POW!</div>
            <p className="coming-soon-kicker mono">ISSUE #001 IS IN THE WORKS</p>
            <h3 id="coming-soon-title">New worlds are<br />coming soon.</h3>
            <p>Our first original stories are being drawn, inked, and lettered. Join us when the first panels hit the shelf.</p>
            <span className="coming-soon-stamp mono">STAY TUNED</span>
        </section>
    )}

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
<section className="section about-section" id="about">
    <div className="section-head">
        <h2>About Keyra Comics</h2>
    </div>
    <div className="about-grid">
        <div className="about-copy">
            <p className="eyebrow mono">STORIES WITHOUT THE WAIT</p>
            <h3>Independent comics, always within reach.</h3>
            <p>Keyra Comics is a digital shelf for readers who love bold art, big ideas, and the feeling of discovering a new favourite issue.</p>
            <p>Every comic is delivered digitally, so you can build your library, return to your purchases, and keep reading wherever you are.</p>
        </div>
        <div className="about-points">
            <div><strong>Digital-first</strong><span>No shipping. No paper. Just panels.</span></div>
            <div><strong>Reader-owned</strong><span>Purchased comics stay in your library.</span></div>
            <div><strong>Creator-led</strong><span>A home for memorable independent stories.</span></div>
        </div>
    </div>
</section>
<footer>

    <a href="/" className="logo brand-link"><BrandMark /></a>

    <div className="mono">
        © 2026 Keyra Digital Comics
    </div>

</footer>
        </>
    );
}

export default HomeDesign;
