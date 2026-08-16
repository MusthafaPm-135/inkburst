import { API_ORIGIN } from "../api/axios";
import "./GoogleAuthButton.css";

function GoogleAuthButton() {
    return <button className="google-auth-button" type="button" onClick={() => window.location.assign(`${API_ORIGIN}/api/auth/google`)}>
        <span className="google-auth-icon" aria-hidden="true">G</span>
        Continue with Google
    </button>;
}

export default GoogleAuthButton;
