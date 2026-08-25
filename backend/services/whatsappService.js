const https = require("https");
const isConfigured = () => [
    "META_WHATSAPP_ACCESS_TOKEN",
    "META_WHATSAPP_PHONE_NUMBER_ID",
    "META_WHATSAPP_TEMPLATE_NAME",
    "META_GRAPH_API_VERSION",
    "ADMIN_WHATSAPP_TO",
].every((name) => process.env[name]);

const notifyAdminOfNewChat = ({ chatId, username }) => {
    if (!isConfigured()) return Promise.resolve({ skipped: true });

    const graphVersion = String(process.env.META_GRAPH_API_VERSION).startsWith("v")
        ? String(process.env.META_GRAPH_API_VERSION)
        : `v${process.env.META_GRAPH_API_VERSION}`;
    const recipient = String(process.env.ADMIN_WHATSAPP_TO).replace(/\D/g, "");
    const adminUrl = `${(process.env.FRONTEND_URL || "https://keyracomics.vercel.app").replace(/\/$/, "")}/admin`;
    const body = JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "template",
        template: {
            name: process.env.META_WHATSAPP_TEMPLATE_NAME,
            language: { code: process.env.META_WHATSAPP_LANGUAGE_CODE || "en" },
            components: [{
                type: "body",
                parameters: [
                    { type: "text", text: username || "A customer" },
                    { type: "text", text: String(chatId) },
                    { type: "text", text: adminUrl }
                ]
            }]
        }
    });

    return new Promise((resolve, reject) => {
        const request = https.request({
            hostname: "graph.facebook.com",
            path: `/${graphVersion}/${process.env.META_WHATSAPP_PHONE_NUMBER_ID}/messages`,
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.META_WHATSAPP_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(body)
            }
        }, (response) => {
            let responseBody = "";
            response.on("data", (chunk) => { responseBody += chunk; });
            response.on("end", () => {
                if (response.statusCode >= 200 && response.statusCode < 300) return resolve({ sent: true });
                reject(new Error(`Meta WhatsApp returned status ${response.statusCode}: ${responseBody.slice(0, 200)}`));
            });
        });

        request.on("error", reject);
        request.write(body);
        request.end();
    });
};

module.exports = { notifyAdminOfNewChat };
