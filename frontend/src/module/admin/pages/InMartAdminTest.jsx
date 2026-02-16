import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import inmartAPI from '@/lib/api/inmartAPI';

export default function InMartAdminTest() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        weight: '',
        price: '',
        originalPrice: '',
        discount: '',
        image: '',
        category: 'Snacks & Drinks',
        subCategory: 'Chocolates',
        isNew: false,
        isBestSeller: false,
        isOnSale: false,
        isTrending: false,
    });

    // Fetch products on mount
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await inmartAPI.adminGetAllProducts();

            if (response.success) {
                setProducts(response.data.products);
                setSuccess('✅ Products loaded successfully!');
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError('❌ Failed to load products: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Get store ID from first product (or you can hardcode it)
            const storeId = products[0]?.store?._id || products[0]?.store;

            const productData = {
                ...formData,
                store: storeId,
                price: Number(formData.price),
                originalPrice: Number(formData.originalPrice),
                stock: 50,
                isAvailable: true,
            };

            let response;
            if (editingProduct) {
                response = await inmartAPI.adminUpdateProduct(editingProduct._id, productData);
                setSuccess('✅ Product updated successfully!');
            } else {
                response = await inmartAPI.adminCreateProduct(productData);
                setSuccess('✅ Product created successfully!');
            }

            if (response.success) {
                await fetchProducts();
                resetForm();
            }
        } catch (err) {
            setError('❌ Failed to save product: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            brand: product.brand || '',
            weight: product.weight,
            price: product.price,
            originalPrice: product.originalPrice || '',
            discount: product.discount || '',
            image: product.image,
            category: product.category,
            subCategory: product.subCategory || '',
            isNew: product.isNew || false,
            isBestSeller: product.isBestSeller || false,
            isOnSale: product.isOnSale || false,
            isTrending: product.isTrending || false,
        });
        setShowAddForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            setLoading(true);
            const response = await inmartAPI.adminDeleteProduct(id);

            if (response.success) {
                setSuccess('✅ Product deleted successfully!');
                await fetchProducts();
            }
        } catch (err) {
            setError('❌ Failed to delete product: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            brand: '',
            weight: '',
            price: '',
            originalPrice: '',
            discount: '',
            image: '',
            category: 'Snacks & Drinks',
            subCategory: 'Chocolates',
            isNew: false,
            isBestSeller: false,
            isOnSale: false,
            isTrending: false,
        });
        setEditingProduct(null);
        setShowAddForm(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                InMart Admin Test
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Test adding, editing, and deleting products
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <Plus size={20} />
                            Add Product
                        </button>
                    </div>
                </div>

                {/* Notifications */}
                {success && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 flex items-center gap-2">
                        <CheckCircle2 className="text-green-600" size={20} />
                        <span className="text-green-800 dark:text-green-200">{success}</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-center gap-2">
                        <AlertCircle className="text-red-600" size={20} />
                        <span className="text-red-800 dark:text-red-200">{error}</span>
                    </div>
                )}

                {/* Add/Edit Form */}
                {showAddForm && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            {editingProduct ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Brand
                                </label>
                                <input
                                    type="text"
                                    value={formData.brand}
                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Weight *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    placeholder="e.g., 500 g"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Price *
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Original Price
                                </label>
                                <input
                                    type="number"
                                    value={formData.originalPrice}
                                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Discount
                                </label>
                                <input
                                    type="text"
                                    value={formData.discount}
                                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                    placeholder="e.g., 20%"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Image URL *
                                </label>
                                <input
                                    type="url"
                                    required
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div className="col-span-2 flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isNew}
                                        onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">New</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isBestSeller}
                                        onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Best Seller</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isOnSale}
                                        onChange={(e) => setFormData({ ...formData, isOnSale: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">On Sale</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isTrending}
                                        onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Trending</span>
                                </label>
                            </div>

                            <div className="col-span-2 flex gap-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading && <Loader2 className="animate-spin" size={16} />}
                                    {editingProduct ? 'Update Product' : 'Add Product'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Products List */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Products ({products.length})
                    </h2>

                    {loading && !products.length ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-purple-600" size={32} />
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {products.map((product) => (
                                <div
                                    key={product._id}
                                    className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                                >
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-16 h-16 object-cover rounded-lg"
                                    />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {product.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {product.brand} • {product.weight} • ₹{product.price}
                                        </p>
                                        <div className="flex gap-2 mt-1">
                                            {product.isNew && (
                                                <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                                                    New
                                                </span>
                                            )}
                                            {product.isBestSeller && (
                                                <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded">
                                                    Best Seller
                                                </span>
                                            )}
                                            {product.isOnSale && (
                                                <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                                                    On Sale
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product._id)}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
