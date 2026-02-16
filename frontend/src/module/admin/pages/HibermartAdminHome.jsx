import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import inmartAPI from '@/lib/api/inmartAPI';
import {
    ShoppingBag,
    Users,
    CreditCard,
    Package,
    Tag,
    Plus,
    Upload,
    Trash2,
    Edit,
    Layout,
    Image as ImageIcon,
    Star,
    Settings2,
    CheckCircle2,
    X,
    ChevronRight,
    ChevronDown,
    Monitor,
    ArrowLeft,
    Clock3,
    Search,
    MapPin,
    MoreHorizontal,
    Eye,
    Truck,
    Clock,
    Compass,
    Home,
    Gamepad2,
    Apple,
    Headphones,
    Smartphone,
    Shirt,
    Coffee,
    Sparkles
} from "lucide-react"

export default function HibermartAdminHome() {
    const location = useLocation()

    // Derive active section from URL path
    const getActiveTab = () => {
        if (location.pathname.includes("/categories") && !location.pathname.includes("/categories/grocery") && !location.pathname.includes("/categories/beauty") && !location.pathname.includes("/categories/household") && !location.pathname.includes("/categories/snacks")) return "categories";
        if (location.pathname.includes("/categories/grocery")) return "grocery";
        if (location.pathname.includes("/categories/beauty")) return "beauty";
        if (location.pathname.includes("/categories/household")) return "household";
        if (location.pathname.includes("/categories/snacks")) return "snacks";
        if (location.pathname.includes("/newly-launched")) return "newly-launched";
        if (location.pathname.includes("/best-sellers")) return "best-sellers";
        if (location.pathname.includes("/trending")) return "trending";
        if (location.pathname.includes("/banners")) return "banners";
        if (location.pathname.includes("/sale")) return "sale";
        if (location.pathname.includes("/orders")) return "orders";
        if (location.pathname.includes("/navigation")) return "navigation";
        return "overview";
    }
    const activeTab = getActiveTab()

    // --- API DATA STATES ---
    const [stats, setStats] = useState({
        totalProducts: 0,
        monthlyRev: "₹0",
        activePromos: 0,
        storeUsers: 0
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // --- DRILL DOWN STATE ---
    // path: array of { id, name, level }
    const [currentPath, setCurrentPath] = useState([])

    // Mock Data States (Enhanced for nesting)
    const [catalogItems, setCatalogItems] = useState([
        {
            id: "grocery",
            name: "Grocery & Kitchen",
            image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/323b2564-9fa9-43dd-9755-b5df299797d7_a7f60fc5-47fa-429d-9fd1-5f0644c0d4e3",
            level: "main",
            children: [
                {
                    id: "g1",
                    name: "Fresh Vegetables",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/323b2564-9fa9-43dd-9755-b5df299797d7_a7f60fc5-47fa-429d-9fd1-5f0644c0d4e3",
                    level: "sub",
                    children: [
                        {
                            id: "g1_c1",
                            name: "Leafy and Seasonings",
                            image: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_96/NI_CATALOG/IMAGES/CIW/2025/3/19/30b88794-29ec-4c4a-a983-1e9c7b75bde3_0496956a-6096-4027-842b-7505f9bd3196",
                            level: "child",
                            children: [
                                { id: "p1", name: "No Roots, Spinach (Palak Soppu)", weight: "1 Bunch", price: 23, originalPrice: 29, discount: "20% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/7faac0b9ed58f4e7306646613d92a42a.png", type: "product" },
                                { id: "p2", name: "No Roots, Coriander Leaves (Kotthambari Soppu)", weight: "1 Bunch", price: 10, originalPrice: 13, discount: "23% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/CIW/2026/1/21/b6aaa4a1-7478-4d58-90cd-d60827750079_Coriander_1.png", type: "product" },
                                { id: "p3", name: "Fenugreek (Menthya Soppu)", weight: "1 Bunch x 2", price: 45, originalPrice: 60, discount: "25% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/412fa1971a6753dd37051f8cefc7c018", type: "product" },
                                { id: "p4", name: "Lemon (Nimbe Hannu)", weight: "200 g", price: 23, originalPrice: 29, discount: "20% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/19/892f62a9-a9fa-4fde-9f58-992db9e33834_A3W98GOS1G_MN_18122025.png", type: "product" }
                            ]
                        },
                        {
                            id: "g1_c2",
                            name: "Potatoes, Onions & Tomatoes",
                            image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/CIW/2026/1/21/bc000749-2fb2-4181-a1e5-acb465279cb1_1.png",
                            level: "child",
                            children: [
                                { id: "p5", name: "Potato (Aloo Gadde)", weight: "1 kg", price: 33, originalPrice: 41, discount: "19% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/CIW/2026/1/21/bc000749-2fb2-4181-a1e5-acb465279cb1_1.png", type: "product" },
                                { id: "p6", name: "Hybrid Tomato", weight: "500 g", price: 16, originalPrice: 20, discount: "20% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/18/96833bab-c95a-468d-b40a-f6104f516e9b_TOXY8MIG4N_MN_18122025.png", type: "product" },
                                { id: "p7", name: "Indian Tomato", weight: "500 g", price: 15, originalPrice: 19, discount: "21% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/CIW/2026/1/21/44551113-a49d-4583-9fb2-2c87e9cc2cf9_Tomato_1.png", type: "product" },
                                { id: "p8", name: "New Potato (Aloo Gadde)", weight: "1 kg", price: 39, originalPrice: 49, discount: "20% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/18/9a0225b0-a68f-4001-a535-f2fe1f6afa1b_NI3G71DSGI_MN_18122025.png", type: "product" },
                                { id: "p9", name: "Chandramukhi Potato", weight: "500 g", price: 64, originalPrice: 80, discount: "20% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/18/5cc0d74c-34a5-423e-80f7-409887425186_ZKLINGWTT2_MN_18122025.png", type: "product" }
                            ]
                        },
                        {
                            id: "g1_c3",
                            name: "Daily Vegetables",
                            image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/CIW/2025/12/9/035bcbdc-64fa-4a91-a272-2189156c9e10_1036_1.png",
                            level: "child",
                            children: [
                                { id: "p10", name: "Carrot", weight: "500 g", price: 21, originalPrice: 26, discount: "19% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/CIW/2025/12/9/035bcbdc-64fa-4a91-a272-2189156c9e10_1036_1.png", type: "product" },
                                { id: "p11", name: "Cucumber", weight: "2 Pieces x 2", price: 25, originalPrice: 36, discount: "30% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/2024/5/6/2bea05e2-0359-47d7-ae52-999430efb3f3_freshvegetables_MFPXQBV7WU_MN.png", type: "product" },
                                { id: "p12", name: "Kateri Brinjal", weight: "250 g", price: 14, originalPrice: 18, discount: "22% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/11/20/0341cfe7-2f2b-4103-a4ce-310764deb9b3_54NXJ5864D_MN_20112025.jpg", type: "product" },
                                { id: "p13", name: "Bharta Purple Brinjal", weight: "1 Piece", price: 16, originalPrice: 20, discount: "20% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/CIW/2026/1/13/4c3730f5-abc6-40fa-aa99-f07af9b8a2f2_3967.png", type: "product" },
                                { id: "p18", name: "Long Purple Brinjal", weight: "250 g", price: 26, originalPrice: 33, discount: "21% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/11/20/26c7935b-3d3e-4663-8f7e-2df7439d28d8_WS1IB52FZR_MN_20112025.jpg", type: "product" },
                                { id: "p19", name: "Sweet Corn", weight: "2 Pieces", price: 50, originalPrice: 63, discount: "20% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/19/d4d7ac17-6abf-4c4a-ae1e-809c5e13364e_G100GAHFI6_MN_18122025.png", type: "product" },
                                { id: "p20", name: "Green Peas (Matar)", weight: "250 g", price: 20, originalPrice: 25, discount: "20% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/18/b9259871-791d-45e2-a858-69ea89709647_4YVALFTTFJ_MN_18122025.png", type: "product" },
                                { id: "p21", name: "Haricot Beans", weight: "250 g", price: 18, originalPrice: 23, discount: "21% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/18/c19d2290-3dda-4d30-ac10-6f4c148baf0a_NKVUOJROCL_MN_18122025.png", type: "product" },
                                { id: "p24", name: "Broad Beans", weight: "250 g x 2", price: 35, originalPrice: 48, discount: "27% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/CIW/2025/9/22/f7b2f2b4-85c1-4c24-ad1a-14fff45902a6_7478_1.png", type: "product" },
                                { id: "p25", name: "Sweet Potato", weight: "500 g", price: 28, originalPrice: 35, discount: "20% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/CIW/2025/12/29/92ee1893-a0b7-4244-a3b4-2f320f02025a_1128_1.png", type: "product" }
                            ]
                        },
                        {
                            id: "g1_c4",
                            name: "Exotic & Premium",
                            image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/19/02ad4f56-e2eb-46a4-871a-52530edf2413_IWYUR7YS4Q_MN_18122025.png",
                            level: "child",
                            children: [
                                { id: "p14", name: "English Cucumber", weight: "1 Pack", price: 32, originalPrice: 40, discount: "20% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/19/02ad4f56-e2eb-46a4-871a-52530edf2413_IWYUR7YS4Q_MN_18122025.png", type: "product" },
                                { id: "p15", name: "English Cucumber - Protected", weight: "500 g", price: 31, originalPrice: 39, discount: "20% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/19/a38e244f-5e10-40a9-89ef-4755ccff0984_HNJHF8TDNE_MN_18122025.png", type: "product" },
                                { id: "p16", name: "Organic Certified Potato", weight: "1 kg", price: 58, originalPrice: 73, discount: "20% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/CIW/2025/12/23/a2532a2d-3b0b-4af6-8f4a-7b5d291a6517_8288_1.png", type: "product" },
                                { id: "p17", name: "Bhoomi Farms Organic Sweet Potato", weight: "480 g", price: 67, originalPrice: 84, discount: "20% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/19/d2554a7f-1764-46c1-9edf-5a2f190387ba_NANC2ZI3P9_MN_18122025.png", type: "product" },
                                { id: "p22", name: "Ooty Potato", weight: "500 g", price: 51, originalPrice: 64, discount: "20% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/18/67db81ec-4b72-4690-a764-34daccc83d0e_X06C20K2ZS_MN_18122025.png", type: "product" },
                                { id: "p23", name: "Baby Potato", weight: "500 g x 2", price: 65, originalPrice: 86, discount: "24% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/56a0557e3d6af641d997ea5cc0809895", type: "product" },
                                { id: "p26", name: "Potato (Aloo) Value Pack", weight: "3 kg", price: 96, originalPrice: 120, discount: "20% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/gslhg2y6ythtu14d3skh", type: "product" }
                            ]
                        }
                    ]
                },
                {
                    id: "g2",
                    name: "Fresh Fruits",
                    image: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_500/NI_CATALOG/IMAGES/CIW/2025/12/5/c4fddc77-f407-4a03-a598-13df6178c402_050b74b6-7c2d-48dd-ae57-b084748cea25",
                    level: "sub",
                    children: []
                },
                {
                    id: "g3",
                    name: "Dairy, Bread and Eggs",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/12/24/ceb53190-72a3-466b-a892-8989615788c9_fe00456c-3b5a-4e74-80e2-c274a4c9f818.png",
                    level: "sub",
                    children: []
                },
                {
                    id: "g4",
                    name: "Meat and Seafood",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/9c48b537-eef1-4047-becb-ddb7e79c373d_72aac542-4cef-4cf9-a9dd-5f1b862165c1",
                    level: "sub",
                    children: []
                }
            ]
        },
        {
            id: "beauty",
            name: "Beauty & Wellness",
            image: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_500/NI_CATALOG/IMAGES/CIW/2024/11/14/06511b7d-6979-450f-a492-9430fd40e0be_973121d5-bc6b-4e60-8f9f-6828859e3845",
            level: "main",
            children: [
                {
                    id: "bath-body-main",
                    name: "Bath and Body",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/46b1b550-1e5f-423e-967b-e1cf3a608bb8_13bc4f93-eab7-4263-a592-54f144d0eec6",
                    level: "sub",
                    children: [
                        {
                            id: "soaps-wash",
                            name: "Soaps & Body Wash",
                            image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/46b1b550-1e5f-423e-967b-e1cf3a608bb8_13bc4f93-eab7-4263-a592-54f144d0eec6",
                            level: "child",
                            children: [
                                { id: "b1", name: "Dettol Liquid Handwash", weight: "200ml", price: 99, originalPrice: 109, discount: "10% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/CIW/2025/11/25/7f6a8e3d-7d7e-4b7d-8e7d-7f6a8e3d7d7e_1.png", type: "product" }
                            ]
                        }
                    ]
                },
                {
                    id: "skin-care-main",
                    name: "Skincare",
                    image: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_500/NI_CATALOG/IMAGES/CIW/2025/3/19/30b88794-29ec-4c4a-a983-1e9c7b75bde3_0496956a-6096-4027-842b-7505f9bd3196",
                    level: "sub",
                    children: [
                        {
                            id: "face-care",
                            name: "Face Care",
                            image: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_500/NI_CATALOG/IMAGES/CIW/2025/3/19/30b88794-29ec-4c4a-a983-1e9c7b75bde3_0496956a-6096-4027-842b-7505f9bd3196",
                            level: "child",
                            children: [
                                { id: "p20", name: "Hydrating Moisturizer", weight: "50ml", price: 450, originalPrice: 599, discount: "25% OFF", time: "10 MINS", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=400&auto=format&fit=crop", type: "product" },
                                { id: "p21", name: "Gentle Face Wash", weight: "150ml", price: 299, originalPrice: 350, discount: "15% OFF", time: "10 MINS", image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=400&auto=format&fit=crop", type: "product" }
                            ]
                        }
                    ]
                },
                {
                    id: "hair-care-main",
                    name: "Hair Care",
                    image: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=400&auto=format&fit=crop",
                    level: "sub",
                    children: [
                        {
                            id: "shampoo-cond",
                            name: "Shampoo & Conditioner",
                            image: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=400&auto=format&fit=crop",
                            level: "child",
                            children: [
                                { id: "p22", name: "Argan Oil Shampoo", weight: "250ml", price: 399, originalPrice: 499, discount: "20% OFF", time: "10 MINS", image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=400&auto=format&fit=crop", type: "product" },
                                { id: "p23", name: "Conditioner (Deep Repair)", weight: "200ml", price: 350, originalPrice: 450, discount: "22% OFF", time: "10 MINS", image: "https://images.unsplash.com/photo-1598446768994-db0ed227181f?q=80&w=400&auto=format&fit=crop", type: "product" }
                            ]
                        }
                    ]
                },
                {
                    id: "makeup-main",
                    name: "Makeup",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/7c05fd2b-1ea8-4ce4-9b9e-0ba402d3f698_b802ea7a-3d08-44f0-ac8e-4793e4806f67",
                    level: "sub",
                    children: [
                        { id: "makeup-face", name: "Face Makeup", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/7c05fd2b-1ea8-4ce4-9b9e-0ba402d3f698_b802ea7a-3d08-44f0-ac8e-4793e4806f67", level: "child", children: [] }
                    ]
                },
                {
                    id: "oral-care-main",
                    name: "Oral Care",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/12/5/d753ff8d-4cdb-4548-bba2-b10e480cc6b2_28cfcd55-1e7f-4333-a5d5-15c023b8b58d",
                    level: "sub",
                    children: [
                        { id: "toothpaste", name: "Toothpaste", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/12/5/d753ff8d-4cdb-4548-bba2-b10e480cc6b2_28cfcd55-1e7f-4333-a5d5-15c023b8b58d", level: "child", children: [] }
                    ]
                },
                {
                    id: "grooming-main",
                    name: "Grooming",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/6fd76e5f-016b-4810-94fd-252eab4245a6_2edc9535-9e14-49cf-a05e-25fa4ca45cb8",
                    level: "sub",
                    children: [
                        { id: "mens-grooming", name: "Men's Grooming", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/6fd76e5f-016b-4810-94fd-252eab4245a6_2edc9535-9e14-49cf-a05e-25fa4ca45cb8", level: "child", children: [] }
                    ]
                },
                {
                    id: "baby-care-main",
                    name: "Baby Care",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/838ef0d0-8687-447a-8520-95b6700b70f6_a08f1496-3e1f-425f-bdd5-90d1e2bfce5d",
                    level: "sub",
                    children: [
                        { id: "diapers", name: "Diapers & Wipes", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/838ef0d0-8687-447a-8520-95b6700b70f6_a08f1496-3e1f-425f-bdd5-90d1e2bfce5d", level: "child", children: [] }
                    ]
                },
                {
                    id: "fragrances-main",
                    name: "Fragrances",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/d0f1c0f3-5dc4-422e-9120-222c0afc4043_2588dd56-663e-43f0-a14b-1a537b8301a9",
                    level: "sub",
                    children: [
                        { id: "perfumes", name: "Perfumes & Deos", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/d0f1c0f3-5dc4-422e-9120-222c0afc4043_2588dd56-663e-43f0-a14b-1a537b8301a9", level: "child", children: [] }
                    ]
                }
            ]
        },
        {
            id: "household",
            name: "Household & Lifestyle",
            image: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_500/NI_CATALOG/IMAGES/CIW/2025/3/19/03b3be59-51bc-4127-9cea-8179017f68d5_4420c246-b05a-413a-8494-deeb470112c7",
            level: "main",
            children: [
                {
                    id: "home-furnishing-main",
                    name: "Home and Furnishing",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/28f9da5d-40d0-4791-9ad7-824e041320ff_dbef4796-189f-4a9f-86f7-f896aa5fddb2",
                    level: "sub",
                    children: [
                        { id: "living-room", name: "Living Room", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/28f9da5d-40d0-4791-9ad7-824e041320ff_dbef4796-189f-4a9f-86f7-f896aa5fddb2", level: "child", children: [] }
                    ]
                },
                {
                    id: "kitchen-dining-main",
                    name: "Kitchen and Dining",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/66ea9503-f944-4f5f-bb44-8608a0355e3a_ee7d3d13-c857-4e5a-96b1-3c79da306b9e",
                    level: "sub",
                    children: [
                        { id: "cookware", name: "Cookware", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/66ea9503-f944-4f5f-bb44-8608a0355e3a_ee7d3d13-c857-4e5a-96b1-3c79da306b9e", level: "child", children: [] }
                    ]
                },
                {
                    id: "cleaning-main",
                    name: "Cleaning Essentials",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/b332fa4a-4a15-4c32-8bb8-f46b34ef13d5_ff40260d-3a00-40e7-b019-69ecebed8a91",
                    level: "sub",
                    children: [
                        { id: "floor-care", name: "Floor Care", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/b332fa4a-4a15-4c32-8bb8-f46b34ef13d5_ff40260d-3a00-40e7-b019-69ecebed8a91", level: "child", children: [] }
                    ]
                },
                {
                    id: "clothing-main",
                    name: "Clothing",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/93cce7bf-96cc-4ff6-adfc-a248c2a8cb94_783cd072-3e52-4daf-996a-4652d000d943",
                    level: "sub",
                    children: [
                        { id: "mens-wear", name: "Men's Wear", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/93cce7bf-96cc-4ff6-adfc-a248c2a8cb94_783cd072-3e52-4daf-996a-4652d000d943", level: "child", children: [] }
                    ]
                },
                {
                    id: "mobiles-electronics-main",
                    name: "Mobiles and Electronics",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/11/6/7b165e34-9f50-4dc8-ae7d-85f85aadad7a_e6d790c1-88b0-4922-901c-1584d65cf264",
                    level: "sub",
                    children: [
                        { id: "accessories", name: "Accessories", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/11/6/7b165e34-9f50-4dc8-ae7d-85f85aadad7a_e6d790c1-88b0-4922-901c-1584d65cf264", level: "child", children: [] }
                    ]
                },
                {
                    id: "appliances-main",
                    name: "Appliances",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/11/6/78c66d7c-517c-4b60-b879-bca877df5850_68de0373-8d3b-4945-8e81-60b93b732cc8",
                    level: "sub",
                    children: [
                        { id: "kitchen-appliances", name: "Kitchen Appliances", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/11/6/78c66d7c-517c-4b60-b879-bca877df5850_68de0373-8d3b-4945-8e81-60b93b732cc8", level: "child", children: [] }
                    ]
                },
                {
                    id: "books-stationery-main",
                    name: "Books and Stationery",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/e1e37212-1b34-4711-927e-bce563247de7_60934c30-e762-4a81-ba56-8bf6f30b6766",
                    level: "sub",
                    children: [
                        { id: "office-supplies", name: "Office Supplies", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/e1e37212-1b34-4711-927e-bce563247de7_60934c30-e762-4a81-ba56-8bf6f30b6766", level: "child", children: [] }
                    ]
                },
                {
                    id: "jewellery-accessories-main",
                    name: "Jewellery and Accessories",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/8e5a7ca9-0291-4e6a-8691-1c1bddb4e642_da8cf6a8-0e6d-4fb4-8e7d-9e1688b9cd07",
                    level: "sub",
                    children: [
                        { id: "fashion-jewellery", name: "Fashion Jewellery", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/8e5a7ca9-0291-4e6a-8691-1c1bddb4e642_da8cf6a8-0e6d-4fb4-8e7d-9e1688b9cd07", level: "child", children: [] }
                    ]
                },
                {
                    id: "puja-main",
                    name: "Puja",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/965c898a-bc67-4fe8-8fd4-d13e1eb79772_c38285f9-727d-422b-ad77-e1e22d4d251d",
                    level: "sub",
                    children: [
                        { id: "puja-essentials", name: "Puja Essentials", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/965c898a-bc67-4fe8-8fd4-d13e1eb79772_c38285f9-727d-422b-ad77-e1e22d4d251d", level: "child", children: [] }
                    ]
                },
                {
                    id: "toys-games-main",
                    name: "Toys and Games",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/79f943d8-2977-4753-bab0-1a74f582d6b8_7a341dcf-099f-4617-a44f-d28c55de560a",
                    level: "sub",
                    children: [
                        { id: "educational-toys", name: "Educational Toys", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/79f943d8-2977-4753-bab0-1a74f582d6b8_7a341dcf-099f-4617-a44f-d28c55de560a", level: "child", children: [] }
                    ]
                },
                {
                    id: "sports-fitness-main",
                    name: "Sports and Fitness",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/06414bae-6149-4a26-8ca5-a5afffb3f753_171a212b-1edd-4a68-a424-46e240270a3b",
                    level: "sub",
                    children: [
                        { id: "fitness-equipment", name: "Fitness Equipment", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/06414bae-6149-4a26-8ca5-a5afffb3f753_171a212b-1edd-4a68-a424-46e240270a3b", level: "child", children: [] }
                    ]
                },
                {
                    id: "pet-supplies-main",
                    name: "Pet Supplies",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/b936925b-340a-4d1a-a423-0ecbc989d8ee_f70daa6c-8b2f-45d5-86e5-ced16b437ce4",
                    level: "sub",
                    children: [
                        { id: "dog-food", name: "Dog Food", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/b936925b-340a-4d1a-a423-0ecbc989d8ee_f70daa6c-8b2f-45d5-86e5-ced16b437ce4", level: "child", children: [] }
                    ]
                }
            ]
        },
        {
            id: "snacks",
            name: "Snacks & Drinks",
            image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_252/RX_LIFESTYLE_IMAGES/IMAGES/MERCHANDISER/2024/11/4/9769dae1-432d-45db-9c3f-c1f60579e0bf_SnacksDrinks.png",
            level: "main",
            children: [
                {
                    id: "s1",
                    name: "Cold Drinks and Juices",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/5bec1f84-4aa5-49ae-9c3d-9a0dcb9fe2ad_d990b4fc-4629-4cc6-bc7a-ace787fb378a",
                    level: "sub",
                    children: [
                        { id: "p27", name: "Coca-Cola Soft Drink", weight: "750 ml", price: 45, originalPrice: 50, discount: "10% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_540,w_496/NI_CATALOG/IMAGES/CIW/2024/7/11/2bd20a89-2fb0-4545-8167-75916053359c_726d36e7-1473-4043-9828-5c4d3609848f", type: "product" },
                        { id: "p28", name: "Real Fruit Power Mixed Fruit", weight: "1 L", price: 110, originalPrice: 130, discount: "15% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_540,w_496/NI_CATALOG/IMAGES/CIW/2024/4/19/271d9d9b-d7de-4977-96a1-a58eeb01c23a_9446d338-7822-48bd-b657-36e4f35832a8", type: "product" }
                    ]
                },
                {
                    id: "s2",
                    name: "Ice Creams and Frozen Desserts",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/5b0984b8-303b-4a80-81b7-9656f1950b67_63aaae7c-1add-4357-8ae1-5a9662d6b240",
                    level: "sub",
                    children: [
                        { id: "p29", name: "Amul Belgian Chocolate", weight: "500 ml", price: 220, originalPrice: 280, discount: "21% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_540,w_496/NI_CATALOG/IMAGES/CIW/2024/11/8/16a1bde7-3a81-4876-b9a3-5c4d3609848f_1.png", type: "product" },
                        { id: "p30", name: "Kwality Wall's Vanilla", weight: "700 ml", price: 150, originalPrice: 190, discount: "21% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_540,w_496/NI_CATALOG/IMAGES/CIW/2024/12/10/726d36e7-1473-4043-9828-5c4d3609848f_Vanilla.png", type: "product" }
                    ]
                },
                {
                    id: "s3",
                    name: "Chips and Namkeens",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/b654b666-43b5-4599-9919-98f9c7a924e9_cf31e6c0-a70b-4415-b702-3a622d866898",
                    level: "sub",
                    children: [
                        { id: "p31", name: "Lay's India's Magic Masala", weight: "50 g", price: 20, originalPrice: 20, discount: "0% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_540,w_496/NI_CATALOG/IMAGES/CIW/2024/7/22/e1bde73a-8148-476b-9a35-c4d3609848f_Lays.png", type: "product" },
                        { id: "p32", name: "Kurkure Masala Munch", weight: "90 g", price: 30, originalPrice: 35, discount: "14% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_540,w_496/NI_CATALOG/IMAGES/CIW/2024/6/12/16a1bde7-3a81-4876-b9a3-5c4d3609848f_Kurkure.png", type: "product" }
                    ]
                },
                {
                    id: "s4",
                    name: "Chocolates",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/405730cd-115c-4530-8f32-74e50c09f378_1dab5493-a168-4485-a66f-da4bc7510de3",
                    level: "sub",
                    children: [
                        { id: "p33", name: "Cadbury Dairy Milk Silk", weight: "60 g", price: 75, originalPrice: 85, discount: "12% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_540,w_496/NI_CATALOG/IMAGES/CIW/2024/10/20/726d36e7-1473-4043-9828-5c4d3609848f_DairyMilk.png", type: "product" },
                        { id: "p34", name: "Ferrero Rocher", weight: "4 Pieces", price: 160, originalPrice: 180, discount: "11% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_540,w_496/NI_CATALOG/IMAGES/CIW/2024/9/10/16a1bde7-3a81-4876-b9a3-5c4d3609848f_Ferrero.png", type: "product" }
                    ]
                },
                {
                    id: "s5",
                    name: "Noodles, Pasta, Vermicelli",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/6a51d704-b2cc-4787-aced-162fae80a0ce_042fb322-f6db-412d-ba43-f83d090aa463",
                    level: "sub",
                    children: [
                        { id: "p35", name: "Maggi 2-Minute Noodles", weight: "70 g", price: 14, originalPrice: 14, discount: "0% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_540,w_496/NI_CATALOG/IMAGES/CIW/2024/11/14/726d36e7-1473-4043-9828-5c4d3609848f_Maggi.png", type: "product" }
                    ]
                },
                {
                    id: "s6",
                    name: "Frozen Food",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/bf978cbc-ab49-4a43-b23e-41352f4fe33d_dd569df9-8e7b-4e55-bc88-ef692b4d471f",
                    level: "sub",
                    children: [
                        { id: "p36", name: "McCain French Fries", weight: "450 g", price: 125, originalPrice: 145, discount: "14% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_540,w_496/NI_CATALOG/IMAGES/CIW/2024/11/5/16a1bde7-3a81-4876-b9a3-5c4d3609848f_McCain.png", type: "product" }
                    ]
                },
                {
                    id: "s7",
                    name: "Sweet Corner",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/baa03922-9920-4588-b397-a5faad7f4ff5_b2be157f-a054-402a-b5e6-dbb8eff8ae4a",
                    level: "sub",
                    children: [
                        { id: "p37", name: "Haldiram's Gulab Jamun", weight: "1 kg", price: 210, originalPrice: 250, discount: "16% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_540,w_496/NI_CATALOG/IMAGES/CIW/2024/11/4/726d36e7-1473-4043-9828-5c4d3609848f_GulabJamun.png", type: "product" }
                    ]
                },
                {
                    id: "s8",
                    name: "Paan Corner",
                    image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/822a816f-42b1-44ea-a605-98936352f195_2cf4e5c9-61eb-4c20-91d3-5a3b04af44e8",
                    level: "sub",
                    children: [
                        { id: "p38", name: "Meetha Paan", weight: "1 Piece", price: 25, originalPrice: 30, discount: "17% OFF", time: "10 MINS", image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_540,w_496/NI_CATALOG/IMAGES/CIW/2024/11/4/16a1bde7-3a81-4876-b9a3-5c4d3609848f_Paan.png", type: "product" }
                    ]
                }
            ]
        }
    ])

    const [banners, setBanners] = useState([
        { id: 1, title: "Grand Opening Offer", type: "Hero", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop" },
        { id: 2, title: "Winter Sale", type: "Promo", image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=800&auto=format&fit=crop" },
    ])

    const [saleItems, setSaleItems] = useState([
        { id: 1, name: "McCain French Fries", price: 141, discount: "52%", image: "https://images.unsplash.com/photo-1573082801971-5a31908bc09e?q=80&w=300&auto=format&fit=crop" },
    ])

    const [stories, setStories] = useState([
        { id: 1, name: "Healthy Morning", image: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?q=80&w=200&auto=format&fit=crop" },
        { id: 2, name: "Flash Deals", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=200&auto=format&fit=crop" },
    ])

    const [orders, setOrders] = useState([
        {
            id: "#45021",
            customer: "Rahul Sharma",
            items: 4,
            total: 840,
            status: "Pending",
            time: "2 MINS AGO",
            priority: true,
            address: "HSR Layout, Sector 4, Bangalore 560102",
            type: "Home Delivery",
            phone: "+91 98765 43210",
            email: "rahul.s@example.com",
            itemsList: [
                { id: 1, name: "Fresh Spinach (Palak)", qty: 2, price: 58, image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_400/NI_CATALOG/IMAGES/CIW/2024/10/24/491d9c15-47e0-4068-963d-495995bd3647_7e93438a-167d-4a11-a83d-31766a5e11d6" },
                { id: 2, name: "Carrot (Local)", qty: 1, price: 21, image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_400/NI_CATALOG/IMAGES/CIW/2024/11/14/06511b7d-6979-450f-a492-9430fd40e0be_973121d5-bc6b-4e60-8f9f-6828859e3845" },
                { id: 3, name: "McCain French Fries", qty: 1, price: 141, image: "https://images.unsplash.com/photo-1573082801971-5a31908bc09e?q=80&w=300&auto=format&fit=crop" }
            ]
        },
        {
            id: "#45022",
            customer: "Anjali Gupta",
            items: 2,
            total: 320,
            status: "Processing",
            time: "15 MINS AGO",
            priority: false,
            address: "BTM Layout, Stage 2, Bangalore 560076",
            type: "Home Delivery",
            phone: "+91 88822 11100",
            email: "anjali.g@example.com",
            itemsList: [
                { id: 4, name: "Hydrating Moisturizer", qty: 1, price: 250, image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=400&auto=format&fit=crop" },
                { id: 5, name: "Gentle Face Wash", qty: 1, price: 70, image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=400&auto=format&fit=crop" }
            ]
        },
        {
            id: "#45023",
            customer: "Vikram Singh",
            items: 7,
            total: 1450,
            status: "Pending",
            time: "22 MINS AGO",
            priority: true,
            address: "Koramangala, Block 3, Bangalore 560034",
            type: "Home Delivery",
            phone: "+91 70011 00223",
            email: "vikram.v@example.com",
            itemsList: [
                { id: 6, name: "Stainless Steel Knife", qty: 1, price: 1200, image: "https://images.unsplash.com/photo-1593611664164-5d4474759963?q=80&w=400&auto=format&fit=crop" },
                { id: 7, name: "Floor Cleaner (Citrus)", qty: 2, price: 250, image: "https://images.unsplash.com/photo-1563453392212-326f5e854473?q=80&w=400&auto=format&fit=crop" }
            ]
        },
        {
            id: "#45024",
            customer: "Priya Das",
            items: 1,
            total: 125,
            status: "Shipped",
            time: "45 MINS AGO",
            priority: false,
            address: "Indiranagar, 100ft Rd, Bangalore 560038",
            type: "Home Delivery",
            phone: "+91 99900 11122",
            email: "priya.das@example.com",
            itemsList: [
                { id: 8, name: "Argan Oil Shampoo", qty: 1, price: 125, image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=400&auto=format&fit=crop" }
            ]
        },
    ])

    const [trendingItems, setTrendingItems] = useState([])
    const [newlyLaunchedItems, setNewlyLaunchedItems] = useState([])
    const [bestSellersItems, setBestSellersItems] = useState([])

    const [navCategories, setNavCategories] = useState([
        { id: "all", name: "All", icon: "ShoppingBag", themeColor: "#D3AEFE" },
        { id: "home", name: "Home", icon: "Home", themeColor: "#BFF7D4" },
        { id: "toys", name: "Toys", icon: "Gamepad2", themeColor: "#FBE04C" },
        { id: "fresh", name: "Fresh", icon: "Apple", themeColor: "#21C063" },
        { id: "electronics", name: "Electronics", icon: "Headphones", themeColor: "#FDE256" },
        { id: "mobiles", name: "Mobiles", icon: "Smartphone", themeColor: "#FD8930" },
    ])

    // File upload ref and state
    const fileInputRef = useRef(null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    // Handle file upload
    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await inmartAPI.uploadImage(formData);

            if (response.success) {
                const fullUrl = `http://localhost:5000${response.data.url}`;
                setUploadedImageUrl(fullUrl);

                // Update the image input field
                const imageInput = document.querySelector('input[name="image"]');
                if (imageInput) {
                    imageInput.value = fullUrl;
                }

                console.log('✅ Image upload successful:', fullUrl);
            } else {
                alert('Failed to upload image: ' + response.message);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    // UI States
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [modalType, setModalType] = useState("") // category, banner, product, story, item
    const [editingItem, setEditingItem] = useState(null)
    const [selectedOrder, setSelectedOrder] = useState(null)
    // The fileInputRef is already declared above, so we remove the duplicate here.

    // Reset path when tab changes to avoid mismatched data drill-down and "nothing showing" errors
    useEffect(() => {
        setCurrentPath([])
    }, [activeTab])

    // Fetch initial data
    const fetchAllData = useCallback(async () => {
        setLoading(true)
        try {
            const [
                statsRes,
                categoriesRes,
                bannersRes,
                collectionsRes,
                productsRes
            ] = await Promise.all([
                inmartAPI.getDashboardStats(),
                inmartAPI.adminGetAllCategories(),
                inmartAPI.getBanners(),
                inmartAPI.adminGetAllCollections(),
                inmartAPI.adminGetAllProducts()
            ]);

            if (statsRes.success) {
                setStats({
                    totalProducts: statsRes.data.stats.totalProducts,
                    monthlyRev: "₹45.2L", // Still mock for now as backend doesn't have orders/rev yet
                    activePromos: statsRes.data.stats.saleProducts,
                    storeUsers: statsRes.data.stats.totalStores
                });
            }

            if (categoriesRes.success && productsRes.success) {
                const categories = categoriesRes.data.categories;
                const products = productsRes.data.products;

                // Transform backend categories to UI nested structure
                const transformedCatalog = categories.map(cat => ({
                    ...cat,
                    id: cat.slug || cat._id,
                    type: 'category',
                    children: (cat.subCategories || []).map(sub => ({
                        ...sub,
                        id: sub.id || sub.slug || sub._id,
                        type: 'category',
                        children: (sub.children || []).map(child => {
                            // Find products belonging to this child category
                            const childProducts = products.filter(p =>
                                p.category === cat.name &&
                                p.subCategory === sub.name &&
                                p.childCategory === child.name
                            ).map(p => ({
                                ...p,
                                id: p._id || p.productId,
                                type: 'product'
                            }));

                            return {
                                ...child,
                                id: child.id || child.slug || child._id,
                                type: 'category',
                                children: childProducts
                            };
                        })
                    }))
                }));

                setCatalogItems(transformedCatalog);
                setTrendingItems(products.filter(p => p.isTrending));
            }

            if (bannersRes.success) {
                setBanners(bannersRes.data.banners);
            }

            if (collectionsRes.success) {
                const collections = collectionsRes.data.collections;
                console.log('📦 Collections fetched:', collections);

                const sale = collections.find(c => c.slug === 'sale');
                if (sale) setSaleItems(sale.products || []);

                const newlyLaunched = collections.find(c => c.slug === 'newly-launched');
                if (newlyLaunched) setNewlyLaunchedItems(newlyLaunched.products || []);

                const bestSellers = collections.find(c => c.slug === 'best-sellers');
                if (bestSellers) setBestSellersItems(bestSellers.products || []);

                const trending = collections.find(c => c.slug === 'trending');
                if (trending) setTrendingItems(trending.products || []);
            }

        } catch (err) {
            console.error("Error fetching admin data:", err);
            setError("Failed to load management data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleOpenModal = (type, item = null) => {
        setModalType(type)
        setEditingItem(item)
        setShowUploadModal(true)
    }

    const handleDeleteItem = async (item) => {
        try {
            if (activeTab === "banners") {
                // Implement banner delete API if exists, or just filter for now
                setBanners(prev => prev.filter(b => b.id !== item.id))
            } else if (activeTab === "sale") {
                // Handle sale item removal from collection
            } else if (["grocery", "beauty", "household", "snacks", "overview"].includes(activeTab)) {
                if (item.type === "product") {
                    await inmartAPI.adminDeleteProduct(item._id || item.id);
                } else {
                    await inmartAPI.adminDeleteCategory(item._id || item.id);
                }
                fetchAllData(); // Refresh to get updated tree
            }
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Failed to delete item.");
        }
    }

    const handleDeleteCollectionItem = async (collectionSlug, item) => {
        try {
            console.log(`🗑️ Deleting product from collection: ${collectionSlug}`, item);

            // Delete the product itself
            await inmartAPI.adminDeleteProduct(item._id || item.id);

            // Refresh data to update UI
            await fetchAllData();

            console.log('✅ Product deleted successfully');
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Failed to delete item.");
        }
    }

    const handleSaveItem = async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const name = formData.get("name")
        const image = formData.get("image")
        const price = formData.get("price")
        const weight = formData.get("weight")
        const discount = formData.get("discount")
        const time = formData.get("time")

        try {
            if (modalType === "banner") {
                // Banner save logic
            } else if (modalType === "product") {
                // Determine which collection this product belongs to based on active tab
                let collectionSlug = null;
                if (activeTab === "sale") collectionSlug = "sale";
                else if (activeTab === "newly-launched") collectionSlug = "newly-launched";
                else if (activeTab === "best-sellers") collectionSlug = "best-sellers";
                else if (activeTab === "trending") collectionSlug = "trending";

                const productData = {
                    name,
                    image,
                    price: Number(price),
                    originalPrice: Number(formData.get("originalPrice")) || Number(price),
                    weight,
                    discount,
                    deliveryTime: time,
                    category: currentPath[0]?.name || activeTab,
                    subCategory: currentPath[1]?.name || "",
                    childCategory: currentPath[2]?.name || "",
                    store: "65c0f1234567890abcdef123", // Default Store ID for Hibermart
                    collectionSlug, // Add product to specific collection
                    isNew: activeTab === "newly-launched",
                    isBestSeller: activeTab === "best-sellers",
                    isTrending: activeTab === "trending",
                    isOnSale: activeTab === "sale"
                };

                console.log('💾 Saving product:', productData);

                if (editingItem) {
                    await inmartAPI.adminUpdateProduct(editingItem._id || editingItem.id, productData);
                } else {
                    await inmartAPI.adminCreateProduct(productData);
                }
            } else if (modalType === "category") {
                const categoryData = {
                    name,
                    image,
                    level: currentPath.length === 0 ? "main" : (currentPath.length === 1 ? "sub" : "child")
                };

                if (editingItem) {
                    await inmartAPI.adminUpdateCategory(editingItem._id || editingItem.id, categoryData);
                } else {
                    // Logic for sub/child categories would need nested updates in the backend
                    await inmartAPI.adminCreateCategory(categoryData);
                }
            }

            fetchAllData();
            setShowUploadModal(false)
            setEditingItem(null)
        } catch (err) {
            console.error("Save failed:", err);
            alert("Failed to save changes.");
        }
    }

    return (
        <div className="p-4 lg:p-8 bg-[#F8F9FB] min-h-screen font-sans selection:bg-black selection:text-white">
            <div className="max-w-7xl mx-auto">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded">Admin</span>
                            <ChevronRight className="w-3 h-3 text-neutral-300" />
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{activeTab === "overview" ? "Dashboard" : activeTab}</span>
                        </div>
                        <h1 className="text-4xl font-black text-neutral-900 tracking-tighter">
                            {activeTab === "overview" && "Hibermart Control"}
                            {activeTab === "grocery" && "Grocery & Kitchen"}
                            {activeTab === "beauty" && "Beauty & Wellness"}
                            {activeTab === "household" && "Household & Lifestyle"}
                            {activeTab === "snacks" && "Snacks & Drinks"}
                            {activeTab === "newly-launched" && "New Launches"}
                            {activeTab === "best-sellers" && "Bestselling Row"}
                            {activeTab === "trending" && "Trending Near You"}
                            {activeTab === "banners" && "Campaign Manager"}
                            {activeTab === "sale" && "Mega Sale Op"}
                            {activeTab === "stories" && "Story Studio"}
                            {activeTab === "inventory" && "Stock Control"}
                            {activeTab === "orders" && "Order Hub"}
                            {activeTab === "settings" && "Store Settings"}
                            {activeTab === "navigation" && "Navigation Manager"}
                        </h1>
                        <p className="text-neutral-500 font-medium mt-1">
                            {activeTab === "overview" && "Manage your storefront assets and campaigns here."}
                            {activeTab !== "overview" && `Configure and optimize the ${activeTab.replace("-", " ")} section items.`}
                        </p>
                    </div>
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === "overview" && <DashboardOverview stats={stats} />}

                        {/* Catalog Sections */}
                        {["grocery", "beauty", "household", "snacks", "overview"].includes(activeTab) && (
                            <NestedManagement
                                rootName="Main Catalog"
                                items={catalogItems}
                                path={currentPath}
                                setPath={setCurrentPath}
                                activeRootId={activeTab === "overview" ? null : activeTab}
                                onAdd={(type = "category") => handleOpenModal(type)}
                                onEdit={(item) => handleOpenModal(item.type === "product" ? "product" : "category", item)}
                                onDelete={(item) => handleDeleteItem(item)}
                            />
                        )}

                        {/* All Categories Management */}
                        {activeTab === "categories" && (
                            <div className="space-y-6">
                                <div className="flex items-end justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-neutral-900 tracking-tight">All Categories</h2>
                                        <p className="text-sm text-neutral-500 font-medium mt-1">Manage all main categories and their subcategories</p>
                                    </div>
                                    <button
                                        onClick={() => handleOpenModal("category")}
                                        className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-neutral-800 transition-all shadow-sm"
                                    >
                                        <Plus size={18} strokeWidth={3} />
                                        Add Main Category
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {catalogItems.map((category) => (
                                        <div
                                            key={category._id || category.id}
                                            className="bg-white rounded-2xl border border-neutral-100 shadow-md overflow-hidden group hover:shadow-xl transition-all"
                                        >
                                            <div className="relative aspect-square bg-neutral-50 overflow-hidden">
                                                <img
                                                    src={category.image || "https://via.placeholder.com/300"}
                                                    alt={category.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                                />
                                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleOpenModal("category", category)}
                                                        className="p-2 bg-white rounded-full shadow-lg hover:bg-neutral-50"
                                                    >
                                                        <Edit className="w-4 h-4 text-black" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteItem(category)}
                                                        className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-4 space-y-2">
                                                <h3 className="font-black text-neutral-900 text-base">{category.name}</h3>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-neutral-500 font-semibold">
                                                        {category.subCategories?.length || 0} subcategories
                                                    </span>
                                                    {category.themeColor && (
                                                        <div
                                                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                                            style={{ backgroundColor: category.themeColor }}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {catalogItems.length === 0 && !loading && (
                                    <div className="text-center py-12">
                                        <p className="text-neutral-400 font-medium">No categories found. Add your first category!</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Collection Sections */}
                        {activeTab === "newly-launched" && (
                            <ManagementGrid
                                title="New Launches"
                                subtitle="Recently added products shown in the 'New' section."
                                items={newlyLaunchedItems}
                                onAdd={() => handleOpenModal("product")}
                                onEdit={(item) => handleOpenModal("product", item)}
                                onDelete={(item) => handleDeleteCollectionItem('newly-launched', item)}
                                type="product"
                            />
                        )}
                        {activeTab === "best-sellers" && (
                            <ManagementGrid
                                title="Best Sellers"
                                subtitle="Top performing products row management."
                                items={bestSellersItems}
                                onAdd={() => handleOpenModal("product")}
                                onEdit={(item) => handleOpenModal("product", item)}
                                onDelete={(item) => handleDeleteCollectionItem('best-sellers', item)}
                                type="product"
                            />
                        )}
                        {activeTab === "trending" && (
                            <ManagementGrid
                                title="Trending Near You"
                                subtitle="Popular items chosen by users in their vicinity."
                                items={trendingItems}
                                onAdd={() => handleOpenModal("product")}
                                onEdit={(item) => handleOpenModal("product", item)}
                                onDelete={(item) => handleDeleteCollectionItem('trending', item)}
                                type="product"
                            />
                        )}


                        {/* Campaign Sections */}
                        {activeTab === "banners" && (
                            <ManagementGrid
                                title="Banner Campaigns"
                                subtitle="Hero, promo, and special price banners for your storefront."
                                items={banners}
                                onAdd={() => handleOpenModal("banner")}
                                onEdit={(item) => handleOpenModal("banner", item)}
                                onDelete={(item) => handleDeleteItem(item)}
                                type="banner"
                            />
                        )}
                        {activeTab === "sale" && (
                            <ManagementGrid
                                title="Big Sale Operations"
                                subtitle="Control products appearing in the mega sale sunburst section."
                                items={saleItems}
                                onAdd={() => handleOpenModal("product")}
                                onEdit={(item) => handleOpenModal("product", item)}
                                onDelete={(item) => handleDeleteCollectionItem('sale', item)}
                                type="sale"
                            />
                        )}

                        {/* Ops & Settings */}
                        {activeTab === "orders" && (
                            <OrderProcessingHub orders={orders} />
                        )}
                        {activeTab === "navigation" && (
                            <div className="space-y-6">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-xl font-black text-neutral-900">Module Categories</h3>
                                            <p className="text-sm font-bold text-neutral-400">Manage the horizontal navigation icons and themes.</p>
                                        </div>
                                        <button
                                            onClick={() => handleOpenModal("nav")}
                                            className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-lg shadow-black/10"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Entry
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {navCategories.map((cat) => (
                                            <div key={cat.id} className="group relative bg-neutral-50 p-6 rounded-3xl border border-neutral-100 hover:border-black/10 hover:bg-white hover:shadow-xl hover:shadow-black/5 transition-all duration-300">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner"
                                                        style={{ backgroundColor: `${cat.themeColor}20` }}
                                                    >
                                                        <div
                                                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                                                            style={{ backgroundColor: cat.themeColor }}
                                                        >
                                                            {(() => {
                                                                const iconMap = { ShoppingBag, Home, Gamepad2, Apple, Headphones, Smartphone, Sparkles, Shirt, Coffee, Compass };
                                                                const IconComponent = iconMap[cat.icon] || ShoppingBag;
                                                                return <IconComponent className="w-5 h-5 text-white" />;
                                                            })()}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-neutral-900 uppercase tracking-tight">{cat.name}</h4>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.themeColor }}></div>
                                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{cat.themeColor}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenModal("nav", cat)} className="p-2 bg-white rounded-xl shadow-sm hover:bg-neutral-50 transition-colors">
                                                        <Edit className="w-3.5 h-3.5 text-neutral-400" />
                                                    </button>
                                                    <button onClick={() => setNavCategories(prev => prev.filter(c => c.id !== cat.id))} className="p-2 bg-white rounded-xl shadow-sm hover:bg-red-50 transition-colors border-red-100">
                                                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100 flex items-center gap-6">
                                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm shrink-0">
                                        <Monitor className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-emerald-900 tracking-tight">Live Preview Sync</h4>
                                        <p className="text-sm font-bold text-emerald-700/70">Changes made here will reflect instantly on the InMart homepage for all users.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Management Modal */}
                {showUploadModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
                            onClick={() => setShowUploadModal(false)}
                        />
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="relative bg-white w-full sm:max-w-2xl sm:rounded-[3rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden max-h-[95vh] flex flex-col mt-auto sm:mt-0"
                        >
                            <div className="p-6 sm:p-10 overflow-y-auto">
                                <div className="flex justify-between items-center mb-6 sm:mb-8">
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-black text-neutral-900">
                                            {editingItem ? "Edit Existing" : "Create New"} {modalType}
                                        </h3>
                                        <p className="text-[10px] sm:text-sm font-bold text-neutral-400">Configure visual and operational aspects.</p>
                                    </div>
                                    <button onClick={() => setShowUploadModal(false)} className="p-2 sm:p-3 bg-neutral-50 hover:bg-neutral-100 rounded-xl sm:rounded-2xl transition-all">
                                        <X className="w-5 h-5 text-neutral-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleSaveItem} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="sm:col-span-2">
                                        <label className="text-[9px] font-black uppercase text-neutral-400 tracking-widest block mb-2">{modalType === "product" ? "Product Name" : "Category / Display Name"}</label>
                                        <input name="name" type="text" defaultValue={editingItem?.name || editingItem?.title} placeholder="e.g. Fresh Spinach..." className="w-full bg-white border border-neutral-200 rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all" required />
                                    </div>

                                    {modalType === "product" && (
                                        <>

                                            <div>
                                                <label className="text-[9px] font-black uppercase text-neutral-400 tracking-widest block mb-1.5 sm:mb-2">Weight / Qty</label>
                                                <input name="weight" type="text" defaultValue={editingItem?.weight} placeholder="e.g. 1 Bunch / 500g..." className="w-full bg-neutral-50 border border-neutral-200 rounded-xl sm:rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all" />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-neutral-400 tracking-widest block mb-1.5 sm:mb-2">Delivery Time</label>
                                                <input name="time" type="text" defaultValue={editingItem?.time} placeholder="e.g. 10 MINS..." className="w-full bg-neutral-50 border border-neutral-200 rounded-xl sm:rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all" />
                                            </div>

                                            <div>
                                                <label className="text-[9px] font-black uppercase text-neutral-400 tracking-widest block mb-1.5 sm:mb-2">Selling Price (₹)</label>
                                                <input name="price" type="number" defaultValue={editingItem?.price} placeholder="0.00" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl sm:rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all" />
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                <div>
                                                    <label className="text-[9px] font-black uppercase text-neutral-400 tracking-widest block mb-1.5">Original Price (₹)</label>
                                                    <input name="originalPrice" type="number" defaultValue={editingItem?.originalPrice} placeholder="0.00" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl sm:rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all" />
                                                </div>
                                            </div>

                                            <div className="sm:col-span-2">
                                                <label className="text-[9px] font-black uppercase text-neutral-400 tracking-widest block mb-1.5 sm:mb-2">Offer / Discount (e.g. 20% OFF)</label>
                                                <input name="discount" type="text" defaultValue={editingItem?.discount} placeholder="e.g. 20% OFF..." className="w-full bg-neutral-50 border border-neutral-200 rounded-xl sm:rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all" />
                                            </div>
                                        </>
                                    )}

                                    {modalType === "nav" && (
                                        <>
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-neutral-400 tracking-widest block mb-1.5 sm:mb-2 text-left">Theme Color</label>
                                                <div className="flex gap-3">
                                                    <input name="themeColor" type="color" defaultValue={editingItem?.themeColor || "#000000"} className="w-12 h-12 rounded-xl border-0 p-0 cursor-pointer overflow-hidden shadow-sm" />
                                                    <input type="text" value={editingItem?.themeColor || "#000000"} className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-bold font-mono uppercase tracking-widest" readOnly />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-neutral-400 tracking-widest block mb-1.5 sm:mb-2 text-left">Lucide Icon</label>
                                                <select name="icon" defaultValue={editingItem?.icon || "ShoppingBag"} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl sm:rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all">
                                                    <option value="ShoppingBag">Shopping Bag</option>
                                                    <option value="Home">Home</option>
                                                    <option value="Gamepad2">Toys</option>
                                                    <option value="Apple">Fresh</option>
                                                    <option value="Headphones">Electronics</option>
                                                    <option value="Smartphone">Mobiles</option>
                                                    <option value="Sparkles">Beauty</option>
                                                    <option value="Shirt">Fashion</option>
                                                    <option value="Coffee">Snacks</option>
                                                </select>
                                            </div>
                                        </>
                                    )}


                                    <div className="sm:col-span-2">
                                        <label className="text-[9px] font-black uppercase text-neutral-400 tracking-widest block mb-2">{modalType === "product" ? "Product Image URL" : "Visual Media (Cloud URL)"}</label>
                                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                            <div className="flex-1">
                                                <input name="image" type="text" defaultValue={editingItem?.image} placeholder="Paste image URL or upload below..." className="w-full bg-white border border-neutral-200 rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all" required />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="px-6 py-3 sm:py-0 bg-neutral-900 text-white rounded-xl sm:rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:bg-neutral-400 disabled:cursor-not-allowed"
                                            >
                                                {isUploading ? 'Uploading...' : 'Upload'}
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileUpload}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                        </div>
                                        {isUploading && (
                                            <p className="text-xs text-neutral-500 mt-2 font-semibold">Uploading image, please wait...</p>
                                        )}
                                    </div>

                                    <button type="submit" className="sm:col-span-2 bg-black text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-neutral-800 hover:-translate-y-1 active:translate-y-0 transition-all mt-4 sm:mt-6">
                                        {editingItem ? "Update Changes" : editingItem === null && modalType === "product" ? "Create Product" : `Create ${modalType}`}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    )
}

function DashboardOverview({ stats }) {
    return (
        <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Active Products", value: stats.totalProducts.toLocaleString(), icon: Package, color: "bg-blue-50 text-blue-600" },
                    { label: "Monthly Rev", value: stats.monthlyRev, icon: CreditCard, color: "bg-emerald-50 text-emerald-600" },
                    { label: "Active Promos", value: stats.activePromos, icon: Tag, color: "bg-amber-50 text-amber-600" },
                    { label: "Store Users", value: stats.storeUsers, icon: Users, color: "bg-purple-50 text-purple-600" },
                ].map((item, idx) => (
                    <div key={idx} className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2.5 rounded-xl ${item.color}`}>
                                <item.icon className="w-4 h-4" />
                            </div>
                            <button className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus className="w-3.5 h-3.5 text-neutral-300" />
                            </button>
                        </div>
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{item.label}</p>
                        <h4 className="text-xl font-black text-neutral-900 mt-0.5">{item.value}</h4>
                    </div>
                ))}
            </div>

        </div>
    )
}

function NestedManagement({ rootName, items, path, setPath, activeRootId, onAdd, onEdit, onDelete }) {
    // Current level data finder
    const getCurrentLevelItems = () => {
        const root = items.find(i => i.id === activeRootId);
        let current = activeRootId ? (root ? root.children : []) : items;

        for (const segment of path) {
            if (!current || !Array.isArray(current)) return [];
            const found = current.find(i => i.id === segment.id)
            if (found && found.children) {
                current = found.children
            } else {
                return []
            }
        }
        return current || []
    }

    const rootCategory = items.find(i => i.id === activeRootId)
    const departmentCategories = rootCategory ? rootCategory.children : []

    const activeCategory = (() => {
        if (!activeRootId) return null;
        if (path.length === 0) return rootCategory;
        let current = rootCategory;
        for (const segment of path) {
            current = current?.children?.find(c => c.id === segment.id);
        }
        return current;
    })();

    const currentItems = getCurrentLevelItems()
    const isProductView = (currentItems.length > 0 && currentItems[0].type === "product") || (activeCategory?.level === "child")
    const canBackOut = path.length > 0 || (activeRootId && path.length === 0)

    // Sidebar should show siblings of the current active level
    const getSidebarItems = () => {
        if (!activeRootId || !rootCategory) return []
        if (path.length <= 1) return rootCategory.children || []

        // Find parent of the current level to show its children (siblings)
        let parent = rootCategory
        for (let i = 0; i < path.length - 1; i++) {
            const found = parent.children?.find(c => c.id === path[i].id)
            if (found && found.children) parent = found
        }

        // Filter out products from sidebar to keep it a category browser
        return (parent.children || []).filter(item => item.type !== "product")
    }

    const sidebarItems = getSidebarItems()
    const showSidebar = !!activeRootId && sidebarItems.length > 0 && path.length > 0

    return (
        <div className="space-y-6">
            {/* Navigation & Dropdown Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                        <h2 className="text-2xl font-black text-neutral-900">
                            {path.length === 0 ? (activeRootId ? rootCategory?.name : rootName) : path[path.length - 1].name}
                        </h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">
                                {isProductView ? "Product Inventory" : "Category Management"}
                            </p>
                            {isProductView && (
                                <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase border border-emerald-100">
                                    {currentItems.length} SKUs Total
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Category Quick-Switch Dropdown (Only show when drilled down) */}
                    {activeRootId && departmentCategories.length > 0 && path.length > 0 && (
                        <div className="relative group">
                            <button className="flex items-center gap-2 bg-neutral-50 px-4 py-2 rounded-xl border border-neutral-200 hover:border-black transition-all">
                                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Switch {path.length === 0 ? "Category" : "Sub-Category"}</span>
                                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black transition-colors" />
                            </button>

                            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-neutral-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] p-2">
                                {(() => {
                                    const activeDept = path.length > 0 ? departmentCategories.find(c => c.id === path[0].id) : null;
                                    const itemsToShow = activeDept ? (activeDept.children || []) : departmentCategories;

                                    return itemsToShow.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                if (path.length === 0) {
                                                    // Root level: Clicking a department should drill down to first sub if exists
                                                    if (cat.children && cat.children.length > 0) {
                                                        setPath([{ id: cat.id, name: cat.name }, { id: cat.children[0].id, name: cat.children[0].name }])
                                                    } else {
                                                        setPath([{ id: cat.id, name: cat.name }])
                                                    }
                                                } else {
                                                    // Inside a department: Clicking a sub-category should jump to it
                                                    setPath([{ id: activeDept.id, name: activeDept.name }, { id: cat.id, name: cat.name }])
                                                }
                                            }}
                                            className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-50 transition-all text-left ${path[path.length - 1]?.id === cat.id ? "bg-neutral-50" : ""}`}
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0">
                                                <img src={cat.image} className="w-full h-full object-contain" alt="" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-neutral-900 leading-tight">{cat.name}</p>
                                                <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-tighter">
                                                    {cat.type === "product" ? "Product" : `${cat.children?.length || 0} Items`}
                                                </p>
                                            </div>
                                            {path[path.length - 1]?.id === cat.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                        </button>
                                    ));
                                })()}
                            </div>
                        </div>
                    )}

                </div>

                <div className="flex items-center gap-1.5">
                    {isProductView && (
                        <div className="hidden md:flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-xl border border-neutral-200">
                            <Search className="w-3 h-3 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search inventory..."
                                className="bg-transparent border-none outline-none text-[9px] font-black uppercase tracking-widest w-32 placeholder:text-neutral-400"
                            />
                        </div>
                    )}
                    <button onClick={() => onAdd("category")} className="flex items-center gap-1.5 bg-neutral-50 text-neutral-600 px-4 py-2 rounded-xl font-black text-[8px] uppercase tracking-widest hover:bg-neutral-100 transition-all border border-neutral-200">
                        <Plus className="w-3 h-3" />
                        {path.length === 0 ? "Category" : "Sub Category"}
                    </button>
                    {isProductView && (
                        <button onClick={() => onAdd("product")} className="flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-xl font-black text-[8px] uppercase tracking-widest shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 transition-all">
                            <Plus className="w-3 h-3" />
                            Product
                        </button>
                    )}
                </div>
            </div>

            {/* Breadcrumb Tray - Only show when drilled down */}
            {path.length > 0 && (
                <div className="flex items-center gap-1 bg-white shadow-sm px-2 py-1.5 rounded-xl w-fit border border-neutral-100">
                    <button
                        onClick={() => setPath([])}
                        className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg transition-all text-neutral-400 hover:text-black hover:bg-neutral-50"
                    >
                        {activeRootId ? rootCategory?.name || rootName : rootName}
                    </button>
                    {path.map((segment, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                            <ChevronRight className="w-2.5 h-2.5 text-neutral-300" />
                            <button
                                onClick={() => setPath(path.slice(0, idx + 1))}
                                className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg transition-all ${idx === path.length - 1 ? "bg-black text-white shadow-md" : "text-neutral-400 hover:text-black hover:bg-neutral-50"}`}
                            >
                                {segment.name}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8 min-h-[500px]">
                {/* Vertical Category Selector Sidebar (Screenshot 2 Style) */}
                {showSidebar && (
                    <div className="lg:w-32 flex-shrink-0 space-y-0.5 border-r border-neutral-100 pr-4 hidden lg:block overflow-y-auto max-h-[80vh] scrollbar-hide">
                        <p className="text-[10px] font-black uppercase text-neutral-900 tracking-wider mb-4 border-b border-neutral-100 pb-2">All Sub Categories</p>
                        <p className="text-[8px] font-black uppercase text-neutral-300 tracking-[0.2em] mb-3">Browse</p>
                        {sidebarItems.map((cat) => (
                            <div key={cat.id} className="group relative">
                                <button
                                    onClick={() => {
                                        if (path.length === 0) {
                                            if (cat.children && cat.children.length > 0) {
                                                setPath([{ id: cat.id, name: cat.name }, { id: cat.children[0].id, name: cat.children[0].name }])
                                            } else {
                                                setPath([{ id: cat.id, name: cat.name }])
                                            }
                                        } else {
                                            const newPath = [...path.slice(0, -1), { id: cat.id, name: cat.name }]
                                            setPath(newPath)
                                        }
                                    }}
                                    className={`w-full flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all hover:bg-neutral-50 ${path[path.length - 1]?.id === cat.id ? "bg-white shadow-lg shadow-neutral-100/50 ring-1 ring-neutral-100" : ""}`}
                                >
                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center p-2 transition-all duration-500 overflow-hidden ${path[path.length - 1]?.id === cat.id ? "bg-white ring-2 ring-black scale-105" : "bg-neutral-50"}`}>
                                        <img src={cat.image} className="w-full h-full object-contain" alt="" />
                                    </div>
                                    <span className={`text-[7px] font-black text-center leading-tight transition-colors uppercase tracking-tighter ${path[path.length - 1]?.id === cat.id ? "text-black" : "text-neutral-400"}`}>
                                        {cat.name}
                                    </span>
                                </button>

                                <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all z-10 scale-75 group-hover:scale-100">
                                    <button onClick={(e) => { e.stopPropagation(); onEdit(cat); }} className="bg-black text-white p-2 rounded-full shadow-lg hover:rotate-12 transition-transform">
                                        <Edit className="w-2.5 h-2.5" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); onDelete(cat); }} className="bg-white text-red-500 p-2 rounded-full shadow-lg border border-neutral-100 hover:scale-110 transition-transform">
                                        <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                </div>

                                {path[path.length - 1]?.id === cat.id && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 w-1 h-8 bg-black rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]" />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Main Content Pane */}
                <div className="flex-1">
                    <h3 className="text-sm font-black text-neutral-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                        {path.length > 0 ? path[path.length - 1].name : (activeRootId ? rootCategory?.name : "All Categories")}
                        <span className="text-neutral-300 font-bold ml-1">{isProductView ? "Products" : "Sub Categories"}</span>
                    </h3>
                    <div className={`grid gap-2 sm:gap-3 ${isProductView ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8" : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8"}`}>
                        {currentItems.map((item) => (
                            item.type === "product" ? (
                                <HibermartProductCard
                                    key={item.id}
                                    product={item}
                                    onEdit={() => onEdit(item)}
                                    onDelete={() => onDelete(item)}
                                />
                            ) : (
                                <CategoryManagementCard
                                    key={item.id}
                                    item={item}
                                    onClick={() => setPath([...path, { id: item.id, name: item.name }])}
                                    onEdit={() => onEdit(item)}
                                    onDelete={() => onDelete(item)}
                                />
                            )
                        ))}

                        <button
                            onClick={() => onAdd(isProductView ? "product" : "category")}
                            className={`flex flex-col items-center justify-center bg-white border-2 border-dashed border-neutral-200 rounded-xl hover:bg-white hover:border-black transition-all group relative overflow-hidden ${isProductView ? "min-h-[160px]" : "min-h-[100px]"}`}
                        >
                            <div className="absolute inset-0 bg-neutral-50/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="p-1.5 bg-neutral-50 rounded-lg shadow-sm group-hover:scale-110 transition-transform text-neutral-400 relative z-10 border border-neutral-100">
                                <Plus className="w-3.5 h-3.5 mx-auto" strokeWidth={3} />
                            </div>
                            <p className="text-[6px] font-black uppercase tracking-widest text-neutral-300 mt-1.5 relative z-10 group-hover:text-black transition-colors text-center px-1">
                                Add {isProductView ? "Product" : "New"}
                            </p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function CategoryManagementCard({ item, onClick, onEdit, onDelete }) {
    return (
        <div className="group relative">
            {/* Circular Category Card matching Screenshot 1 */}
            <div
                onClick={onClick}
                className="cursor-pointer bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden p-2 hover:shadow-lg hover:shadow-neutral-200/50 transition-all text-center flex flex-col items-center justify-center min-h-[100px]"
            >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-black flex items-center justify-center p-1 mb-1 bg-white relative">
                    <img src={item.image} alt="" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h4 className="font-black text-neutral-900 text-[7px] sm:text-[8px] leading-tight uppercase tracking-widest px-0.5">{item.name}</h4>
                <div className="mt-1 text-[5px] font-black text-emerald-500 bg-emerald-50 px-1 py-0.5 rounded-full uppercase tracking-widest">Active</div>
            </div>

            {/* Admin Controls matching Screenshot 1 */}
            <div className="absolute top-2 -right-1 flex flex-col gap-2 z-30 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="bg-black text-white p-2.5 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
                >
                    <Edit className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="bg-white text-red-500 p-2.5 rounded-full shadow-lg border border-neutral-100 hover:scale-110 active:scale-95 transition-all"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

function HibermartProductCard({ product, onEdit, onDelete }) {
    return (
        <div className="bg-white rounded-xl border border-neutral-100 shadow-md shadow-neutral-200/20 overflow-hidden group hover:border-black transition-all p-1 sm:p-1.5 relative h-full flex flex-col min-h-[180px]">
            {/* Sunburst Discount Badge matching Screenshot 2 */}
            <div className="absolute top-0.5 left-0.5 z-10 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                <div className="absolute inset-0 bg-[#7B61FF] rotate-[22.5deg] rounded-sm" />
                <div className="absolute inset-0 bg-[#7B61FF] rotate-[67.5deg] rounded-sm shadow-sm" />
                <span className="relative z-20 text-[5px] sm:text-[6px] font-black text-white leading-tight text-center px-0.5 uppercase">
                    {product.discount ? product.discount.split(' ')[0] : 'SALE'}
                </span>
            </div>

            {/* Product Image with AD mark matching Screenshot 2 */}
            <div className="aspect-square rounded-lg overflow-hidden mb-1.5 sm:mb-2 relative bg-neutral-50 flex-shrink-0 flex items-center justify-center p-1.5">
                <img src={product.image} className="max-w-[90%] max-h-[90%] object-contain group-hover:scale-110 transition-transform duration-700" alt="" />

                <div className="absolute bottom-1 left-1 flex flex-col items-start gap-1">
                    <div className="flex items-center gap-0.5 bg-white/95 backdrop-blur px-1 py-0.5 rounded-md border border-neutral-100 shadow-sm">
                        <span className="text-[5px] font-black text-neutral-600 uppercase tracking-tighter">AD</span>
                        <div className="w-1.5 h-1.5 rounded-full border border-emerald-500 flex items-center justify-center pb-[0.5px]">
                            <div className="w-0.5 h-0.5 bg-emerald-500 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Details matching Screenshot 2 */}
            <div className="px-0.5 pb-0.5 space-y-0 flex-1 flex flex-col">
                <div className="flex items-center gap-1 text-neutral-400 mb-0.5">
                    <span className="text-[6px] font-black uppercase tracking-tight">{product.time || '10 MINS'}</span>
                </div>

                <h4 className="font-black text-neutral-900 text-[9px] sm:text-[10px] line-clamp-2 leading-tight min-h-[1.5rem] mb-0.5">
                    {product.name}
                </h4>

                <p className="text-[8px] font-bold text-neutral-400 mb-1">{product.weight || '1 Unit'}</p>

                <div className="mt-auto flex items-center justify-between gap-1">
                    <div className="flex flex-col">
                        <span className="text-[10px] sm:text-[11px] font-black text-neutral-900 leading-none">₹{product.price || 0}</span>
                        {product.originalPrice && (
                            <span className="text-[7px] sm:text-[8px] font-bold text-neutral-300 line-through">₹{product.originalPrice}</span>
                        )}
                    </div>

                    <button className="flex items-center gap-0.5 border border-emerald-500 text-emerald-600 px-1.5 py-0.5 rounded-md font-black text-[7px] hover:bg-emerald-50 transition-all group/btn active:scale-95 uppercase tracking-tighter bg-emerald-50/20">
                        ADD <Plus className="w-2.5 h-2.5 group-hover/btn:rotate-90 transition-transform" strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Admin Actions Overlay on Hover */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-30 rounded-2xl">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="bg-white p-2.5 rounded-xl hover:scale-110 active:scale-95 transition-all shadow-xl group/edit border border-neutral-100"
                >
                    <Edit className="w-4 h-4 text-black group-hover/edit:rotate-12 transition-transform" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="bg-white p-2.5 rounded-xl hover:scale-110 active:scale-95 transition-all shadow-xl group/del border border-neutral-100"
                >
                    <Trash2 className="w-4 h-4 text-red-500 group-hover/del:scale-110 transition-transform" />
                </button>
            </div>
        </div>
    )
}

function ManagementGrid({ title, subtitle, items, onAdd, onEdit, onDelete, type }) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-neutral-900 tracking-tighter">{title}</h2>
                    <p className="text-xs font-medium text-neutral-500">{subtitle}</p>
                </div>
                <button
                    onClick={() => onAdd()}
                    className="flex items-center justify-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 transition-all"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Add {type}
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
                {items.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden group hover:border-black transition-all relative">
                        <div className="relative aspect-video bg-neutral-100 overflow-hidden">
                            <img src={item.image} alt={item.name || item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 z-20">
                                <button onClick={() => onEdit(item)} className="bg-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                                    <Edit className="w-3.5 h-3.5 text-black" />
                                </button>
                                <button onClick={() => onDelete(item)} className="bg-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                </button>
                            </div>
                            {item.type && (
                                <span className="absolute top-3 left-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm">
                                    {item.type}
                                </span>
                            )}
                        </div>
                        <div className="p-4">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h4 className="font-black text-neutral-900 text-[13px] leading-tight">{item.name || item.title}</h4>
                                    {item.price && <p className="text-[10px] font-bold text-neutral-500 mt-1">₹{item.price} • <span className="text-emerald-500">{item.discount} OFF</span></p>}
                                    {!item.price && <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Store Asset</p>}
                                </div>
                                <div className="flex flex-col items-center flex-shrink-0">
                                    <div className="w-7 h-7 rounded-full border border-emerald-100 flex items-center justify-center text-emerald-500 bg-emerald-50 shadow-sm">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-[7px] font-black text-neutral-300 uppercase mt-1">Live</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Empty State / Add Skeleton */}
                <button
                    onClick={onAdd}
                    className="flex flex-col items-center justify-center aspect-square sm:aspect-auto sm:min-h-[14rem] bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-2xl hover:bg-white hover:border-black transition-all group"
                >
                    <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform border border-neutral-100">
                        <Plus className="w-5 h-5 text-neutral-400" />
                    </div>
                    <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest mt-3 group-hover:text-black">Draft New {type}</p>
                </button>
            </div>
        </div>
    )
}

function OrderProcessingHub({ orders }) {
    const [selectedOrder, setSelectedOrder] = useState(null);

    const getStatusStyles = (status) => {
        switch (status) {
            case "Pending": return "bg-amber-50 text-amber-600 border-amber-100";
            case "Processing": return "bg-blue-50 text-blue-600 border-blue-100";
            case "Shipped": return "bg-purple-50 text-purple-600 border-purple-100";
            case "Delivered": return "bg-emerald-50 text-emerald-600 border-emerald-100";
            default: return "bg-neutral-50 text-neutral-600 border-neutral-100";
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-neutral-900 tracking-tighter">Active Shipments</h2>
                    <p className="text-sm font-medium text-neutral-500">Live order queue from Hibermart App.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white border border-neutral-100 px-4 py-2 rounded-xl flex items-center gap-4 shadow-sm">
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none mb-1">Queue Status</p>
                            <p className="text-xs font-black text-neutral-900 uppercase">Optimal</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                            <Truck className="w-5 h-5 text-emerald-500" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-neutral-100 shadow-xl shadow-neutral-200/40 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-neutral-50">
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Order Details</th>
                                <th className="px-4 py-4 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Customer Info</th>
                                <th className="px-4 py-4 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Pricing</th>
                                <th className="px-4 py-4 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-neutral-400 tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50/50">
                            {orders.map((order) => (
                                <tr
                                    key={order.id}
                                    className="group hover:bg-neutral-50/50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedOrder(order)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:bg-white transition-colors">
                                                <Package className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-black text-neutral-900">{order.id}</p>
                                                    {order.priority && (
                                                        <span className="bg-red-50 text-red-500 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase border border-red-100">Urgent</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">{order.time}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-neutral-800">{order.customer}</p>
                                            <div className="flex items-center gap-1.5 text-neutral-400">
                                                <MapPin className="w-3.5 h-3.5" />
                                                <p className="text-xs font-bold truncate max-w-[200px]">{order.address}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div>
                                            <p className="text-sm font-black text-neutral-900">₹{order.total}</p>
                                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">{order.items} SKU • {order.type}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(order.status)} animate-in fade-in zoom-in duration-300`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-50" />
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                                                className="p-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-400 hover:text-neutral-900 rounded-xl transition-all border border-neutral-200/50"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button className="bg-black text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                                                Process
                                            </button>
                                            <button className="p-2.5 bg-white hover:bg-neutral-50 text-neutral-300 hover:text-black rounded-xl transition-all border border-neutral-100">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-neutral-50/50 px-8 py-4 border-t border-neutral-50 flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    <p>Total {orders.length} Active Shipments in Queue</p>
                    <div className="flex items-center gap-4">
                        <p className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500" /> {orders.filter(o => o.status === "Pending").length} Pending
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" /> {orders.filter(o => o.status === "Processing").length} In Progress
                        </p>
                    </div>
                </div>
            </div>

            {/* Order Detail Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrder(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="px-8 py-8 border-b border-neutral-50 bg-neutral-50/50 flex items-center justify-between relative">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-2xl font-black text-neutral-900">{selectedOrder.id}</h3>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(selectedOrder.status)}`}>
                                            {selectedOrder.status}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-1">Order Placed {selectedOrder.time}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="p-3 bg-white hover:bg-neutral-100 rounded-2xl transition-all border border-neutral-100 shadow-sm"
                                >
                                    <X className="w-5 h-5 text-neutral-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                {/* Customer & Shipping Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Customer Details</p>
                                        <div className="p-5 bg-neutral-50 rounded-[2rem] border border-neutral-100 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-neutral-400 shadow-sm">
                                                    <Users className="w-4 h-4" />
                                                </div>
                                                <p className="text-sm font-black text-neutral-800">{selectedOrder.customer}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-neutral-400 shadow-sm">
                                                    <Monitor className="w-4 h-4" /> {/* Email icon substitute */}
                                                </div>
                                                <p className="text-xs font-bold text-neutral-500">{selectedOrder.email}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-neutral-400 shadow-sm">
                                                    <Plus className="w-4 h-4 rotate-45" /> {/* Phone icon substitute */}
                                                </div>
                                                <p className="text-xs font-bold text-neutral-500">{selectedOrder.phone}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Shipping Address</p>
                                        <div className="p-5 bg-neutral-50 rounded-[2rem] border border-neutral-100 flex gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <p className="text-xs font-bold text-neutral-600 leading-relaxed">
                                                {selectedOrder.address}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Items List */}
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Order Summary ({selectedOrder.itemsList?.length} items)</p>
                                    <div className="space-y-3">
                                        {selectedOrder.itemsList?.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-neutral-100 rounded-2xl hover:border-neutral-200 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 bg-neutral-50 rounded-xl overflow-hidden border border-neutral-100 p-2">
                                                        <img src={item.image} alt="" className="w-full h-full object-contain" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-neutral-800">{item.name}</p>
                                                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Qty: {item.qty} • ₹{item.price}/unit</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-black text-neutral-900">₹{item.qty * item.price}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-8 border-t border-neutral-50 bg-white flex items-center justify-between sm:rounded-b-[3rem]">
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Grand Total</p>
                                    <p className="text-3xl font-black text-neutral-900">₹{selectedOrder.total}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                                        Print Invoice
                                    </button>
                                    <button className="px-8 py-3 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:shadow-black/20 hover:-translate-y-1 transition-all">
                                        Update To Processing
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

