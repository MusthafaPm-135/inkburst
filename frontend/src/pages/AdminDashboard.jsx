import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API, { API_ORIGIN } from "../api/axios";
import AdminIcon from '../control/admin-icon';
import AdminSupport from "../components/AdminSupport";
import {saveInvoice} from "../control/save-invoice";
const getComics = async () => (await API.get("/admin/comics")).data.comics;
import { closeTawkChat } from "../components/TawkTo";
import "./AdminDashboard.css";
import "./AdminNext.css";

const emptyComic = { title: "", author: "", genre: "", price: "", description: "" };

function AdminDashboard({ onLogout, adminUser } = {}) {
    const navigate = useNavigate();
    const pending = useRef(false);
    const [sync, setSync] = useState("Connecting…");
    const [saving, setSaving] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showEditor, setShowEditor] = useState(false);
    const [tab, setTab] = useState("Overview");
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

    const loadDashboard = async () => {
        if (pending.current) return;
        pending.current = true;
        try {
            const [statsResponse, comicList, usersResponse, accessResponse, ordersResponse] = await Promise.all([
                API.get("/admin/stats"),
                getComics(),
                API.get("/admin/users"),
                API.get("/admin/comic-access"),
                API.get("/admin/orders")
            ]);

            const fetchedComics = comicList || [];
            const fetchedUsers = usersResponse.data?.users || [];
            const baseStats = statsResponse.data?.stats || {};

            setSync(`Updated ${new Date().toLocaleTimeString()}`);
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
            setSync("Connection interrupted — retrying automatically");
        } finally {
            pending.current = false;
            setLoading(false);
        }
    };

    const loadCoupons = async () => { try { const { data } = await API.get("/coupons/admin"); setCoupons(data.coupons || []); } catch { setMessage("Could not refresh coupons. Please retry."); } };
    useEffect(() => {
        const refresh = () => { if (!document.hidden) { loadDashboard(); loadCoupons(); } };
        refresh();
        const timer = setInterval(refresh, 10000);
        window.addEventListener('online', refresh);
        document.addEventListener('visibilitychange', refresh);
        return () => { clearInterval(timer); window.removeEventListener('online', refresh); document.removeEventListener('visibilitychange', refresh); };
    }, []);

    const createCoupon = async (event) => {
        event.preventDefault(); setMessage("");
        try {
            await API.post("/coupons/admin", couponForm);
            setCouponForm({ code: "", discount_type: "percent", discount_value: "", min_order: "0", max_discount: "", usage_limit: "", expires_at: "" });
            setMessage("Coupon created successfully.");
            loadCoupons();
        } catch (error) { setMessage(error.response?.data?.message || "Could not create coupon."); }
    };
    const toggleCoupon = async (id) => { try { await API.put(`/coupons/admin/${id}/toggle`); await loadCoupons(); } catch { setMessage("Could not change coupon. Please retry."); } };
    const deleteCoupon = async (id) => { if (!window.confirm("Delete this coupon?")) return; try { await API.delete(`/coupons/admin/${id}`); await loadCoupons(); } catch { setMessage("Could not delete coupon. Please retry."); } };

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

        if (saving) return;
        if (Object.values(files).some(file => file && file.size > 20 * 1024 * 1024)) { setMessage('Each file must be 20 MB or smaller.'); return; }
        setSaving(true);
        const body = new FormData();
        Object.entries(form).forEach(([key,value]) => body.append(key,value));
        Object.entries(files).forEach(([key,file]) => { if(file) body.append(key,file); });
        try {
            if (editingId) await API.put('/admin/comics/' + editingId, body);
            else await API.post('/admin/comics', body);
            setMessage(editingId ? 'Comic updated.' : 'Comic uploaded.');
            resetForm(); await loadDashboard();
        } catch(error) { setMessage(error.response?.data?.message || 'Save failed. Your changes have not been published. Please retry.'); }
        finally { setSaving(false); }
    };

    const editComic = (comic) => {
        setTab("Comics");
        setShowEditor(true);
        setEditingId(comic.id);
        setForm({ title: comic.title, author: comic.author, genre: comic.genre, price: comic.price, description: comic.description || "" });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const deleteComic = async comic => {
        if (!window.confirm('Delete “'+comic.title+'”? This cannot be undone.')) return;
        try { await API.delete('/admin/comics/'+comic.id); setMessage('Comic deleted.'); await loadDashboard(); }
        catch(error) { setMessage(error.response?.data?.message || 'Delete failed. The comic was not removed.'); }
    };

    const downloadInvoice = async (order) => {
        try {
            const response = await API.get(`/admin/orders/${order.id}/invoice`, { responseType: "blob" });
            await saveInvoice(response.data, 'keyra-invoice-'+order.id+'.pdf');
        } catch (error) { setMessage(error.response?.data?.message || "Could not generate invoice PDF."); }
    };

    const logout = async () => {
        if (onLogout) return onLogout();
        try { await API.post("/auth/logout"); } catch { /* clear local session either way */ }
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        closeTawkChat();
        navigate("/");
    };

    const activity = [
        ...usersList.filter(u=>u.created_at).map(u=>({id:'user'+u.id, title:'New user signed up', detail:u.username, date:u.created_at, section:'Readers'})),
        ...orders.map(o=>({id:'order'+o.id,title:'Comic purchased',detail:o.title,date:o.purchased_at,section:'Orders'})),
        ...accessLogs.map(l=>({id:'read'+l.id,title:'Comic read',detail:l.title,date:l.accessed_at,section:'Readers'}))
    ].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,6);
    const navigateTab = name => { setTab(name); setSelectedUser(null); setShowEditor(false); window.scrollTo({top:0}); };
    return <main className="admin-page">
        <header className="admin-header">
            <div><a href="/" className="admin-logo">KEYRA<span>COMICS</span></a><p>Admin control room</p></div>
            <div className="admin-header-actions">
                <span className="sync-status" role="status">{sync}</span><button className="secondary-button" onClick={() => { loadDashboard(); loadCoupons(); }}>Refresh</button>
                <button className="secondary-button" onClick={logout}>Log out</button>
            </div>
        </header>

        <nav className="control-tabs" aria-label="Admin navigation">
          {[['Overview','⌂','Home'],['Comics','▥','Comics'],['Add','＋','Add comic'],['Readers','♙','Users'],['More','•••','More']].map(([name,icon,label])=><button key={name} className={name === 'Add' ? 'nav-add' : ''} aria-label={label} aria-current={tab===name?'page':undefined} onClick={()=>{if(name==='Add'){navigateTab('Comics');resetForm();setShowEditor(true);}else navigateTab(name);}}><AdminIcon name={name}/><small>{label}</small></button>)}
        </nav>
        <section className="admin-intro"><p>{tab === 'Overview' ? 'Welcome back,' : 'KEYRA / ADMIN'}</p><h1>{tab === 'Overview' ? <>{adminUser?.username || 'Admin'} <em>✦</em></> : tab === 'Readers' ? 'Users' : tab}</h1><p>{tab === 'Overview' ? "Here’s what’s happening at KeyraComics today." : 'Manage your community and stories.'}</p></section>
        {message && <p className="admin-message" role="status">{message}</p>}

        <section hidden={tab !== "Overview"} className="stats-grid" aria-label="Store statistics">
            {[ ["Comics", stats?.total_comics ?? stats?.totalComics], ["Users", stats?.total_users ?? stats?.totalUsers], ["Orders", stats?.total_orders ?? stats?.totalOrders], ["Revenue", stats ? `₹${Number(stats.total_revenue ?? stats.totalRevenue ?? 0).toFixed(2)}` : null] ].map(([label, value]) =>
                <article className="stat-card" key={label}><span>{label}</span><strong>{loading ? "—" : (value ?? "—")}</strong></article>
            )}
        </section>

        {tab === 'Overview' && <section className="admin-panel activity-panel"><div className="panel-heading"><h2>Recent activity</h2><button className="text-button" onClick={()=>navigateTab('Readers')}>View readers →</button></div><div className="activity-list">{activity.map(item=><button key={item.id} onClick={()=>navigateTab(item.section)}><span className="activity-icon"><AdminIcon name={item.section}/></span><span><strong>{item.title}</strong><small>{item.detail} · {new Date(item.date).toLocaleString()}</small></span><span>›</span></button>)}{!activity.length && <p>{loading ? 'Loading activity…' : sync.startsWith('Updated') ? 'Your latest reader and order activity will appear here.' : 'Waiting for a connection. Activity will refresh automatically.'}</p>}</div></section>}
        {tab === 'More' && <section className="admin-panel more-menu">{[['Orders','Paid orders & invoices'],['Coupons','Discounts & coupon codes'],['Support','Customer support']].map(([name,description])=><button key={name} onClick={()=>navigateTab(name)}><span><strong>{name}</strong><small>{description}</small></span><span>›</span></button>)}<button onClick={logout}><span>Sign out</span><span>↗</span></button></section>}
        <section hidden={tab !== "Comics" || !showEditor} className="admin-panel">
            <div className="panel-heading"><div><h2>{editingId ? "Edit comic" : "Add a new comic"}</h2><p>{editingId ? "Leave a file empty to keep the existing version." : "Both a cover image and PDF are required."}</p></div>{editingId && <button className="secondary-button" onClick={()=>{resetForm();setShowEditor(false);}}>Back to comics</button>}</div>
            {editingId && <div className="editor-preview"><img src={getCoverUrl(comics.find(c=>c.id===editingId)?.cover_image)} alt="Comic cover"/><div><h2>{form.title}</h2><span className="published-badge">● Listed in catalogue</span><p>{form.author}</p></div></div>}<div className="editor-tabs">Details</div><form className="comic-form" onSubmit={submitComic}>
                <label>Title<input name="title" value={form.title} onChange={updateField} required /></label>
                <label>Author<input name="author" value={form.author} onChange={updateField} required /></label>
                <label>Genre<input name="genre" value={form.genre} onChange={updateField} required /></label>
                <label>Price (₹)<input name="price" type="number" min="0" step="0.01" value={form.price} onChange={updateField} required /></label>
                <label className="full-width">Description<textarea name="description" value={form.description} onChange={updateField} required rows="4" /></label>
                <label>Cover image<input name="cover_image" type="file" accept="image/*" onChange={updateFile} required={!editingId} /></label>
                <label>Comic PDF<input name="pdf_file" type="file" accept="application/pdf" onChange={updateFile} required={!editingId} /></label>
                <button disabled={saving} className="primary-button" type="submit">{saving ? "Saving…" : editingId ? "Save changes" : "Upload comic"}</button>
            </form>
        </section>

        <section hidden={tab !== "Comics" || showEditor} className="admin-panel"><div className="panel-heading"><div><h2>Your comics</h2><p>{comics.length} currently listed</p><button className="primary-button" onClick={()=>{resetForm();setShowEditor(true);}}>＋ Add comic</button></div></div>
            <div className="comic-admin-grid">{comics.map((comic) => <article className="admin-comic" key={comic.id}>
                <img src={getCoverUrl(comic.cover_image || comic.cover)} alt="" />
                <div><h3>{comic.title}</h3><p>{comic.author} · ₹{comic.price}</p><div className="comic-actions"><button className="secondary-button" onClick={() => editComic(comic)}>Edit</button><button className="danger-button" onClick={() => deleteComic(comic)}>Delete</button></div></div>
            </article>)}{!loading && comics.length === 0 && <p>No comics have been uploaded yet.</p>}</div>
        </section>

        <section hidden={tab !== "Coupons"} className="admin-panel coupon-admin-panel"><div className="panel-heading"><div><h2>Coupon codes</h2><p>Create discounts for checkout</p></div></div>
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

        <section hidden={tab !== "Orders"} className="admin-panel"><div className="panel-heading"><div><h2>Paid orders & invoices</h2><p>Download a paid order invoice, then send it yourself.</p></div></div>
            {!orders.length ? <p>{loading ? "Loading paid orders…" : "No paid orders yet."}</p> : <div className="admin-users-table-wrap"><table className="admin-users-table"><thead><tr><th>Order</th><th>Customer</th><th>Comic</th><th>Paid</th><th></th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td className="user-id">#{order.id}<br /><span className="user-date">{new Date(order.purchased_at).toLocaleDateString()}</span></td><td><strong>{order.username}</strong><br /><span className="user-email">{order.email}</span></td><td>{order.title}</td><td>₹{Number(order.price).toFixed(2)}</td><td><button type="button" className="primary-button" onClick={() => downloadInvoice(order)}>Download PDF</button></td></tr>)}</tbody></table></div>}
        </section>

        <section hidden={tab !== "Readers"} className="admin-panel"><div className="panel-heading"><div><h2>Comic access history</h2><p>Latest 200 reader events. Every delivered PDF includes the buyer and order number.</p></div></div>
            {!accessLogs.length ? <p>{loading ? "Loading access history…" : "No delivered comics have been read yet."}</p> : <div className="admin-users-table-wrap"><table className="admin-users-table"><thead><tr><th>When</th><th>Customer</th><th>Comic</th><th>IP</th><th>Watermark</th></tr></thead><tbody>{accessLogs.map((log) => <tr key={log.id}><td className="user-date">{new Date(log.accessed_at).toLocaleString()}</td><td><strong>{log.username}</strong><br /><span className="user-email">{log.email}</span></td><td>{log.title}</td><td className="user-id">{log.ip_address || "—"}</td><td className="user-id">{log.watermark_label}</td></tr>)}</tbody></table></div>}
        </section>

        <section hidden={tab !== "Readers"} className="admin-panel">
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
                                    <td className="user-name"><button className="text-button" onClick={()=>setSelectedUser(user)}>{user.username} →</button></td>
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
        {selectedUser && <div className="profile-overlay"><section role="dialog" aria-modal="true" aria-labelledby="profile-title" className="profile-card"><button className="text-button" autoFocus onClick={()=>setSelectedUser(null)}>← Back to users</button><header><div className="user-avatar">{selectedUser.username?.slice(0,1).toUpperCase()}</div><div><h2 id="profile-title">{selectedUser.username}</h2><span className="user-badge">{selectedUser.role}</span><p>{selectedUser.email}</p><small>Joined {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'date unavailable'}</small></div></header><div className="profile-detail"><strong>Account details</strong><p>User #{selectedUser.id}</p><p>{selectedUser.email}</p></div><div className="profile-detail"><strong>Permissions</strong><p>{selectedUser.role === 'admin' ? 'Administrator access' : 'Customer access'}</p><small>Permissions are verified by the server on every request.</small></div><div className="profile-detail"><strong>Recent reading history</strong>{accessLogs.filter(l=>l.email===selectedUser.email).slice(0,5).map(l=><p key={l.id}>{l.title} · {new Date(l.accessed_at).toLocaleDateString()}</p>)}{!accessLogs.some(l=>l.email===selectedUser.email) && <p>No entries in the latest 200 reader events.</p>}</div></section></div>}
        {tab === "Support" && <AdminSupport />}
    </main>;
}

export default AdminDashboard;
