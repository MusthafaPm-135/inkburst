import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import SiteHeader from "../components/SiteHeader";
import "./Storefront.css";

const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
});

function Checkout() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        API.get("/cart").then((response) => setItems(response.data.cart)).catch(() => setMessage("Could not load your cart."));
    }, []);

    const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0), [items]);

    const checkout = async () => {
        setBusy(true);
        setMessage("");
        try {
            if (!await loadRazorpay()) throw new Error("Razorpay could not be loaded. Please check your connection and try again.");
            const { data } = await API.post("/orders/create-payment");

            await new Promise((resolve, reject) => {
                const razorpay = new window.Razorpay({
                    key: data.key,
                    amount: data.order.amount,
                    currency: data.order.currency,
                    name: "Keyra Comics",
                    description: `${data.itemCount} digital comic${data.itemCount === 1 ? "" : "s"}`,
                    order_id: data.order.id,
                    theme: { color: "#d3283c" },
                    handler: async (payment) => {
                        try {
                            await API.post("/orders/verify-payment", payment);
                            resolve();
                        } catch (error) {
                            reject(new Error(error.response?.data?.message || "We could not verify your payment."));
                        }
                    },
                    modal: { ondismiss: () => reject(new Error("Payment cancelled.")) }
                });
                razorpay.open();
            });
            navigate("/library", { replace: true });
        } catch (error) {
            setMessage(error.response?.data?.message || error.message || "Payment could not be completed.");
            setBusy(false);
        }
    };

    return <><SiteHeader /><main className="store-page checkout-page"><p className="eyebrow">FINAL STEP</p><h1 className="store-title">Confirm your order</h1>{message && <p className="form-error">{message}</p>}{items.length === 0 ? <section className="empty-state"><h2>There is nothing to check out.</h2><Link className="store-button" to="/cart">Back to cart</Link></section> : <div className="checkout-layout"><section className="checkout-card"><h2>Your comics</h2>{items.map((item) => <div className="checkout-line" key={item.id}><span>{item.title}</span><strong>₹{Number(item.price).toFixed(2)}</strong></div>)}<div className="summary-total"><span>Total</span><strong>₹{total.toFixed(2)}</strong></div></section><section className="checkout-card"><h2>Secure payment</h2><p>Pay securely with Razorpay using UPI, cards, net banking, or wallets. Your comics unlock after payment verification.</p><button className="store-button" disabled={busy} onClick={checkout}>{busy ? "Opening payment…" : `Pay securely · ₹${total.toFixed(2)}`}</button><Link to="/cart">Back to cart</Link></section></div>}</main></>;
}

export default Checkout;
