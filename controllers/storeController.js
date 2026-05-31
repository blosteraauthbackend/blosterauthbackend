// Backend 1: controllers/storeController.js (Complete Version - Handshake & Live Redirect Fixed)
const { PutObjectCommand, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const { s3Acc1 } = require('../config/s3Client');
const { userDB } = require('../config/database');
const axios = require('axios');

const fetchR2File = async (key) => {
    try {
        const command = new GetObjectCommand({ Bucket: process.env.CF_BUCKET_ACC1, Key: key });
        const response = await s3Acc1.send(command); 
        return await response.Body.transformToString();
    } catch (error) { return null; }
};
exports.publishToCloudflare = async (req, res) => {
    try {
        const { html, css, json, subdomain, website_id, pageId = 'home' } = req.body;

        const bodyContentMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const cleanHTML = bodyContentMatch ? bodyContentMatch[1] : html;

        const finalHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; min-height: 100vh; overflow-x: hidden; font-family: sans-serif; }
        
        [linkType]:not([linkType="none"]) { cursor: pointer !important; pointer-events: auto !important; transition: all 0.2s ease; }
        [linkType]:not([linkType="none"]):hover { opacity: 0.8; }

        .hover-zoom, .hover-shrink, .hover-jump, .hover-slide-right, .hover-glow, .hover-spin, .hover-skew, .hover-blur, .hover-lift, .hover-border { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important; }
        .hover-zoom:hover { transform: scale(1.08) !important; }
        .hover-shrink:hover { transform: scale(0.92) !important; }
        .hover-jump:hover { transform: translateY(-12px) !important; }
        .hover-slide-right:hover { transform: translateX(18px) !important; }
        .hover-glow:hover { box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4) !important; }
        .hover-spin:hover { transform: rotate(5deg) !important; }
        .hover-skew:hover { transform: skewX(-8deg) !important; }
        .hover-blur { filter: blur(3px); }
        .hover-blur:hover { filter: blur(0px) !important; }
        .hover-lift:hover { transform: translateY(-6px) !important; box-shadow: 0 15px 35px rgba(0,0,0,0.15) !important; }
        .hover-border:hover { border: 2px solid #2563eb !important; }

        @keyframes loop-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes loop-pulse { 0%, 100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.06); opacity: 1; } }
        @keyframes loop-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes loop-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        @keyframes loop-bounce { 0%, 100%, 20%, 50%, 80% { transform: translateY(0); } 40% { transform: translateY(-10px); } 60% { transform: translateY(-5px); } }
        @keyframes loop-swing { 20% { transform: rotate(15deg); } 40% { transform: rotate(-10deg); } 60% { transform: rotate(5deg); } 80% { transform: rotate(-5deg); } 100% { transform: rotate(0deg); } }
        @keyframes loop-wobble { 0%, 100% { transform: translateX(0deg); } 15% { transform: translateX(-15%) rotate(-5deg); } 30% { transform: translateX(10%) rotate(3deg); } 45% { transform: translateX(-10%) rotate(-3deg); } 60% { transform: translateX(5%) rotate(2deg); } 75% { transform: translateX(-5%) rotate(-1deg); } }
        @keyframes loop-heartbeat { 0%, 100% { transform: scale(1); } 14% { transform: scale(1.12); } 28% { transform: scale(1); } 42% { transform: scale(1.12); } 70% { transform: scale(1); } }
        @keyframes loop-flash { 0%, 50%, 100% { opacity: 1; } 25%, 75% { opacity: 0.2; } }
        @keyframes loop-bounce-gentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }

        .loop-float { animation: loop-float 2.5s infinite ease-in-out; }
        .loop-pulse { animation: loop-pulse 1.8s infinite ease-in-out; }
        .loop-spin { animation: loop-spin 4s infinite linear; }
        .loop-shake { animation: loop-shake 0.5s infinite ease-in-out; }
        .loop-bounce { animation: loop-bounce 2s infinite ease-in-out; }
        .loop-swing { animation: loop-swing 2s infinite ease-in-out; transform-origin: top center; }
        .loop-wobble { animation: loop-wobble 2s infinite ease-in-out; }
        .loop-heartbeat { animation: loop-heartbeat 1.5s infinite ease-in-out; }
        .loop-flash { animation: loop-flash 2s infinite ease-in-out; }
        .loop-bounce-gentle { animation: loop-bounce-gentle 1.5s infinite ease-in-out; }

        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-down { from { opacity: 0; transform: translateY(-50px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-left { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slide-right { from { opacity: 0; transform: translateX(-50px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes zoom-in { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        @keyframes zoom-out { from { opacity: 0; transform: scale(1.15); } to { opacity: 1; transform: scale(1); } }
        @keyframes bounce-effect { 0% { opacity:0; transform:scale(0.3); } 50% { opacity:1; transform:scale(1.05); } 70% { transform:scale(0.9); } 100% { transform:scale(1); } }
        @keyframes rotate-in { from { opacity: 0; transform: rotate(-120deg); } to { opacity: 1; transform: rotate(0); } }
        @keyframes flip-in-x { from { opacity: 0; transform: perspective(400px) rotateX(90deg); } to { opacity: 1; transform: perspective(400px) rotateX(0deg); } }

        ${css} 
    </style>
</head>
<body>
    ${cleanHTML}

    <script>
        window.onclick = function(e) {
            const target = e.target.closest('[linkType]');
            if (target) {
                const type = target.getAttribute('linkType');
                if (!type || type === 'none') return;
                const internal = target.getAttribute('internalHref');
                const external = target.getAttribute('externalHref');
                const href = (type === 'internal' ? internal : external);
                const openIn = target.getAttribute('target') || '_self';

                if (href && href !== '#') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (openIn === '_blank') window.open(href, '_blank');
                    else window.top.location.href = href; 
                }
            }
        };
    </script>

    <script>
        window.addEventListener('load', function() {
            var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        var el = entry.target;
                        var anim = el.getAttribute('data-animate');
                        var loopAnim = el.getAttribute('data-loop-animate');

                        if (anim && anim !== 'none') {
                            if(loopAnim) el.classList.remove(loopAnim);
                            el.style.animation = anim + ' 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards';
                            setTimeout(function() {
                                el.style.animation = ''; 
                                el.style.opacity = '1';  
                                if (loopAnim && loopAnim !== 'none') {
                                    el.classList.add(loopAnim); 
                                }
                            }, 800);
                        } else {
                            el.style.opacity = '1';
                        }
                        observer.unobserve(el);
                    }
                });
            }, { threshold: 0.1 });

            document.querySelectorAll('[data-animate]').forEach(function(el) {
                var anim = el.getAttribute('data-animate');
                if (anim && anim !== 'none') {
                    el.style.opacity = '0';
                    observer.observe(el);
                }
            });
        });
    </script>

    <script>
        (function() {
            var wrappers = document.querySelectorAll('.blost-slides-wrapper');
            wrappers.forEach(function(wrapper) {
                var container = wrapper.parentElement;
                if(!container) return;
                var prevBtn = container.querySelector('.blost-prev');
                var nextBtn = container.querySelector('.blost-next');
                var slides = wrapper.querySelectorAll('.blost-slide');
                if (slides.length === 0) return;

                var isAuto = container.getAttribute('data-auto') === 'true';
                var intervalTime = parseInt(container.getAttribute('data-interval') || 3000);
                var currentIndex = 0;
                var timer;

                function updateSlides() {
                    for (var i = 0; i < slides.length; i++) {
                        slides[i].style.transition = 'transform 0.5s ease-in-out';
                        if (i === currentIndex) {
                            slides[i].style.transform = 'translateX(0)';
                            slides[i].style.zIndex = '10';
                        } else if (i < currentIndex) {
                            slides[i].style.transform = 'translateX(-100%)';
                            slides[i].style.zIndex = '0';
                        } else {
                            slides[i].style.transform = 'translateX(100%)';
                            slides[i].style.zIndex = '0';
                        }
                    }
                }

                function nextSlide() {
                    currentIndex++;
                    if (currentIndex >= slides.length) currentIndex = 0;
                    updateSlides();
                }

                function prevSlide() {
                    currentIndex--;
                    if (currentIndex < 0) currentIndex = slides.length - 1;
                    updateSlides();
                }

                function resetTimer() {
                    clearInterval(timer);
                    if (isAuto) timer = setInterval(nextSlide, intervalTime);
                }

                if (nextBtn) nextBtn.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); nextSlide(); resetTimer(); });
                if (prevBtn) prevBtn.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); prevSlide(); resetTimer(); });

                updateSlides();
                if (isAuto) resetTimer();
            });
        })();
    </script>

    <script>
        window.blostera_website_id = "${website_id}";
    </script>

    <script>
        (function() {
            var grids = document.querySelectorAll('.blost-dynamic-products-grid');
            if(grids.length === 0 || !window.blostera_website_id) return;

            fetch('http://localhost:5001/api/products/list?website_id=' + window.blostera_website_id)
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    if(data.success && data.products.length > 0) {
                        var html = '';
                        data.products.forEach(function(prod) {
                            var saleBadge = prod.price > prod.discounted_price ? '<span class="absolute top-2 left-2 md:top-3 md:left-3 bg-red-500 text-white text-[10px] md:text-xs font-black px-2 py-1 rounded z-10">SALE</span>' : '';
                            var comparePrice = prod.price > 0 ? '<span class="text-gray-400 text-xs md:text-sm line-through">Rs ' + prod.price + '</span>' : '';
                            var imgUrl = prod.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';

                            html += '<a href="/products/' + prod.slug + '" target="_top" class="bg-white block rounded-xl md:rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 md:hover:-translate-y-2 transition-all duration-300 overflow-hidden group border border-gray-100 cursor-pointer">' +
                                '<div class="relative overflow-hidden aspect-square">' + saleBadge + '<img src="' + imgUrl + '" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"></div>' +
                                '<div class="p-3 md:p-5"><h3 class="text-sm md:text-lg font-bold text-gray-900 mb-1 line-clamp-2 leading-tight">' + prod.title + '</h3>' +
                                '<div class="flex flex-col md:flex-row justify-between items-start md:items-center mt-2 md:mt-3 gap-2 md:gap-0"><div class="flex flex-row md:flex-col items-center md:items-start gap-2 md:gap-0">' + comparePrice + '<span class="text-base md:text-xl font-black text-blue-600">Rs ' + prod.discounted_price + '</span></div>' +
                                '<div class="w-full md:w-10 h-8 md:h-10 bg-blue-50 md:bg-gray-100 text-blue-600 md:text-gray-900 rounded-lg md:rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors text-sm md:text-base font-bold md:font-normal"><span class="md:hidden">Add to Cart</span><span class="hidden md:inline">🛒</span></div></div></div></a>';
                        });
                        grids.forEach(function(grid) {
                            grid.innerHTML = html;
                            grid.addEventListener('click', function(e) {
                                var card = e.target.closest('a');
                                if (card && card.getAttribute('href') && card.getAttribute('href').indexOf('/products/') !== -1) {
                                    e.preventDefault(); e.stopPropagation();
                                    window.top.location.href = card.getAttribute('href'); 
                                }
                            });
                        });
                    } else {
                        grids.forEach(function(grid) { grid.innerHTML = '<div class="col-span-full text-center text-zinc-400 font-bold p-10">No products added yet!</div>'; });
                    }
                })
                .catch(function(err) { console.error("Products injection failed:", err); });
        })();
    </script>
