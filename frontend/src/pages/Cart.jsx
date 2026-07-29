import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { API_ORIGIN } from "../api/axios";
import SiteHeader from "../components/SiteHeader";
import "./Storefront.css";

function Cart() {
    const navigate = useNavigate(); const [items, setItems] = useState([]); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(true);
    const load = async () => { try { const response = await API.get("/cart"); setItems(response.data.cart); } catch (error) { setMessage(error.response?.data?.message || "Could not load your cart."); } finally { setLoading(false); } };
    useEffect(() => { load(); }, []);
    const remove = async (id) => { try { await API.delete(`/cart/${id}`); setItems((current) => current.filter((item) => item.id !== id)); } catch { setMessage("Could not remove that comic."); } };
    const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0), [items]);
    return <><SiteHeader /><main className="store-page"><p className="eyebrow">YOUR SELECTION</p><h1 className="store-title">Shopping cart</h1>{message && <p className="form-error">{message}</p>}{loading ? <p>Loading your cart…</p> : items.length === 0 ? <section className="empty-state"><h2>Your cart is empty.</h2><Link className="store-button" to="/#browse">Browse comics</Link></section> : <div className="cart-layout"><section className="cart-list">{items.map((item) => <article className="cart-row" key={item.id}><img src={`${API_ORIGIN}/uploads/covers/${item.cover_image}`} alt="" /><div><h2>{item.title}</h2><p>{item.author}</p><strong>₹{Number(item.price).toFixed(2)}</strong></div><button className="text-danger" onClick={() => remove(item.id)}>Remove</button></article>)}</section><aside className="order-summary"><h2>Order summary</h2><div><span>Comics ({items.length})</span><strong>₹{total.toFixed(2)}</strong></div><div className="summary-total"><span>Total</span><strong>₹{total.toFixed(2)}</strong></div><button className="store-button" onClick={() => navigate("/checkout")}>Continue to checkout</button><Link to="/#browse">Keep browsing</Link></aside></div>}</main></>;
}
export default Cart;
