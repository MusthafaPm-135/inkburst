import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { API_ORIGIN } from "../api/axios";
import { getComics } from "../api/comics";
import "./AdminDashboard.css";

const emptyComic = { title: "", author: "", genre: "", price: "", description: "" };

function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [comics, setComics] = useState([]);
    const [form, setForm] = useState(emptyComic);
    const [files, setFiles] = useState({ cover_image: null, pdf_file: null });
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const [statsResponse, comicList] = await Promise.all([
                API.get("/admin/stats"),
                getComics()
            ]);
            setStats(statsResponse.data.stats);
            setComics(comicList);
        } catch (error) {
            setMessage(error.response?.data?.message || "Could not load the admin dashboard.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadDashboard(); }, []);

    const updateField = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const updateFile = (event) => {
        const { name, files: selectedFiles } = event.target;
        setFiles((current) => ({ ...current, [name]: selectedFiles?.[0] || null }));
    };

    const resetForm = () => {
        setForm(emptyComic);
        setFiles({ cover_image: null, pdf_file: null });
        setEditingId(null);
    };

    const submitComic = async (event) => {
        event.preventDefault();
        setMessage("");
        const body = new FormData();
        Object.entries(form).forEach(([key, value]) => body.append(key, value));
        if (files.cover_image) body.append("cover_image", files.cover_image);
        if (files.pdf_file) body.append("pdf_file", files.pdf_file);

        try {
            if (editingId) {
                await API.put(`/admin/comics/${editingId}`, body);
                setMessage("Comic updated successfully.");
            } else {
                if (!files.cover_image || !files.pdf_file) {
                    setMessage("A cover image and PDF are required for a new comic.");
                    return;
                }
                await API.post("/admin/comics", body);
                setMessage("Comic uploaded successfully.");
            }
            resetForm();
            loadDashboard();
        } catch (error) {
            setMessage(error.response?.data?.message || "Could not save the comic.");
        }
    };

    const editComic = (comic) => {
        setEditingId(comic.id);
        setForm({ title: comic.title, author: comic.author, genre: comic.genre, price: comic.price, description: comic.description || "" });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const deleteComic = async (comic) => {
        if (!window.confirm(`Delete “${comic.title}”? This cannot be undone.`)) return;
        try {
            await API.delete(`/admin/comics/${comic.id}`);
            setMessage("Comic deleted successfully.");
            loadDashboard();
        } catch (error) {
            setMessage(error.response?.data?.message || "Could not delete the comic.");
        }
    };

    const logout = async () => {
        try { await API.post("/auth/logout"); } catch { /* clear local session either way */ }
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    return <main className="admin-page">
        <header className="admin-header">
            <div><a href="/" className="admin-logo">KEYRA COMICS</a><p>Admin control room</p></div>
            <button className="secondary-button" onClick={logout}>Log out</button>
        </header>

        <section className="admin-intro"><h1>Manage your comic shelf</h1><p>Upload, update, and remove comics from one place.</p></section>
        {message && <p className="admin-message" role="status">{message}</p>}

        <section className="stats-grid" aria-label="Store statistics">
            {[ ["Comics", stats?.totalComics], ["Users", stats?.totalUsers], ["Orders", stats?.totalOrders], ["Revenue", stats ? `₹${Number(stats.totalRevenue).toFixed(2)}` : null] ].map(([label, value]) =>
                <article className="stat-card" key={label}><span>{label}</span><strong>{loading ? "—" : value}</strong></article>
            )}
        </section>

        <section className="admin-panel">
            <div className="panel-heading"><div><h2>{editingId ? "Edit comic" : "Add a new comic"}</h2><p>{editingId ? "Leave a file empty to keep the existing version." : "Both a cover image and PDF are required."}</p></div>{editingId && <button className="secondary-button" onClick={resetForm}>Cancel edit</button>}</div>
            <form className="comic-form" onSubmit={submitComic}>
                <label>Title<input name="title" value={form.title} onChange={updateField} required /></label>
                <label>Author<input name="author" value={form.author} onChange={updateField} required /></label>
                <label>Genre<input name="genre" value={form.genre} onChange={updateField} required /></label>
                <label>Price (₹)<input name="price" type="number" min="0" step="0.01" value={form.price} onChange={updateField} required /></label>
                <label className="full-width">Description<textarea name="description" value={form.description} onChange={updateField} required rows="4" /></label>
                <label>Cover image<input name="cover_image" type="file" accept="image/*" onChange={updateFile} required={!editingId} /></label>
                <label>Comic PDF<input name="pdf_file" type="file" accept="application/pdf" onChange={updateFile} required={!editingId} /></label>
                <button className="primary-button" type="submit">{editingId ? "Save changes" : "Upload comic"}</button>
            </form>
        </section>

        <section className="admin-panel"><div className="panel-heading"><div><h2>Your comics</h2><p>{comics.length} currently listed</p></div></div>
            <div className="comic-admin-grid">{comics.map((comic) => <article className="admin-comic" key={comic.id}>
                <img src={`${API_ORIGIN}/uploads/covers/${comic.cover_image}`} alt="" />
                <div><h3>{comic.title}</h3><p>{comic.author} · ₹{comic.price}</p><div className="comic-actions"><button className="secondary-button" onClick={() => editComic(comic)}>Edit</button><button className="danger-button" onClick={() => deleteComic(comic)}>Delete</button></div></div>
            </article>)}{!loading && comics.length === 0 && <p>No comics have been uploaded yet.</p>}</div>
        </section>
    </main>;
}

export default AdminDashboard;
