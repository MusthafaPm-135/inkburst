const https = require("https");
const querystring = require("querystring");

const isConfigured = () => [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_WHATSAPP_FROM",
    "ADMIN_WHATSAPP_TO",
    "TWILIO_WHATSAPP_CONTENT_SID"
].every((name) => process.env[name]);

const notifyAdminOfNewChat = ({ chatId, username }) => {
    if (!isConfigured()) return Promise.resolve({ skipped: true });

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const body = querystring.stringify({
        From: process.env.TWILIO_WHATSAPP_FROM,
        To: process.env.ADMIN_WHATSAPP_TO,
        ContentSid: process.env.TWILIO_WHATSAPP_CONTENT_SID,
        ContentVariables: JSON.stringify({
            1: username || "A customer",
            2: String(chatId),
            3: `${(process.env.FRONTEND_URL || "https://keyracomics.vercel.app").replace(/\/$/, "")}/admin`
        })
    });

    return new Promise((resolve, reject) => {
        const request = https.request({
            hostname: "api.twilio.com",
            path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
            method: "POST",
            auth: `${accountSid}:${process.env.TWILIO_AUTH_TOKEN}`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": Buffer.byteLength(body)
            }
        }, (response) => {
            let responseBody = "";
            response.on("data", (chunk) => { responseBody += chunk; });
            response.on("end", () => {
                if (response.statusCode >= 200 && response.statusCode < 300) return resolve({ sent: true });
                reject(new Error(`Twilio returned status ${response.statusCode}: ${responseBody.slice(0, 200)}`));
            });
        });

        request.on("error", reject);
        request.write(body);
        request.end();
    });
};

module.exports = { notifyAdminOfNewChat };
