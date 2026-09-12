const db = require('../config/db');
// Verify current authority on every request, including after role revocation.
module.exports = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!req.user?.id) return res.status(401).json({success:false, message:'Login required'});
  db.query('SELECT id, username, email, role FROM users WHERE id = ? LIMIT 1', [req.user.id], (error, users) => {
    if (error) return res.status(503).json({success:false, message:'Could not verify administrator access. Please retry.'});
    if (!users.length || users[0].role !== 'admin') return res.status(403).json({success:false, message:'Administrator access required'});
    req.user = {...req.user, ...users[0]};
    next();
  });
};
