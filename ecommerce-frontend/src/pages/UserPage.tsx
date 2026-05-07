import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import RealProductRating from "../components/RealProductRating";

// --- INTERFACES ---
interface Product {
  id: number;
  name: string;
  price: number;
  brand: string;
  imageUrl?: string;
}
interface Recommendation {
  product: Product;
  confidenceScore: number;
}
interface UserData {
  userId: number;
  role: string;
  token: string;
}
interface Review {
  id?: number;
  user?: { id: number; username?: string };
  product?: { id: number };
  rating: number;
  comment: string;
  createdAt?: string;
}

interface UserPageProps {
  userAuth: UserData;
  onLogout: () => void;
}

const UserPage: React.FC<UserPageProps> = ({ userAuth, onLogout }) => {
  // STATE MUA SẮM CỦA USER
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCart, setShowCart] = useState<boolean>(false);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [showOrders, setShowOrders] = useState<boolean>(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [currentReviews, setCurrentReviews] = useState<Review[]>([]);
  const [reviewForm, setReviewForm] = useState<{
    rating: number;
    comment: string;
    productId: number | null;
  }>({ rating: 5, comment: "", productId: null });

  // BẮT SỰ KIỆN VNPAY
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const vnp_ResponseCode = urlParams.get("vnp_ResponseCode");
    const vnp_TxnRef = urlParams.get("vnp_TxnRef");

    if (vnp_ResponseCode && vnp_TxnRef) {
      const orderId = vnp_TxnRef.split("_")[0];
      fetch(
        `http://localhost:8888/api/orders/payment-confirm/${orderId}?responseCode=${vnp_ResponseCode}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${userAuth.token}` },
        },
      ).then((res) => {
        if (res.ok) {
          if (vnp_ResponseCode === "00") {
            toast.success(`Thanh toán VNPay thành công đơn #${orderId}!`, {
              duration: 4000,
            });
          } else {
            toast.error(`Thanh toán đơn #${orderId} thất bại hoặc đã bị hủy.`, {
              duration: 4000,
            });
          }
          fetchUserOrders();
        }
      });
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // EFFECTS NẠP DỮ LIỆU
  useEffect(() => {
    fetchRecommendations();
    fetchCartHistory();
    fetchAllProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      fetch(`http://localhost:8888/api/reviews/product/${selectedProduct.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setCurrentReviews(data);
          } else {
            setCurrentReviews([]);
          }
        })
        .catch((err) => {
          console.error("Lỗi lấy review:", err);
          setCurrentReviews([]);
        });
    } else {
      setCurrentReviews([]);
    }
  }, [selectedProduct]);

  // CÁC HÀM XỬ LÝ API
  const fetchAllProducts = () => {
    fetch("http://localhost:8888/api/products", {
      headers: { Authorization: `Bearer ${userAuth.token}` },
    })
      .then((res) => res.json())
      .then((data) => setAllProducts(data));
  };

  const fetchUserOrders = () => {
    fetch(`http://localhost:8888/api/orders/user/${userAuth.userId}`, {
      headers: { Authorization: `Bearer ${userAuth.token}` },
    })
      .then((res) => res.json())
      .then((data) => setUserOrders(data));
  };

  const fetchRecommendations = () => {
    fetch(`http://localhost:8888/api/recommendation/display/${userAuth.userId}`)
      .then((res) => res.json())
      .then((data) => setRecommendations(data));
  };

  const fetchCartHistory = () => {
    fetch(`http://localhost:8888/api/activities/cart/${userAuth.userId}`)
      .then((res) => res.json())
      .then((data) => setCartItems(data));
  };

  const trackActivity = (productId: number, action: string) => {
    fetch("http://localhost:8888/api/activities/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userAuth.userId,
        action,
        productId,
        sessionId: "web_session",
      }),
    }).then(() => {
      if (action === "add_to_cart") {
        fetchCartHistory();
        toast.success("Đã thêm vào giỏ hàng!");
      }
    });
  };

  const handleRemoveFromCart = (productId: number, itemIndex: number) => {
    const newCart = [...cartItems];
    newCart.splice(itemIndex, 1);
    setCartItems(newCart);
    toast.success("Đã xóa khỏi giỏ hàng");

    fetch(
      `http://localhost:8888/api/activities/cart/${userAuth.userId}/${productId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${userAuth.token}` },
      },
    ).catch((err) => console.error("Lỗi khi xóa giỏ hàng:", err));
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return toast.error("Giỏ hàng đang trống!");

    const loadingToast = toast.loading("Đang tạo đơn hàng...");
    fetch(`http://localhost:8888/api/orders/checkout/${userAuth.userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userAuth.token}`,
      },
      body: JSON.stringify(cartItems),
    })
      .then((res) => res.json())
      .then((order) => {
        cartItems.forEach((item) => trackActivity(item.id, "purchase"));
        setCartItems([]);
        setShowCart(false);
        toast.dismiss(loadingToast);

        const totalAmount = cartItems.reduce(
          (sum, item) => sum + item.price,
          0,
        );
        fetch(
          `http://localhost:8888/api/payment/create_url?amount=${totalAmount}&orderId=${order.id}`,
          { headers: { Authorization: `Bearer ${userAuth.token}` } },
        )
          .then((res) => res.json())
          .then((data) => {
            if (data.paymentUrl) window.location.href = data.paymentUrl;
          });
      })
      .catch(() => {
        toast.dismiss(loadingToast);
        toast.error("Lỗi khi tạo đơn hàng.");
      });
  };

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      user: { id: userAuth.userId },
      product: { id: reviewForm.productId },
      rating: reviewForm.rating,
      comment: reviewForm.comment,
    };
    fetch("http://localhost:8888/api/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userAuth.token}`,
      },
      body: JSON.stringify(body),
    }).then((res) => {
      if (res.ok) {
        toast.success("Cảm ơn bạn đã đánh giá!");
        setReviewForm({ rating: 5, comment: "", productId: null });
        fetchUserOrders();
        // Force re-render the RealRating component and popup by re-fetching
        if (selectedProduct) {
          fetch(
            `http://localhost:8888/api/reviews/product/${selectedProduct.id}`,
          )
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data)) setCurrentReviews(data);
            });
        }
      }
    });
  };

  // LOGIC LỌC TÌM KIẾM & DANH MỤC (NÂNG CẤP)
  const filteredProducts = allProducts.filter((p) => {
    const matchName =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase());

    let matchPrice = true;
    if (priceFilter === "D_1M") matchPrice = p.price < 1000000;
    if (priceFilter === "1M_10M")
      matchPrice = p.price >= 1000000 && p.price <= 10000000;
    if (priceFilter === "U_10M") matchPrice = p.price > 10000000;

    let matchCategory = true;
    const n = p.name.toLowerCase();
    if (categoryFilter === "PHONE")
      matchCategory =
        n.includes("điện thoại") ||
        n.includes("iphone") ||
        n.includes("galaxy s") ||
        n.includes("z fold") ||
        n.includes("redmi");
    if (categoryFilter === "LAPTOP")
      matchCategory = n.includes("laptop") || n.includes("macbook");
    if (categoryFilter === "ACCESSORY")
      matchCategory =
        !n.includes("điện thoại") &&
        !n.includes("iphone") &&
        !n.includes("galaxy s") &&
        !n.includes("z fold") &&
        !n.includes("redmi") &&
        !n.includes("laptop") &&
        !n.includes("macbook");

    return matchName && matchPrice && matchCategory;
  });

  // TÍNH TOÁN RATING THẬT CHO POPUP SẢN PHẨM
  const popupAverageRating =
    currentReviews.length > 0
      ? Math.round(
          currentReviews.reduce((sum, rev) => sum + rev.rating, 0) /
            currentReviews.length,
        )
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      <div className="max-w-6xl mx-auto p-8 flex-1 w-full">
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="px-4">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Cửa hàng AI 🤖
            </h1>
            <p className="text-gray-500 font-medium">
              Xin chào, thành viên #{userAuth.userId} 👋
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                fetchUserOrders();
                setShowOrders(true);
              }}
              className="bg-white border border-gray-200 px-6 py-2 rounded-xl font-bold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              🧾 Lịch sử đơn hàng
            </button>
            <button
              onClick={() => setShowCart(true)}
              className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold shadow-md hover:bg-gray-800 hover:shadow-lg transition-all flex items-center gap-2"
            >
              <span>🛒</span> Giỏ hàng
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {cartItems.length}
              </span>
            </button>
            <button
              onClick={onLogout}
              className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-100 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* KHU VỰC AI RECOMMENDATION */}
        <div className="mb-14">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800">
            <span className="text-3xl">✨</span> Gợi ý dành cho bạn
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                onClick={() => {
                  setSelectedProduct(rec.product);
                  trackActivity(rec.product.id, "view_product");
                }}
                className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-xl cursor-pointer flex flex-col transition-all duration-300 border border-gray-100 hover:-translate-y-1 relative"
              >
                <div className="mb-3 flex justify-between items-center">
                  <span
                    className={`text-[10px] font-black px-3 py-1.5 rounded-full tracking-wider ${rec.confidenceScore > 0 ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-orange-100 text-orange-700 border border-orange-200"}`}
                  >
                    {rec.confidenceScore > 0 ? "DÀNH CHO BẠN" : "XU HƯỚNG 🔥"}
                  </span>
                </div>

                <div className="w-full h-48 my-2 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center relative group">
                  {rec.product.imageUrl ? (
                    <img
                      src={rec.product.imageUrl}
                      alt={rec.product.name}
                      className="w-full h-full object-cover mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <span className="text-gray-300 text-sm">Chưa có ảnh</span>
                  )}
                </div>

                <h3
                  className="font-bold text-gray-800 mt-3 line-clamp-2 leading-tight"
                  title={rec.product.name}
                >
                  {rec.product.name}
                </h3>
                <p className="text-gray-400 text-xs mb-1 mt-1 font-medium">
                  {rec.product.brand}
                </p>

                {/* RATING THẬT 100% TỪ DATABASE */}
                <RealProductRating productId={rec.product.id} />

                {/* --- THANH TIẾN TRÌNH AI (AI MATCHING SCORE) --- */}
                {rec.confidenceScore > 0 && (
                  <div className="mb-4 bg-gradient-to-br from-blue-50 to-indigo-50/30 p-3 rounded-xl border border-blue-100/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-bold text-blue-800 flex items-center gap-1.5">
                        <span className="text-sm">🧠</span> Phân tích AI
                      </span>
                      <span className="text-xs font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">
                        {Math.round(rec.confidenceScore * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-100/50 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${Math.round(rec.confidenceScore * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-red-500 font-bold text-lg">
                    {rec.product.price.toLocaleString()} đ
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      trackActivity(rec.product.id, "add_to_cart");
                    }}
                    className="bg-blue-50 text-blue-700 w-10 h-10 rounded-xl font-bold text-xl hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center"
                    title="Thêm vào giỏ"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KHÁM PHÁ KHO HÀNG */}
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-t pt-10">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
              📦 Khám phá kho hàng
            </h2>
            <div className="flex gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="🔍 Tìm tên hoặc thương hiệu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 md:w-64 px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-sm"
              />
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-white cursor-pointer font-medium text-sm text-gray-700"
              >
                <option value="ALL">Tất cả mức giá</option>
                <option value="D_1M">Dưới 1 triệu</option>
                <option value="1M_10M">Từ 1 - 10 triệu</option>
                <option value="U_10M">Trên 10 triệu</option>
              </select>
            </div>
          </div>

          {/* BỘ LỌC DANH MỤC (CATEGORY PILLS) */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: "ALL", label: "Tất cả sản phẩm" },
              { id: "PHONE", label: "📱 Điện thoại" },
              { id: "LAPTOP", label: "💻 Laptop" },
              { id: "ACCESSORY", label: "🎧 Phụ kiện & Khác" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-5 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${categoryFilter === cat.id ? "bg-gray-800 text-white shadow-md scale-105" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-100"}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {filteredProducts.length === 0 ? (
              <div className="col-span-4 text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                <span className="text-4xl block mb-2">🔍</span>
                Không tìm thấy sản phẩm nào phù hợp.
              </div>
            ) : (
              filteredProducts.map((prod, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedProduct(prod);
                    trackActivity(prod.id, "view_product");
                  }}
                  className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-xl cursor-pointer flex flex-col transition-all duration-300 border border-gray-100 hover:-translate-y-1 group"
                >
                  <div className="w-full h-48 mb-3 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center relative">
                    {prod.imageUrl ? (
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <span className="text-gray-300 text-sm">Chưa có ảnh</span>
                    )}
                  </div>
                  <h3
                    className="font-bold mt-2 line-clamp-2 text-gray-800 leading-tight"
                    title={prod.name}
                  >
                    {prod.name}
                  </h3>
                  <p className="text-gray-400 text-xs mb-1 mt-1 font-medium">
                    {prod.brand}
                  </p>

                  {/* RATING THẬT 100% TỪ DATABASE */}
                  <RealProductRating productId={prod.id} />

                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
                    <p className="text-red-500 font-bold text-lg">
                      {prod.price.toLocaleString()} đ
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        trackActivity(prod.id, "add_to_cart");
                      }}
                      className="bg-gray-100 text-gray-800 w-10 h-10 rounded-xl font-bold text-xl hover:bg-gray-900 hover:text-white transition-colors flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* FOOTER ĐỒ ÁN */}
      <footer className="mt-16 bg-gray-900 text-gray-400 py-12 rounded-t-[3rem] shadow-inner text-center mx-4 md:mx-12 mb-4">
        <h2 className="text-2xl font-black text-white mb-3 tracking-wide">
          Hệ thống Cửa hàng AI - Next Purchase Prediction
        </h2>
        <p className="mb-1 text-sm">
          Đồ án tốt nghiệp / Khóa luận chuyên ngành Phần mềm
        </p>
        <p className="mb-6 text-sm text-gray-500">
          Phát triển với ReactJS, Spring Boot & Machine Learning (Markov Chain)
        </p>
        <div className="text-sm border-t border-gray-800 pt-6 mx-auto max-w-lg flex justify-around">
          <p>
            Sinh viên:{" "}
            <span className="text-gray-200 font-bold">Đặng Thanh Tùng</span>
          </p>
          <p>
            Nhóm: <span className="text-gray-200 font-bold">VH07</span>
          </p>
        </div>
      </footer>

      {/* POPUP SẢN PHẨM NÂNG CẤP DÙNG SỐ SAO THẬT */}
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition-all font-bold"
            >
              ✕
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <div className="w-full h-64 mt-2 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100">
                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="w-full h-full object-contain mix-blend-multiply p-4"
                  />
                ) : (
                  <span className="text-gray-300">Chưa có ảnh</span>
                )}
              </div>
              <div className="flex flex-col justify-center">
                <h2 className="text-2xl font-black text-gray-800 mb-2 leading-tight">
                  {selectedProduct.name}
                </h2>

                {/* RATING THẬT TRÊN POPUP */}
                <div className="flex items-center gap-2 mb-4 text-sm">
                  {currentReviews.length > 0 ? (
                    <>
                      <span className="text-yellow-400 tracking-widest">
                        {"★".repeat(popupAverageRating)}
                        <span className="text-gray-200">
                          {"★".repeat(5 - popupAverageRating)}
                        </span>
                      </span>
                      <span className="text-blue-600 font-bold cursor-pointer hover:underline">
                        {currentReviews.length} Đánh giá
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-400">Chưa có đánh giá</span>
                  )}
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500 font-medium">
                    Thương hiệu:{" "}
                    <span className="text-gray-900 font-bold">
                      {selectedProduct.brand}
                    </span>
                  </span>
                </div>

                <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100">
                  <span className="text-3xl font-black text-red-500">
                    {selectedProduct.price.toLocaleString()} đ
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    trackActivity(selectedProduct.id, "add_to_cart");
                    setSelectedProduct(null);
                  }}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  <span className="text-xl">🛒</span> Thêm vào giỏ hàng ngay
                </button>
              </div>
            </div>
            <div className="border-t pt-8">
              <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                💬 Đánh giá từ khách hàng ({currentReviews.length})
              </h3>
              <div className="space-y-4">
                {currentReviews.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium">
                      Chưa có đánh giá nào cho sản phẩm này.
                    </p>
                  </div>
                ) : (
                  currentReviews.map((rev, i) => (
                    <div
                      key={i}
                      className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                            K
                          </div>
                          <span className="font-bold text-gray-800 text-sm">
                            Khách hàng #{rev.user?.id}
                          </span>
                        </div>
                        <span className="text-yellow-400 text-sm tracking-widest">
                          {"★".repeat(rev.rating)}
                          <span className="text-gray-200">
                            {"★".repeat(5 - rev.rating)}
                          </span>
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed pl-11">
                        {rev.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GIỎ HÀNG NÂNG CẤP */}
      {showCart && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCart(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl p-6 flex flex-col transition-transform">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                🛒 Giỏ hàng
              </h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-400 hover:text-gray-800 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <span className="text-6xl mb-4 opacity-50">🛍️</span>
                  <p className="font-medium">Giỏ hàng đang trống</p>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="flex items-center gap-4 p-3 border border-gray-100 rounded-2xl bg-white hover:border-blue-200 hover:shadow-md transition-all group"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt="img"
                        className="w-16 h-16 object-cover rounded-xl bg-gray-50 p-1 border border-gray-100"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-xl"></div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-gray-800 line-clamp-2 leading-snug">
                        {item.name}
                      </h4>
                      <p className="font-black text-blue-600 mt-1">
                        {item.price.toLocaleString()} đ
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.id, idx)}
                      className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all font-bold"
                      title="Xóa khỏi giỏ"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-6 border-t border-gray-100 mt-6 bg-white">
              <div className="flex justify-between mb-6 font-bold text-lg">
                <span className="text-gray-500">Tổng thanh toán:</span>
                <span className="text-red-500 text-2xl font-black">
                  {cartItems
                    .reduce((sum, item) => sum + item.price, 0)
                    .toLocaleString()}{" "}
                  đ
                </span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${cartItems.length === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none" : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/30 active:scale-[0.98]"}`}
              >
                Thanh toán qua VNPay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LỊCH SỬ ĐƠN HÀNG + FORM ĐÁNH GIÁ */}
      {showOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowOrders(false)}
          />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col relative z-10 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
              <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                🧾 Lịch sử Đơn hàng
              </h2>
              <button
                onClick={() => setShowOrders(false)}
                className="text-gray-400 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50/50">
              {userOrders.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-5xl block mb-4 opacity-50">📦</span>
                  <p className="text-gray-500 font-medium">
                    Bạn chưa có đơn hàng nào.
                  </p>
                </div>
              ) : (
                userOrders.map((entry, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-4">
                      <div>
                        <p className="font-black text-gray-800 text-lg">
                          Mã đơn: #{entry.order.id}
                        </p>
                        <p className="text-xs text-gray-400 font-medium mt-1">
                          {new Date(entry.order.orderDate).toLocaleString(
                            "vi-VN",
                          )}
                        </p>
                      </div>
                      <span
                        className={`px-4 py-1.5 rounded-full text-xs font-black tracking-wide ${entry.order.status === "CHỜ THANH TOÁN" ? "bg-red-50 text-red-600 border border-red-100" : entry.order.status === "ĐÃ THANH TOÁN" ? "bg-green-50 text-green-600 border border-green-100" : "bg-blue-50 text-blue-600 border border-blue-100"}`}
                      >
                        {entry.order.status}
                      </span>
                    </div>
                    <div className="space-y-3 mb-5">
                      {entry.items.map((item: any, i: number) => (
                        <div
                          key={i}
                          className="flex justify-between items-center bg-gray-50/50 p-3 rounded-xl border border-gray-100"
                        >
                          <div className="flex-1">
                            <span className="font-bold text-gray-700 text-sm">
                              {item.product?.name}{" "}
                              <span className="text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md ml-1">
                                x{item.quantity}
                              </span>
                            </span>
                            {entry.order.status === "HOÀN THÀNH" && (
                              <button
                                onClick={() =>
                                  setReviewForm({
                                    ...reviewForm,
                                    productId: item.product?.id,
                                  })
                                }
                                className="block mt-2 text-blue-600 text-xs font-bold hover:underline"
                              >
                                ✎ Đánh giá sản phẩm
                              </button>
                            )}
                          </div>
                          <span className="text-gray-900 text-sm font-black">
                            {item.priceAtPurchase.toLocaleString()} đ
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center font-bold text-gray-800">
                      <span className="text-gray-500">Tổng cộng:</span>
                      <span className="text-red-500 text-xl font-black">
                        {entry.order.totalAmount.toLocaleString()} đ
                      </span>
                    </div>

                    {reviewForm.productId &&
                      entry.items.some(
                        (it: any) => it.product?.id === reviewForm.productId,
                      ) && (
                        <form
                          onSubmit={submitReview}
                          className="mt-6 p-5 bg-blue-50/30 rounded-2xl border border-blue-100 shadow-inner"
                        >
                          <p className="font-black mb-4 text-blue-800 flex items-center gap-2">
                            <span>⭐</span> Đánh giá sản phẩm
                          </p>
                          <select
                            value={reviewForm.rating}
                            onChange={(e) =>
                              setReviewForm({
                                ...reviewForm,
                                rating: Number(e.target.value),
                              })
                            }
                            className="w-full mb-4 p-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-400 bg-white font-medium text-gray-700"
                          >
                            <option value="5">⭐⭐⭐⭐⭐ - Rất hài lòng</option>
                            <option value="4">⭐⭐⭐⭐ - Hài lòng</option>
                            <option value="3">⭐⭐⭐ - Bình thường</option>
                            <option value="2">⭐⭐ - Không hài lòng</option>
                            <option value="1">⭐ - Rất tệ</option>
                          </select>
                          <textarea
                            required
                            placeholder="Chia sẻ cảm nhận chi tiết của bạn..."
                            value={reviewForm.comment}
                            onChange={(e) =>
                              setReviewForm({
                                ...reviewForm,
                                comment: e.target.value,
                              })
                            }
                            className="w-full p-4 rounded-xl border border-blue-200 min-h-[100px] outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium resize-none"
                          />
                          <div className="flex gap-3 mt-4">
                            <button
                              type="submit"
                              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
                            >
                              Gửi đánh giá
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setReviewForm({
                                  rating: 5,
                                  comment: "",
                                  productId: null,
                                })
                              }
                              className="px-6 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-bold text-sm transition-colors"
                            >
                              Hủy
                            </button>
                          </div>
                        </form>
                      )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPage;
