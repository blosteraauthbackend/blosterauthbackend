// Backend 1: controllers/authController.js (Wix-Style Dynamic CMS Signup)

const { userDB } = require('../config/database');
const { s3Acc1 } = require('../config/s3Client');
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// --- 1. REGISTER ---
exports.register = async (req, res) => {
    try {
        const { 
            name = "", user_name = "", phone = "", email = "", 
            password = "", website_type = "ecommerce", 
            domain_name = "", website_store_name = "" 
        } = req.body;

        const check = await userDB.execute({
            sql: "SELECT id FROM users WHERE email = ? OR user_name = ? OR domain_name = ? OR phone = ?",
            args: [email, user_name, domain_name, phone]
        });

        if (check.rows.length > 0) {
            return res.status(400).json({ success: false, message: "Email, Username, Phone ya Domain pehle se maujood hai!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const website_id = "WEB-" + Math.floor(100000 + Math.random() * 900000);
        
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        const expiryStr = expiryDate.toISOString().slice(0, 19).replace('T', ' ');

        const currentPages = {
            "home": { name: "Home Page", slug: "home", title: "Welcome to My Store" }
        };

        if (website_type === 'ecommerce') {
            currentPages["product-detail"] = { 
                name: "Product Details Page", 
                slug: "product-detail", 
                title: "Buy {product_title} Online" 
            };
        }

        // Save User to DB
        await userDB.execute({
            sql: `INSERT INTO users (website_id, name, user_name, phone, email, password_hash, website_type, domain_name, website_store_name, expiry_date, status, pages) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [website_id, name, user_name, phone, email, hashedPassword, website_type, domain_name, website_store_name, expiryStr, 'active', JSON.stringify(currentPages)]
        });

        // Upload Default HTML/JSON templates to Cloudflare R2
        const defaultHomeHTML = `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-gray-50 py-20 text-center"><h1 class="text-4xl md:text-6xl font-black text-gray-900">Welcome to ${website_store_name}</h1><p class="text-gray-500 mt-4">Start dragging components and publish your live store!</p></body></html>`;
        const defaultHomeJSON = { components: [{ tagName: 'h1', classes:['text-4xl','font-black','text-center'], content: `Welcome to ${website_store_name}` }] };

        await s3Acc1.send(new PutObjectCommand({
            Bucket: process.env.CF_BUCKET_ACC1, Key: `sites/${domain_name}/home.html`, Body: defaultHomeHTML, ContentType: "text/html"
        }));
        await s3Acc1.send(new PutObjectCommand({
            Bucket: process.env.CF_BUCKET_ACC1, Key: `sites/${domain_name}/home.json`, Body: JSON.stringify(defaultHomeJSON), ContentType: "application/json"
        }));

       if (website_type === 'ecommerce') {
            // 🚀 DYNAMIC CMS ATTRIBUTES (data-product-field) UPDATED TEMPLATE!
          // 🚀 DYNAMIC CMS ATTRIBUTES (Advanced Product Template for New Users)
            const defaultProductDetailHTML = `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body { margin: 0; padding: 0; min-height: 100vh; font-family: sans-serif; }
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                </style>
            </head>
            <body>
                <div class="bg-[#f4f4f5] text-slate-800 font-sans min-h-screen w-full pb-20">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div class="bg-white rounded-[32px] border border-slate-100 p-6 sm:p-10 shadow-sm">
                            <div class="text-xs text-slate-400 font-bold mb-8 uppercase tracking-widest">Home &gt; Shop &gt; Details</div>
                            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
                                <div class="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
                                    <div id="dynamic-thumbnails" class="flex md:flex-col gap-3 overflow-x-auto md:overflow-x-visible md:w-20 shrink-0 custom-scrollbar"></div>
                                    <div class="flex-1 relative aspect-square sm:aspect-[4/3] md:aspect-[4/5] bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden group">
                                        <span class="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full z-10 shadow-lg tracking-widest uppercase">Sale</span>
                                        <img id="main-product-img" data-product-field="image" src="https://pub-523084f9a7c94006a299a1f9c733ce56.r2.dev/images/blostera-1779191931277-yf44ed.webp" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
                                    </div>
                                </div>
                                <div class="lg:col-span-5 flex flex-col justify-between space-y-6">
                                    <div>
                                        <div class="space-y-2">
                                            <span data-product-field="sku" class="text-[10px] text-blue-500 font-black uppercase tracking-widest">SKU: BS-12345678</span>
                                            <h1 data-product-field="title" class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">Blue Embroidered Chiffon Maxi Set For Women</h1>
                                        </div>
                                        <div class="flex items-center gap-2 text-yellow-400 text-xs font-black mt-2">★★★★★ <span class="text-slate-400 font-bold">(0 Reviews)</span></div>
                                        <div class="mt-6 flex items-baseline gap-3 border-b border-slate-100 pb-6">
                                            <span id="dynamic-price" data-product-field="price" class="text-3xl font-black text-slate-900">Rs. 2,949</span>
                                            <span id="dynamic-compare-price" class="text-slate-400 text-sm line-through">Rs. 2,979</span>
                                        </div>
                                        <div class="mt-6">
                                            <h4 class="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">Description</h4>
                                            <p data-product-field="description" class="text-slate-500 text-sm leading-relaxed font-medium">This is a prebuilt demo product. You can edit, modify, or delete this product from your dashboard at any time to fit your catalog requirements!</p>
                                        </div>
                                        <div id="color-section" class="mt-6 space-y-3 hidden">
                                            <span class="text-[10px] uppercase tracking-widest font-black text-slate-400">Color: <b id="color-label" class="text-slate-800 normal-case ml-1"></b></span>
                                            <div id="dynamic-colors" class="flex flex-wrap gap-3"></div>
                                        </div>
                                        <div id="size-section" class="mt-6 space-y-3 hidden">
                                            <span class="text-[10px] uppercase tracking-widest font-black text-slate-400">Size: <b id="size-label" class="text-slate-800 normal-case ml-1"></b></span>
                                            <div id="dynamic-sizes" class="flex flex-wrap gap-2"></div>
                                        </div>
                                        <div class="mt-8 space-y-3">
                                            <span class="text-[10px] uppercase tracking-widest font-black text-slate-400">Quantity</span>
                                            <div class="flex items-center border border-slate-200 rounded-xl w-32 h-12 overflow-hidden bg-white shadow-sm">
                                                <button onclick="var q=document.getElementById('qty-val'); q.innerText=Math.max(1,parseInt(q.innerText)-1);" class="flex-1 h-full hover:bg-slate-50 active:bg-slate-100 transition-all font-bold text-lg text-slate-500">-</button>
                                                <span id="qty-val" class="flex-1 text-center text-sm font-black text-slate-800">1</span>
                                                <button onclick="var q=document.getElementById('qty-val'); q.innerText=parseInt(q.innerText)+1;" class="flex-1 h-full hover:bg-slate-50 active:bg-slate-100 transition-all font-bold text-lg text-slate-500">+</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="space-y-3 pt-6 border-t border-slate-100">
                                        <button class="w-full bg-[#5053f0] hover:bg-[#4346df] text-white text-xs uppercase tracking-widest font-black py-4 rounded-xl transition shadow-lg shadow-blue-500/20 hover:-translate-y-1">Add to cart</button>
                                        <button class="w-full border border-green-500 bg-green-50 hover:bg-green-100 text-green-700 text-xs uppercase tracking-widest font-black py-4 rounded-xl transition shadow-sm">💬 Buy on WhatsApp</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="mt-20">
                            <div class="flex items-center justify-between mb-8">
                                <h2 class="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">You may also like</h2>
                                <div class="h-1 w-20 bg-[#5053f0] rounded-full hidden md:block"></div>
                            </div>
                            <div id="related-products-grid" class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"></div>
                        </div>
                    </div>
                </div>
            </body>
            </html>`;
            const defaultProductDetailJSON = { components: [] };

            await s3Acc1.send(new PutObjectCommand({
                Bucket: process.env.CF_BUCKET_ACC1, Key: `sites/${domain_name}/product-detail.html`, Body: defaultProductDetailHTML, ContentType: "text/html"
            }));
            await s3Acc1.send(new PutObjectCommand({
                Bucket: process.env.CF_BUCKET_ACC1, Key: `sites/${domain_name}/product-detail.json`, Body: JSON.stringify(defaultProductDetailJSON), ContentType: "application/json"
            }));

            // Step 3: Auto-create Demo Product inside Backend 2
            const demoImage = "https://pub-523084f9a7c94006a299a1f9c733ce56.r2.dev/images/blostera-1779191931277-yf44ed.webp";
            await axios.post('http://localhost:5001/api/products/add-internal', {
                user_id: website_id,
                website_id: website_id,
                title: "Blue Embroidered Chiffon Maxi Set For Women",
                description: "This is a prebuilt demo product. You can edit, modify, or delete this product from your dashboard at any time to fit your catalog requirements!",
                price: 2979.0,
                discounted_price: 2949.0,
                quantity: 100,
                image_url: demoImage,
                image_urls: [demoImage]
            }, {
                headers: {
                    'X-Internal-Token': process.env.INTERNAL_API_SECRET
                }
            });
        }

        res.status(201).json({ success: true, message: "Registration Successful!", website_id });
    } catch (error) {
        console.error("REGISTRATION ERROR:", error.message);
        if (isUserSavedInDB) {
            try {
                await userDB.execute({
                    sql: "DELETE FROM users WHERE website_id = ?",
                    args: [website_id]
                });
                console.log(`🧹 DB Rollback Successful! Wiped out broken account: ${website_id}`);
            } catch (dbErr) {
                console.error("Fatal: Failed to rollback broken user registration:", dbErr.message);
            }
        }
        res.status(500).json({ success: false, message: "System Error inside Registration: " + error.message });
    }
};

// --- 2. LOGIN ---
exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        const result = await userDB.execute({
            sql: "SELECT * FROM users WHERE email = ? OR phone = ? OR user_name = ? OR website_id = ?",
            args: [identifier, identifier, identifier, identifier]
        });

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User nahi mila!" });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Ghalat Password!" });
        }

        const token = jwt.sign(
            { id: user.id, website_id: user.website_id, domain: user.domain_name }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: "Login Successful!",
            token,
            user: { name: user.name, website_id: user.website_id, domain: user.domain_name, type: user.website_type }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Login Error" });
    }
};