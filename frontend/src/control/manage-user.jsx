import {useEffect, useRef, useState} from 'react';
import API from '../api/axios';
import './manage-user.css';

export default function ManageUser({user, adminUser, onClose, onChanged}) {
    const dialog = useRef(null);
    const [profile,setProfile] = useState(null);
    const [section,setSection] = useState('');
    const [form,setForm] = useState({username:user.username,email:user.email});
    const [role,setRole] = useState(user.role);
    const [busy,setBusy] = useState(false);
    const [error,setError] = useState('');
    const [notice,setNotice] = useState('');
    const [confirmDelete,setConfirmDelete] = useState('');
    const load = async () => {
        const {data} = await API.get(`/admin/users/${user.id}`);
        setProfile(data); setForm({username:data.user.username,email:data.user.email}); setRole(data.user.role);
    };
    useEffect(() => {
        dialog.current.showModal();
        load().catch(() => setError('Could not load this user. Close and try again.'));
    }, []);
    const save = async (event, permissions = false) => {
        event.preventDefault(); setBusy(true); setError(''); setNotice('');
        try {
            await API.put(`/admin/users/${user.id}${permissions ? '/permissions' : ''}`, permissions ? {role} : form);
            await load(); onChanged(); setNotice('Changes saved.');
        } catch(error) { setError(error.response?.data?.message || 'Could not save changes. Please retry.'); }
        finally { setBusy(false); }
    };
    const remove = async event => {
        event.preventDefault(); setBusy(true); setError('');
        try { await API.delete(`/admin/users/${user.id}`); onChanged(); onClose(); }
        catch(error) { setError(error.response?.data?.message || 'Could not delete this user.'); }
        finally { setBusy(false); }
    };
    const current = profile?.user || user;
    const events = [...(profile?.reads || []).map(r=>({key:`r${r.id}`,label:`Read ${r.title}`,date:r.accessed_at})),...(profile?.orders || []).map(o=>({key:`o${o.id}`,label:`Purchased ${o.title}`,date:o.purchased_at}))].sort((a,b)=>new Date(b.date)-new Date(a.date));
    const self = Number(adminUser?.id) === Number(user.id);
    const rows = [['Account details','Edit name and email','♙'],['Activity logs','Recent purchases and reading','☷'],['Permissions','Manage role and access','◇'],['Reading history','View this user’s reading activity','▤'],['Support requests','View requests from this user','⚑']];
    return <dialog ref={dialog} className="manage-user" onCancel={event=>{event.preventDefault();if(!busy)onClose();}} aria-labelledby="manage-user-title">
        <button className="text-button" disabled={busy} onClick={onClose}>← Back to users</button>
        <header className="manage-user-header"><div className="manage-avatar">{current.username?.slice(0,1).toUpperCase()}</div><div><h2 id="manage-user-title">{current.username} <span className="user-badge">{current.role === 'admin' ? 'Admin' : 'Customer'}</span></h2><p>{current.email}</p><small>{current.created_at ? `Joined ${new Date(current.created_at).toLocaleDateString()}` : `User #${current.id}`}</small></div></header>
        <div className="manage-counts">{[['reads','Reads'],['orders','Purchases'],['support','Requests']].map(([key,label])=><div key={key}><strong>{profile?.[key]?.length ?? '—'}</strong><span>{label}</span></div>)}</div><p className="manage-caption">Most recent 100 records per category</p>
        {error && <p role="alert" className="admin-message">{error}</p>}{notice && <p role="status">{notice}</p>}
        {!profile && !error && <p role="status">Loading account…</p>}
        <div className="manage-menu">{rows.map(([name,description,icon])=><div key={name}><button className="manage-menu-row" aria-expanded={section===name} onClick={()=>{setSection(section===name?'':name);setNotice('');}}><span className="manage-symbol">{icon}</span><span><strong>{name}</strong><small>{description}</small></span><span>›</span></button>
        {section === name && <section className="manage-section">
            {name === 'Account details' && <form onSubmit={save}><label>Username<input required maxLength={40} value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/></label><label>Email<input type="email" required maxLength={254} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><button className="primary-button" disabled={busy || !profile}>{busy?'Saving…':'Save account'}</button></form>}
            {name === 'Permissions' && <form onSubmit={e=>save(e,true)}><label>Account role<select disabled={self} value={role} onChange={e=>setRole(e.target.value)}><option value="user">Customer</option><option value="admin">Administrator</option></select></label><p>{self ? 'Your own administrator access is protected.' : 'Administrators can manage comics, users, orders, and store settings. Changes apply to existing sessions.'}</p><button className="primary-button" disabled={busy || self || !profile}>{busy?'Saving…':'Save permissions'}</button></form>}
            {name === 'Activity logs' && <>{profile?.unavailable?.some(key=>['reads','orders'].includes(key)) && <p>Some activity could not load.</p>}{events.map(event=><p key={event.key}><strong>{event.label}</strong><small>{new Date(event.date).toLocaleString()}</small></p>)}{profile && !events.length && <p>No recent activity available.</p>}</>}
            {name === 'Reading history' && <>{profile?.reads === null ? <p>Reading history is temporarily unavailable.</p> : profile?.reads?.length ? profile.reads.map(read=><p key={read.id}><strong>{read.title}</strong><small>{new Date(read.accessed_at).toLocaleString()}</small></p>) : <p>No reading history yet.</p>}</>}
            {name === 'Support requests' && <>{profile?.support === null ? <p>Support requests are temporarily unavailable.</p> : profile?.support?.length ? profile.support.map(item=><p key={item.id}><strong>Request #{item.id} · {item.status}</strong><small>{new Date(item.updated_at).toLocaleString()}</small></p>) : <p>No support requests yet.</p>}</>}
        </section>}</div>)}</div>
        <button className="manage-delete" disabled={self || current.role==='admin' || busy || !profile} onClick={()=>setSection(section==='Delete user'?'':'Delete user')}><span>♲</span><span>Delete user<small>Permanently remove this account</small></span></button>
        {section === 'Delete user' && <form className="manage-section" onSubmit={remove}><p>This cannot be undone. Accounts with linked purchases, reading, cart, or support records are protected.</p><label>Type {current.email} to confirm<input autoComplete="off" value={confirmDelete} onChange={e=>setConfirmDelete(e.target.value)}/></label><button className="danger-button" disabled={busy || confirmDelete!==current.email}>{busy?'Deleting…':'Permanently delete user'}</button></form>}
    </dialog>;
}
