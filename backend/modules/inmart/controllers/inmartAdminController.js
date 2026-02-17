import InMartStore from '../models/InMartStore.js';
import InMartProduct from '../models/InMartProduct.js';
import InMartCategory from '../models/InMartCategory.js';
import InMartCollection from '../models/InMartCollection.js';
import InMartBanner from '../models/InMartBanner.js';
import InMartStory from '../models/InMartStory.js';

// ==================== PRODUCTS ====================

// @desc    Get all products (admin)
// @route   GET /api/admin/inmart/products
// @access  Private/Admin
export const getAllProducts = async (req, res) => {
    try {
        const products = await InMartProduct.find()
            .populate('store', 'name slug')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            data: { products }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
};

// @desc    Create product
// @route   POST /api/admin/inmart/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
    try {
        const { collectionSlug, ...productData } = req.body;

        const product = await InMartProduct.create(productData);

        // If collection slug is provided, add product to that collection
        if (collectionSlug) {
            const collection = await InMartCollection.findOne({ slug: collectionSlug });
            if (collection) {
                // Add product ID to collection's products array
                collection.products.push(product._id);
                await collection.save();
                console.log(`✅ Product added to collection: ${collectionSlug}`);
            } else {
                console.warn(`⚠️ Collection not found: ${collectionSlug}`);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: { product }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
};

// @desc    Update product
// @route   PUT /api/admin/inmart/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
    try {
        const { collectionSlug, ...productData } = req.body;

        const product = await InMartProduct.findByIdAndUpdate(
            req.params.id,
            productData,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Update collection membership if collectionSlug is provided
        if (collectionSlug) {
            // Remove from all collections first
            await InMartCollection.updateMany(
                { products: product._id },
                { $pull: { products: product._id } }
            );

            // Add to new collection
            const collection = await InMartCollection.findOne({ slug: collectionSlug });
            if (collection && !collection.products.includes(product._id)) {
                collection.products.push(product._id);
                await collection.save();
                console.log(`✅ Product updated in collection: ${collectionSlug}`);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: { product }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating product',
            error: error.message
        });
    }
};

// @desc    Delete product
// @route   DELETE /api/admin/inmart/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
    try {
        const product = await InMartProduct.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Remove product from all collections
        await InMartCollection.updateMany(
            { products: product._id },
            { $pull: { products: product._id } }
        );
        console.log(`🗑️ Product removed from all collections`);

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error.message
        });
    }
};

// ==================== CATEGORIES ====================

// @desc    Get all categories (admin)
// @route   GET /api/admin/inmart/categories
// @access  Private/Admin
export const getAllCategories = async (req, res) => {
    try {
        const categories = await InMartCategory.find().sort({ displayOrder: 1 });

        res.status(200).json({
            success: true,
            count: categories.length,
            data: { categories }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
};

// @desc    Create category
// @route   POST /api/admin/inmart/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
    try {
        const category = await InMartCategory.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: { category }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating category',
            error: error.message
        });
    }
};

// @desc    Update category
// @route   PUT /api/admin/inmart/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res) => {
    try {
        const category = await InMartCategory.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: { category }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating category',
            error: error.message
        });
    }
};

// @desc    Delete category
// @route   DELETE /api/admin/inmart/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
    try {
        const category = await InMartCategory.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting category',
            error: error.message
        });
    }
};

// ==================== COLLECTIONS ====================

// @desc    Get all collections (admin)
// @route   GET /api/admin/inmart/collections
// @access  Private/Admin
export const getAllCollections = async (req, res) => {
    try {
        const collections = await InMartCollection.find()
            .populate('products', 'name image price')
            .sort({ displayOrder: 1 });

        res.status(200).json({
            success: true,
            count: collections.length,
            data: { collections }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching collections',
            error: error.message
        });
    }
};

// @desc    Create collection
// @route   POST /api/admin/inmart/collections
// @access  Private/Admin
export const createCollection = async (req, res) => {
    try {
        const collection = await InMartCollection.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Collection created successfully',
            data: { collection }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating collection',
            error: error.message
        });
    }
};

