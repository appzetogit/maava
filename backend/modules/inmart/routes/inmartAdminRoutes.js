import express from 'express';
import {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getAllCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    getAllStores,
    createStore,
    updateStore,
    deleteStore,
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    getAllNavEntries,
    createNavEntry,
    updateNavEntry,
    deleteNavEntry,
    getDashboardStats
} from '../controllers/inmartAdminController.js';
import { upload, uploadImage } from '../controllers/uploadController.js';

const router = express.Router();

// Image Upload
router.post('/upload', upload.single('image'), uploadImage);

// Dashboard Stats
router.get('/stats', getDashboardStats);

// Products
router.route('/products')
    .get(getAllProducts)
    .post(createProduct);

router.route('/products/:id')
    .put(updateProduct)
    .delete(deleteProduct);

// Categories
router.route('/categories')
    .get(getAllCategories)
    .post(createCategory);

router.route('/categories/:id')
    .put(updateCategory)
    .delete(deleteCategory);

// Collections
router.route('/collections')
    .get(getAllCollections)
    .post(createCollection);

router.route('/collections/:id')
    .put(updateCollection)
    .delete(deleteCollection);

// Stores
router.route('/stores')
    .get(getAllStores)
    .post(createStore);

router.route('/stores/:id')
    .put(updateStore)
    .delete(deleteStore);

// Banners
router.route('/banners')
    .get(getAllBanners)
    .post(createBanner);

router.route('/banners/:id')
    .put(updateBanner)
    .delete(deleteBanner);

// Navigation
router.route('/navigation')
    .get(getAllNavEntries)
    .post(createNavEntry);

router.route('/navigation/:id')
    .put(updateNavEntry)
    .delete(deleteNavEntry);

export default router;
