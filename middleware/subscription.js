const { userDB } = require('../config/database');

const checkSubscription = async (req, res, next) => {
    const { subdomain } = req.params; // Next.js se subdomain aayega

    const result = await userDB.execute({
        sql: "SELECT expiry_date, status FROM users WHERE domain_name = ?",
        args: [subdomain]
    });

    const user = result.rows[0];
    const now = new Date();
    const expiry = new Date(user.expiry_date);

    if (now > expiry && user.status !== 'paid') {
        return res.status(403).json({ message: "Subscription Expired. Please pay $1." });
    }

    next();
};

module.exports = checkSubscription;