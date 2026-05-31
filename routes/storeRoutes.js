// FILE: routes/storeRoutes.js
const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');

// 1. Publishing & Viewing
router.post('/publish', storeController.publishToCloudflare);
router.get('/get-site', storeController.getSiteByHostname);
router.get('/get-json', storeController.getStoreJSON); 
router.post('/cart/add', cartController.addToCart);
router.get('/cart/count', cartController.getCartCount);
router.get('/cart/list', cartController.listCart); // 🚀 NAYA
router.post('/cart/remove', cartController.removeFromCart); // 🚀 NAYA
// 2. 🆕 Multi-Page Management
router.post('/create-page', storeController.createPage); // Naya page banaye
router.post('/delete-page', storeController.deletePage); // Page delete kare
router.get('/list-pages', storeController.listPages);   // Saare pages ki list dikhaye
router.post('/rename-page', storeController.renamePage); // Page ka naam change kare
router.post('/settings/update', storeController.updateSettings);
router.get('/settings/get', storeController.getSettings);
router.post('/order/place', orderController.placeOrder);
router.get('/order/list', orderController.getOrders);            // 🚀 NEW
router.get('/order/items', orderController.getOrderItems);       // 🚀 NEW
router.post('/order/update-status', orderController.updateOrderStatus); // 🚀 NEW
router.get('/stats', orderController.getStats);
router.get('/order/public-detail', orderController.getOrderPublic);
module.exports = router;