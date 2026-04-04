import InMartStore from '../models/InMartStore.js';
import InMartProduct from '../models/InMartProduct.js';
import InMartCategory from '../models/InMartCategory.js';
import InMartCollection from '../models/InMartCollection.js';
import InMartBanner from '../models/InMartBanner.js';
import InMartStory from '../models/InMartStory.js';
import InMartNavigation from '../models/InMartNavigation.js';
import Order from '../../order/models/Order.js';
import User from '../../auth/models/User.js';
import Delivery from '../../delivery/models/Delivery.js';


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
        const { id } = req.params;
        const isObjectId = mongoose.Types.ObjectId.isValid(id) && String(id).length === 24;

        // Support deletion by Mongo _id (preferred), or by productId/slug (fallback)
        let product = null;
        if (isObjectId) {
            product = await InMartProduct.findByIdAndDelete(id);
        }
        if (!product) {
            product = await InMartProduct.findOneAndDelete({
                $or: [{ productId: id }, { slug: id }]
            });
        }

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
        const { id } = req.params;
        const isObjectId = mongoose.Types.ObjectId.isValid(id) && String(id).length === 24;

        // Support deletion by Mongo _id (preferred), or by slug (fallback)
        let category = null;
        if (isObjectId) {
            category = await InMartCategory.findByIdAndDelete(id);
        }
        if (!category) {
            category = await InMartCategory.findOneAndDelete({ slug: id });
        }

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

// @desc    Delete a subcategory from a main category (embedded doc)
// @route   DELETE /api/admin/inmart/categories/:categoryId/subcategories/:subId
// @access  Private/Admin
export const deleteSubCategory = async (req, res) => {
    try {
        const { categoryId, subId } = req.params;

        const findCategoryQuery = (mongoose.Types.ObjectId.isValid(categoryId) && String(categoryId).length === 24)
            ? { _id: categoryId }
            : { slug: categoryId };

        const category = await InMartCategory.findOne(findCategoryQuery);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const before = category.subCategories?.length || 0;
        const subIdStr = String(subId);

        category.subCategories = (category.subCategories || []).filter((sc) => {
            const scId = sc?._id?.toString?.();
            const scAltId = sc?.id ? String(sc.id) : null;
            const scSlug = sc?.slug ? String(sc.slug) : null;
            return !(scId === subIdStr || scAltId === subIdStr || scSlug === subIdStr);
        });

        if ((category.subCategories?.length || 0) === before) {
            return res.status(404).json({ success: false, message: 'Subcategory not found' });
        }

        await category.save();
        return res.status(200).json({ success: true, message: 'Subcategory deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error deleting subcategory', error: error.message });
    }
};

// @desc    Delete a child category from a subcategory (embedded doc)
// @route   DELETE /api/admin/inmart/categories/:categoryId/subcategories/:subId/children/:childId
// @access  Private/Admin
export const deleteChildCategory = async (req, res) => {
    try {
        const { categoryId, subId, childId } = req.params;

        const findCategoryQuery = (mongoose.Types.ObjectId.isValid(categoryId) && String(categoryId).length === 24)
            ? { _id: categoryId }
            : { slug: categoryId };

        const category = await InMartCategory.findOne(findCategoryQuery);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const subIdStr = String(subId);
        const childIdStr = String(childId);

        const sub = (category.subCategories || []).find((sc) => {
            const scId = sc?._id?.toString?.();
            const scAltId = sc?.id ? String(sc.id) : null;
            const scSlug = sc?.slug ? String(sc.slug) : null;
            return scId === subIdStr || scAltId === subIdStr || scSlug === subIdStr;
        });

        if (!sub) {
            return res.status(404).json({ success: false, message: 'Subcategory not found' });
        }

        const before = sub.children?.length || 0;
        sub.children = (sub.children || []).filter((ch) => {
            const chId = ch?._id?.toString?.();
            const chAltId = ch?.id ? String(ch.id) : null;
            const chSlug = ch?.slug ? String(ch.slug) : null;
            return !(chId === childIdStr || chAltId === childIdStr || chSlug === childIdStr);
        });

        if ((sub.children?.length || 0) === before) {
            return res.status(404).json({ success: false, message: 'Child category not found' });
        }

        await category.save();
        return res.status(200).json({ success: true, message: 'Child category deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error deleting child category', error: error.message });
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

// ==================== NAVIGATION ====================

// @desc    Get all navigation entries
// @route   GET /api/admin/inmart/navigation
// @access  Private/Admin
export const getAllNavEntries = async (req, res) => {
    try {
        const navigation = await InMartNavigation.find().sort({ displayOrder: 1 });
        res.status(200).json({
            success: true,
            count: navigation.length,
            data: { navigation }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching navigation entries',
            error: error.message
        });
    }
};

// @desc    Create navigation entry
// @route   POST /api/admin/inmart/navigation
// @access  Private/Admin
export const createNavEntry = async (req, res) => {
    try {
        const navEntry = await InMartNavigation.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Navigation entry created successfully',
            data: { navigation: navEntry }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating navigation entry',
            error: error.message
        });
    }
};

