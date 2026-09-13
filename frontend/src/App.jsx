import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Library from "./pages/Library";
import GoogleAuthCallback from "./pages/GoogleAuthCallback";
import RequireAuth from "./components/RequireAuth";
import GoogleCallback from "./pages/GoogleCallback";
import CustomerCare from "./components/CustomerCare";
import TawkTo, { isTawkConfigured } from "./components/TawkTo";
import ReaderPortal from "./pages/ReaderPortal";
import "./styles/KeyraNext.css";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route path="/" element={<Home />} />

                <Route path="/login" element={<Login />} />

                <Route
                    path="/auth/google/callback"
                    element={<GoogleCallback />}
                />

                <Route path="/register" element={<Register />} />

                <Route path="/reader" element={<ReaderPortal />} />

                <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />

                <Route element={<RequireAuth />}>
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/library" element={<Library />} />
                </Route>

                <Route path="/admin/*" element={<Navigate to="/" replace />} />
                <Route path="/control/*" element={<Navigate to="/" replace />} />
                <Route path="/admin.html" element={<Navigate to="/" replace />} />

            </Routes>
            {isTawkConfigured ? <TawkTo /> : <CustomerCare />}
        </BrowserRouter>
    );
}

export default App;
