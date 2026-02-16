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

export default router;
