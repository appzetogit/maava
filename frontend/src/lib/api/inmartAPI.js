import api from './axios';

/**
 * InMart API Service
 * All API calls for the InMart (Hibermart) section
 */

// ==================== PUBLIC ENDPOINTS ====================

/**
 * Get all home page data (categories, collections, banners, stories)
 * This is the most efficient endpoint - fetches everything in one call
 */
export const getInMartHome = async () => {
    try {
        const response = await api.get('/inmart/home');
        return response.data;
    } catch (error) {
        console.error('Error fetching InMart home data:', error);
        throw error;
    }
};

/**
 * Get all categories
 */
export const getCategories = async () => {
    try {
        const response = await api.get('/inmart/categories');
        return response.data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
};

/**
 * Get all active navigation categories
 */
export const getNavCategories = async () => {
    try {
        const response = await api.get('/inmart/navigation');
        return response.data;
    } catch (error) {
        console.error('Error fetching navigation:', error);
        throw error;
    }
};

/**
 * Get products with optional filters
 * @param {Object} filters - { category, subCategory, search, isNew, isBestSeller, isOnSale, isTrending, minPrice, maxPrice, page, limit }
 */
export const getProducts = async (filters = {}) => {
    try {
        const params = new URLSearchParams();

        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
                params.append(key, filters[key]);
            }
        });

        const response = await api.get(`/inmart/products?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

/**
 * Get product by slug
 */
export const getProductBySlug = async (slug) => {
    try {
        const response = await api.get(`/inmart/products/${slug}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
    }
};

/**
 * Get all collections with their products
 */
export const getCollections = async () => {
    try {
        const response = await api.get('/inmart/collections');
        return response.data;
    } catch (error) {
        console.error('Error fetching collections:', error);
        throw error;
    }
};

/**
 * Get collection by slug with all products
 */
