import InMartStore from '../models/InMartStore.js';
import InMartProduct from '../models/InMartProduct.js';
import InMartCategory from '../models/InMartCategory.js';
import InMartCollection from '../models/InMartCollection.js';
import InMartBanner from '../models/InMartBanner.js';
import InMartStory from '../models/InMartStory.js';
import InMartNavigation from '../models/InMartNavigation.js';

// @desc    Get all active InMart stores
// @route   GET /api/inmart/stores
// @access  Public
export const getStores = async (req, res) => {
    try {
        const stores = await InMartStore.find({ isActive: true, isAcceptingOrders: true })
            .select('-__v')
            .sort({ rating: -1 });

        res.status(200).json({
            success: true,
            count: stores.length,
            data: { stores }
        });
    } catch (error) {
        console.error('Error fetching InMart stores:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching stores',
            error: error.message
        });
    }
};

// @desc    Get store by slug
// @route   GET /api/inmart/stores/:slug
// @access  Public
export const getStoreBySlug = async (req, res) => {
    try {
        const store = await InMartStore.findOne({
            slug: req.params.slug,
            isActive: true
        });

        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { store }
        });
    } catch (error) {
        console.error('Error fetching store:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching store',
            error: error.message
        });
    }
};

// @desc    Get all categories
// @route   GET /api/inmart/categories
// @access  Public
export const getCategories = async (req, res) => {
    try {
        const categories = await InMartCategory.find({ isActive: true })
            .select('-__v')
            .sort({ displayOrder: 1 });

        res.status(200).json({
            success: true,
            count: categories.length,
            data: { categories }
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
};

// @desc    Get products with filters
// @route   GET /api/inmart/products
// @access  Public
export const getProducts = async (req, res) => {
    try {
        const {
            category,
            subCategory,
            childCategory,
            search,
            isNew,
            isBestSeller,
            isOnSale,
            isTrending,
            minPrice,
            maxPrice,
            page = 1,
            limit = 20
        } = req.query;

        const query = { isAvailable: true };

        // Filters
        if (category) query.category = { $regex: new RegExp(`^${category}$`, 'i') };
        if (subCategory) query.subCategory = { $regex: new RegExp(`^${subCategory}$`, 'i') };
        if (childCategory) query.childCategory = { $regex: new RegExp(`^${childCategory}$`, 'i') };
        if (isNew === 'true') query.isNew = true;
        if (isBestSeller === 'true') query.isBestSeller = true;
        if (isOnSale === 'true') query.isOnSale = true;
        if (isTrending === 'true') query.isTrending = true;

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Text search
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const skip = (page - 1) * limit;

        const products = await InMartProduct.find(query)
            .populate('store', 'name slug deliveryTime')
            .select('-__v')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(skip);

        const total = await InMartProduct.countDocuments(query);

        res.status(200).json({
            success: true,
            count: products.length,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            data: { products }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
};

// @desc    Get product by slug
// @route   GET /api/inmart/products/:slug
// @access  Public
export const getProductBySlug = async (req, res) => {
    try {
        const product = await InMartProduct.findOne({
            slug: req.params.slug,
            isAvailable: true
        }).populate('store', 'name slug deliveryTime rating');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { product }
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error.message
        });
    }
};

// @desc    Get collection by slug with products
// @route   GET /api/inmart/collections/:slug
// @access  Public
export const getCollectionBySlug = async (req, res) => {
    try {
        const collection = await InMartCollection.findOne({
            slug: req.params.slug,
            isActive: true
        }).populate({
            path: 'products',
            match: { isAvailable: true },
            select: '-__v',
            populate: {
                path: 'store',
                select: 'name slug deliveryTime'
            }
        });

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: 'Collection not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { collection }
        });
    } catch (error) {
        console.error('Error fetching collection:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching collection',
            error: error.message
        });
    }
};

// @desc    Get all collections
// @route   GET /api/inmart/collections
// @access  Public
export const getCollections = async (req, res) => {
    try {
        const collections = await InMartCollection.find({ isActive: true })
            .populate({
                path: 'products',
                match: { isAvailable: true },
                select: 'name slug price originalPrice discount image brand weight isNew',
                options: { limit: 10 }
            })
            .select('-__v')
            .sort({ displayOrder: 1 });

        res.status(200).json({
            success: true,
            count: collections.length,
            data: { collections }
        });
    } catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching collections',
            error: error.message
        });
    }
};

// @desc    Get all active banners
// @route   GET /api/inmart/banners
// @access  Public
export const getBanners = async (req, res) => {
    try {
        const banners = await InMartBanner.find({ isActive: true })
            .populate('store', 'name slug')
            .populate('restaurant', 'name slug')
            .populate('collection', 'name slug')
            .select('-__v')
            .sort({ displayOrder: 1 });

        res.status(200).json({
            success: true,
            count: banners.length,
            data: { banners }
        });
    } catch (error) {
        console.error('Error fetching banners:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching banners',
            error: error.message
        });
    }
};

// @desc    Get all active stories
// @route   GET /api/inmart/stories
// @access  Public
export const getStories = async (req, res) => {
    try {
        const stories = await InMartStory.find({ isActive: true })
            .populate('collection', 'name slug')
            .select('-__v')
            .sort({ displayOrder: 1 });

        res.status(200).json({
            success: true,
            count: stories.length,
            data: { stories }
        });
    } catch (error) {
        console.error('Error fetching stories:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching stories',
            error: error.message
        });
    }
};

// @desc    Get all active navigation entries
// @route   GET /api/inmart/navigation
// @access  Public
export const getNavCategories = async (req, res) => {
    try {
        const navigation = await InMartNavigation.find({ isActive: true }).sort({ displayOrder: 1 });
        res.status(200).json({
            success: true,
            count: navigation.length,
            data: { navigation }
        });
    } catch (error) {
        console.error('Error fetching navigation entries:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching navigation',
            error: error.message
        });
    }
};

// @desc    Get InMart home page data (all in one)
// @route   GET /api/inmart/home
// @access  Public
export const getHomeData = async (req, res) => {
    try {
        // Fetch all data in parallel
        const [categories, collections, banners, stories, navigation, store] = await Promise.all([
            InMartCategory.find({ isActive: true }).sort({ displayOrder: 1 }).select('-__v'),
            InMartCollection.find({ isActive: true })
                .populate({
                    path: 'products',
                    match: { isAvailable: true },
                    select: 'name slug price originalPrice discount image brand weight isNew isOnSale',
                    options: { limit: 10 }
                })
                .sort({ displayOrder: 1 })
                .select('-__v'),
            InMartBanner.find({ isActive: true }).sort({ displayOrder: 1 }).select('-__v'),
            InMartStory.find({ isActive: true }).sort({ displayOrder: 1 }).select('-__v'),
            InMartNavigation.find({ isActive: true }).sort({ displayOrder: 1 }).select('-__v'),
            InMartStore.findOne({ isActive: true }).select('name slug deliveryTime minimumOrder rating isAcceptingOrders')
        ]);

        res.status(200).json({
            success: true,
            data: {
                store,
                categories,
                collections,
                banners,
                stories,
                navigation
            }
        });
    } catch (error) {
        console.error('Error fetching home data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching home data',
            error: error.message
        });
    }
};
