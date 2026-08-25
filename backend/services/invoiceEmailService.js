const https = require("https");

const isConfigured = () => ["RESEND_API_KEY", "INVOICE_FROM_EMAIL"]
    .every((name) => process.env[name]);

const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatPrice = (value) => `₹${Number(value).toFixed(2)}`;

const sendPurchaseInvoice = ({ customer, items, paymentId, razorpayOrderId }) => {
    if (!isConfigured() || !customer?.email) return Promise.resolve({ skipped: true });

    const total = items.reduce((sum, item) => sum + Number(item.price), 0);
    const invoiceNumber = `KEYRA-${String(paymentId).replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const itemRows = items.map((item) => `
        <tr>
            <td style="padding:10px;border-bottom:1px solid #ddd">${escapeHtml(item.title)}</td>
            <td style="padding:10px;border-bottom:1px solid #ddd">${escapeHtml(item.author || "KeyraComics")}</td>
            <td style="padding:10px;border-bottom:1px solid #ddd;text-align:right">${formatPrice(item.price)}</td>
        </tr>`).join("");
    const body = JSON.stringify({
        from: process.env.INVOICE_FROM_EMAIL,
        to: [customer.email],
        subject: `Your KeyraComics invoice — ${invoiceNumber}`,
        html: `
            <div style="max-width:680px;margin:auto;font-family:Arial,sans-serif;color:#20192b">
                <div style="padding:24px;background:#c51f38;color:#fff">
                    <h1 style="margin:0">KeyraComics</h1>
                    <p style="margin:6px 0 0">Purchase invoice</p>
                </div>
                <div style="padding:24px;border:1px solid #ddd">
                    <p>Hi ${escapeHtml(customer.username || "Keyra reader")},</p>
                    <p>Thank you for your purchase. Your comics are now available in your KeyraComics Library.</p>
                    <p><strong>Invoice:</strong> ${escapeHtml(invoiceNumber)}<br>
                    <strong>Payment ID:</strong> ${escapeHtml(paymentId)}<br>
                    <strong>Razorpay order:</strong> ${escapeHtml(razorpayOrderId)}<br>
                    <strong>Date:</strong> ${escapeHtml(new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }))}</p>
                    <table style="width:100%;border-collapse:collapse;margin-top:20px">
                        <thead><tr style="background:#f2eadc"><th style="padding:10px;text-align:left">Comic</th><th style="padding:10px;text-align:left">Author</th><th style="padding:10px;text-align:right">Price</th></tr></thead>
                        <tbody>${itemRows}</tbody>
                        <tfoot><tr><td colspan="2" style="padding:12px;text-align:right"><strong>Total paid</strong></td><td style="padding:12px;text-align:right"><strong>${formatPrice(total)}</strong></td></tr></tfoot>
                    </table>
                    <p style="margin-top:24px">Open your Library: <a href="${escapeHtml(`${(process.env.FRONTEND_URL || "https://keyracomics.vercel.app").replace(/\/$/, "")}/library`)}">Read your comics</a></p>
                </div>
            </div>`
    });

    return new Promise((resolve, reject) => {
        const request = https.request({
            hostname: "api.resend.com",
            path: "/emails",
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(body)
            }
        }, (response) => {
            let responseBody = "";
            response.on("data", (chunk) => { responseBody += chunk; });
            response.on("end", () => {
                if (response.statusCode >= 200 && response.statusCode < 300) return resolve({ sent: true });
                reject(new Error(`Resend returned status ${response.statusCode}: ${responseBody.slice(0, 200)}`));
            });
        });
        request.on("error", reject);
        request.write(body);
        request.end();
    });
};

module.exports = { sendPurchaseInvoice };
