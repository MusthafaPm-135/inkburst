const express = require("express");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const { query, ensureCouponsTable, normalizeCode, calculateCoupon } = require("../services/couponService");

const router = express.Router();

router.post("/validate", auth, async (req, res) => {
    try {
        const cart = await query("SELECT comics.price, 1 AS quantity FROM cart JOIN comics ON comics.id = cart.comic_id WHERE cart.user_id = ?", [req.user.id]);
        const subtotalPaise = Math.round(cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity || 1), 0) * 100);
        const pricing = await calculateCoupon(req.body?.code, subtotalPaise);
        res.json({ success: true, code: pricing.code, subtotal: pricing.subtotalPaise / 100, discount: pricing.discountPaise / 100, total: pricing.totalPaise / 100 });
    } catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message || "Could not validate this coupon." });
    }
});

router.get("/admin", auth, admin, async (_req, res) => {
    try { await ensureCouponsTable(); res.json({ success: true, coupons: await query("SELECT * FROM coupons ORDER BY id DESC") }); }
    catch { res.status(500).json({ success: false, message: "Could not load coupons." }); }
});

router.post("/admin", auth, admin, async (req, res) => {
    try {
        await ensureCouponsTable();
        const { discount_type, discount_value, min_order = 0, max_discount, usage_limit, starts_at, expires_at } = req.body || {};
        const code = normalizeCode(req.body?.code);
        if (!code || !["percent", "fixed"].includes(discount_type) || !(Number(discount_value) > 0) || (discount_type === "percent" && Number(discount_value) > 100)) return res.status(400).json({ success: false, message: "Enter valid coupon details." });
        await query("INSERT INTO coupons (code, discount_type, discount_value, min_order, max_discount, usage_limit, starts_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [code, discount_type, discount_value, Number(min_order) || 0, max_discount || null, usage_limit || null, starts_at ? String(starts_at).replace("T", " ") : null, expires_at ? String(expires_at).replace("T", " ") : null]);
        res.json({ success: true, message: "Coupon created." });
    } catch (error) { res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({ success: false, message: error.code === "ER_DUP_ENTRY" ? "That coupon code already exists." : "Could not create coupon." }); }
});

router.put("/admin/:id/toggle", auth, admin, async (req, res) => {
    try { await ensureCouponsTable(); await query("UPDATE coupons SET active = NOT active WHERE id = ?", [req.params.id]); res.json({ success: true }); }
    catch { res.status(500).json({ success: false, message: "Could not update coupon." }); }
});

router.delete("/admin/:id", auth, admin, async (req, res) => {
    try { await ensureCouponsTable(); await query("DELETE FROM coupons WHERE id = ?", [req.params.id]); res.json({ success: true }); }
    catch { res.status(500).json({ success: false, message: "Could not delete coupon." }); }
});

module.exports = router;
