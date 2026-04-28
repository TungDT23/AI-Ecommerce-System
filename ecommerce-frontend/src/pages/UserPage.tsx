import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

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
        .then((data) => setCurrentReviews(data))
        .catch(console.error);
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

  // MỚI: HÀM XÓA SẢN PHẨM KHỎI GIỎ HÀNG
  const handleRemoveFromCart = (productId: number, itemIndex: number) => {
    // 1. Xóa tạm thời trên giao diện cho mượt
    const newCart = [...cartItems];
    newCart.splice(itemIndex, 1);
    setCartItems(newCart);
    toast.success("Đã xóa khỏi giỏ hàng");

    // 2. Gọi API báo Backend xóa thật trong DB
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
      }
    });
  };

  // LOGIC LỌC TÌM KIẾM
  const filteredProducts = allProducts.filter((p) => {
    const matchName =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase());
    let matchPrice = true;
    if (priceFilter === "D_1M") matchPrice = p.price < 1000000;
    if (priceFilter === "1M_10M")
      matchPrice = p.price >= 1000000 && p.price <= 10000000;
    if (priceFilter === "U_10M") matchPrice = p.price > 10000000;
    return matchName && matchPrice;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8 relative">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm">
          <div className="px-4">
            <h1 className="text-3xl font-bold text-gray-800">Cửa hàng AI 🤖</h1>
            <p className="text-gray-500">
              Xin chào, thành viên #{userAuth.userId} 👋
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                fetchUserOrders();
                setShowOrders(true);
              }}
              className="bg-white border border-gray-300 px-6 py-2 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-colors"
            >
              🧾 Lịch sử đơn hàng
            </button>
            <button
              onClick={() => setShowCart(true)}
              className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold shadow-sm hover:bg-gray-800"
            >
              🛒 Giỏ hàng ({cartItems.length})
            </button>
            <button
              onClick={onLogout}
              className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-100"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            ✨ Gợi ý dành cho bạn
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                onClick={() => {
                  setSelectedProduct(rec.product);
                  trackActivity(rec.product.id, "view_product");
                }}
                className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg cursor-pointer flex flex-col transition-all border border-transparent hover:border-blue-100"
              >
                <div className="mb-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full ${rec.confidenceScore > 0 ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}
                  >
                    {rec.confidenceScore > 0 ? "DÀNH CHO BẠN" : "XU HƯỚNG"}
                  </span>
                </div>
                <div className="w-full h-48 my-3 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                  {rec.product.imageUrl ? (
                    <img
                      src={rec.product.imageUrl}
                      alt={rec.product.name}
                      className="w-full h-full object-cover mix-blend-multiply hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-gray-300 text-sm">Chưa có ảnh</span>
                  )}
                </div>
                <h3
                  className="font-bold mt-2 line-clamp-2"
                  title={rec.product.name}
                >
                  {rec.product.name}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {rec.product.brand}
                </p>
                <div className="mt-auto pt-4 border-t border-gray-50">
                  <p className="text-red-500 font-bold text-lg">
                    {rec.product.price.toLocaleString()} đ
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      trackActivity(rec.product.id, "add_to_cart");
                    }}
                    className="w-full mt-4 bg-blue-50 text-blue-700 py-2 rounded-xl font-semibold hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    + Thêm vào giỏ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4 border-t pt-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              📦 Khám phá kho hàng
            </h2>
            <div className="flex gap-4 w-full md:w-auto">
              <input
                type="text"
                placeholder="🔍 Tìm tên hoặc thương hiệu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 md:w-64 px-4 py-2 border rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="px-4 py-2 border rounded-xl outline-none focus:border-blue-500 bg-white cursor-pointer"
              >
                <option value="ALL">Tất cả mức giá</option>
                <option value="D_1M">Dưới 1 triệu</option>
                <option value="1M_10M">Từ 1 - 10 triệu</option>
                <option value="U_10M">Trên 10 triệu</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {filteredProducts.length === 0 ? (
              <div className="col-span-4 text-center py-12 text-gray-500">
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
                  className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg cursor-pointer flex flex-col transition-all"
                >
                  <div className="w-full h-48 mb-3 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                    {prod.imageUrl ? (
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover mix-blend-multiply hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-gray-300 text-sm">Chưa có ảnh</span>
                    )}
                  </div>
                  <h3 className="font-bold mt-2 line-clamp-2" title={prod.name}>
                    {prod.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">{prod.brand}</p>
                  <div className="mt-auto pt-4">
                    <p className="text-red-500 font-bold text-lg">
                      {prod.price.toLocaleString()} đ
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        trackActivity(prod.id, "add_to_cart");
                      }}
                      className="w-full mt-4 bg-gray-100 text-gray-800 py-2 rounded-xl font-semibold hover:bg-gray-900 hover:text-white transition-colors"
                    >
                      + Thêm vào giỏ
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* POPUP SẢN PHẨM */}
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition-all"
            >
              ✕
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="w-full h-56 mt-2 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                ) : (
                  <span className="text-gray-300">Chưa có ảnh</span>
                )}
              </div>
              <div className="flex flex-col justify-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {selectedProduct.name}
                </h2>
                <p className="text-gray-500 mb-4">
                  Thương hiệu:{" "}
                  <span className="font-semibold">{selectedProduct.brand}</span>
                </p>
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <span className="text-3xl font-bold text-red-500">
                    {selectedProduct.price.toLocaleString()} đ
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    trackActivity(selectedProduct.id, "add_to_cart");
                    setSelectedProduct(null);
                  }}
                  className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Thêm vào giỏ hàng ngay
                </button>
              </div>
            </div>
            <div className="border-t pt-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                Đánh giá từ khách hàng ({currentReviews.length})
              </h3>
              <div className="space-y-4">
                {currentReviews.length === 0 ? (
                  <p className="text-gray-400 italic text-sm">
                    Chưa có đánh giá nào cho sản phẩm này.
                  </p>
                ) : (
                  currentReviews.map((rev, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 p-4 rounded-xl border border-gray-100"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-blue-600 text-sm">
                          Khách hàng #{rev.user?.id}
                        </span>
                        <span className="text-yellow-500 text-sm">
                          {"★".repeat(rev.rating)}
                          <span className="text-gray-300">
                            {"★".repeat(5 - rev.rating)}
                          </span>
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">{rev.comment}</p>
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
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowCart(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Giỏ hàng của bạn
              </h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-2xl text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <span className="text-4xl mb-4">🛒</span>
                  <p>Giỏ hàng đang trống</p>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:shadow-sm transition-all group"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt="img"
                        className="w-14 h-14 object-cover rounded-lg bg-white p-1"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gray-200 rounded-lg"></div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-gray-800 line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="font-bold text-blue-600 mt-1">
                        {item.price.toLocaleString()} đ
                      </p>
                    </div>
                    {/* Nút Xóa Sản Phẩm */}
                    <button
                      onClick={() => handleRemoveFromCart(item.id, idx)}
                      className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all font-bold"
                      title="Xóa khỏi giỏ"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-6 border-t mt-6 bg-white">
              <div className="flex justify-between mb-4 font-bold text-lg">
                <span>Tổng tiền:</span>
                <span className="text-red-500">
                  {cartItems
                    .reduce((sum, item) => sum + item.price, 0)
                    .toLocaleString()}{" "}
                  đ
                </span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-colors ${cartItems.length === 0 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
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
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowOrders(false)}
          />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col relative z-10 overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0">
              <h2 className="text-2xl font-bold text-gray-800">
                Lịch sử Đơn hàng
              </h2>
              <button
                onClick={() => setShowOrders(false)}
                className="text-gray-500 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50">
              {userOrders.length === 0 ? (
                <p className="text-center text-gray-500 mt-4">
                  Bạn chưa có đơn hàng nào.
                </p>
              ) : (
                userOrders.map((entry, idx) => (
                  <div
                    key={idx}
                    className="bg-white border rounded-xl p-5 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-4 border-b pb-3">
                      <div>
                        <p className="font-bold text-gray-800 text-lg">
                          Mã đơn: #{entry.order.id}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(entry.order.orderDate).toLocaleString(
                            "vi-VN",
                          )}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${entry.order.status === "CHỜ THANH TOÁN" ? "bg-red-100 text-red-700" : entry.order.status === "ĐÃ THANH TOÁN" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {entry.order.status}
                      </span>
                    </div>
                    <div className="space-y-3 mb-4">
                      {entry.items.map((item: any, i: number) => (
                        <div
                          key={i}
                          className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100"
                        >
                          <div className="flex-1">
                            <span className="font-medium text-gray-700 text-sm">
                              {item.product?.name} (x{item.quantity})
                            </span>
                            {entry.order.status === "HOÀN THÀNH" && (
                              <button
                                onClick={() =>
                                  setReviewForm({
                                    ...reviewForm,
                                    productId: item.product?.id,
                                  })
                                }
                                className="block mt-1 text-blue-600 text-xs font-bold hover:underline"
                              >
                                Đánh giá sản phẩm này
                              </button>
                            )}
                          </div>
                          <span className="text-gray-600 text-sm font-semibold">
                            {item.priceAtPurchase.toLocaleString()} đ
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t flex justify-between items-center font-bold text-gray-800">
                      <span>Tổng cộng:</span>
                      <span className="text-red-500 text-xl">
                        {entry.order.totalAmount.toLocaleString()} đ
                      </span>
                    </div>

                    {reviewForm.productId &&
                      entry.items.some(
                        (it: any) => it.product?.id === reviewForm.productId,
                      ) && (
                        <form
                          onSubmit={submitReview}
                          className="mt-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100 shadow-inner"
                        >
                          <p className="font-bold mb-3 text-blue-800 text-sm">
                            Gửi đánh giá cho sản phẩm này
                          </p>
                          <select
                            value={reviewForm.rating}
                            onChange={(e) =>
                              setReviewForm({
                                ...reviewForm,
                                rating: Number(e.target.value),
                              })
                            }
                            className="w-full mb-3 p-2 rounded-lg border border-blue-200 outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                          >
                            <option value="5">5 Sao - Rất hài lòng</option>
                            <option value="4">4 Sao - Hài lòng</option>
                            <option value="3">3 Sao - Bình thường</option>
                            <option value="2">2 Sao - Không hài lòng</option>
                            <option value="1">1 Sao - Rất tệ</option>
                          </select>
                          <textarea
                            required
                            placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                            value={reviewForm.comment}
                            onChange={(e) =>
                              setReviewForm({
                                ...reviewForm,
                                comment: e.target.value,
                              })
                            }
                            className="w-full p-3 rounded-lg border border-blue-200 min-h-[80px] outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                          />
                          <div className="flex gap-2 mt-3">
                            <button
                              type="submit"
                              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors text-sm"
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
                              className="px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold text-sm transition-colors"
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