</body>
</html>`;

        const htmlKey = `sites/${subdomain}/${pageId}.html`;
        const jsonKey = `sites/${subdomain}/${pageId}.json`;

        await s3Acc1.send(new PutObjectCommand({ Bucket: process.env.CF_BUCKET_ACC1, Key: htmlKey, Body: finalHTML, ContentType: "text/html" }));
        await s3Acc1.send(new PutObjectCommand({ Bucket: process.env.CF_BUCKET_ACC1, Key: jsonKey, Body: JSON.stringify(json), ContentType: "application/json" }));

        // 🚀 THE FIX: Preserving old data like 'type' when saving pages!
        const userResult = await userDB.execute({ sql: "SELECT pages FROM users WHERE website_id = ?", args: [website_id] });
        let currentPages = JSON.parse(userResult.rows[0].pages || "{}");

        currentPages[pageId] = {
            ...(currentPages[pageId] || {}), // PRESERVES 'type', 'title' ETC!
            name: currentPages[pageId]?.name || pageId,
            slug: pageId,
            htmlPath: htmlKey
        };

        await userDB.execute({ sql: "UPDATE users SET pages = ? WHERE website_id = ?", args: [JSON.stringify(currentPages), website_id] });

        res.json({ success: true, message: "Published with Smart Links!" });

    } catch (error) {
        console.error("Publish Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.getSiteByHostname = async (req, res) => {
    try {
        const { hostname, path = 'home' } = req.query; 
        let subdomain = hostname.split('.')[0];

        const result = await userDB.execute({
            sql: "SELECT domain_name, website_id, pages FROM users WHERE domain_name = ? OR custom_domain = ?",
            args: [subdomain, hostname]
        });

        if (result.rows.length === 0) return res.status(404).json({ success: false });

        const user = result.rows[0];
        const allPages = JSON.parse(user.pages || "{}");
        
        // 🚀 CREATE PAGE MAP (Type -> Slug)
        const pageMap = {};
        let currentPageType = 'standard';
        
        Object.keys(allPages).forEach(key => {
            const p = allPages[key];
            if(p.type) pageMap[p.type] = p.slug;
            if(p.slug === path) currentPageType = p.type;
        });

        if (path === 'home' && currentPageType === 'standard') currentPageType = 'home';
        
        const pageKey = `sites/${user.domain_name}/${path}.html`;
        const html_content = await fetchR2File(pageKey);

        if (!html_content) {
            return res.json({
                success: true,
                website_id: user.website_id,
                page_type: 'standard',
                page_map: pageMap,
                html_content: `<body style="background:#000; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;"><h1 style="font-size:3rem;">🚀 Page Not Published</h1><p style="color:#888;">Builder mein ja kar '${path}' page ko save/publish karein.</p><a href="/" style="color:#3b82f6;">Back to Home</a></body>`
            });
        }

        res.json({ 
            success: true, 
            html_content, 
            website_id: user.website_id,
            page_type: currentPageType,
            page_map: pageMap 
        });

    } catch (error) { res.status(500).json({ success: false }); }
};

exports.getStoreJSON = async (req, res) => {
    try {
        const { subdomain, pageId = 'home' } = req.query;
        const key = `sites/${subdomain.toLowerCase()}/${pageId}.json`;
        
        const jsonData = await fetchR2File(key);

        if (!jsonData) return res.json({ success: false, message: "Fresh Start" });

        res.json({ success: true, json_data: JSON.parse(jsonData) });
    } catch (e) {
        res.json({ success: false, message: "Empty Data" });
    }
};
// 🚀 2. CREATE PAGE (WITH TYPE)
exports.createPage = async (req, res) => {
    try {
        const { website_id, pageName, seoTitle, pageType = 'standard' } = req.body;
        const slug = pageName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

        if (slug === 'home') return res.status(400).json({ message: "Home page default hota hai!" });

        const result = await userDB.execute({
            sql: "SELECT domain_name, pages FROM users WHERE website_id = ?",
            args: [website_id]
        });
        const user = result.rows[0];
        let currentPages = JSON.parse(user.pages || "{}");

        if (currentPages[slug]) return res.status(400).json({ message: "Ye slug pehle se bana hua hai!" });

        const initialHTML = `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body><h1 class="text-4xl p-20 font-black text-center">Naya Page: ${pageName}</h1></body></html>`;
        const initialJSON = { components: [{ tagName: 'h1', classes:['text-4xl','p-20','font-black','text-center'], content: `Welcome to ${pageName}` }] };

        await s3Acc1.send(new PutObjectCommand({ Bucket: process.env.CF_BUCKET_ACC1, Key: `sites/${user.domain_name}/${slug}.html`, Body: initialHTML, ContentType: "text/html" }));
        await s3Acc1.send(new PutObjectCommand({ Bucket: process.env.CF_BUCKET_ACC1, Key: `sites/${user.domain_name}/${slug}.json`, Body: JSON.stringify(initialJSON), ContentType: "application/json" }));

        // Save Type in DB
        currentPages[slug] = { name: pageName, title: seoTitle, slug: slug, type: pageType };

        await userDB.execute({
            sql: "UPDATE users SET pages = ? WHERE website_id = ?",
            args: [JSON.stringify(currentPages), website_id]
        });

        res.json({ success: true, slug });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
exports.deletePage = async (req, res) => {
    try {
        const { website_id, slug } = req.body;
        const result = await userDB.execute({ sql: "SELECT domain_name, pages FROM users WHERE website_id = ?", args: [website_id] });
        const user = result.rows[0];
        let currentPages = JSON.parse(user.pages || "{}");

        await s3Acc1.send(new DeleteObjectCommand({ Bucket: process.env.CF_BUCKET_ACC1, Key: `sites/${user.domain_name}/${slug}.html` }));
        await s3Acc1.send(new DeleteObjectCommand({ Bucket: process.env.CF_BUCKET_ACC1, Key: `sites/${user.domain_name}/${slug}.json` }));

        delete currentPages[slug];
        await userDB.execute({ sql: "UPDATE users SET pages = ? WHERE website_id = ?", args: [JSON.stringify(currentPages), website_id] });

        res.json({ success: true });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.listPages = async (req, res) => {
    try {
        const { website_id } = req.query;
        const result = await userDB.execute({ sql: "SELECT pages FROM users WHERE website_id = ?", args: [website_id] });
        const rawPages = JSON.parse(result.rows[0].pages || "{}");

        const pagesArray = Object.keys(rawPages).map(key => {
            const p = rawPages[key];
            return {
                id: key,
                name: typeof p === 'string' ? key : (p.name || key),
                slug: typeof p === 'string' ? key : (p.slug || key)
            };
        });

        res.json({ success: true, pages: pagesArray });
    } catch (error) { res.status(500).json({ success: false }); }
};

exports.renamePage = async (req, res) => {
    try {
        const { website_id, oldSlug, newName } = req.body;
        const newSlug = newName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

        if (oldSlug === 'home') return res.status(400).json({ message: "Home page rename nahi ho sakta!" });

        const result = await userDB.execute({
            sql: "SELECT domain_name, pages FROM users WHERE website_id = ?",
            args: [website_id]
        });
        const user = result.rows[0];
        let currentPages = JSON.parse(user.pages || "{}");

        const { CopyObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
        
        await s3Acc1.send(new CopyObjectCommand({
            Bucket: process.env.CF_BUCKET_ACC1,
            CopySource: `${process.env.CF_BUCKET_ACC1}/sites/${user.domain_name}/${oldSlug}.html`,
            Key: `sites/${user.domain_name}/${newSlug}.html`
        }));
        await s3Acc1.send(new CopyObjectCommand({
            Bucket: process.env.CF_BUCKET_ACC1,
            CopySource: `${process.env.CF_BUCKET_ACC1}/sites/${user.domain_name}/${oldSlug}.json`,
            Key: `sites/${user.domain_name}/${newSlug}.json`
        }));

        await s3Acc1.send(new DeleteObjectCommand({ Bucket: process.env.CF_BUCKET_ACC1, Key: `sites/${user.domain_name}/${oldSlug}.html` }));
        await s3Acc1.send(new DeleteObjectCommand({ Bucket: process.env.CF_BUCKET_ACC1, Key: `sites/${user.domain_name}/${oldSlug}.json` }));

        const pageData = currentPages[oldSlug];
        delete currentPages[oldSlug];
        currentPages[newSlug] = { ...pageData, name: newName, slug: newSlug };

        await userDB.execute({
            sql: "UPDATE users SET pages = ? WHERE website_id = ?",
            args: [JSON.stringify(currentPages), website_id]
        });

        res.json({ success: true, newSlug });
    } catch (error) {
        res.status(500).json({ success: false, message: "Rename Error: Shayad purani file nahi mili" });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { website_id, logo_url, whatsapp_number, social_links, name, phone, website_store_name, domain_name, custom_domain } = req.body;

        // 1. Fetch current user data to check if subdomain is changing
        const userRes = await userDB.execute({
            sql: "SELECT domain_name FROM users WHERE website_id = ?",
            args: [website_id]
        });
        const oldSubdomain = userRes.rows[0].domain_name;
        const newSubdomain = domain_name.toLowerCase().trim().replace(/\s+/g, '-');

        // 2. IF SUBDOMAIN CHANGED -> Move Files in R2
        if (oldSubdomain !== newSubdomain) {
            // Check if new subdomain is already taken
            const checkRes = await userDB.execute({
                sql: "SELECT id FROM users WHERE domain_name = ?",
                args: [newSubdomain]
            });
            if (checkRes.rows.length > 0) return res.status(400).json({ success: false, message: "This subdomain is already taken!" });

            // MOVE LOGIC: List all files in old folder and copy to new folder
            const listParams = { Bucket: process.env.CF_BUCKET_ACC1, Prefix: `sites/${oldSubdomain}/` };
            const listedObjects = await s3Acc1.send(new ListObjectsV2Command(listParams));

            if (listedObjects.Contents) {
                for (const obj of listedObjects.Contents) {
                    const newKey = obj.Key.replace(`sites/${oldSubdomain}/`, `sites/${newSubdomain}/`);
                    // Copy to new location
                    await s3Acc1.send(new CopyObjectCommand({
                        Bucket: process.env.CF_BUCKET_ACC1,
                        CopySource: `${process.env.CF_BUCKET_ACC1}/${obj.Key}`,
                        Key: newKey
                    }));
                    // Delete from old location
                    await s3Acc1.send(new DeleteObjectCommand({
                        Bucket: process.env.CF_BUCKET_ACC1,
                        Key: obj.Key
                    }));
                }
            }
        }

        // 3. Update Database (Including Account Info & Domains)
        await userDB.execute({
            sql: `UPDATE users SET 
                  name = ?, phone = ?, website_store_name = ?, domain_name = ?, 
                  custom_domain = ?, logo_url = ?, whatsapp_number = ?, social_links = ? 
                  WHERE website_id = ?`,
            args: [
                name, phone, website_store_name, newSubdomain, 
                custom_domain || null, logo_url, whatsapp_number, 
                JSON.stringify(social_links || {}), website_id
            ]
        });

        res.json({ success: true, message: "Settings & Domains Updated!", newSubdomain });
    } catch (error) {
        console.error("Update Settings Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
// 🚀 GET STORE SETTINGS
exports.getSettings = async (req, res) => {
    try {
        const { website_id } = req.query;
        const result = await userDB.execute({
            sql: "SELECT website_store_name, logo_url, whatsapp_number, social_links FROM users WHERE website_id = ?",
            args: [website_id]
        });
        res.json({ success: true, settings: result.rows[0] });
    } catch (error) { res.status(500).json({ success: false }); }
};