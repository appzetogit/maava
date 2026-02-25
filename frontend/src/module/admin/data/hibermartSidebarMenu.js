import {
    LayoutDashboard,
    ShoppingBag,
    Image as ImageIcon,
    Tag,
    Users,
    CreditCard,
    MessageSquare,
    Truck,
    Sparkles,
    Flame,
    Zap,
    Heart,
    Coffee,
    Compass,
    MapPin
} from "lucide-react"

export const hibermartSidebarMenuData = [
    {
        type: "link",
        label: "Store Overview",
        path: "/admin/hibermart",
        icon: "LayoutDashboard",
    },
    {
        type: "link",
        label: "Navigation Manager",
        path: "/admin/hibermart/navigation",
        icon: "Compass",
    },
    {
        type: "section",
        label: "CAMPAIGNS & CONTENT",
        items: [
            {
                type: "link",
                label: "Banners (Hero/Promo)",
                path: "/admin/hibermart/banners",
                icon: "ImageIcon",
            },
        ],
    },
    {
        type: "section",
        label: "CURATED COLLECTIONS",
        items: [
            {
                type: "link",
                label: "Big Sale Section",
                path: "/admin/hibermart/sale",
                icon: "Tag",
            },
            {
                type: "link",
                label: "Newly Launched",
                path: "/admin/hibermart/newly-launched",
                icon: "Sparkles",
            },
            {
                type: "link",
                label: "Best Sellers",
                path: "/admin/hibermart/best-sellers",
                icon: "Flame",
            },
            {
                type: "link",
                label: "Trending Near You",
                path: "/admin/hibermart/trending",
                icon: "Zap",
            },
        ],
    },
    {
        type: "section",
        label: "CATEGORY CATALOG",
        items: [
            {
                type: "link",
                label: "Grocery & Kitchen",
                path: "/admin/hibermart/categories/grocery",
                icon: "ShoppingBag",
            },
            {
                type: "link",
                label: "Beauty & Wellness",
                path: "/admin/hibermart/categories/beauty",
                icon: "Heart",
            },
            {
                type: "link",
                label: "Household & Lifestyle",
                path: "/admin/hibermart/categories/household",
                icon: "Zap",
            },
            {
                type: "link",
                label: "Snacks & Drinks",
                path: "/admin/hibermart/categories/snacks",
                icon: "Coffee",
            },
        ],
    },
    {
        type: "section",
        label: "OPERATIONS",
        items: [
            {
                type: "link",
                label: "Orders to Process",
                path: "/admin/hibermart/orders",
                icon: "Truck",
            },
            {
                type: "link",
                label: "Zone Setup",
                path: "/admin/hibermart-zone-setup",
                icon: "MapPin",
            },
            {
                type: "link",
                label: "Store Location",
                path: "/admin/hibermart/store-location",
                icon: "MapPin",
            },
        ],
    },
]
