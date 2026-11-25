import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import ComicCard from "../components/ComicCard";
import { getComics } from "../api/comics";
import API, { API_ORIGIN } from "../api/axios";

function coverUrl(comic) {
    const cover = comic?.cover_image || comic?.cover;
    if (!cover) return "";
    if (/^(https?:|data:)/.test(cover)) return cover;
    return cover.startsWith("/") ? `${API_ORIGIN}${cover}` : `${API_ORIGIN}/uploads/covers/${cover}`;
}
export default function ComicDetail() {
    const { comicId } = useParams();
    const navigate = useNavigate();
    const [comics, setComics] = useState([]);
    const [tab, setTab] = useState("synopsis");
    const [busy, setBusy] = useState(false);
    useEffect(() => { getComics().then(setComics); }, []);
    const comic = comics.find(c => String(c.id) === String(comicId));
    const addToCart = async () => {
        if (!localStorage.getItem("user")) return navigate("/login");
        setBusy(true);
        try { await API.post("/cart/add", { comicId: comic.id }); navigate("/cart"); }
        catch(error) { alert(error.response?.data?.message || "Could not add this comic to your cart."); }
        finally { setBusy(false); }
    };
    return <><SiteHeader/><main className="detail-page"><div className="shop-breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/shop">Shop</Link><span>/</span><b>{comic?.title || "Comic details"}</b></div>{!comic?<section className="detail-missing"><h1>Comic not found</h1><p>This issue may no longer be available.</p><Link className="store-button" to="/shop">Back to shop</Link></section>:<><div className="detail-main"><div className="detail-art"><img src={coverUrl(comic)} alt={`${comic.title} cover`} onError={e=>{e.currentTarget.style.visibility="hidden"}}/></div><div className="detail-copy"><p className="eyebrow">{comic.genre || "DIGITAL COMIC"} · ISSUE #{String(comic.id).padStart(3,"0")}</p><h1>{comic.title}</h1><p className="detail-byline">By {comic.author || "Keyra Comics"}</p><p className="detail-rating">Digital edition <span>•</span> Instant library access</p><div className="detail-price">₹{Number(comic.price).toFixed(2)}</div><button className="detail-add" disabled={busy} onClick={addToCart}>{busy?"Adding…":"ADD TO CART"}</button><p className="detail-assurance">Secure checkout · Read in your Keyra library</p></div></div><div className="detail-tabs"><div className="detail-tab-buttons"><button className={tab==="synopsis"?"active":""} onClick={()=>setTab("synopsis")}>Synopsis</button><button className={tab==="creator"?"active":""} onClick={()=>setTab("creator")}>Creator details</button></div><div className="detail-tab-content">{tab==="synopsis"?<><h2>About this issue</h2><p>{comic.description || "A digital comic edition from KeyraComics."}</p></>:<><h2>Creator</h2><p>{comic.author || "Keyra Comics"}{comic.genre?` · ${comic.genre}`:""}</p></>}</div></div>{comics.length>1&&<section className="detail-related"><div className="section-head"><h2>You might also like</h2><Link to="/shop">View all →</Link></div><div className="grid">{comics.filter(c=>String(c.id)!==String(comic.id)).slice(0,4).map(c=><ComicCard key={c.id} comic={c}/>)}</div></section>}</>}</main></>;
}

