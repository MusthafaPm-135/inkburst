import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import "./CustomerCare.css";
import "./CustomerCareQuestions.css";
import "./CustomerCareNext.css";

const primaryQuestions = [
    { label: "Read a purchase", message: "How do I read a purchased comic?" },
    { label: "Payment options", message: "What payment methods can I use?" },
    { label: "Missing comic", message: "Why is my purchase missing from Library?" },
    { label: "Login trouble", message: "How can I get help with login?" },
    { label: "Refund help", message: "How do I request a refund?" }
];
const whatsappUrl = "https://wa.me/+918075714019";

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
    const inputRef = useRef(null);
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
            <header className="customer-care-header"><div><span className="customer-care-kicker">KEYRACOMICS SUPPORT</span><h2>How can we help?</h2><p>Choose a topic or send us a message.</p></div><button type="button" onClick={() => setIsOpen(false)} aria-label="Close customer care">×</button></header>
            <a className="care-whatsapp-button" href={whatsappUrl} target="_blank" rel="noreferrer"><span aria-hidden="true">●</span><span><strong>Prefer WhatsApp?</strong><small>Open a direct chat</small></span><b aria-hidden="true">↗</b></a>
            {!user ? <div className="care-login-required"><span aria-hidden="true">🔒</span><h3>Log in to get help</h3><p>Your account helps us find your purchases and continue the same conversation.</p><button type="button" onClick={() => { setIsOpen(false); navigate("/login"); }}>Log in to continue</button></div> :
                <div className="customer-care-chat">
                    <div className={`care-connection-status ${notice ? "resolved" : (chat?.status || "new")}`}><span aria-hidden="true" />{notice ? "Conversation closed" : chat?.status === "active" ? "A KeyraComics admin is here" : chat ? "Admin notified — waiting for a reply" : "Ready when you are"}</div>
                    <div className="care-primary-questions" aria-label="Common support topics">
                        <strong>What do you need help with?</strong>
                        <p>Tap a topic to add the question below.</p>
                        <div>{primaryQuestions.map((question) => <button type="button" key={question.label} onClick={() => { setInput(question.message); inputRef.current?.focus(); }}>{question.label}<span aria-hidden="true">›</span></button>)}</div>
                    </div>
                    <div className="care-messages" aria-label="Chat messages">
                        {!messages.length && <div className="care-welcome"><strong>{notice ? "This conversation is closed." : "No messages yet"}</strong><span>{notice || "Your conversation with our support team will appear here."}</span></div>}
                        {messages.map((message) => <div className={`care-message ${message.sender_role}`} key={message.id}><strong>{message.sender_role === "admin" ? "Keyra Admin" : "You"}</strong><p>{message.message}</p><small>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div>)}
                        <div ref={messagesEndRef} />
                    </div>
                    {error && <p className="care-error">{error}</p>}
                    <form className="care-input" onSubmit={sendMessage}><label htmlFor="care-message-input">Your message <small>Type /close to end the chat</small></label><div><input ref={inputRef} id="care-message-input" maxLength="2000" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Tell us how we can help…" autoComplete="off" /><button type="submit" disabled={sending || !input.trim()}>{sending ? "…" : "Send"}</button></div></form>
                </div>}
        </section>}
        <button className="customer-care-launcher" type="button" aria-label={isOpen ? "Close customer care" : "Open customer care"} aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}><span aria-hidden="true">{isOpen ? "×" : "?"}</span><strong>{isOpen ? "Close" : "Customer care"}</strong></button>
    </aside>;
}

export default CustomerCare;
