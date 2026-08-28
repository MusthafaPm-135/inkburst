import { useEffect } from "react";

// Tawk widget IDs are public identifiers from the embed code. Environment
// variables can still override these values if the business changes widgets.
const propertyId = import.meta.env.VITE_TAWK_PROPERTY_ID || "6a904ea8cedbe83442f9a9a7";
const widgetId = import.meta.env.VITE_TAWK_WIDGET_ID || "1k11r6h26";

export const isTawkConfigured = Boolean(propertyId && widgetId);

// Avoid calling Tawk's login/logout/minimize methods while its widget is
// reconnecting. Those calls make the floating button repeatedly open and close.
export function closeTawkChat() {}

function TawkTo() {
    useEffect(() => {
        if (!isTawkConfigured) return undefined;

        if (document.querySelector("script[data-keyra-tawk]")) return undefined;

        window.Tawk_API = window.Tawk_API || {};
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
