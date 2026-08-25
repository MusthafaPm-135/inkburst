import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import "./CustomerCare.css";
import "./CustomerCareQuestions.css";

const primaryQuestions = [
    "How do I read a purchased comic?",
    "What payment methods can I use?",
    "Why is my purchase missing from Library?",
    "How can I get help with login?",
    "How do I request a refund?"
];
const whatsappUrl = "https://api.whatsapp.com/qr/DQYSOU2ZRETTJ1";

function CustomerCare() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const user = JSON.parse(localStorage.getItem("user") || "null");

    const loadChat = async () => {
        if (!user) return;
        try {
            const response = await API.get("/support/chat");
            setChat(response.data.chat);
            setMessages(response.data.messages || []);
            setError("");
        } catch (requestError) {
            setError(requestError.response?.status === 401 ? "Your session expired. Please log in again." : "Customer care is temporarily unavailable.");
        }
    };

    useEffect(() => {
        if (!isOpen || !user) return undefined;
        loadChat();
        const timer = window.setInterval(loadChat, 4000);
        return () => window.clearInterval(timer);
    }, [isOpen, user?.id]);

    useEffect(() => {
        if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [isOpen, messages]);

    const sendMessage = async (event) => {
        event.preventDefault();
        const message = input.trim();
        if (!message || sending) return;
        setSending(true);
        setError("");
        setNotice("");
        try {
            const response = await API.post("/support/messages", { message });
            setInput("");
            if (response.data.closed) {
                setChat(null);
                setMessages([]);
                setNotice("Chat closed. Send another message whenever you need to start a new conversation.");
                return;
            }
            setChat(response.data.chat);
            setMessages((current) => [...current, response.data.message]);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Could not send your message.");
        } finally {
            setSending(false);
        }
    };

    return <aside className="customer-care" aria-live="polite">
        {isOpen && <section className="customer-care-panel" aria-label="Customer care live chat">
            <header className="customer-care-header"><div><span className="customer-care-kicker">KEYRACOMICS</span><h2>Customer care</h2></div><button type="button" onClick={() => setIsOpen(false)} aria-label="Close customer care">×</button></header>
            <a className="care-whatsapp-button" href={whatsappUrl} target="_blank" rel="noreferrer"><span aria-hidden="true">●</span> Chat on WhatsApp</a>
            {!user ? <div className="care-login-required"><span aria-hidden="true">🔒</span><h3>Log in to start a chat</h3><p>Customer care chat is available to registered KeyraComics customers.</p><button type="button" onClick={() => { setIsOpen(false); navigate("/login"); }}>Log in</button></div> :
                <div className="customer-care-chat">
                    <div className={`care-connection-status ${notice ? "resolved" : (chat?.status || "new")}`}><span aria-hidden="true" />{notice ? "Chat closed" : chat?.status === "active" ? "Admin connected" : "Connecting you to a KeyraComics admin…"}</div>
                    <div className="care-messages" aria-label="Chat messages">
                        {!messages.length && <p className="care-welcome">{notice || "Send your question below. An admin will be notified and will join this chat. Type /close at any time to close the conversation."}</p>}
                        {messages.map((message) => <div className={`care-message ${message.sender_role}`} key={message.id}><strong>{message.sender_role === "admin" ? "Keyra Admin" : "You"}</strong><p>{message.message}</p><small>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div>)}
                        <div ref={messagesEndRef} />
                    </div>
                    {error && <p className="care-error">{error}</p>}
                    <div className="care-primary-questions" aria-label="Primary customer care questions">
                        <strong>Primary questions</strong>
                        <div>{primaryQuestions.map((question) => <button type="button" key={question} onClick={() => setInput(question)}>{question}</button>)}</div>
                    </div>
                    <form className="care-input" onSubmit={sendMessage}><label className="sr-only" htmlFor="care-message-input">Message customer care</label><input id="care-message-input" maxLength="2000" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type your message…" autoComplete="off" /><button type="submit" disabled={sending || !input.trim()}>{sending ? "…" : "Send"}</button></form>
                </div>}
        </section>}
        <button className="customer-care-launcher" type="button" aria-label={isOpen ? "Close customer care" : "Open customer care"} aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}><span aria-hidden="true">{isOpen ? "×" : "?"}</span><strong>{isOpen ? "Close" : "Customer care"}</strong></button>
    </aside>;
}

export default CustomerCare;
