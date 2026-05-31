const { userDB } = require('../config/database');

exports.addToCart = async (req, res) => {
    try {
        const { website_id, customer_id, product_id, variant_id, quantity } = req.body;

        const check = await userDB.execute({
            sql: "SELECT id, quantity FROM carts WHERE website_id = ? AND customer_id = ? AND product_id = ? AND (variant_id = ? OR variant_id IS NULL)",
            args: [website_id, customer_id, product_id, variant_id || null]
        });

        if (check.rows.length > 0) {
            const newQty = check.rows[0].quantity + parseInt(quantity);
            await userDB.execute({
                sql: "UPDATE carts SET quantity = ? WHERE id = ?",
                args: [newQty, check.rows[0].id]
            });
        } else {
            const cartItemId = "ITEM-" + Math.floor(Math.random() * 1000000);
            await userDB.execute({
                sql: "INSERT INTO carts (id, website_id, customer_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?, ?, ?)",
                args: [cartItemId, website_id, customer_id, product_id, variant_id || null, parseInt(quantity)]
            });
        }
        res.json({ success: true, message: "Added to cart successfully!" });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getCartCount = async (req, res) => {
    try {
        const { website_id, customer_id } = req.query;
        const result = await userDB.execute({
            sql: "SELECT SUM(quantity) as total FROM carts WHERE website_id = ? AND customer_id = ?",
            args: [website_id, customer_id]
        });
        res.json({ success: true, count: result.rows[0].total || 0 });
    } catch (error) { res.status(500).json({ success: false }); }
};

// 🚀 NAYA: Fetch Cart Items IDs
exports.listCart = async (req, res) => {
    try {
        const { website_id, customer_id } = req.query;
        const result = await userDB.execute({
            sql: "SELECT * FROM carts WHERE website_id = ? AND customer_id = ?",
            args: [website_id, customer_id]
        });
        res.json({ success: true, items: result.rows });
    } catch (error) { res.status(500).json({ success: false }); }
};

// 🚀 NAYA: Remove Item from Cart
exports.removeFromCart = async (req, res) => {
    try {
        const { id } = req.body;
        await userDB.execute({ sql: "DELETE FROM carts WHERE id = ?", args: [id] });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
};