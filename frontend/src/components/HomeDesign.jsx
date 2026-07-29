import { useEffect, useState } from "react";
import { getComics } from "../api/comics";
import ComicCard from "../components/ComicCard";
import SiteHeader from "../components/SiteHeader";
import BrandMark from "../components/BrandMark";
import "../styles/Home.css";

function HomeDesign() {
    const [comics, setComics] = useState([]);
    const [activeGenre, setActiveGenre] = useState("All");

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

    const genres = ["All", ...new Set(comics.map((comic) => comic.genre).filter(Boolean))];
    const visibleComics = activeGenre === "All" ? comics : comics.filter((comic) => comic.genre === activeGenre);

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
        <div className="filters" aria-label="Filter comics by genre">
            {genres.map((genre) => <button key={genre} className={`chip ${activeGenre === genre ? "active" : ""}`} onClick={() => setActiveGenre(genre)}>{genre}</button>)}
        </div>
    </div>

    <div className="grid">

    {visibleComics.map((comic) => (

        <ComicCard
            key={comic.id}
            comic={comic}
        />

    ))}

    {visibleComics.length === 0 && <p className="browse-empty">No comics in this category yet.</p>}

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
        © 2026 Inkburst Digital Comics
    </div>

</footer>
        </>
    );
}

export default HomeDesign;
