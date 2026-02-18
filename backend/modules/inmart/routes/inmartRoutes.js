import express from 'express';
import {
    getStores,
    getStoreBySlug,
    getCategories,
    getProducts,
    getProductBySlug,
    getCollectionBySlug,
    getCollections,
    getBanners,
    getStories,
    getNavCategories,
    getHomeData
} from '../controllers/inmartController.js';

const router = express.Router();

// Home page data (combined endpoint for efficiency)
router.get('/home', getHomeData);

// Stores
router.get('/stores', getStores);
router.get('/stores/:slug', getStoreBySlug);

// Categories
router.get('/categories', getCategories);

// Products
router.get('/products', getProducts);
router.get('/products/:slug', getProductBySlug);

// Collections
router.get('/collections', getCollections);
router.get('/collections/:slug', getCollectionBySlug);

// Banners
router.get('/banners', getBanners);

// Stories
router.get('/stories', getStories);

// Navigation
router.get('/navigation', getNavCategories);

export default router;
