// Backend 1: controllers/uploadController.js
const { s3Acc3 } = require('../config/s3Client'); // Using existing Account 3
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require('sharp');

exports.uploadAndCompressImage = async (req, res) => {
    try {
        const file = (req.files && req.files.length > 0) ? req.files[0] : req.file;
        if (!file) return res.status(400).json({ success: false, message: "No file uploaded" });

        // Frontend se dynamic parameters lenge (Defaults set hain agar khali ho)
        const websiteType = req.body.websiteType || 'ecommerce'; // 'ecommerce' ya 'blogging'
        const uploadType = req.body.uploadType || 'canvas';       // 'canvas' ya 'product'
        const sku = req.body.sku || 'TEMP-SKU';                   // Product unique SKU

        console.log(`📸 Image received: ${file.originalname}. Processing for WebP...`);

        // 🚀 Compress Image to WebP (Sharp)
        const compressedBuffer = await sharp(file.buffer)
            .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true }) // Responsive sizing
            .webp({ quality: 55, effort: 6 }) // Super compressed sharp WebP
            .toBuffer();

        // 🚀 DYNAMIC FOLDER PATH GENERATOR (Ustad ji, ye aapka solid folders logic hai)
        const randomStr = Math.random().toString(36).substring(7);
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14); // YYYYMMDDHHMMSS format
        
        let r2FileName = '';

        if (websiteType === 'ecommerce') {
            if (uploadType === 'product') {
                // Folder: ecommerce/products/[SKU]/[YYYYMMDDHHMMSS]-[random].webp
                r2FileName = `ecommerce/products/${sku}/${timestamp}-${randomStr}.webp`;
            } else {
                // Folder: ecommerce/canvas/blostera-[timestamp]-[random].webp
                r2FileName = `ecommerce/canvas/blostera-${Date.now()}-${randomStr}.webp`;
            }
        } else if (websiteType === 'blogging') {
            // Folder: blogging/blostera-[timestamp]-[random].webp
            r2FileName = `blogging/blostera-${Date.now()}-${randomStr}.webp`;
        }

        // 🚀 Upload to Cloudflare R2 (Acc 3) with CDN Cache Control
        await s3Acc3.send(new PutObjectCommand({
            Bucket: process.env.CF_BUCKET_ACC3,
            Key: r2FileName,
            Body: compressedBuffer,
            ContentType: "image/webp",
            
            // 🔥 CACHE ENGINE: Tells Cloudflare and Browser to cache this image for 1 year!
            CacheControl: "public, max-age=31536000, immutable" 
        }));

        const imageUrl = `${process.env.CF_PUBLIC_URL_ACC3}/${r2FileName}`;
        console.log(`✅ Uploaded to: ${r2FileName} | Size: ${Math.round(compressedBuffer.length / 1024)} KB`);

        res.json({ 
            success: true, 
            url: imageUrl,     
            data: [imageUrl]   
        });

    } catch (error) {
        console.error("❌ Upload Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};