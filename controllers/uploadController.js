const { s3Acc3 } = require('../config/s3Client'); 
const { PutObjectCommand } = require("@aws-sdk/client-s3");

// 🚀 DEFENSIVE IMPORT: Prevent server crash if sharp binaries fail on Vercel
let sharp;
try {
    sharp = require('sharp');
    console.log("⚡ Sharp module loaded successfully!");
} catch (e) {
    console.warn("⚠️ Sharp native binaries failed to load. Falling back to Raw Uploads.", e.message);
}

exports.uploadAndCompressImage = async (req, res) => {
    try {
        const file = (req.files && req.files.length > 0) ? req.files[0] : req.file;
        if (!file) return res.status(400).json({ success: false, message: "No file uploaded" });

        const websiteType = req.body.websiteType || 'ecommerce';
        const uploadType = req.body.uploadType || 'product';
        const sku = req.body.sku || 'TEMP-SKU';

        const randomStr = Math.random().toString(36).substring(7);
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
        
        let r2FileName = '';
        let contentType = file.mimetype;
        let finalBuffer = file.buffer;

        // Path Generation
        if (websiteType === 'ecommerce') {
            if (uploadType === 'product') {
                r2FileName = `ecommerce/products/${sku}/${timestamp}-${randomStr}.webp`;
            } else {
                r2FileName = `ecommerce/canvas/blostera-${Date.now()}-${randomStr}.webp`;
            }
        } else {
            r2FileName = `blogging/blostera-${Date.now()}-${randomStr}.webp`;
        }

        // 🚀 COMPRESSION STEP: Only runs if sharp is available
        if (sharp) {
            try {
                finalBuffer = await sharp(file.buffer)
                    .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 60 })
                    .toBuffer();
                contentType = "image/webp";
                console.log("⚡ Image compressed to WebP successfully.");
            } catch (sharpErr) {
                console.error("⚠️ Compression failed, using original raw buffer:", sharpErr.message);
                finalBuffer = file.buffer;
            }
        }

        // 🚀 UPLOAD TO CLOUDFLARE R2
        await s3Acc3.send(new PutObjectCommand({
            Bucket: process.env.CF_BUCKET_ACC3,
            Key: r2FileName,
            Body: finalBuffer,
            ContentType: contentType,
            CacheControl: "public, max-age=31536000, immutable" 
        }));

        const imageUrl = `${process.env.CF_PUBLIC_URL_ACC3}/${r2FileName}`;
        console.log(`✅ Upload Successful: ${imageUrl}`);

        res.json({ 
            success: true, 
            url: imageUrl,     
            data: [imageUrl]   
        });

    } catch (error) {
        console.error("❌ Upload Controller Critical Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};