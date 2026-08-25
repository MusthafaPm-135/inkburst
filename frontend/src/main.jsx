import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./theme-overrides.css";
import App from "./App.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "./context/ThemeContext";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <GoogleOAuthProvider
            clientId="452728166530-crhv0679knvpag9sms74mj0agf7h6dvb.apps.googleusercontent.com"
        >
            <App />
        </GoogleOAuthProvider>
    </StrictMode>
);