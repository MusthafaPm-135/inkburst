import { useEffect, useState } from "react";
import API from "../api/axios";
import "./AdminSupport.css";
import "./AdminSupportQuickAnswers.css";

const quickAnswers = [
    { label: "Read purchased comic", text: "After your payment is verified, open Library from the top navigation. Your purchased comic will appear there with a Read Comic button." },
    { label: "Payment methods", text: "KeyraComics checkout uses Razorpay. You can use the eligible UPI, card, net banking, or wallet options shown in the secure Razorpay payment window." },
    { label: "Missing purchase", text: "Please confirm that you are logged in with the same account used during checkout. If the comic is still missing from your Library, send us your Razorpay payment ID so we can check it." },
    { label: "Login help", text: "You can sign in using your email and password or Continue with Google. If Google sign-in fails, return to the login page and try again in the same browser." }
];

function AdminSupport() {
    const [chats, setChats] = useState([]), [selectedId, setSelectedId] = useState(null), [messages, setMessages] = useState([]), [reply, setReply] = useState(""), [error, setError] = useState("");
    const loadChats = async () => { try { const { data } = await API.get("/support/admin/chats"); setChats(data.chats || []); if (!selectedId && data.chats?.length) setSelectedId(data.chats[0].id); } catch { setError("Could not load customer chats."); } };
    const loadMessages = async (id = selectedId) => { if (!id) return; try { const { data } = await API.get(`/support/admin/chats/${id}/messages`); setMessages(data.messages || []); setError(""); } catch { setError("Could not load this conversation."); } };
    useEffect(() => { loadChats(); const timer = window.setInterval(loadChats, 5000); return () => window.clearInterval(timer); }, [selectedId]);
    useEffect(() => { loadMessages(selectedId); if (!selectedId) return undefined; const timer = window.setInterval(() => loadMessages(selectedId), 4000); return () => window.clearInterval(timer); }, [selectedId]);
    const sendReply = async (event) => { event.preventDefault(); const message = reply.trim(); if (!message || !selectedId) return; try { const { data } = await API.post(`/support/admin/chats/${selectedId}/messages`, { message }); setReply(""); await Promise.all([loadMessages(selectedId), loadChats()]); if (data.closed) setError(""); } catch { setError("Could not send the reply."); } };
    const resolveChat = async () => { try { await API.put(`/support/admin/chats/${selectedId}/status`, { status: "resolved" }); await loadChats(); } catch { setError("Could not resolve this chat."); } };
    const selected = chats.find((chat) => chat.id === selectedId), waitingCount = chats.filter((chat) => chat.status === "waiting").length;

    return <section className="admin-panel support-admin-panel">
        <div className="panel-heading"><div><h2>Customer Care</h2><p>{waitingCount} waiting chat{waitingCount === 1 ? "" : "s"}</p></div>{waitingCount > 0 && <span className="support-alert-badge">{waitingCount} NEW</span>}</div>
        {error && <p className="support-admin-error">{error}</p>}
        <div className="support-admin-layout">
            <div className="support-chat-list">{chats.map((chat) => <button className={chat.id === selectedId ? "selected" : ""} type="button" key={chat.id} onClick={() => setSelectedId(chat.id)}><span><strong>{chat.username}</strong><small>{chat.email}</small></span><span className={`support-status ${chat.status}`}>{chat.status}</span><p>{chat.last_message || "No message"}</p></button>)}{!chats.length && <p>No customer chats yet.</p>}</div>
            <div className="support-admin-conversation">{selected ? <><header><div><strong>{selected.username}</strong><small>Chat #{selected.id} · type /close to resolve</small></div>{selected.status !== "resolved" && <button className="secondary-button" type="button" onClick={resolveChat}>Mark resolved</button>}</header><div className="support-admin-messages">{messages.map((message) => <div className={message.sender_role} key={message.id}><strong>{message.sender_role === "admin" ? "Admin" : selected.username}</strong><p>{message.message}</p></div>)}</div>{selected.status !== "resolved" && <><div className="support-quick-answers"><strong>Quick answers</strong><div>{quickAnswers.map((answer) => <button type="button" key={answer.label} onClick={() => setReply(answer.text)}>{answer.label}</button>)}</div></div><form onSubmit={sendReply}><input maxLength="2000" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply to customer…" /><button className="primary-button" type="submit">Send</button></form></>}</> : <p className="support-select-prompt">Select a customer chat.</p>}</div>
        </div>
    </section>;
}

export default AdminSupport;
