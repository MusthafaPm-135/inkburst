import { useEffect, useState } from "react";
import API, { API_ORIGIN } from "../api/axios";
import SiteHeader from "../components/SiteHeader";
import "./Storefront.css";

function Library() {
    const [orders, setOrders] = useState([]); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(true);
    useEffect(() => { API.get("/orders").then((response) => setOrders(response.data.orders)).catch((error) => setMessage(error.response?.data?.message || "Could not load your library.")).finally(() => setLoading(false)); }, []);
    return <><SiteHeader /><main className="store-page"><p className="eyebrow">OWNED BY YOU</p><h1 className="store-title">Your library</h1>{message && <p className="form-error">{message}</p>}{loading ? <p>Loading your comics…</p> : orders.length === 0 ? <section className="empty-state"><h2>Your shelf is waiting.</h2><p>Comics you purchase will appear here.</p></section> : <div className="library-grid">{orders.map((order) => <article className="library-card" key={order.id}><img src={`${API_ORIGIN}/uploads/covers/${order.cover_image}`} alt={order.title} /><div><span className="card-genre">PURCHASED</span><h2>{order.title}</h2><p>{order.author}</p><p>Purchased {new Date(order.purchased_at).toLocaleDateString()}</p><a className="store-button" href={`${API.defaults.baseURL}/orders/read/${order.comic_id}`} target="_blank" rel="noreferrer">Read comic</a></div></article>)}</div>}</main></>;
}
export default Library;
