const router = require('express').Router();
const db = require('../config/db');
const query = (sql, values = []) => new Promise((resolve, reject) => {
    db.query(sql, values, (error, rows) => error ? reject(error) : resolve(rows));
});
const optionalRows = async (sql, values) => {
    try { return await query(sql, values); }
    catch (error) { if (error.code === 'ER_NO_SUCH_TABLE') return []; throw error; }
};
const fail = (res, error) => {
    console.error('User management failed:', error.code || error.name);
    return res.status(error.code === 'ER_DUP_ENTRY' ? 409 : 503).json({success:false, message:error.code === 'ER_DUP_ENTRY' ? 'That username or email is already in use.' : 'Could not complete the request. Please retry.'});
};
router.param('id', (req, res, next, id) => {
    if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1) return res.status(400).json({success:false,message:'Invalid user.'});
    next();
});
router.get('/:id', async (req, res) => {
    try {
        let users;
        try { users = await query('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [req.params.id]); }
        catch (error) { if (error.code !== 'ER_BAD_FIELD_ERROR') throw error; users = await query('SELECT id, username, email, role FROM users WHERE id = ?', [req.params.id]); }
        if (!users.length) return res.status(404).json({success:false,message:'User not found.'});
        const results = await Promise.allSettled([
            optionalRows('SELECT l.id, l.accessed_at, c.title FROM comic_access_logs l JOIN comics c ON c.id = l.comic_id WHERE l.user_id = ? ORDER BY l.accessed_at DESC LIMIT 100', [req.params.id]),
            query("SELECT o.id, o.price, o.purchased_at, c.title FROM orders o JOIN comics c ON c.id = o.comic_id WHERE o.user_id = ? AND o.payment_status = 'Paid' ORDER BY o.purchased_at DESC LIMIT 100", [req.params.id]),
            optionalRows('SELECT id, status, created_at, updated_at FROM support_chats WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100', [req.params.id])
        ]);
        const data = {success:true,user:users[0],unavailable:[]};
        ['reads','orders','support'].forEach((key,i) => { if (results[i].status === 'fulfilled') data[key] = results[i].value; else { data[key] = null; data.unavailable.push(key); } });
        res.json(data);
    } catch (error) { fail(res,error); }
});

// Lock administrators together so simultaneous role changes cannot remove the last admin.
async function mutate(req, res, action) {
    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();
        const [rows] = await connection.query("SELECT id, role FROM users WHERE role = 'admin' OR id = ? ORDER BY id FOR UPDATE", [req.params.id]);
        const actor = rows.find(user => Number(user.id) === Number(req.user.id));
        const target = rows.find(user => Number(user.id) === Number(req.params.id));
        if (actor?.role !== 'admin') { await connection.rollback(); return res.status(403).json({success:false,message:'Administrator access required.'}); }
        if (!target) { await connection.rollback(); return res.status(404).json({success:false,message:'User not found.'}); }
        const problem = await action(connection, target);
        if (problem) { await connection.rollback(); return res.status(409).json({success:false,message:problem}); }
        await connection.commit();
        res.json({success:true});
    } catch (error) {
        if (connection) await connection.rollback().catch(() => {});
        if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({success:false,message:'This account has linked records and cannot be deleted.'});
        fail(res,error);
    } finally { connection?.release(); }
}
router.put('/:id', async (req, res) => {
    const username = String(req.body?.username || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!username || username.length > 40 || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({success:false,message:'Enter a username (up to 40 characters) and a valid email.'});
    await mutate(req,res,async connection => { await connection.query('UPDATE users SET username = ?, email = ? WHERE id = ?', [username,email,req.params.id]); });
});
router.put('/:id/permissions', async (req, res) => {
    if (!['admin','user'].includes(req.body?.role)) return res.status(400).json({success:false,message:'Choose customer or administrator access.'});
    await mutate(req,res,async connection => {
        if (Number(req.user.id) === Number(req.params.id)) return 'You cannot change your own administrator permissions.';
        await connection.query('UPDATE users SET role = ? WHERE id = ?', [req.body.role,req.params.id]);
    });
});
router.delete('/:id', async (req, res) => {
    await mutate(req,res,async (connection,target) => {
        if (Number(req.user.id) === Number(req.params.id) || target.role === 'admin') return 'Administrator accounts cannot be deleted. Change their role first using another administrator.';
        for (const table of ['orders','cart','comic_access_logs','support_chats']) {
            try {
                const [rows] = await connection.query(`SELECT user_id FROM ${table} WHERE user_id = ? LIMIT 1 FOR UPDATE`, [req.params.id]);
                if (rows.length) return 'This user has purchases, cart items, reading history, or support records. Keep the account to preserve those records.';
            } catch (error) { if (error.code !== 'ER_NO_SUCH_TABLE') throw error; }
        }
        await connection.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    });
});
module.exports = router;
