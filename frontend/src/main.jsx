import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <GoogleOAuthProvider
            clientId="452728166530-crhv0679knvpag9sms74mj0agf7h6dvb.apps.googleusercontent.com"
        >
            <App />
        </GoogleOAuthProvider>
    </StrictMode>
);
