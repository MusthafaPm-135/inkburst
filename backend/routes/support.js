const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const { notifyAdminOfNewChat } = require("../services/whatsappService");

const router = express.Router();
const query = (sql, values = []) => new Promise((resolve, reject) => {
    db.query(sql, values, (error, results) => error ? reject(error) : resolve(results));
});
const cleanMessage = (value) => String(value || "").trim().slice(0, 2000);

const initializeSupportTables = () => {
    db.query(`CREATE TABLE IF NOT EXISTS support_chats (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        admin_id INT NULL,
        status ENUM('waiting','active','resolved') NOT NULL DEFAULT 'waiting',
        whatsapp_notified TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_support_user_status (user_id, status),
        INDEX idx_support_status_updated (status, updated_at)
    ) ENGINE=InnoDB`, (chatError) => {
        if (chatError) return console.error("SUPPORT CHAT TABLE ERROR:", chatError.message);
        db.query(`CREATE TABLE IF NOT EXISTS support_messages (
            id INT NOT NULL AUTO_INCREMENT,
            chat_id INT NOT NULL,
            sender_id INT NOT NULL,
            sender_role ENUM('customer','admin') NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX idx_support_messages_chat (chat_id, id)
        ) ENGINE=InnoDB`, (messageError) => {
            if (messageError) console.error("SUPPORT MESSAGE TABLE ERROR:", messageError.message);
        });
    });
};

initializeSupportTables();
router.use(auth);

router.get("/chat", async (req, res) => {
    try {
        const chats = await query(
            "SELECT id, status, created_at, updated_at FROM support_chats WHERE user_id = ? AND status <> 'resolved' ORDER BY id DESC LIMIT 1",
            [req.user.id]
        );
        if (!chats.length) return res.json({ success: true, chat: null, messages: [] });
        const messages = await query(
            "SELECT id, sender_role, message, created_at FROM support_messages WHERE chat_id = ? ORDER BY id ASC",
            [chats[0].id]
        );
        res.json({ success: true, chat: chats[0], messages });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not load support chat." });
    }
});

router.post("/messages", async (req, res) => {
    const message = cleanMessage(req.body?.message);
    if (!message) return res.status(400).json({ success: false, message: "Enter a message." });

    try {
        let chats = await query(
            "SELECT id, status FROM support_chats WHERE user_id = ? AND status <> 'resolved' ORDER BY id DESC LIMIT 1",
            [req.user.id]
        );
        let chat = chats[0];
        let isNewChat = false;

        if (message.toLowerCase() === "/close") {
            if (chat) {
                await query("UPDATE support_chats SET status = 'resolved', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [chat.id]);
            }
            return res.json({ success: true, closed: true, message: "Chat closed." });
        }

        if (!chat) {
            const result = await query("INSERT INTO support_chats (user_id) VALUES (?)", [req.user.id]);
            chat = { id: result.insertId, status: "waiting" };
            isNewChat = true;
        }

        const result = await query(
            "INSERT INTO support_messages (chat_id, sender_id, sender_role, message) VALUES (?, ?, 'customer', ?)",
            [chat.id, req.user.id, message]
        );
        await query("UPDATE support_chats SET status = IF(status = 'resolved', 'waiting', status), updated_at = CURRENT_TIMESTAMP WHERE id = ?", [chat.id]);

        if (isNewChat) {
            query("SELECT username FROM users WHERE id = ? LIMIT 1", [req.user.id]).then((users) => {
                notifyAdminOfNewChat({ chatId: chat.id, username: users[0]?.username })
                    .then((result) => {
                        if (result.sent) query("UPDATE support_chats SET whatsapp_notified = 1 WHERE id = ?", [chat.id]).catch(() => {});
                    })
                    .catch((error) => console.error("WHATSAPP SUPPORT ALERT ERROR:", error.message));
            }).catch(() => {});
        }

        res.status(201).json({
            success: true,
            chat: { id: chat.id, status: chat.status },
            message: { id: result.insertId, sender_role: "customer", message, created_at: new Date().toISOString() }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not send your support message." });
    }
});

router.get("/admin/chats", admin, async (req, res) => {
    try {
        const chats = await query(`
            SELECT sc.id, sc.user_id, sc.admin_id, sc.status, sc.whatsapp_notified,
                   sc.created_at, sc.updated_at, u.username, u.email,
                   (SELECT message FROM support_messages WHERE chat_id = sc.id ORDER BY id DESC LIMIT 1) AS last_message,
                   (SELECT COUNT(*) FROM support_messages WHERE chat_id = sc.id AND sender_role = 'customer') AS customer_messages
            FROM support_chats sc
            JOIN users u ON u.id = sc.user_id
            ORDER BY FIELD(sc.status, 'waiting', 'active', 'resolved'), sc.updated_at DESC
            LIMIT 100
        `);
        res.json({ success: true, chats });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not load support chats." });
    }
});

router.get("/admin/chats/:id/messages", admin, async (req, res) => {
    try {
        const chats = await query("SELECT id, status, user_id FROM support_chats WHERE id = ? LIMIT 1", [req.params.id]);
        if (!chats.length) return res.status(404).json({ success: false, message: "Chat not found." });
        const messages = await query("SELECT id, sender_role, message, created_at FROM support_messages WHERE chat_id = ? ORDER BY id ASC", [req.params.id]);
        res.json({ success: true, chat: chats[0], messages });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not load messages." });
    }
});

router.post("/admin/chats/:id/messages", admin, async (req, res) => {
    const message = cleanMessage(req.body?.message);
    if (!message) return res.status(400).json({ success: false, message: "Enter a reply." });
    try {
        const chats = await query("SELECT id FROM support_chats WHERE id = ? LIMIT 1", [req.params.id]);
        if (!chats.length) return res.status(404).json({ success: false, message: "Chat not found." });
        if (message.toLowerCase() === "/close") {
            await query("UPDATE support_chats SET status = 'resolved', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [req.params.id]);
            return res.json({ success: true, closed: true, message: "Chat closed." });
        }
        const result = await query(
            "INSERT INTO support_messages (chat_id, sender_id, sender_role, message) VALUES (?, ?, 'admin', ?)",
            [req.params.id, req.user.id, message]
        );
        await query("UPDATE support_chats SET admin_id = ?, status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [req.user.id, req.params.id]);
        res.status(201).json({ success: true, message: { id: result.insertId, sender_role: "admin", message, created_at: new Date().toISOString() } });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not send the reply." });
    }
});

router.put("/admin/chats/:id/status", admin, async (req, res) => {
    const status = ["waiting", "active", "resolved"].includes(req.body?.status) ? req.body.status : null;
    if (!status) return res.status(400).json({ success: false, message: "Invalid chat status." });
    try {
        await query("UPDATE support_chats SET status = ?, admin_id = IF(? = 'active', ?, admin_id), updated_at = CURRENT_TIMESTAMP WHERE id = ?", [status, status, req.user.id, req.params.id]);
        res.json({ success: true, status });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not update chat status." });
    }
});

module.exports = router;
