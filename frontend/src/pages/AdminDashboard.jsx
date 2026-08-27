import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { API_ORIGIN } from "../api/axios";
import { getComics } from "../api/comics";
import "./AdminDashboard.css";
import "./AdminNext.css";

const emptyComic = { title: "", author: "", genre: "", price: "", description: "" };

function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [comics, setComics] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [accessLogs, setAccessLogs] = useState([]);
    const [orders, setOrders] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [couponForm, setCouponForm] = useState({ code: "", discount_type: "percent", discount_value: "", min_order: "0", max_discount: "", usage_limit: "", expires_at: "" });
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
            const [statsResponse, comicList, usersResponse, accessResponse, ordersResponse] = await Promise.all([
                API.get("/admin/stats").catch(() => ({ data: { stats: null } })),
                getComics(),
                API.get("/admin/users").catch(() => ({ data: { users: [] } })),
                API.get("/admin/comic-access").catch(() => ({ data: { logs: [] } })),
                API.get("/admin/orders").catch(() => ({ data: { orders: [] } }))
            ]);

            const fetchedComics = comicList || [];
            const fetchedUsers = usersResponse.data?.users || [];
            const baseStats = statsResponse.data?.stats || {};

            setComics(fetchedComics);
            setUsersList(fetchedUsers);
            setAccessLogs(accessResponse.data?.logs || []);
            setOrders(ordersResponse.data?.orders || []);
            setStats({
                // The backend returns camelCase fields. Map them to the
                // state names this component uses for the stat cards.
                total_comics: Math.max(Number(baseStats.totalComics ?? baseStats.total_comics ?? 0), fetchedComics.length),
                total_users: Math.max(Number(baseStats.totalUsers ?? baseStats.total_users ?? 0), fetchedUsers.length),
                total_orders: Number(baseStats.totalOrders ?? baseStats.total_orders ?? 0),
                total_revenue: Number(baseStats.totalRevenue ?? baseStats.total_revenue ?? 0),
            });
        } catch {
            const localComics = await getComics();
            setComics(localComics);
        } finally {
            setLoading(false);
        }
    };

    const loadCoupons = async () => { try { const { data } = await API.get("/coupons/admin"); setCoupons(data.coupons || []); } catch { /* coupon panel stays empty */ } };
    useEffect(() => { loadDashboard(); loadCoupons(); }, []);

    const createCoupon = async (event) => {
        event.preventDefault(); setMessage("");
        try {
            await API.post("/coupons/admin", couponForm);
            setCouponForm({ code: "", discount_type: "percent", discount_value: "", min_order: "0", max_discount: "", usage_limit: "", expires_at: "" });
            setMessage("Coupon created successfully.");
            loadCoupons();
        } catch (error) { setMessage(error.response?.data?.message || "Could not create coupon."); }
    };
    const toggleCoupon = async (id) => { await API.put(`/coupons/admin/${id}/toggle`); loadCoupons(); };
    const deleteCoupon = async (id) => { if (!window.confirm("Delete this coupon?")) return; await API.delete(`/coupons/admin/${id}`); loadCoupons(); };

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

    const downloadInvoice = async (order) => {
        try {
            const response = await API.get(`/admin/orders/${order.id}/invoice`, { responseType: "blob" });
            const url = URL.createObjectURL(response.data);
            const link = document.createElement("a");
            link.href = url; link.download = `keyra-invoice-${order.id}.pdf`; link.click();
            URL.revokeObjectURL(url);
        } catch (error) { setMessage(error.response?.data?.message || "Could not generate invoice PDF."); }
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

        <section className="admin-panel coupon-admin-panel"><div className="panel-heading"><div><h2>Coupon codes</h2><p>Create discounts for checkout</p></div></div>
            <form className="coupon-admin-form" onSubmit={createCoupon}>
                <label>Code<input value={couponForm.code} onChange={(event) => setCouponForm({ ...couponForm, code: event.target.value.toUpperCase() })} placeholder="WELCOME10" required /></label>
                <label>Discount type<select value={couponForm.discount_type} onChange={(event) => setCouponForm({ ...couponForm, discount_type: event.target.value })}><option value="percent">Percentage</option><option value="fixed">Fixed amount</option></select></label>
                <label>Discount value<input type="number" min="0.01" step="0.01" value={couponForm.discount_value} onChange={(event) => setCouponForm({ ...couponForm, discount_value: event.target.value })} required /></label>
                <label>Minimum order<input type="number" min="0" step="0.01" value={couponForm.min_order} onChange={(event) => setCouponForm({ ...couponForm, min_order: event.target.value })} /></label>
                <label>Maximum discount<input type="number" min="0" step="0.01" value={couponForm.max_discount} onChange={(event) => setCouponForm({ ...couponForm, max_discount: event.target.value })} placeholder="Optional" /></label>
                <label>Usage limit<input type="number" min="1" value={couponForm.usage_limit} onChange={(event) => setCouponForm({ ...couponForm, usage_limit: event.target.value })} placeholder="Unlimited" /></label>
                <label>Expiry date<input type="datetime-local" value={couponForm.expires_at} onChange={(event) => setCouponForm({ ...couponForm, expires_at: event.target.value })} /></label>
                <button className="primary-button" type="submit">Create coupon</button>
            </form>
            <div className="coupon-admin-list">{coupons.map((coupon) => <article key={coupon.id}><div><strong>{coupon.code}</strong><span>{coupon.discount_type === "percent" ? `${Number(coupon.discount_value)}% off` : `₹${Number(coupon.discount_value).toFixed(2)} off`} · used {coupon.used_count}{coupon.usage_limit ? `/${coupon.usage_limit}` : ""}</span></div><span className={coupon.active ? "coupon-live" : "coupon-off"}>{coupon.active ? "Active" : "Paused"}</span><button className="secondary-button" type="button" onClick={() => toggleCoupon(coupon.id)}>{coupon.active ? "Pause" : "Enable"}</button><button className="danger-button" type="button" onClick={() => deleteCoupon(coupon.id)}>Delete</button></article>)}{!coupons.length && <p>No coupons created yet.</p>}</div>
        </section>

        <section className="admin-panel"><div className="panel-heading"><div><h2>Manual invoice PDFs</h2><p>Download a paid order invoice, then send it yourself.</p></div></div>
            {!orders.length ? <p>{loading ? "Loading paid orders…" : "No paid orders yet."}</p> : <div className="admin-users-table-wrap"><table className="admin-users-table"><thead><tr><th>Order</th><th>Customer</th><th>Comic</th><th>Paid</th><th></th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td className="user-id">#{order.id}<br /><span className="user-date">{new Date(order.purchased_at).toLocaleDateString()}</span></td><td><strong>{order.username}</strong><br /><span className="user-email">{order.email}</span></td><td>{order.title}</td><td>₹{Number(order.price).toFixed(2)}</td><td><button type="button" className="primary-button" onClick={() => downloadInvoice(order)}>Download PDF</button></td></tr>)}</tbody></table></div>}
        </section>

        <section className="admin-panel"><div className="panel-heading"><div><h2>Comic access history</h2><p>Latest 200 reader events. Every delivered PDF includes the buyer and order number.</p></div></div>
            {!accessLogs.length ? <p>{loading ? "Loading access history…" : "No delivered comics have been read yet."}</p> : <div className="admin-users-table-wrap"><table className="admin-users-table"><thead><tr><th>When</th><th>Customer</th><th>Comic</th><th>IP</th><th>Watermark</th></tr></thead><tbody>{accessLogs.map((log) => <tr key={log.id}><td className="user-date">{new Date(log.accessed_at).toLocaleString()}</td><td><strong>{log.username}</strong><br /><span className="user-email">{log.email}</span></td><td>{log.title}</td><td className="user-id">{log.ip_address || "—"}</td><td className="user-id">{log.watermark_label}</td></tr>)}</tbody></table></div>}
        </section>

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

