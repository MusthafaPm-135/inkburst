import { useEffect, useState } from "react";

function ThemeToggle() {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("keyra-theme") || "system";
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("keyra-theme", theme);
    }, [theme]);

    const cycleTheme = () => {
        setTheme((current) => {
            if (current === "system") return "light";
            if (current === "light") return "dark";
            return "system";
        });
    };

    const label =
        theme === "system"
            ? "Device"
            : theme === "light"
            ? "Light"
            : "Dark";

    const icon =
        theme === "system"
            ? "💻"
            : theme === "light"
            ? "☀️"
            : "🌙";

    return (
        <button
            type="button"
            className="theme-toggle-btn"
            onClick={cycleTheme}
            title="Switch theme"
        >
            <span>{icon}</span>
            <span>{label}</span>
        </button>
    );
}

export default ThemeToggle;