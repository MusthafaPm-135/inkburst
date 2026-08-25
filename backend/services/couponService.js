const db = require("../config/db");

const query = (sql, values = []) => new Promise((resolve, reject) => {
    db.query(sql, values, (error, results) => error ? reject(error) : resolve(results));
});

let ready;
const ensureCouponsTable = () => {
    if (!ready) ready = query(`CREATE TABLE IF NOT EXISTS coupons (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(40) NOT NULL UNIQUE,
        discount_type ENUM('percent','fixed') NOT NULL,
        discount_value DECIMAL(10,2) NOT NULL,
        min_order DECIMAL(10,2) NOT NULL DEFAULT 0,
        max_discount DECIMAL(10,2) NULL,
        usage_limit INT NULL,
        used_count INT NOT NULL DEFAULT 0,
        starts_at DATETIME NULL,
        expires_at DATETIME NULL,
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);
    return ready;
};

const normalizeCode = (value) => String(value || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 40);

const calculateCoupon = async (codeValue, subtotalPaise) => {
    const code = normalizeCode(codeValue);
    if (!code) return { code: "", subtotalPaise, discountPaise: 0, totalPaise: subtotalPaise, coupon: null };
    await ensureCouponsTable();
    const rows = await query(`SELECT * FROM coupons WHERE code = ? AND active = 1
        AND (starts_at IS NULL OR starts_at <= NOW()) AND (expires_at IS NULL OR expires_at >= NOW())
        AND (usage_limit IS NULL OR used_count < usage_limit) LIMIT 1`, [code]);
    if (!rows.length) throw Object.assign(new Error("This coupon is invalid or has expired."), { status: 400 });
    const coupon = rows[0];
    if (subtotalPaise < Math.round(Number(coupon.min_order) * 100)) {
        throw Object.assign(new Error(`This coupon requires a minimum order of ₹${Number(coupon.min_order).toFixed(2)}.`), { status: 400 });
    }
    let discountPaise = coupon.discount_type === "percent"
        ? Math.round(subtotalPaise * Number(coupon.discount_value) / 100)
        : Math.round(Number(coupon.discount_value) * 100);
    if (coupon.max_discount != null) discountPaise = Math.min(discountPaise, Math.round(Number(coupon.max_discount) * 100));
    discountPaise = Math.min(discountPaise, Math.max(0, subtotalPaise - 100));
    return { code, subtotalPaise, discountPaise, totalPaise: subtotalPaise - discountPaise, coupon };
};

module.exports = { query, ensureCouponsTable, normalizeCode, calculateCoupon };