// @desc    Update navigation entry
// @route   PUT /api/admin/inmart/navigation/:id
// @access  Private/Admin
export const updateNavEntry = async (req, res) => {
    try {
        const navEntry = await InMartNavigation.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!navEntry) {
            return res.status(404).json({
                success: false,
                message: 'Navigation entry not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Navigation entry updated successfully',
            data: { navigation: navEntry }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating navigation entry',
            error: error.message
        });
    }
};

// @desc    Delete navigation entry
// @route   DELETE /api/admin/inmart/navigation/:id
// @access  Private/Admin
export const deleteNavEntry = async (req, res) => {
    try {
        const navEntry = await InMartNavigation.findByIdAndDelete(req.params.id);

        if (!navEntry) {
            return res.status(404).json({
                success: false,
                message: 'Navigation entry not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Navigation entry deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting navigation entry',
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
        const hibermartOrderMatch = {
            $or: [
                { isHibermartOrder: true },
                { restaurantId: 'hibermart-id' },
                { restaurantName: { $regex: /^hibermart$/i } }
            ]
        };

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [
            totalProducts,
            totalCategories,
            totalCollections,
            totalStores,
            totalNavEntries,
            activeProducts,
            activeBanners,
            totalUsers,
            mainStore,
            hibermartOrderStats,
            activeCouriers
        ] = await Promise.all([
            InMartProduct.countDocuments(),
            InMartCategory.countDocuments(),
            InMartCollection.countDocuments(),
            InMartStore.countDocuments(),
            InMartNavigation.countDocuments(),
            InMartProduct.countDocuments({ isAvailable: true }),
            InMartBanner.countDocuments({ isActive: true }),
            User.countDocuments(),
            InMartStore.findOne(),
            Order.aggregate([
                {
                    $match: hibermartOrderMatch
                },
                {
                    $facet: {
                        total: [
                            {
                                $match: {
                                    status: { $ne: 'cancelled' },
                                    'payment.status': 'completed'
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    totalRevenue: { $sum: { $ifNull: ['$pricing.total', 0] } },
                                    totalOrders: { $sum: 1 }
                                }
                            }
                        ],
                        monthly: [
                            {
                                $match: {
                                    createdAt: { $gte: startOfMonth },
                                    status: { $ne: 'cancelled' },
                                    'payment.status': 'completed'
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    monthlyRevenue: { $sum: { $ifNull: ['$pricing.total', 0] } }
                                }
                            }
                        ]
                    }
                }
            ]),
            Delivery.countDocuments({ 'availability.isOnline': true, isActive: true })
        ]);

        const orderStats = hibermartOrderStats[0]?.total[0] || { totalRevenue: 0, totalOrders: 0 };
        const monthlyStats = hibermartOrderStats[0]?.monthly[0] || { monthlyRevenue: 0 };

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalProducts,
                    totalCategories,
                    totalCollections,
                    totalStores,
                    totalNavEntries,
                    activeProducts,
                    activeBanners, // Representing "Active Promos" per user request
                    totalUsers,
                    totalRevenue: orderStats.totalRevenue || 0,
                    monthlyRevenue: monthlyStats.monthlyRevenue || 0,
                    totalOrders: orderStats.totalOrders || 0,
                    isStoreOpen: mainStore ? mainStore.isAcceptingOrders : true,
                    activeCouriers
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

// @desc    Toggle InMart store status (open/closed)
// @route   PATCH /api/admin/inmart/store-status
// @access  Private/Admin
export const toggleStoreStatus = async (req, res) => {
    try {
        const { isOpen } = req.body;

        // Update all stores or the main one. For simplicity, updating all since Hibermart is usually one store in this context.
        await InMartStore.updateMany({}, { isAcceptingOrders: isOpen });

        res.status(200).json({
            success: true,
            message: `Store status updated to ${isOpen ? 'Open' : 'Closed'}`,
            data: { isOpen }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating store status',
            error: error.message
        });
    }
};

// @desc    Get all hibermart orders for admin console
// @route   GET /api/admin/inmart/orders
// @access  Private/Admin
export const getHibermartOrders = async (req, res) => {
    try {
        const { limit = 50, page = 1 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Standard matching for Hibermart orders across all possible markers
        const hibermartFilter = {
            $or: [
                { isHibermartOrder: true },
                { restaurantId: 'hibermart-id' },
                { restaurantName: { $regex: /^hibermart$/i } }
            ]
        };

        const orders = await Order.find(hibermartFilter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip)
            .select('-__v')
            .populate('userId', 'name phone email');

        const total = await Order.countDocuments(hibermartFilter);

        res.status(200).json({
            success: true,
            data: {
                orders,
                total,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching hibermart orders',
            error: error.message
        });
    }
};
