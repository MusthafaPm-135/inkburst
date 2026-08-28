import { useEffect } from "react";
import API from "../api/axios";

// Tawk widget IDs are public identifiers from the embed code. Environment
// variables can still override these values if the business changes widgets.
const propertyId = import.meta.env.VITE_TAWK_PROPERTY_ID || "6a904ea8cedbe83442f9a9a7";
const widgetId = import.meta.env.VITE_TAWK_WIDGET_ID || "1k11r6h26";

export const isTawkConfigured = Boolean(propertyId && widgetId);

let widgetReady = false;
let queuedIdentitySync = false;
let signedInTawkUserId = null;
let identityRequestUserId = null;

const getWebsiteSession = () => {
    try {
        return {
            token: localStorage.getItem("token"),
            user: JSON.parse(localStorage.getItem("user") || "null")
        };
    } catch {
        return { token: null, user: null };
    }
};

export function closeTawkChat() {
    const tawk = window.Tawk_API;
    if (!signedInTawkUserId || !tawk?.logout) return;

    // Mark this before calling Tawk. logout() reconnects its widget and can
    // invoke onLoad again; the cleared marker prevents a second logout loop.
    signedInTawkUserId = null;
    identityRequestUserId = null;
    tawk.logout(() => {});
}

async function syncTawkIdentity() {
    const { token, user } = getWebsiteSession();
    const userId = user?.id ? String(user.id) : null;

    if (!token || !userId) {
        closeTawkChat();
        return;
    }

    const tawk = window.Tawk_API;
    if (!widgetReady || !tawk?.login) {
        queuedIdentitySync = true;
        return;
    }

    if (signedInTawkUserId === userId || identityRequestUserId === userId) return;
    identityRequestUserId = userId;

    try {
        const { data } = await API.get("/auth/tawk-identity");
        const visitor = data?.visitor;
        if (!visitor?.userId || !visitor?.hash) throw new Error("Missing Tawk identity");

        tawk.login(visitor, (error) => {
            identityRequestUserId = null;
            if (!error) signedInTawkUserId = userId;
        });
    } catch {
        // Leave the normal widget alone if secure Tawk sign-in is not yet
        // configured. This avoids changing its open/closed state.
        identityRequestUserId = null;
    }
}

function TawkTo() {
    useEffect(() => {
        const onAuthChange = () => { void syncTawkIdentity(); };
        window.addEventListener("authChanged", onAuthChange);
        return () => window.removeEventListener("authChanged", onAuthChange);
    }, []);

    useEffect(() => {
        if (!isTawkConfigured) return undefined;

        if (document.querySelector("script[data-keyra-tawk]")) {
            void syncTawkIdentity();
            return undefined;
        }

        window.Tawk_API = window.Tawk_API || {};
        const previousOnLoad = window.Tawk_API.onLoad;
        window.Tawk_API.onLoad = () => {
            widgetReady = true;
            previousOnLoad?.();
            if (queuedIdentitySync || getWebsiteSession().token) void syncTawkIdentity();
        };
        window.Tawk_LoadStart = new Date();

        const script = document.createElement("script");
        script.async = true;
        script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
        script.charset = "UTF-8";
        script.setAttribute("crossorigin", "*");
        script.setAttribute("data-keyra-tawk", "true");
        document.head.appendChild(script);

        return () => script.remove();
    }, []);

    return null;
}

export default TawkTo;
