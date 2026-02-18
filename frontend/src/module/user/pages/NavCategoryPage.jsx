import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ShoppingBag, Search, Filter } from "lucide-react";
import inmartAPI from "@/lib/api/inmartAPI";
import AnimatedPage from "../components/AnimatedPage";
import AddToCartButton from "../components/AddToCartButton";

const ProductCard = ({ product }) => (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 dark:border-white/5 group hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 flex flex-col h-full">
        <div className="relative aspect-square w-full mb-4 bg-[#F8F9FA] dark:bg-white/5 rounded-2xl flex items-center justify-center p-4 overflow-hidden">
            <img src={product.image} alt={product.name} className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-700 ease-out" />
            {product.discount && (
                <div className="absolute top-3 left-3 bg-[#8B5CF6] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg">
                    {product.discount} OFF
                </div>
            )}
        </div>
        <div className="flex-1 space-y-1">
            <h3 className="text-[15px] font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                {product.name}
            </h3>
            <p className="text-xs font-semibold text-gray-400">
                {product.weight} • {product.deliveryTime || '10 MINS'}
            </p>
        </div>
        <div className="mt-4 flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-lg font-black text-gray-900 dark:text-white leading-none">
                    ₹{product.price}
                </span>
                {product.originalPrice > product.price && (
                    <span className="text-[11px] text-gray-400 line-through font-bold mt-1">
                        ₹{product.originalPrice}
                    </span>
                )}
            </div>
            <AddToCartButton
                item={{ ...product, restaurant: "Hibermart", restaurantId: "hibermart-id" }}
                className="w-16"
            />
        </div>
    </div>
);

export default function NavCategoryPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [navEntry, setNavEntry] = useState(null);
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Step 1: Find the nav entry by slug
                const navRes = await inmartAPI.getNavCategories(); // Should probably have a getBySlug but we can filter
                if (navRes.success) {
                    const entry = navRes.data.navigation.find(n => n.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug || n._id === slug);

                    if (!entry) throw new Error("Navigation category not found");
                    setNavEntry(entry);

                    // Step 2: Fetch products based on target
                    let fetchedProducts = [];
                    if (entry.targetType === 'category') {
                        const res = await inmartAPI.getProducts({ category: entry.targetId });
                        fetchedProducts = res.data.products;
                    } else if (entry.targetType === 'collection') {
                        const res = await inmartAPI.getCollectionBySlug(entry.targetId);
                        fetchedProducts = res.data.collection.products;
                    }

                    setProducts(fetchedProducts);
                }
            } catch (err) {
                console.error("Error fetching nav category data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
                    <p className="font-bold text-gray-400 uppercase tracking-widest text-xs animate-pulse">Loading Products...</p>
                </div>
            </div>
        );
    }

    return (
        <AnimatedPage className="min-h-screen bg-[#F8F9FA] dark:bg-[#0a0a0a] pb-24">
            {/* Premium Header */}
            <header
                className="sticky top-0 z-50 w-full px-4 sm:px-6 py-4 flex items-center justify-between backdrop-blur-xl border-b border-gray-100 dark:border-white/5 transition-colors"
                style={{ backgroundColor: `${navEntry?.themeColor}10` }}
            >
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white dark:bg-white/5 rounded-2xl shadow-sm hover:scale-110 active:scale-95 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-white" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{navEntry?.name}</h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{products.length} products found</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-3 bg-white dark:bg-white/5 rounded-2xl shadow-sm">
                        <Search className="w-5 h-5 text-gray-400" />
                    </button>
                    <button className="p-3 bg-white dark:bg-white/5 rounded-2xl shadow-sm">
                        <Filter className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
                {products.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                        {products.map((product) => (
                            <motion.div
                                key={product._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <ProductCard product={product} />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <ShoppingBag className="w-10 h-10 text-gray-300" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">No products found</h2>
                        <p className="text-gray-400 font-medium mt-2">This category doesn't have any products yet.</p>
                        <button
                            onClick={() => navigate('/in-mart')}
                            className="mt-8 px-8 py-3 bg-black text-white rounded-2xl font-bold transition-transform hover:scale-105"
                        >
                            Go back to InMart
                        </button>
                    </div>
                )}
            </main>
        </AnimatedPage>
    );
}