export const getCollectionBySlug = async (slug) => {
    try {
        const response = await api.get(`/inmart/collections/${slug}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching collection:', error);
        throw error;
    }
};

/**
 * Get all stores
 */
export const getStores = async () => {
    try {
        const response = await api.get('/inmart/stores');
        return response.data;
    } catch (error) {
        console.error('Error fetching stores:', error);
        throw error;
    }
};

/**
 * Get banners
 */
export const getBanners = async () => {
    try {
        const response = await api.get('/inmart/banners');
        return response.data;
    } catch (error) {
        console.error('Error fetching banners:', error);
        throw error;
    }
};

/**
 * Get stories
 */
export const getStories = async () => {
    try {
        const response = await api.get('/inmart/stories');
        return response.data;
    } catch (error) {
        console.error('Error fetching stories:', error);
        throw error;
    }
};

// ==================== ADMIN ENDPOINTS ====================

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async () => {
    try {
        const response = await api.get('/admin/inmart/stats');
        return response.data;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
    }
};

/**
 * Admin: Get all products
 */
export const adminGetAllProducts = async () => {
    try {
        const response = await api.get('/admin/inmart/products');
        return response.data;
    } catch (error) {
        console.error('Error fetching admin products:', error);
        throw error;
    }
};

/**
 * Admin: Create product
 */
export const adminCreateProduct = async (productData) => {
    try {
        const response = await api.post('/admin/inmart/products', productData);
        return response.data;
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
};

/**
 * Admin: Update product
 */
export const adminUpdateProduct = async (id, productData) => {
    try {
        const response = await api.put(`/admin/inmart/products/${id}`, productData);
        return response.data;
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
};

/**
 * Admin: Delete product
 */
export const adminDeleteProduct = async (id) => {
    try {
        const response = await api.delete(`/admin/inmart/products/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
};

/**
 * Admin: Get all categories
 */
export const adminGetAllCategories = async () => {
    try {
        const response = await api.get('/admin/inmart/categories');
        return response.data;
    } catch (error) {
        console.error('Error fetching admin categories:', error);
        throw error;
    }
};

/**
 * Admin: Create category
 */
export const adminCreateCategory = async (categoryData) => {
    try {
        const response = await api.post('/admin/inmart/categories', categoryData);
        return response.data;
    } catch (error) {
        console.error('Error creating category:', error);
        throw error;
    }
};

/**
 * Admin: Update category
 */
export const adminUpdateCategory = async (id, categoryData) => {
    try {
        const response = await api.put(`/admin/inmart/categories/${id}`, categoryData);
        return response.data;
    } catch (error) {
        console.error('Error updating category:', error);
        throw error;
    }
};

/**
 * Admin: Delete category
 */
export const adminDeleteCategory = async (id) => {
    try {
        const response = await api.delete(`/admin/inmart/categories/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting category:', error);
        throw error;
    }
};

/**
 * Admin: Get all collections
 */
export const adminGetAllCollections = async () => {
    try {
        const response = await api.get('/admin/inmart/collections');
        return response.data;
    } catch (error) {
        console.error('Error fetching admin collections:', error);
        throw error;
    }
};

/**
 * Admin: Create collection
 */
export const adminCreateCollection = async (collectionData) => {
    try {
        const response = await api.post('/admin/inmart/collections', collectionData);
        return response.data;
    } catch (error) {
        console.error('Error creating collection:', error);
        throw error;
    }
};

/**
 * Admin: Update collection
 */
export const adminUpdateCollection = async (id, collectionData) => {
    try {
        const response = await api.put(`/admin/inmart/collections/${id}`, collectionData);
        return response.data;
    } catch (error) {
        console.error('Error updating collection:', error);
        throw error;
    }
};

/**
 * Admin: Delete collection
 */
export const adminDeleteCollection = async (id) => {
    try {
        const response = await api.delete(`/admin/inmart/collections/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting collection:', error);
        throw error;
    }
};

/**
 * Admin: Get all banners
 */
export const adminGetAllBanners = async () => {
    try {
        const response = await api.get('/admin/inmart/banners');
        return response.data;
    } catch (error) {
        console.error('Error fetching admin banners:', error);
        throw error;
    }
};

/**
 * Admin: Create banner
 */
export const adminCreateBanner = async (bannerData) => {
    try {
        const response = await api.post('/admin/inmart/banners', bannerData);
        return response.data;
    } catch (error) {
        console.error('Error creating banner:', error);
        throw error;
    }
};

/**
 * Admin: Update banner
 */
export const adminUpdateBanner = async (id, bannerData) => {
    try {
        const response = await api.put(`/admin/inmart/banners/${id}`, bannerData);
        return response.data;
    } catch (error) {
        console.error('Error updating banner:', error);
        throw error;
    }
};

/**
 * Admin: Delete banner
 */
export const adminDeleteBanner = async (id) => {
    try {
        const response = await api.delete(`/admin/inmart/banners/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting banner:', error);
        throw error;
    }
};

/**
 * Admin: Get all navigation entries
 */
export const adminGetAllNavEntries = async () => {
    try {
        const response = await api.get('/admin/inmart/navigation');
        return response.data;
    } catch (error) {
        console.error('Error fetching admin nav entries:', error);
        throw error;
    }
};

/**
 * Admin: Create navigation entry
 */
export const adminCreateNavEntry = async (navData) => {
    try {
        const response = await api.post('/admin/inmart/navigation', navData);
        return response.data;
    } catch (error) {
        console.error('Error creating nav entry:', error);
        throw error;
    }
};

/**
 * Admin: Update navigation entry
 */
export const adminUpdateNavEntry = async (id, navData) => {
    try {
        const response = await api.put(`/admin/inmart/navigation/${id}`, navData);
        return response.data;
    } catch (error) {
        console.error('Error updating nav entry:', error);
        throw error;
    }
};

/**
 * Admin: Delete navigation entry
 */
export const adminDeleteNavEntry = async (id) => {
    try {
        const response = await api.delete(`/admin/inmart/navigation/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting nav entry:', error);
        throw error;
    }
};

/**
 * Admin: Upload image
 */
export const uploadImage = async (formData) => {
    try {
        const response = await api.post('/admin/inmart/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

/**
 * Admin: Toggle store status
 */
export const adminToggleStoreStatus = async (isOpen) => {
    try {
        const response = await api.patch('/admin/inmart/store-status', { isOpen });
        return response.data;
    } catch (error) {
        console.error('Error toggling store status:', error);
        throw error;
    }
};

export const adminGetOrders = async (params = {}) => {
    try {
        const response = await api.get('/admin/inmart/orders', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching hibermart orders:', error);
        throw error;
    }
};

export default {
    // Public
    getInMartHome,
    getCategories,
    getNavCategories,
    getProducts,
    getProductBySlug,
    getCollections,
    getCollectionBySlug,
    getStores,
    getBanners,
    getStories,

    // Admin
    getDashboardStats,
    adminGetAllProducts,
    adminCreateProduct,
    adminUpdateProduct,
    adminDeleteProduct,
    adminGetAllCategories,
    adminCreateCategory,
    adminUpdateCategory,
    adminDeleteCategory,
    adminGetAllCollections,
    adminCreateCollection,
    adminUpdateCollection,
    adminDeleteCollection,
    adminGetAllBanners,
    adminCreateBanner,
    adminUpdateBanner,
    adminDeleteBanner,
    adminGetAllNavEntries,
    adminCreateNavEntry,
    adminUpdateNavEntry,
    adminDeleteNavEntry,
    uploadImage,
    adminToggleStoreStatus,
    adminGetOrders,
};
