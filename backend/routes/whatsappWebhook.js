const crypto = require("crypto");
const express = require("express");

const router = express.Router();

function hasValidSignature(req) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const signature = req.get("x-hub-signature-256");

  if (!appSecret || !signature || !req.rawBody) return false;

  const expected = `sha256=${crypto
    .createHmac("sha256", appSecret)
    .update(req.rawBody)
    .digest("hex")}`;

  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function getReply() {
  return (
    "Hi! Thanks for contacting Keyra Comics. You can browse our comics at " +
    "https://keyracomics.vercel.app. A member of our team will reply soon."
  );
}

async function sendTextMessage(to, body) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const graphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION;

  if (!accessToken || !phoneNumberId || !graphApiVersion) {
    console.error("WhatsApp reply skipped: missing WhatsApp environment variables.");
    return;
  }

  const response = await fetch(
    `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    }
  );

  if (!response.ok) {
    console.error(
      "WhatsApp message failed:",
      response.status,
      await response.text()
    );
  }
}

// Meta calls this route before enabling the webhook.
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    token &&
    token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// Meta sends all WhatsApp events here after the webhook is enabled.
router.post("/", (req, res) => {
  if (!hasValidSignature(req)) {
    return res.sendStatus(401);
  }

  res.sendStatus(200);

  const changes = req.body?.entry?.flatMap((entry) => entry.changes || []) || [];
  const messages = changes.flatMap((change) => change.value?.messages || []);

  for (const message of messages) {
    if (message.type === "text" && message.from) {
      sendTextMessage(message.from, getReply()).catch((error) =>
        console.error("WhatsApp auto-reply error:", error.message)
      );
    }
  }
});

module.exports = router;
