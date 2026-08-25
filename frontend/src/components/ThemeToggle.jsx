import { useTheme } from "../context/ThemeContext";

function ThemeToggle() {
    const { theme, cycleTheme } = useTheme();

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