import { useEffect } from "react";

const propertyId = import.meta.env.VITE_TAWK_PROPERTY_ID;
const widgetId = import.meta.env.VITE_TAWK_WIDGET_ID;

export const isTawkConfigured = Boolean(propertyId && widgetId);

function TawkTo() {
    useEffect(() => {
        if (!isTawkConfigured || document.querySelector("script[data-keyra-tawk]")) return undefined;

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
