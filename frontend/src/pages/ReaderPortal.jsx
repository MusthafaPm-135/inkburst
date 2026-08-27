import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API, { API_ORIGIN } from "../api/axios";
import BrandMark from "../components/BrandMark";
import { closeTawkChat } from "../components/TawkTo";
import "./ReaderPortal.css";

const getCoverUrl = (cover) => {
    if (!cover) return "";
    if (/^(https?:|data:)/.test(cover)) return cover;
    return cover.startsWith("/") ? `${API_ORIGIN}${cover}` : `${API_ORIGIN}/uploads/covers/${cover}`;
};

function ReaderPortal() {
    const [mode, setMode] = useState("starting");
    const [orders, setOrders] = useState([]);
    const [selected, setSelected] = useState(null);
    const [readerUrl, setReaderUrl] = useState("");
    const [form, setForm] = useState({ username: "", email: "", password: "" });
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);

    const loadLibrary = async () => {
        setBusy(true);
        setMessage("");
        try {
            await API.post("/orders/recover").catch(() => null);
            const response = await API.get("/orders");
            setOrders(response.data.orders || []);
            setMode("library");
        } catch (error) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setMessage(error.response?.data?.message || "Please sign in again to open your library.");
            setMode("login");
        } finally {
            setBusy(false);
        }
    };

    useEffect(() => {
        if (localStorage.getItem("token")) loadLibrary();
        else setMode("login");
    }, []);

    useEffect(() => () => {
        if (readerUrl) URL.revokeObjectURL(readerUrl);
    }, [readerUrl]);

    const submit = async (event) => {
        event.preventDefault();
        setMessage("");
        if (mode === "signup" && (form.password.length < 12 || form.password.length > 64)) {
            setMessage("Use a password with 12 to 64 characters.");
            return;
        }
        setBusy(true);
        try {
            if (mode === "signup") {
                await API.post("/auth/register", form);
                setForm({ username: "", email: form.email, password: "" });
                setMessage("Account created. Please log in to open your library.");
                setMode("login");
            } else {
                const response = await API.post("/auth/login", { email: form.email, password: form.password });
                if (!response.data.token) throw new Error("Login completed without an access token. Please try again.");
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("user", JSON.stringify(response.data.user || {}));
                await loadLibrary();
            }
        } catch (error) {
            setMessage(error.response?.data?.message || error.message || "Could not continue. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    const openComic = async (order) => {
        setBusy(true);
        setMessage("");
        try {
            const response = await API.get(`/orders/read/${order.comic_id}`, { responseType: "blob" });
            const nextUrl = URL.createObjectURL(new Blob([response.data], { type: response.headers["content-type"] || "application/pdf" }));
            setReaderUrl(nextUrl);
            setSelected(order);
            setMode("reader");
        } catch (error) {
            setMessage(error.response?.data?.message || "Could not open this comic. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        closeTawkChat();
        setOrders([]);
        setSelected(null);
        setReaderUrl("");
        setForm({ username: "", email: "", password: "" });
        setMessage("");
        setMode("login");
    };

    return <main className="reader-portal">
        <header className="reader-portal-nav">
            <Link to="/" className="reader-portal-logo" aria-label="Back to KeyraComics"><BrandMark height="44px" /></Link>
            <span className="reader-portal-name">KEYRA READER <em>WEB</em></span>
            {mode === "library" && <button type="button" className="reader-logout" onClick={logout}>Log out</button>}
            {mode === "reader" && <button type="button" className="reader-logout" onClick={() => setMode("library")}>Library</button>}
        </header>

        {mode === "starting" && <div className="reader-loading"><span /> Opening your shelf…</div>}

        {(mode === "login" || mode === "signup") && <section className="reader-auth-shell">
            <div className="reader-auth-poster" aria-hidden="true"><span>KEYRA</span><strong>READ.<br />KEEP.<br />RETURN.</strong><small>YOUR DIGITAL SHELF</small></div>
            <div className="reader-auth-card">
                <p className="reader-kicker">{mode === "login" ? "WELCOME BACK" : "NEW READER"}</p>
                <h1>{mode === "login" ? "Your shelf is waiting." : "Build your comic shelf."}</h1>
                <p>{mode === "login" ? "Log in to keep reading the comics you purchased from KeyraComics." : "Create your account, then purchase comics from the KeyraComics store."}</p>
                {message && <p className="reader-message" role="alert">{message}</p>}
                <form onSubmit={submit} className="reader-form">
                    {mode === "signup" && <label>Name<input required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label>}
                    <label>Email<input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
                    <label>Password {mode === "signup" && <small>12–64 characters</small>}<input required type="password" minLength={mode === "signup" ? 12 : undefined} maxLength={64} autoComplete={mode === "login" ? "current-password" : "new-password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
                    <button disabled={busy} className="reader-primary">{busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
                </form>
                <button type="button" className="reader-switch" onClick={() => { setMessage(""); setMode(mode === "login" ? "signup" : "login"); }}>{mode === "login" ? "New here? Create an account" : "Already a reader? Log in"}</button>
            </div>
        </section>}

        {mode === "library" && <section className="reader-library-shell">
            <div className="reader-library-heading"><div><p className="reader-kicker">OWNED BY YOU</p><h1>Your library</h1><p>Everything you purchase at KeyraComics appears here.</p></div><button type="button" className="reader-refresh" onClick={loadLibrary} disabled={busy}>{busy ? "Refreshing…" : "Refresh library"}</button></div>
            {message && <p className="reader-message" role="alert">{message}</p>}
            {!orders.length ? <div className="reader-empty"><span>✦</span><h2>Your shelf is waiting.</h2><p>Purchase a comic from the store and it will appear here automatically.</p></div> : <div className="reader-library-grid">{orders.map((order) => <article className="reader-comic-card" key={order.id}><div className="reader-cover">{order.cover_image ? <img src={getCoverUrl(order.cover_image)} alt={`Cover of ${order.title}`} /> : <span>KEYRA</span>}</div><div><p className="reader-card-label">PURCHASED</p><h2>{order.title}</h2><p className="reader-author">{order.author}</p><p className="reader-date">Purchased {new Date(order.purchased_at).toLocaleDateString()}</p><button type="button" className="reader-read" onClick={() => openComic(order)} disabled={busy}>{busy ? "Opening…" : "Read comic"}</button></div></article>)}</div>}
            <a className="reader-purchase-bar" href="/#browse">Purchase comics <span aria-hidden="true">↗</span></a>
        </section>}

        {mode === "reader" && selected && <section className="reader-viewer"><div className="reader-viewer-bar"><button type="button" onClick={() => setMode("library")}>← Library</button><strong>{selected.title}</strong><a href={readerUrl} target="_blank" rel="noreferrer">Open in new tab ↗</a></div>{readerUrl ? <iframe title={`Reader for ${selected.title}`} src={readerUrl} className="reader-frame" /> : <div className="reader-loading"><span /> Opening comic…</div>}</section>}
    </main>;
}

export default ReaderPortal;
