import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import BrandMark from "../components/BrandMark";
import ComicCard from "../components/ComicCard";
import { getComics } from "../api/comics";
import { API_ORIGIN } from "../api/axios";
import "../styles/Home.css";
import "../styles/StorefrontRefresh.css";

function HomeDesign() {
    const location = useLocation();
    const [comics, setComics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const featuredComic = comics[0];
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchingComics = comics.filter((comic) => [comic.title, comic.author, comic.genre, comic.description].filter(Boolean).some((value) => value.toLowerCase().includes(normalizedQuery)));

    const getCoverUrl = (comic) => {
        const cover = comic?.cover_image || comic?.cover;
        if (!cover) return "";
        if (/^(https?:|data:)/.test(cover)) return cover;
        return cover.startsWith("/") ? `${API_ORIGIN}${cover}` : `${API_ORIGIN}/uploads/covers/${cover}`;
    };

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
    <div className="hero-content">
        <div className="hero-eyebrow mono">Original stories. Instant access.</div>
        <h1>READ BOLD.<br />OWN DIGITAL.</h1>
        <p className="hero-copy-box permanent-light-box">Digital-only comics from independent creators — delivered instantly, readable anywhere, and never out of print.</p>
        <div className="hero-actions">
            <button className="btn-primary" onClick={() => document.getElementById("browse").scrollIntoView({ behavior: "smooth" })}>Explore Comics</button>
            <button className="btn-ghost" onClick={() => document.getElementById("how").scrollIntoView({ behavior: "smooth" })}>How It Works</button>
        </div>
        <div className="hero-proof mono"><span>⚡ INSTANT DELIVERY</span><span>🔒 SECURE PAYMENT</span><span>∞ YOUR LIBRARY</span></div>
    </div>
    <div className="hero-showcase">
        <div className="burst"><span>DIGITAL<br />ORIGINALS</span></div>
        <div className="featured-issue">
            {featuredComic && getCoverUrl(featuredComic) ? <img src={getCoverUrl(featuredComic)} alt="" /> : <div className="featured-placeholder"><span className="mono">KEYRA ORIGINAL</span><strong>NEW WORLDS<br />LIVE HERE.</strong><small className="mono">ISSUE #001</small></div>}
        </div>
        <div className="featured-caption"><span className="mono">FEATURED DROP</span><strong>{featuredComic?.title || "THE FIRST WAVE"}</strong><small>{featuredComic ? `by ${featuredComic.author}` : "KeyraComics Originals"}</small></div>
    </div>
</section>
<div className="reader-promise" aria-label="KeyraComics benefits"><span><strong>BUY ONCE</strong><small>No subscription needed</small></span><span><strong>READ ANYWHERE</strong><small>Phone, tablet, or desktop</small></span><span><strong>KEEP YOUR SHELF</strong><small>Purchases stay in Library</small></span><span><strong>BACK NEW VOICES</strong><small>Independent creator stories</small></span></div>
<section className="reader-app-promo" aria-labelledby="reader-app-title">
    <div className="reader-app-stamp mono">NOW ON ANDROID</div>
    <div className="reader-app-copy">
        <p className="eyebrow mono">TAKE YOUR LIBRARY WITH YOU</p>
        <h2 id="reader-app-title">THE KEYRA<br />READER APP</h2>
        <p>
            Buy your comics here, then sign in to the Keyra Reader App to keep
            every purchased issue in one personal library.
        </p>
    </div>
    <div className="reader-app-actions">
        <a
            className="reader-app-button"
            href="https://expo.dev/artifacts/eas/Ht0pBERQQMQ_D1VrouR7KZZ7ld0rWEB9kloRAweDC4I.apk"
            download
        >
            Download Reader App <span aria-hidden="true">↓</span>
        </a>
        <a className="reader-app-web-link" href="/reader">Use on desktop →</a>
    </div>
</section>
<section
    className="section"
    id="browse"
>

    <div className="section-head storefront-section-head">
        <div><p className="mono section-kicker">FIND YOUR NEXT FIX</p><h2>Browse the Stack</h2></div>
        <p>{loading ? "Opening the vault…" : normalizedQuery ? `${matchingComics.length} result${matchingComics.length === 1 ? "" : "s"} for “${searchQuery.trim()}”` : `${comics.length} digital release${comics.length === 1 ? "" : "s"} ready to discover`}</p>
    </div>

    <div className="catalogue-search">
        <label htmlFor="comic-search"><span aria-hidden="true">⌕</span><input id="comic-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search comics, creators, or genres" /></label>
        {searchQuery && <button type="button" onClick={() => setSearchQuery("")}>Clear</button>}
    </div>

    {loading ? (
        <p className="mono" style={{ textAlign: "center", padding: "40px 0" }}>Loading comics...</p>
    ) : matchingComics.length > 0 ? (
        <div className="grid">
            {matchingComics.map((comic) => (
                <ComicCard key={comic.id} comic={comic} />
            ))}
        </div>
    ) : normalizedQuery ? (
        <section className="catalogue-no-results"><strong>No comics found.</strong><span>Try a different title, creator, or genre.</span></section>
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
