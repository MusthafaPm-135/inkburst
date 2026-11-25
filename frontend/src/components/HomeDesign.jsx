import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "./SiteHeader";
import BrandMark from "./BrandMark";
import ComicCard from "./ComicCard";
import { getComics } from "../api/comics";
import { API_ORIGIN } from "../api/axios";

function getCoverUrl(comic) {
    const cover = comic?.cover_image || comic?.cover;
    if (!cover) return "";
    if (/^(https?:|data:)/.test(cover)) return cover;
    return cover.startsWith("/") ? `${API_ORIGIN}${cover}` : `${API_ORIGIN}/uploads/covers/${cover}`;
}

export default function HomeDesign() {
    const [comics, setComics] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => { getComics().then(setComics).finally(() => setLoading(false)); }, []);
    const featured = comics[0];
    return <><SiteHeader/><main className="home-page">
        <section className="home-hero"><div className="home-hero-copy"><p className="eyebrow">KEYRACOMICS · DIGITAL COMIC SHOP</p><h1>{featured?"THIS WEEK’S TOP DROPS":"YOUR NEXT FAVORITE STORY"}</h1><p>{featured?`Discover ${featured.title} and the latest releases.`:"Explore independent stories, collect your favorites, and read anywhere."}</p><div className="home-hero-actions"><Link to="/shop" className="store-button">Shop comics</Link><Link to="/reader" className="button-outline">Reader app</Link></div></div>{featured?<Link className="hero-feature-cover" to={`/comics/${featured.id}`}><img src={getCoverUrl(featured)} alt={`${featured.title} cover`}/><span>FEATURED ISSUE</span></Link>:<div className="hero-placeholder"><span>KEYRA ORIGINALS</span><strong>NEW WORLDS<br/>COMING SOON</strong><small>YOUR DIGITAL SHELF STARTS HERE</small></div>}</section>
        <section className="home-section" id="arrivals"><div className="home-section-heading"><div><p className="eyebrow">JUST ADDED TO THE SHELF</p><h2>New arrivals</h2></div><Link to="/shop">View all →</Link></div>{loading?<p className="shop-empty">Opening the vault…</p>:comics.length?<div className="grid home-product-grid">{comics.slice(0,4).map(comic=><ComicCard key={comic.id} comic={comic}/>)}</div>:<div className="home-empty"><strong>First issues are on the way.</strong><span>Our shelves will fill with original comics soon.</span></div>}</section>
        <section className="reader-banner"><div className="reader-banner-badge">KEYRA<br/>READER</div><div><p className="eyebrow">YOUR LIBRARY, EVERYWHERE</p><h2>Keep your comics close.</h2><p>Read purchased issues in your Keyra Reader app on Android or desktop.</p></div><div className="reader-banner-actions"><a href="https://expo.dev/artifacts/eas/Ht0pBERQQMQ_D1VrouR7KZZ7ld0rWEB9kloRAweDC4I.apk" download className="store-button">Download app ↓</a><Link to="/reader">Open reader →</Link></div></section>
        <section className="home-section home-story" id="how"><div className="home-section-heading"><div><p className="eyebrow">A SIMPLE WAY TO READ</p><h2>Latest from Keyra</h2></div></div><div className="home-feature-tiles"><article><span>01 · DISCOVER</span><h3>Find your next world.</h3><p>Browse our live catalog and explore stories by title, creator, or genre.</p><Link to="/shop">Explore the shop →</Link></article><article><span>02 · COLLECT</span><h3>Your shelf, yours to keep.</h3><p>Buy a digital issue once and keep it available in your Keyra library.</p><Link to="/login">Visit your library →</Link></article><article><span>03 · READ</span><h3>Pick up anywhere.</h3><p>Use the Keyra Reader app to continue reading on your device.</p><Link to="/reader">Meet the reader →</Link></article></div></section>
        <section className="home-about" id="about"><div><p className="eyebrow">ABOUT THE CRATER</p><h2>Stories worth keeping.</h2><p>KeyraComics is a digital shelf for independent comic stories and the readers who love them.</p></div><Link to="/shop" className="button-outline">Explore the shop</Link></section>
    </main><footer className="site-footer"><Link to="/" className="logo brand-link"><BrandMark/></Link><div><b>Explore</b><Link to="/shop">Shop comics</Link><Link to="/reader">Reader app</Link></div><div><b>Your account</b><Link to="/library">Library</Link><Link to="/cart">Cart</Link></div><small>© 2026 Keyra Digital Comics</small></footer></>;
}

