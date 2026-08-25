import { useEffect, useRef, useState } from "react";
import "./CustomerCare.css";

const quickQuestions = [
    "How do I read a purchased comic?",
    "Which payment methods can I use?",
    "Where can I find my order?"
];

const getReply = (message) => {
    const text = message.toLowerCase();

    if (text.includes("read") || text.includes("library") || text.includes("download")) {
        return "After payment is verified, open Library from the top navigation. Your purchased comics will appear there with a Read Comic button.";
    }
    if (text.includes("payment") || text.includes("pay") || text.includes("upi") || text.includes("card") || text.includes("razorpay")) {
        return "KeyraComics checkout uses Razorpay and supports the payment methods shown in the secure Razorpay window, including eligible UPI, cards, net banking, and wallets.";
    }
    if (text.includes("order") || text.includes("purchase") || text.includes("bought")) {
        return "Completed purchases are added to your Library. Make sure you are logged in with the same account used during checkout.";
    }
    if (text.includes("login") || text.includes("sign in") || text.includes("google") || text.includes("account")) {
        return "You can log in with email and password or continue with Google. If Google login fails, return to the login page and try again in the same browser.";
    }
    if (text.includes("cart") || text.includes("remove")) {
        return "Open Cart from the top navigation to review or remove comics before continuing to checkout.";
    }
    if (text.includes("refund") || text.includes("cancel")) {
        return "For payment, cancellation, or refund concerns, keep your Razorpay payment reference ready and choose Contact Support below so the team can review it.";
    }
    if (text.includes("hello") || text.includes("hi") || text.includes("hey")) {
        return "Hello! I can help with KeyraComics accounts, cart, checkout, payments, orders, and Library access. What do you need help with?";
    }

    return "I could not match that question yet. Try asking about login, cart, payment, orders, refunds, or reading comics from your Library.";
};

function CustomerCare() {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState("home");
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([
        { role: "assistant", text: "Hi! I am the Keyra automated assistant. How can I help you today?" }
    ]);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (isOpen && view === "chat") {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [isOpen, messages, view]);

    const sendMessage = (text) => {
        const question = text.trim();
        if (!question) return;

        setMessages((current) => [
            ...current,
            { role: "user", text: question },
            { role: "assistant", text: getReply(question) }
        ]);
        setInput("");
    };

    const submit = (event) => {
        event.preventDefault();
        sendMessage(input);
    };

    const closePanel = () => {
        setIsOpen(false);
        setView("home");
    };

    return (
        <aside className="customer-care" aria-live="polite">
            {isOpen && (
                <section className="customer-care-panel" aria-label="Customer care">
                    <header className="customer-care-header">
                        <div>
                            <span className="customer-care-kicker">KEYRACOMICS</span>
                            <h2>{view === "chat" ? "AI chat" : "Customer care"}</h2>
                        </div>
                        <button type="button" onClick={closePanel} aria-label="Close customer care">×</button>
                    </header>

                    {view === "home" ? (
                        <div className="customer-care-home">
                            <p>Need help with your account, payment, order, or Library?</p>
                            <button className="care-option care-option-ai" type="button" onClick={() => setView("chat")}>
                                <span aria-hidden="true">✦</span>
                                <span><strong>Chat with Keyra AI</strong><small>Get instant automated help</small></span>
                                <span aria-hidden="true">→</span>
                            </button>
                            <div className="care-topics">
                                <strong>Popular help topics</strong>
                                {quickQuestions.map((question) => (
                                    <button key={question} type="button" onClick={() => { setView("chat"); sendMessage(question); }}>
                                        {question}
                                    </button>
                                ))}
                            </div>
                            <p className="care-disclaimer">The assistant gives automated website help and cannot view private payment or account details.</p>
                        </div>
                    ) : (
                        <div className="customer-care-chat">
                            <button className="care-back" type="button" onClick={() => setView("home")}>← Customer care</button>
                            <div className="care-messages" aria-label="Chat messages">
                                {messages.map((message, index) => (
                                    <p className={`care-message ${message.role}`} key={`${message.role}-${index}`}>
                                        {message.text}
                                    </p>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="care-suggestions">
                                {quickQuestions.slice(0, 2).map((question) => (
                                    <button key={question} type="button" onClick={() => sendMessage(question)}>{question}</button>
                                ))}
                            </div>
                            <form className="care-input" onSubmit={submit}>
                                <label className="sr-only" htmlFor="care-message-input">Ask Keyra AI a question</label>
                                <input id="care-message-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type your question..." autoComplete="off" />
                                <button type="submit" aria-label="Send message">Send</button>
                            </form>
                        </div>
                    )}
                </section>
            )}

            <button
                className="customer-care-launcher"
                type="button"
                aria-label={isOpen ? "Close customer care" : "Open customer care"}
                aria-expanded={isOpen}
                onClick={() => isOpen ? closePanel() : setIsOpen(true)}
            >
                <span aria-hidden="true">{isOpen ? "×" : "?"}</span>
                <strong>{isOpen ? "Close" : "Customer care"}</strong>
            </button>
        </aside>
    );
}

export default CustomerCare;
