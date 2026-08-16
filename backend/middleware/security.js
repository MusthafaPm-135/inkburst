const buckets = new Map();

const prune = () => {
    const now = Date.now();
    for (const [key, value] of buckets.entries()) if (value.resetAt <= now) buckets.delete(key);
};

exports.securityHeaders = (req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (process.env.NODE_ENV === "production") res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
};

// Suitable for a single server instance. Use a shared store such as Redis
// before running multiple backend instances.
exports.rateLimit = ({ prefix, limit, windowMs }) => (req, res, next) => {
    prune();
    const key = `${prefix}:${req.ip}`;
    const now = Date.now();
    const current = buckets.get(key) || { count: 0, resetAt: now + windowMs };
    current.count += 1;
    buckets.set(key, current);
    res.setHeader("RateLimit-Limit", limit);
    res.setHeader("RateLimit-Remaining", Math.max(0, limit - current.count));
    if (current.count > limit) return res.status(429).json({ success: false, message: "Too many attempts. Please wait and try again." });
    next();
};
