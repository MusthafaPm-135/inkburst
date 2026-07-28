module.exports = (req, res, next) => {

    console.log("ADMIN CHECK:", req.user);

    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Login required"
        });
    }

    console.log("USER ROLE:", req.user.role);


    if (req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admin access denied"
        });
    }


    next();

};
