import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Library from "./pages/Library";
import Orders from "./pages/Orders";
import AdminDashboard from './pages/AdminDashboard';
import AdminRoute from "./components/AdminRoute";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route path="/orders" element={<Orders />} />

                <Route path="/" element={<Home />} />

                <Route path="/login" element={<Login />} />

                <Route path="/register" element={<Register />} />

                <Route path="/cart" element={<Cart />} />

                <Route path="/checkout" element={<Checkout />} />

                <Route path="/library" element={<Library />} />

                <Route
                    path="/admin"
                    element={
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    }
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;
