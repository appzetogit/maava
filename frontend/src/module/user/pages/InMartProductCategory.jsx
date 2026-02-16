import { useParams } from "react-router-dom"
import ProductCategoryView from "../components/ProductCategoryView"

const sidebarCategories = [
    { id: 1, name: "Fresh Vegetables", icon: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_96/NI_CATALOG/IMAGES/CIW/2025/3/19/b2676f05-a400-41d7-9972-bc7a182c9a57_6d253ad3-aa89-460e-adce-3e20698c008f" },
    { id: 2, name: "Leafy and Seasonings", icon: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_96/NI_CATALOG/IMAGES/CIW/2025/3/19/30b88794-29ec-4c4a-a983-1e9c7b75bde3_0496956a-6096-4027-842b-7505f9bd3196" },
    { id: 3, name: "Valentine's Day Specials", icon: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_96/a89ef8aef60052992adb6c5517adab30" },
    { id: 4, name: "Pooja & Festive", icon: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_96/NI_CATALOG/IMAGES/CIW/2025/3/19/15b9ed6a-7961-453d-9e19-61001e78666a_b9a24a86-77e1-49e2-892e-305a2a45b25a" },
    { id: 5, name: "Premium Produce", icon: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_96/NI_CATALOG/IMAGES/CIW/2025/12/12/b85a42c3-7cce-4dc8-95fd-d7770031dd6d_5dc9e7ba-f4fa-4b6e-9dec-f3d57f5a78ca.png" },
    { id: 6, name: "Exotic Vegetables", icon: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_96/NI_CATALOG/IMAGES/CIW/2025/3/19/4ee251e0-82ba-470e-a5c1-29660f5ca2cd_10165714-d5c1-4e05-b29a-d1598937f73b" },
    { id: 7, name: "Fresh Fruits", icon: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_96/NI_CATALOG/IMAGES/CIW/2025/12/5/c4fddc77-f407-4a03-a598-13df6178c402_050b74b6-7c2d-48dd-ae57-b084748cea25" },
    { id: 8, name: "Bouquet & Plants", icon: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_96/NI_CATALOG/IMAGES/CIW/2025/12/24/b1d4b0a8-2a5b-498a-9964-e006f8c38b3d_614d258a-61b9-4612-a3d7-7d63399b5bcc.png" },
    { id: 9, name: "Cuts and sprouts", icon: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_96/NI_CATALOG/IMAGES/CIW/2025/3/19/03b3be59-51bc-4127-9cea-8179017f68d5_4420c246-b05a-413a-8494-deeb470112c7" },
    { id: 10, name: "Certified Organics", icon: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_96/NI_CATALOG/IMAGES/CIW/2024/8/16/f8aca2f6-4317-4eb5-9b96-8cd5fb4fd616_Certifiedorganic.png" },
    { id: 11, name: "Exotic Fruits", icon: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_96/NI_CATALOG/IMAGES/CIW/2025/8/25/a33815ee-81be-4312-8567-b2162230962d_0e50f0b8-1bc5-4778-98e7-8c4ff1f01988" },
    { id: 12, name: "Cut Fruits and Juices", icon: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_96/NI_CATALOG/IMAGES/CIW/2025/3/19/1a650bf3-bd22-49c9-a77f-e23ba0b598b5_b22f5453-8374-40f6-840a-2ba00b46e881" },
    { id: 13, name: "Frozen Vegetables", icon: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_96/NI_CATALOG/IMAGES/CIW/2025/5/14/be65bbd1-c143-4507-9284-c5d549d69b69_45309b2a-510a-4b62-9d06-ded69947e065" },
    { id: 14, name: "Combos", icon: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_96/NI_CATALOG/IMAGES/CIW/2025/3/19/292cee7c-d800-4171-aa01-4de71a1d144e_e7513aae-2462-4834-8c24-4f4e6cd897ba" }
]

const vegetableProducts = [
    {
        id: 1,
        name: "No Roots, Spinach (Palak Soppu)",
        desc: "Iron-rich, tender, perfect for curries & soups",
        weight: "1 Bunch",
        price: 23,
        originalPrice: 29,
        discount: "20% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/7faac0b9ed58f4e7306646613d92a42a.png",
        isVeg: true,
        isAd: true
    },
    {
        id: 2,
        name: "Carrot",
        desc: "Crunchy, vitamin-packed & perfect raw or cooked",
        weight: "500 g",
        price: 21,
        originalPrice: 26,
        discount: "19% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/CIW/2025/12/9/035bcbdc-64fa-4a91-a272-2189156c9e10_1036_1.png",
        isVeg: true,
        isAd: true
    },
    {
        id: 3,
        name: "No Roots, Coriander Leaves (Kotthambari Soppu)",
        desc: "Fresh, aromatic, detox, garnish for soups & curries",
        weight: "1 Bunch",
        price: 10,
        originalPrice: 13,
        discount: "23% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/CIW/2026/1/21/b6aaa4a1-7478-4d58-90cd-d60827750079_Coriander_1.png",
        isVeg: true
    },
    {
        id: 4,
        name: "Cucumber",
        desc: "Cool and refreshing, great for salads and snacks.",
        weight: "2 Pieces x 2",
        price: 25,
        originalPrice: 36,
        discount: "30% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/2024/5/6/2bea05e2-0359-47d7-ae52-999430efb3f3_freshvegetables_MFPXQBV7WU_MN.png",
        isVeg: true
    },
    {
        id: 5,
        name: "Fenugreek (Menthya Soppu)",
        desc: "Fresh bitter leaves, aids digestion, in curries",
        weight: "1 Bunch x 2",
        price: 45,
        originalPrice: 60,
        discount: "25% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/412fa1971a6753dd37051f8cefc7c018",
        isVeg: true,
        isAd: true
    },
    {
        id: 6,
        name: "English Cucumber (Sowthekaayi)",
        desc: "Crisp, no seeds & perfect in salads or detox drinks",
        weight: "1 Pack",
        price: 32,
        originalPrice: 40,
        discount: "20% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/19/02ad4f56-e2eb-46a4-871a-52530edf2413_IWYUR7YS4Q_MN_18122025.png",
        isVeg: true
    },
    {
        id: 7,
        name: "Hybrid Tomato",
        desc: "Fresh, firm & great in gravies or sauces",
        weight: "500 g",
        price: 16,
        originalPrice: 20,
        discount: "20% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/18/96833bab-c95a-468d-b40a-f6104f516e9b_TOXY8MIG4N_MN_18122025.png",
        isVeg: true
    },
    {
        id: 8,
        name: "Indian Tomato",
        desc: "Juicy, tangy & ideal for all Indian curries",
        weight: "500 g",
        price: 15,
        originalPrice: 19,
        discount: "21% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/CIW/2026/1/21/44551113-a49d-4583-9fb2-2c87e9cc2cf9_Tomato_1.png",
        isVeg: true
    },
    {
        id: 9,
        name: "Lemon (Nimbe Hannu)",
        desc: "Vitamin C boost, juicy fresh, for drinks/dressings",
        weight: "200 g",
        price: 23,
        originalPrice: 29,
        discount: "20% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/19/892f62a9-a9fa-4fde-9f58-992db9e33834_A3W98GOS1G_MN_18122025.png",
        isVeg: true
    },
    {
        id: 10,
        name: "Kateri Brinjal (Geeru Gundu Badanekaayi)",
        desc: "Firm, low-seed & tasty in stuffed or fried dishes",
        weight: "250 g",
        price: 14,
        originalPrice: 18,
        discount: "22% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/11/20/0341cfe7-2f2b-4103-a4ce-310764deb9b3_54NXJ5864D_MN_20112025.jpg",
        isVeg: true
    },
    {
        id: 11,
        name: "Bharta Purple Brinjal (Badanekaayi)",
        desc: "Rich, smoky flavor perfect for baingan bharta!",
        weight: "1 Piece",
        price: 16,
        originalPrice: 20,
        discount: "20% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/CIW/2026/1/13/4c3730f5-abc6-40fa-aa99-f07af9b8a2f2_3967.png",
        isVeg: true
    },
    {
        id: 12,
        name: "Potato (Aloo Gadde)",
        desc: "Agra’s finest potatoes; great for fries, mash & curries",
        weight: "1 kg",
        price: 33,
        originalPrice: 41,
        discount: "19% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/CIW/2026/1/21/bc000749-2fb2-4181-a1e5-acb465279cb1_1.png",
        isVeg: true
    },
    {
        id: 13,
        name: "Sweet Potato (Sihi Genasu)",
        desc: "Iron-rich, sweet & tasty when roasted or boiled",
        weight: "500 g",
        price: 28,
        originalPrice: 35,
        discount: "20% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/CIW/2025/12/29/92ee1893-a0b7-4244-a3b4-2f320f02025a_1128_1.png",
        isVeg: true
    },
    {
        id: 14,
        name: "Sweet Corn (Sihi Mekkejola)",
        desc: "Sweet, juicy & perfect for snacks, soups or salad",
        weight: "2 Pieces",
        price: 50,
        originalPrice: 63,
        discount: "20% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/19/d4d7ac17-6abf-4c4a-ae1e-809c5e13364e_G100GAHFI6_MN_18122025.png",
        isVeg: true
    },
    {
        id: 15,
        name: "Green Peas (Matar)",
        desc: "Winter pantry staple",
        weight: "250 g",
        price: 20,
        originalPrice: 25,
        discount: "20% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/18/b9259871-791d-45e2-a858-69ea89709647_4YVALFTTFJ_MN_18122025.png",
        isVeg: true
    },
    {
        id: 16,
        name: "Haricot Beans (Hurulikayi)",
        desc: "Soft, healthy beans ideal for soups and sautés",
        weight: "250 g",
        price: 18,
        originalPrice: 23,
        discount: "21% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/18/c19d2290-3dda-4d30-ac10-6f4c148baf0a_NKVUOJROCL_MN_18122025.png",
        isVeg: true
    },
    {
        id: 17,
        name: "Broad Beans (Huralikaayi)",
        desc: "Indian version of edamame",
        weight: "250 g x 2",
        price: 35,
        originalPrice: 48,
        discount: "27% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/CIW/2025/9/22/f7b2f2b4-85c1-4c24-ad1a-14fff45902a6_7478_1.png",
        isVeg: true
    },
    {
        id: 18,
        name: "Long Purple Brinjal (Udda Badanekaayi)",
        desc: "Soft, tasty & ideal for fries, curries",
        weight: "250 g",
        price: 26,
        originalPrice: 33,
        discount: "21% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/11/20/26c7935b-3d3e-4663-8f7e-2df7439d28d8_WS1IB52FZR_MN_20112025.jpg",
        isVeg: true
    },
    {
        id: 19,
        name: "New Potato (Aloo Gadde)",
        desc: "Fresh, tender, perfect for roasting or boiling.",
        weight: "1 kg",
        price: 39,
        originalPrice: 49,
        discount: "20% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/18/9a0225b0-a68f-4001-a535-f2fe1f6afa1b_NI3G71DSGI_MN_18122025.png",
        isVeg: true
    },
    {
        id: 20,
        name: "Chandramukhi Potato (Aloo Gadde)",
        desc: "Creamy texture ideal for mashing & roasting!",
        weight: "500 g",
        price: 64,
        originalPrice: 80,
        discount: "20% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/18/5cc0d74c-34a5-423e-80f7-409887425186_ZKLINGWTT2_MN_18122025.png",
        isVeg: true
    },
    {
        id: 21,
        name: "English Cucumber - Protected Cultivation",
        desc: "Crisp and fresh cucumbers from hydroponic farming",
        weight: "500 g",
        price: 31,
        originalPrice: 39,
        discount: "20% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/19/a38e244f-5e10-40a9-89ef-4755ccff0984_HNJHF8TDNE_MN_18122025.png",
        isVeg: true
    },
    {
        id: 22,
        name: "Ooty Potato (Aloo Gadde)",
        desc: "Hill-grown potatoes with exceptional taste & texture!",
        weight: "500 g",
        price: 51,
        originalPrice: 64,
        discount: "20% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/18/67db81ec-4b72-4690-a764-34daccc83d0e_X06C20K2ZS_MN_18122025.png",
        isVeg: true
    },
    {
        id: 23,
        name: "Baby Potato (Chikka Aloo Gadde)",
        desc: "Tender, buttery gems for perfect roasting!",
        weight: "500 g x 2",
        price: 65,
        originalPrice: 86,
        discount: "24% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/56a0557e3d6af641d997ea5cc0809895",
        isVeg: true
    },
    {
        id: 24,
        name: "Organic Certified Potato (Aloo Gadde)",
        desc: "Agra’s finest potatoes; great for fries, mash & curries",
        weight: "1 kg",
        price: 58,
        originalPrice: 73,
        discount: "20% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/CIW/2025/12/23/a2532a2d-3b0b-4af6-8f4a-7b5d291a6517_8288_1.png",
        isVeg: true
    },
    {
        id: 25,
        name: "Potato (Aloo Gadde) Value Pack",
        desc: "Versatile Vegetable, Cooking Staple.",
        weight: "3 kg",
        price: 96,
        originalPrice: 120,
        discount: "20% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/gslhg2y6ythtu14d3skh",
        isVeg: true
    },
    {
        id: 26,
        name: "Bhoomi Farms Organic Sweet Potato",
        desc: "Authentic Organic and 100% source traceable",
        weight: "480 g",
        price: 67,
        originalPrice: 84,
        discount: "20% OFF",
        deliveryTime: "10 MINS",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/19/d2554a7f-1764-46c1-9edf-5a2f190387ba_NANC2ZI3P9_MN_18122025.png",
        isVeg: true
    }
]

export default function InMartProductCategory() {
    return (
        <ProductCategoryView
            title="Fresh Vegetables"
            sidebarCategories={sidebarCategories}
            products={vegetableProducts}
            activeCategory="Fresh Vegetables"
        />
    )
}
