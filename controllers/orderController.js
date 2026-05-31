const { userDB } = require('../config/database');

exports.placeOrder = async (req, res) => {
    try {
        const { website_id, customer_id, name, email, phone, city, address, items, subtotal, shipping_total, total_amount } = req.body;

        const orderId = "ORD-" + Math.floor(1000000 + Math.random() * 9000000);

        await userDB.execute({
            sql: `INSERT INTO orders (id, website_id, customer_id, name, email, phone, city, address, subtotal, shipping_total, total_amount, status) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [orderId, website_id, customer_id, name, email || '', phone, city, address, subtotal, shipping_total, total_amount, 'pending']
        });

        for (const item of items) {
            const itemId = "ITEM-" + Math.floor(1000000 + Math.random() * 9000000);
            
            // 🚀 VARIANT INFO: Agar variant hai toh string save karein (e.g. "Red / Large") warna "Standard"
            const variantDisplay = item.variant_info || 'Standard Edition'; 
            const img = item.image_url || '';

            await userDB.execute({
                sql: `INSERT INTO order_items (id, order_id, website_id, product_id, variant_id, product_title, quantity, price, shipping_fee) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [itemId, orderId, website_id, item.product_id, variantDisplay, item.title, item.qty, item.price, item.shipping_fee || 0]
            });
        }
        res.status(201).json({ success: true, order_id: orderId });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
// 🚀 2. GET ALL ORDERS FOR STORE OWNER
exports.getOrders = async (req, res) => {
    try {
        const { website_id } = req.query;
        // 🚀 SMART SQL: Ye query har order ka pehla product_id bhi sath layegi preview ke liye
        const result = await userDB.execute({
            sql: `SELECT o.*, 
                 (SELECT product_id FROM order_items WHERE order_id = o.id LIMIT 1) as preview_pid
                 FROM orders o WHERE website_id = ? ORDER BY created_at DESC`,
            args: [website_id]
        });
        res.json({ success: true, orders: result.rows });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// 🚀 3. GET ORDER ITEMS (Details)
exports.getOrderItems = async (req, res) => {
    try {
        const { order_id, website_id } = req.query;
        const result = await userDB.execute({
            sql: "SELECT * FROM order_items WHERE order_id = ? AND website_id = ?",
            args: [order_id, website_id]
        });
        res.json({ success: true, items: result.rows });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// 🚀 4. UPDATE ORDER STATUS
exports.updateOrderStatus = async (req, res) => {
    try {
        const { order_id, website_id, status } = req.body;
        await userDB.execute({
            sql: "UPDATE orders SET status = ? WHERE id = ? AND website_id = ?",
            args: [status, order_id, website_id]
        });
        res.json({ success: true, message: "Status Updated!" });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
// 🚀 GET DASHBOARD SUMMARY (Stats)
exports.getStats = async (req, res) => {
    try {
        const { website_id } = req.query;
        // Total Orders Count
        const countRes = await userDB.execute({
            sql: "SELECT COUNT(*) as total FROM orders WHERE website_id = ?",
            args: [website_id]
        });
        // Total Sales Amount
        const revenueRes = await userDB.execute({
            sql: "SELECT SUM(total_amount) as revenue FROM orders WHERE website_id = ? AND status != 'cancelled'",
            args: [website_id]
        });
        // Active Pages Count
        const userRes = await userDB.execute({
            sql: "SELECT pages FROM users WHERE website_id = ?",
            args: [website_id]
        });
        const pagesCount = Object.keys(JSON.parse(userRes.rows[0].pages || "{}")).length;

        res.json({ 
            success: true, 
            totalOrders: countRes.rows[0].total || 0,
            revenue: revenueRes.rows[0].revenue || 0,
            totalPages: pagesCount
        });
    } catch (error) { res.status(500).json({ success: false }); }
};

// 🚀 GET SINGLE ORDER DETAIL (For Buyer/Customer)
exports.getOrderPublic = async (req, res) => {
    try {
        const { order_id, website_id } = req.query;
        
        // Fetch Main Order
        const orderRes = await userDB.execute({
            sql: "SELECT * FROM orders WHERE id = ? AND website_id = ?",
            args: [order_id, website_id]
        });

        if (orderRes.rows.length === 0) return res.status(404).json({ success: false, message: "Order not found!" });

        // Fetch Order Items
        const itemsRes = await userDB.execute({
            sql: "SELECT * FROM order_items WHERE order_id = ? AND website_id = ?",
            args: [order_id, website_id]
        });

        res.json({ 
            success: true, 
            order: orderRes.rows[0], 
            items: itemsRes.rows 
        });
    } catch (error) { res.status(500).json({ success: false }); }
};