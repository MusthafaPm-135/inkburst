import { useEffect, useState } from "react";
import API, { API_ORIGIN } from "../api/axios";
import SiteHeader from "../components/SiteHeader";
import "./Storefront.css";

function Library() {
    const [orders, setOrders] = useState([]); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(true); const [readingId, setReadingId] = useState(null);
    useEffect(() => { API.post("/orders/recover").catch(() => null).finally(() => { API.get("/orders").then((response) => setOrders(response.data.orders)).catch((error) => setMessage(error.response?.data?.message || "Could not load your library.")).finally(() => setLoading(false)); }); }, []);
    
    const getCoverUrl = (cover) => {
        if (!cover) return "";
        if (cover.startsWith("http://") || cover.startsWith("https://")) return cover;
        if (cover.startsWith("/")) return `${API_ORIGIN}${cover}`;
        return `${API_ORIGIN}/uploads/covers/${cover}`;
    };

    const readComic = async (comicId) => {
        // Open the tab synchronously so mobile Safari allows it, then load the
        // protected PDF through the authenticated API client.
        const readerWindow = window.open("", "_blank");
        try {
            setMessage("");
            setReadingId(comicId);
            const response = await API.get(`/orders/read/${comicId}`, { responseType: "blob" });
            const contentType = response.headers["content-type"] || "application/pdf";
            const readerUrl = URL.createObjectURL(new Blob([response.data], { type: contentType }));
            if (readerWindow) {
                readerWindow.location.replace(readerUrl);
            } else {
                window.location.assign(readerUrl);
            }
            window.setTimeout(() => URL.revokeObjectURL(readerUrl), 60 * 60 * 1000);
        } catch (error) {
            readerWindow?.close();
            setMessage(error.response?.data?.message || "Could not open this comic. Please contact support if the problem continues.");
        } finally {
            setReadingId(null);
        }
    };

    return <><SiteHeader /><main className="store-page"><p className="eyebrow">OWNED BY YOU</p><h1 className="store-title">Your library</h1>{message && <p className="form-error">{message}</p>}{loading ? <p>Loading your comics…</p> : orders.length === 0 ? <section className="empty-state"><h2>Your shelf is waiting.</h2><p>Comics you purchase will appear here.</p></section> : <div className="library-grid">{orders.map((order) => <article className="library-card" key={order.id}><img src={getCoverUrl(order.cover_image)} alt={order.title} /><div><span className="card-genre">PURCHASED</span><h2>{order.title}</h2><p>{order.author}</p><p>Purchased {new Date(order.purchased_at).toLocaleDateString()}</p><button className="store-button" type="button" onClick={() => readComic(order.comic_id)} disabled={readingId === order.comic_id}>{readingId === order.comic_id ? "Opening…" : "Read comic"}</button></div></article>)}</div>}</main></>;
}
export default Library;
