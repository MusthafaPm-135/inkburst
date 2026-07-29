import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import SiteHeader from "../components/SiteHeader";
import "./Storefront.css";

function Checkout() {
    const navigate = useNavigate(); const [items, setItems] = useState([]); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
    useEffect(() => { API.get("/cart").then((response) => setItems(response.data.cart)).catch(() => setMessage("Could not load your cart.")); }, []);
    const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0), [items]);
    const checkout = async () => { setBusy(true); setMessage(""); try { const response = await API.post("/orders/checkout"); setMessage(response.data.message || "Order complete."); setTimeout(() => navigate("/library"), 700); } catch (error) { setMessage(error.response?.data?.message || "Checkout could not be completed."); setBusy(false); } };
    return <><SiteHeader /><main className="store-page checkout-page"><p className="eyebrow">FINAL STEP</p><h1 className="store-title">Confirm your order</h1>{message && <p className="form-error">{message}</p>}{items.length === 0 ? <section className="empty-state"><h2>There is nothing to check out.</h2><Link className="store-button" to="/cart">Back to cart</Link></section> : <div className="checkout-layout"><section className="checkout-card"><h2>Your comics</h2>{items.map((item) => <div className="checkout-line" key={item.id}><span>{item.title}</span><strong>₹{Number(item.price).toFixed(2)}</strong></div>)}<div className="summary-total"><span>Total</span><strong>₹{total.toFixed(2)}</strong></div></section><section className="checkout-card"><h2>Payment</h2><p>This project currently records checkout as a completed demo payment. Connect Razorpay or Stripe before accepting real money.</p><button className="store-button" disabled={busy} onClick={checkout}>{busy ? "Completing order…" : `Complete demo order · ₹${total.toFixed(2)}`}</button><Link to="/cart">Back to cart</Link></section></div>}</main></>;
}
export default Checkout;
