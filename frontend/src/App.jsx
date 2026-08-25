import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Library from "./pages/Library";
import AdminDashboard from "./pages/AdminDashboard";
import GoogleAuthCallback from "./pages/GoogleAuthCallback";
import AdminRoute from "./components/AdminRoute";
import RequireAuth from "./components/RequireAuth";
import GoogleCallback from "./pages/GoogleCallback";
import CustomerCare from "./components/CustomerCare";

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

                <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />

                <Route element={<RequireAuth />}>
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/library" element={<Library />} />
                </Route>

                <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                </Route>

            </Routes>
            <CustomerCare />
        </BrowserRouter>
    );
}

export default App;
