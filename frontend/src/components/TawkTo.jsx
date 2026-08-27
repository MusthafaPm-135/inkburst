import { useEffect } from "react";
import API from "../api/axios";

// Tawk widget IDs are public identifiers from the embed code. Environment
// variables can still override these values if the business changes widgets.
const propertyId = import.meta.env.VITE_TAWK_PROPERTY_ID || "6a904ea8cedbe83442f9a9a7";
const widgetId = import.meta.env.VITE_TAWK_WIDGET_ID || "1k11r6h26";

export const isTawkConfigured = Boolean(propertyId && widgetId);

let isWidgetLoaded = false;
let needsIdentitySync = false;

const currentSession = () => {
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
    needsIdentitySync = false;
    const tawk = window.Tawk_API;
    if (!tawk) return;

    try {
        tawk.endChat?.();
        tawk.minimize?.();
        tawk.logout?.(() => {});
    } catch {
        // The widget may still be loading. Logging out must still continue.
    }
}

export async function syncTawkIdentity() {
    const { token, user } = currentSession();

    if (!token || !user) {
        closeTawkChat();
        return;
    }

    const tawk = window.Tawk_API;
    if (!isWidgetLoaded || !tawk?.login) {
        needsIdentitySync = true;
        return;
    }

    needsIdentitySync = false;

    try {
        const { data } = await API.get("/auth/tawk-identity");
        const visitor = data?.visitor;
        if (!visitor?.userId || !visitor?.hash) throw new Error("Missing Tawk identity");

        tawk.login(visitor, () => {});
    } catch {
        // Never leave a previous customer's Tawk identity active if the
        // current account could not be verified.
        closeTawkChat();
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
            isWidgetLoaded = true;
            previousOnLoad?.();
            if (needsIdentitySync || currentSession().token) void syncTawkIdentity();
            else closeTawkChat();
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
