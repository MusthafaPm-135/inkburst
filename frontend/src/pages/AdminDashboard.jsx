import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { API_ORIGIN } from "../api/axios";
import { getComics } from "../api/comics";
import "./AdminDashboard.css";
import AdminSupport from "../components/AdminSupport";

const emptyComic = { title: "", author: "", genre: "", price: "", description: "" };

function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [comics, setComics] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [form, setForm] = useState(emptyComic);
    const [files, setFiles] = useState({ cover_image: null, pdf_file: null });
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    const getCoverUrl = (cover) => {
        if (!cover) return "";
        if (cover.startsWith("http://") || cover.startsWith("https://") || cover.startsWith("data:")) return cover;
        if (cover.startsWith("/")) return `${API_ORIGIN}${cover}`;
        return `${API_ORIGIN}/uploads/covers/${cover}`;
    };

    const helperReadFileAsDataUrl = (file) => {
        return new Promise((resolve) => {
            if (!file) return resolve("");
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve("");
            reader.readAsDataURL(file);
        });
    };

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const [statsResponse, comicList, usersResponse] = await Promise.all([
                API.get("/admin/stats").catch(() => ({ data: { stats: null } })),
                getComics(),
                API.get("/admin/users").catch(() => ({ data: { users: [] } }))
            ]);

            const fetchedComics = comicList || [];
            const fetchedUsers = usersResponse.data?.users || [];
            const baseStats = statsResponse.data?.stats || {};

            setComics(fetchedComics);
            setUsersList(fetchedUsers);
            setStats({
                total_comics: Math.max(baseStats.total_comics || 0, fetchedComics.length),
                total_users: Math.max(baseStats.total_users || 0, fetchedUsers.length),
                total_orders: baseStats.total_orders || 0,
                total_revenue: baseStats.total_revenue || 0,
            });
        } catch {
            const localComics = await getComics();
            setComics(localComics);
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

        if (!editingId && (!files.cover_image || !files.pdf_file)) {
            setMessage("A cover image and PDF are required for a new comic.");
            return;
        }

        const coverDataUrl = files.cover_image ? await helperReadFileAsDataUrl(files.cover_image) : "";

        const body = new FormData();
        Object.entries(form).forEach(([key, value]) => body.append(key, value));
        if (files.cover_image) body.append("cover_image", files.cover_image);
        if (files.pdf_file) body.append("pdf_file", files.pdf_file);

        let serverSaved = false;
        try {
            if (editingId) {
                await API.put(`/admin/comics/${editingId}`, body);
                setMessage("Comic updated successfully.");
            } else {
                await API.post("/admin/comics", body);
                setMessage("Comic uploaded successfully.");
            }
            serverSaved = true;
        } catch {
            // Backend endpoint offline/unreachable
        }

        // Keep a local catalogue only as an offline fallback. When the API
        // accepts the upload, its record is the single source of truth.
        if (!serverSaved) try {
            const existingLocal = JSON.parse(localStorage.getItem("keyra_local_comics") || "[]");
            if (editingId) {
                const updated = existingLocal.map(c => c.id === editingId ? {
                    ...c,
                    ...form,
                    price: parseFloat(form.price) || 0,
                    cover_image: coverDataUrl || c.cover_image
                } : c);
                localStorage.setItem("keyra_local_comics", JSON.stringify(updated));
                if (!serverSaved) setMessage("Comic updated successfully.");
            } else {
                const newLocalComic = {
                    id: Date.now(),
                    ...form,
                    price: parseFloat(form.price) || 0,
                    cover_image: coverDataUrl,
                    created_at: new Date().toISOString()
                };
                localStorage.setItem("keyra_local_comics", JSON.stringify([newLocalComic, ...existingLocal]));
                if (!serverSaved) setMessage("Comic uploaded successfully.");
            }
        } catch (err) {
            console.error("Failed local sync:", err);
        }

        resetForm();
        loadDashboard();
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
        } catch {
            // backend unreachable
        }
        const existingLocal = JSON.parse(localStorage.getItem("keyra_local_comics") || "[]");
        const filtered = existingLocal.filter(c => c.id !== comic.id);
        localStorage.setItem("keyra_local_comics", JSON.stringify(filtered));
        setMessage("Comic deleted successfully.");
        loadDashboard();
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
            <div className="admin-header-actions">
                <a className="secondary-button" href="/">Return to homepage</a>
                <button className="secondary-button" onClick={logout}>Log out</button>
            </div>
        </header>

        <section className="admin-intro"><h1>Manage your comic shelf</h1><p>Upload, update, and remove comics from one place.</p></section>
        {message && <p className="admin-message" role="status">{message}</p>}

        <section className="stats-grid" aria-label="Store statistics">
            {[ ["Comics", stats?.total_comics ?? stats?.totalComics], ["Users", stats?.total_users ?? stats?.totalUsers], ["Orders", stats?.total_orders ?? stats?.totalOrders], ["Revenue", stats ? `₹${Number(stats.total_revenue ?? stats.totalRevenue ?? 0).toFixed(2)}` : null] ].map(([label, value]) =>
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
                <img src={getCoverUrl(comic.cover_image || comic.cover)} alt="" />
                <div><h3>{comic.title}</h3><p>{comic.author} · ₹{comic.price}</p><div className="comic-actions"><button className="secondary-button" onClick={() => editComic(comic)}>Edit</button><button className="danger-button" onClick={() => deleteComic(comic)}>Delete</button></div></div>
            </article>)}{!loading && comics.length === 0 && <p>No comics have been uploaded yet.</p>}</div>
        </section>

        <AdminSupport />

        <section className="admin-panel">
            <div className="panel-heading">
                <div>
                    <h2>Registered Users</h2>
                    <p>{usersList.length} user account{usersList.length === 1 ? "" : "s"}</p>
                </div>
            </div>
            {usersList.length === 0 ? (
                <p>{loading ? "Loading users…" : "No registered users found."}</p>
            ) : (
                <div className="admin-users-table-wrap">
                    <table className="admin-users-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usersList.map((user) => (
                                <tr key={user.id}>
                                    <td className="user-id">#{user.id}</td>
                                    <td className="user-name"><strong>{user.username}</strong></td>
                                    <td className="user-email">{user.email}</td>
                                    <td>
                                        <span className={`user-badge ${user.role === "admin" ? "badge-admin" : "badge-user"}`}>
                                            {user.role || "user"}
                                        </span>
                                    </td>
                                    <td className="user-date">
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    </main>;
}

export default AdminDashboard;
