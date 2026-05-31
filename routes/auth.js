const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { userDB } = require('../config/database');

router.post('/register', async (req, res) => {
    const { name, user_name, email, password, website_type, domain_name, website_store_name } = req.body;

    try {
        // 1. Check if Email, Username, or Subdomain already exists
        const checkExisting = await userDB.execute({
            sql: "SELECT * FROM users WHERE email = ? OR user_name = ? OR domain_name = ?",
            args: [email, user_name, domain_name]
        });

        if (checkExisting.rows.length > 0) {
            return res.status(400).json({ message: "Email, Username ya Domain pehle se maujood hai!" });
        }

        // 2. Password Hashing
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Generate Unique Website ID (Example: WEB-12345)
        const website_id = "WEB-" + Math.floor(100000 + Math.random() * 900000);

        // 4. Set Expiry Date (30 Days from today)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        const expiryStr = expiryDate.toISOString().slice(0, 19).replace('T', ' ');

        // 5. Insert into Turso
        await userDB.execute({
            sql: `INSERT INTO users 
            (website_id, name, user_name, email, password_hash, website_type, domain_name, website_store_name, expiry_date, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [website_id, name, user_name, email, hashedPassword, website_type, domain_name, website_store_name, expiryStr, 'active']
        });

        res.status(201).json({ 
            success: true, 
            message: "Registration Successful!",
            website_id: website_id 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;