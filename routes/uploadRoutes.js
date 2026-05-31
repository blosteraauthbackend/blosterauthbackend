const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 🚀 Asli Fix: upload.any() laga dein. (Ab kisi bhi naam se file aaye, ye reject nahi karega)
router.post('/image', upload.any(), uploadController.uploadAndCompressImage);

module.exports = router;