// @desc    Update collection
// @route   PUT /api/admin/inmart/collections/:id
// @access  Private/Admin
export const updateCollection = async (req, res) => {
    try {
        const collection = await InMartCollection.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: 'Collection not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Collection updated successfully',
            data: { collection }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating collection',
            error: error.message
        });
    }
};

// @desc    Delete collection
// @route   DELETE /api/admin/inmart/collections/:id
// @access  Private/Admin
export const deleteCollection = async (req, res) => {
    try {
        const collection = await InMartCollection.findByIdAndDelete(req.params.id);

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: 'Collection not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Collection deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting collection',
            error: error.message
        });
    }
};

// ==================== STORES ====================

// @desc    Get all stores (admin)
// @route   GET /api/admin/inmart/stores
// @access  Private/Admin
export const getAllStores = async (req, res) => {
    try {
        const stores = await InMartStore.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: stores.length,
            data: { stores }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching stores',
            error: error.message
        });
    }
};

// @desc    Create store
// @route   POST /api/admin/inmart/stores
// @access  Private/Admin
export const createStore = async (req, res) => {
    try {
        const store = await InMartStore.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Store created successfully',
            data: { store }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating store',
            error: error.message
        });
    }
};

// @desc    Update store
// @route   PUT /api/admin/inmart/stores/:id
// @access  Private/Admin
export const updateStore = async (req, res) => {
    try {
        const store = await InMartStore.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Store updated successfully',
            data: { store }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating store',
            error: error.message
        });
    }
};

// @desc    Delete store
// @route   DELETE /api/admin/inmart/stores/:id
// @access  Private/Admin
export const deleteStore = async (req, res) => {
    try {
        const store = await InMartStore.findByIdAndDelete(req.params.id);

        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Store deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting store',
            error: error.message
        });
    }
};

// ==================== BANNERS ====================

// @desc    Get all banners
// @route   GET /api/admin/inmart/banners
// @access  Private/Admin
export const getAllBanners = async (req, res) => {
    try {
        const banners = await InMartBanner.find().sort({ displayOrder: 1 });
        res.status(200).json({
            success: true,
            count: banners.length,
            data: { banners }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching banners',
            error: error.message
        });
    }
};

// @desc    Create banner
// @route   POST /api/admin/inmart/banners
// @access  Private/Admin
export const createBanner = async (req, res) => {
    console.log('📝 Create Banner Request:', req.body);
    try {
        const banner = await InMartBanner.create(req.body);
        console.log('✅ Banner Created:', banner._id);
        res.status(201).json({
            success: true,
            message: 'Banner created successfully',
            data: { banner }
        });
    } catch (error) {
        console.error('❌ Error creating banner:', error);
        res.status(400).json({
            success: false,
            message: 'Error creating banner',
            error: error.message
        });
    }
};

// @desc    Update banner
// @route   PUT /api/admin/inmart/banners/:id
// @access  Private/Admin
export const updateBanner = async (req, res) => {
    try {
        const banner = await InMartBanner.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Banner updated successfully',
            data: { banner }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating banner',
            error: error.message
        });
    }
};

// @desc    Delete banner
// @route   DELETE /api/admin/inmart/banners/:id
// @access  Private/Admin
export const deleteBanner = async (req, res) => {
    try {
        const banner = await InMartBanner.findByIdAndDelete(req.params.id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Banner deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting banner',
            error: error.message
        });
    }
};

// ==================== DASHBOARD STATS ====================

// @desc    Get InMart dashboard statistics
// @route   GET /api/admin/inmart/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
    try {
        const [
            totalProducts,
            totalCategories,
            totalCollections,
            totalStores,
            activeProducts,
            newProducts,
            saleProducts
        ] = await Promise.all([
            InMartProduct.countDocuments(),
            InMartCategory.countDocuments(),
            InMartCollection.countDocuments(),
            InMartStore.countDocuments(),
            InMartProduct.countDocuments({ isAvailable: true }),
            InMartProduct.countDocuments({ isNew: true }),
            InMartProduct.countDocuments({ isOnSale: true })
        ]);

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalProducts,
                    totalCategories,
                    totalCollections,
                    totalStores,
                    activeProducts,
                    newProducts,
                    saleProducts
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching stats',
            error: error.message
        });
    }
};
