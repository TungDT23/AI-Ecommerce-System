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
  username?: string;
}
interface Review {
  id?: number;
  user?: { id: number; username?: string };
  product?: { id: number };
  rating: number;
  comment: string;
  createdAt?: string;
}
interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  email: string;
  age: number;
  gender: string;
  location: string;
}

interface UserPageProps {
  userAuth: UserData | null;
  onLogout: () => void;
  onLoginClick: () => void;
}

const UserPage: React.FC<UserPageProps> = ({
  userAuth,
  onLogout,
  onLoginClick,
}) => {
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

  // STATE PROFILE & DROPDOWN MENU
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isEditing, SecretIsEditing] = useState<boolean>(false);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // STATE ĐỔI MẬT KHẨU
  const [showChangePassword, setShowChangePassword] = useState<boolean>(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);

  // BẮT SỰ KIỆN VNPAY
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const vnp_ResponseCode = urlParams.get("vnp_ResponseCode");
    const vnp_TxnRef = urlParams.get("vnp_TxnRef");

    if (vnp_ResponseCode && vnp_TxnRef && userAuth) {
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
  }, [userAuth]);

  // EFFECTS NẠP DỮ LIỆU
  useEffect(() => {
    fetchAllProducts();
    if (userAuth) {
      fetchRecommendations();
      fetchCartHistory();
      fetchUserProfile();
    }
  }, [userAuth]);

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
    const headers = userAuth
      ? { Authorization: `Bearer ${userAuth.token}` }
      : {};
    fetch("http://localhost:8888/api/products", { headers })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAllProducts(data);
        } else {
          setAllProducts([]);
        }
      })
      .catch((err) => {
        console.error("Lỗi lấy sản phẩm:", err);
        setAllProducts([]);
      });
  };

  const fetchUserProfile = () => {
    if (!userAuth) return;
    fetch(`http://localhost:8888/api/users/${userAuth.userId}`, {
      headers: { Authorization: `Bearer ${userAuth.token}` },
    })
      .then((res) => res.json())
      .then((data) => setProfileData(data))
      .catch((err) => console.error("Lỗi tải thông tin cá nhân:", err));
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAuth || !profileData) return;

    setIsSavingProfile(true);
    fetch(`http://localhost:8888/api/users/${userAuth.userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userAuth.token}`,
      },
      body: JSON.stringify(profileData),
    })
      .then((res) => {
        if (res.ok) {
          toast.success("Cập nhật thông tin cá nhân thành công!");
          SecretIsEditing(false);
          fetchUserProfile();
        } else {
          toast.error("Có lỗi xảy ra khi cập nhật thông tin!");
        }
      })
      .catch(() => toast.error("Lỗi kết nối server Backend!"))
      .finally(() => setIsSavingProfile(false));
  };

  // ========================================================
  // 🔒 LOGIC ĐỔI MẬT KHẨU KHÔNG BỊ HIỆN DIALOG ĐĂNG XUẤT PHỤ
  // ========================================================
  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAuth) return;

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Mật khẩu mới và xác nhận mật khẩu không trùng khớp!");
      return;
    }

    setIsSavingPassword(true);
    fetch(
      `http://localhost:8888/api/users/${userAuth.userId}/change-password`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userAuth.token}`,
        },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        }),
      },
    )
      .then(async (res) => {
        if (res.ok) {
          // 1. Tắt toàn bộ các popup liên quan đến tài khoản
          setShowChangePassword(false);
          setShowProfile(false);
          setShowDropdown(false);

          // 2. Reset nhanh form dữ liệu
          setPasswordForm({
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
          });

          // 3. Hiển thị thông báo Toast chuẩn chỉnh kéo dài 3.5 giây
          toast.success(
            "Đổi mật khẩu thành công, mời bạn đăng nhập lại để tiếp tục sử dụng!",
            {
              duration: 3500,
              icon: "🔑",
            },
          );

          // 4. CHỐT HẠ: Tự làm sạch dữ liệu đăng nhập và nhảy ra trang chủ (Không gọi onLogout để tránh trôi modal cũ)
          localStorage.removeItem("userAuth"); // Xóa session token lưu ở trình duyệt của sếp

          // Tự reload nhẹ hoặc kích hoạt reset state phiên làm việc tùy theo cấu hình App
          setTimeout(() => {
            window.location.href = "/"; // Đẩy thẳng trình duyệt về trang chủ sạch sẽ
          }, 3500); // Chờ hộp thoại ở trên biến mất trong 3.5 giây rồi chuyển trang luôn!
        } else {
          const errMsg = await res.text();
          toast.error(errMsg || "Mật khẩu cũ không chính xác!");
        }
      })
      .catch(() => toast.error("Lỗi kết nối máy chủ Backend!"))
      .finally(() => setIsSavingPassword(false));
  };

  const fetchUserOrders = () => {
    if (!userAuth) return;
    fetch(`http://localhost:8888/api/orders/user/${userAuth.userId}`, {
      headers: { Authorization: `Bearer ${userAuth.token}` },
    })
      .then((res) => res.json())
      .then((data) => setUserOrders(data));
  };

  const fetchRecommendations = () => {
    if (!userAuth) return;
    fetch(`http://localhost:8888/api/recommendation/display/${userAuth.userId}`)
      .then((res) => res.json())
      .then((data) => setRecommendations(data));
  };

  const fetchCartHistory = () => {
    if (!userAuth) return;
    fetch(`http://localhost:8888/api/activities/cart/${userAuth.userId}`)
      .then((res) => res.json())
      .then((data) => setCartItems(data));
  };

  const trackActivity = (productId: number, action: string) => {
    if (!userAuth) return;
    fetch("http://localhost:8888/api/activities/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userAuth.token}`,
      },
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

  const handleAddToCart = (product: Product) => {
    if (!userAuth) {
      toast("Vui lòng đăng nhập để mua hàng!", { icon: "🔒" });
      onLoginClick();
      return;
    }
    trackActivity(product.id, "add_to_cart");
  };

  const handlePurchaseNow = (product: Product) => {
    if (!userAuth) {
      toast("Vui lòng đăng nhập để mua hàng!", { icon: "🔒" });
      onLoginClick();
      return;
    }
    trackActivity(product.id, "purchase");
    setSelectedProduct(null);
  };

  const handleRemoveFromCart = (productId: number, itemIndex: number) => {
    if (!userAuth) return;
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
    if (!userAuth) return onLoginClick();
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
    if (!userAuth) return onLoginClick();

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
        n.includes("galaxy") ||
        n.includes("redmi");
    if (categoryFilter === "LAPTOP")
      matchCategory = n.includes("laptop") || n.includes("macbook");
    if (categoryFilter === "ACCESSORY")
      matchCategory =
        !n.includes("điện thoại") &&
        !n.includes("iphone") &&
        !n.includes("galaxy") &&
        !n.includes("redmi") &&
        !n.includes("laptop") &&
        !n.includes("macbook");

    return matchName && matchPrice && matchCategory;
  });

  const popupAverageRating =
    currentReviews.length > 0
      ? Math.round(
          currentReviews.reduce((sum, rev) => sum + rev.rating, 0) /
            currentReviews.length,
        )
      : 0;

  const getValidImageUrl = (url?: string) => {
    if (!url) return "https://placehold.co/400x400/eeeeee/999999?text=No+Image";
    if (!url.startsWith("http") && !url.startsWith("/")) {
      return "https://placehold.co/400x400/eeeeee/999999?text=No+Image";
    }
    return url;
  };

  return (
    <div className="min-h-screen bg-[#F5F5FA] font-sans text-gray-800 flex flex-col">
      {/* HEADER STICKY */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex justify-between items-center">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => window.scrollTo(0, 0)}
          >
            <div className="w-10 h-10 bg-blue-600 text-white rounded flex items-center justify-center font-black text-xl">
              AI
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-blue-600 leading-none">
                E-Commerce
              </h1>
              <p className="text-[11px] text-gray-500 mt-0.5 font-semibold">
                {userAuth
                  ? `Xin chào, ${profileData?.fullName || userAuth.username || "Thành viên"}`
                  : "Chào mừng khách hàng"}
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-2xl mx-6">
            <div className="flex w-full border border-gray-300 rounded-sm overflow-hidden focus-within:border-blue-500 transition-colors">
              <input
                type="text"
                placeholder="Tìm sản phẩm, thương hiệu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 text-sm outline-none"
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm font-medium transition-colors">
                Tìm kiếm
              </button>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {userAuth ? (
              <>
                {/* 1. ĐƠN HÀNG */}
                <button
                  onClick={() => {
                    fetchUserOrders();
                    setShowOrders(true);
                  }}
                  className="text-gray-600 hover:text-blue-600 text-sm font-medium flex flex-col items-center"
                >
                  <span className="text-xl leading-none">🧾</span>
                  <span className="text-[10px] mt-1">Đơn hàng</span>
                </button>

                {/* 2. GIỎ HÀNG */}
                <button
                  onClick={() => setShowCart(true)}
                  className="relative text-gray-600 hover:text-blue-600 text-sm font-medium flex flex-col items-center"
                >
                  <span className="text-xl leading-none">🛒</span>
                  <span className="text-[10px] mt-1">Giỏ hàng</span>
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white leisure-none">
                      {cartItems.length}
                    </span>
                  )}
                </button>

                <span className="text-gray-200 h-6 border-r border-gray-300"></span>

                {/* 3. TÀI KHOẢN DROP-DOWN */}
                <div
                  className="relative"
                  onMouseEnter={() => setShowDropdown(true)}
                  onMouseLeave={() => setShowDropdown(false)}
                >
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="text-gray-600 hover:text-blue-600 text-sm font-medium flex flex-col items-center focus:outline-none"
                  >
                    <span className="text-xl leading-none">👤</span>
                    <span className="text-[10px] mt-1 flex items-center gap-0.5">
                      Tài khoản <span className="text-[8px]">▼</span>
                    </span>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-sm shadow-xl py-1 z-50 animate-fade-in">
                      <button
                        onClick={() => {
                          fetchUserProfile();
                          SecretIsEditing(false);
                          setShowProfile(true);
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors"
                      >
                        👤 Thông tin cá nhân
                      </button>
                      <button
                        onClick={() => {
                          setShowChangePassword(true);
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors"
                      >
                        🔒 Đổi mật khẩu
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 font-bold transition-colors"
                      >
                        🚪 Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={onLoginClick}
                className="bg-blue-600 text-white px-5 py-2 text-sm font-bold rounded-sm hover:bg-blue-700 transition-colors shadow-sm"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 py-6 flex-1 w-full flex flex-col gap-6">
        {/* KHU VỰC GỢI Ý AI */}
        {userAuth && recommendations.length > 0 && (
          <section className="bg-white p-4 sm:p-6 rounded-sm shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-gray-800 uppercase">
                Gợi ý hôm nay
              </h2>
              <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] px-2 py-0.5 rounded-sm font-medium">
                Dành cho bạn
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedProduct(rec.product);
                    trackActivity(rec.product.id, "view_product");
                  }}
                  className="group bg-white border border-gray-200 rounded-sm hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex flex-col relative"
                >
                  <div className="w-full aspect-square p-2 bg-white">
                    <img
                      src={getValidImageUrl(rec.product.imageUrl)}
                      alt={rec.product.name}
                      className="w-full h-full object-contain group-hover:-translate-y-1 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-2.5 flex flex-col flex-1 border-t border-gray-50">
                    <h3 className="text-sm text-gray-800 line-clamp-2 leading-snug min-h-[40px] mb-1">
                      {rec.product.name}
                    </h3>
                    <RealProductRating productId={rec.product.id} />
                    <div className="mt-1 mb-2">
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>Độ phù hợp AI</span>
                        <span className="text-blue-600 font-medium">
                          {Math.round(rec.confidenceScore * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-1"
                          style={{
                            width: `${Math.round(rec.confidenceScore * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="mt-auto pt-2 text-red-500 font-medium text-base">
                      {(rec.product.price || 0).toLocaleString()} ₫
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* KHU VỰC TẤT CẢ SẢN PHẨM */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 bg-white p-4 rounded-sm shadow-sm gap-4">
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto scrollbar-hide">
              {[
                { id: "ALL", label: "Tất cả" },
                { id: "PHONE", label: "Điện thoại" },
                { id: "LAPTOP", label: "Laptop" },
                { id: "ACCESSORY", label: "Phụ kiện" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-5 py-1.5 text-sm rounded-sm border whitespace-nowrap transition-colors ${categoryFilter === cat.id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 text-sm border border-gray-300 rounded-sm text-gray-700 outline-none focus:border-blue-500 bg-white"
            >
              <option value="ALL">Giá: Tất cả</option>
              <option value="D_1M">Dưới 1 triệu</option>
              <option value="1M_10M">1 triệu - 10 triệu</option>
              <option value="U_10M">Trên 10 triệu</option>
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full bg-white py-16 text-center text-gray-500 rounded-sm">
                Không tìm thấy sản phẩm phù hợp.
              </div>
            ) : (
              filteredProducts.map((prod, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedProduct(prod);
                    trackActivity(prod.id, "view_product");
                  }}
                  className="group bg-white border border-gray-200 rounded-sm hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex flex-col"
                >
                  <div className="w-full aspect-square p-2 bg-white border-b border-gray-50">
                    <img
                      src={getValidImageUrl(prod.imageUrl)}
                      alt={prod.name}
                      className="w-full h-full object-contain group-hover:-translate-y-1 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-2.5 flex flex-col flex-1">
                    <h3 className="text-sm text-gray-800 line-clamp-2 leading-snug min-h-[40px] mb-1">
                      {prod.name}
                    </h3>
                    <RealProductRating productId={prod.id} />
                    <div className="mt-auto pt-2 text-red-500 font-medium text-base mb-2">
                      {(prod.price || 0).toLocaleString()} ₫
                    </div>
                  </div>
                  <div className="px-2.5 pb-2.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(prod);
                      }}
                      className="w-full py-1.5 border border-blue-600 text-blue-600 text-xs font-medium rounded-sm hover:bg-blue-600 hover:text-white transition-colors"
                    >
                      Thêm vào giỏ
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* 👤 POPUP 1: HỒ SƠ CÁ NHÂN */}
      {showProfile && profileData && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowProfile(false)}
        >
          <div
            className="bg-white rounded-sm max-w-md w-full relative shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide">
                ⚙️ Hồ Sơ Cá Nhân
              </h2>
              <button
                onClick={() => setShowProfile(false)}
                className="text-gray-400 hover:text-gray-800 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={profileData.fullName || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData, fullName: e.target.value })
                  }
                  className={`w-full border rounded-sm px-3 py-2 text-sm outline-none ${isEditing ? "border-blue-500 bg-white" : "border-gray-200 bg-gray-50 text-gray-500"}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                  Tên tài khoản
                </label>
                <input
                  type="text"
                  disabled
                  value={profileData.username || ""}
                  className="w-full bg-gray-100 border border-gray-200 rounded-sm px-3 py-2 text-sm text-gray-400 outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                  Địa chỉ Email *
                </label>
                <input
                  type="email"
                  required
                  disabled={!isEditing}
                  value={profileData.email || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                  className={`w-full border rounded-sm px-3 py-2 text-sm outline-none ${isEditing ? "border-blue-500 bg-white" : "border-gray-200 bg-gray-50 text-gray-500"}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                    Tuổi *
                  </label>
                  <input
                    type="number"
                    required
                    disabled={!isEditing}
                    value={profileData.age || ""}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        age: Number(e.target.value),
                      })
                    }
                    className={`w-full border rounded-sm px-3 py-2 text-sm outline-none ${isEditing ? "border-blue-500 bg-white" : "border-gray-200 bg-gray-50 text-gray-500"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                    Giới tính
                  </label>
                  <select
                    disabled={!isEditing}
                    value={profileData.gender || "Nam"}
                    onChange={(e) =>
                      setProfileData({ ...profileData, gender: e.target.value })
                    }
                    className={`w-full border rounded-sm px-3 py-2 text-sm outline-none ${isEditing ? "border-blue-500 bg-white" : "border-gray-200 bg-gray-50 text-gray-500"}`}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                  Địa chỉ nơi ở *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={profileData.location || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData, location: e.target.value })
                  }
                  className={`w-full border rounded-sm px-3 py-2 text-sm outline-none ${isEditing ? "border-blue-500 bg-white" : "border-gray-200 bg-gray-50 text-gray-500"}`}
                />
              </div>
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => SecretIsEditing(true)}
                    className="w-full py-2 text-sm font-bold text-white bg-blue-600 rounded-sm hover:bg-blue-700 shadow-sm text-center"
                  >
                    ✏️ Chỉnh sửa hồ sơ
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        SecretIsEditing(false);
                        fetchUserProfile();
                      }}
                      className="flex-1 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-sm hover:bg-gray-200"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="flex-1 py-2 text-sm font-bold text-white bg-green-600 rounded-sm hover:bg-green-700 shadow-sm"
                    >
                      {isSavingProfile ? "Đang lưu..." : "💾 Cập nhật"}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔒 POPUP 2: THAY ĐỔI MẬT KHẨU */}
      {showChangePassword && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowChangePassword(false)}
        >
          <div
            className="bg-white rounded-sm max-w-sm w-full relative shadow-2xl flex flex-col overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide">
                🔒 Thay đổi mật khẩu
              </h2>
              <button
                onClick={() => setShowChangePassword(false)}
                className="text-gray-400 hover:text-gray-800 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={handleChangePasswordSubmit}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                  Mật khẩu hiện tại *
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.oldPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      oldPassword: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-gray-300 rounded-sm px-3 py-2 text-sm text-gray-800 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Nhập mật khẩu cũ đang dùng"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                  Mật khẩu mới *
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-gray-300 rounded-sm px-3 py-2 text-sm text-gray-800 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                  Xác nhận mật khẩu mới *
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-gray-300 rounded-sm px-3 py-2 text-sm text-gray-800 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordForm({
                      oldPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  className="flex-1 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-sm hover:bg-gray-200"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="flex-1 py-2 text-sm font-bold text-white bg-blue-600 rounded-sm hover:bg-blue-700 shadow-sm"
                >
                  {isSavingPassword ? "Đang lưu..." : "🔑 Đổi mật khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUPS PHỤ TRỢ (SẢN PHẨM, GIỎ HÀNG, ĐƠN HÀNG) */}
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white rounded-sm max-w-4xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-3 right-3 z-10 text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center font-bold"
            >
              ✕
            </button>
            <div className="md:w-1/2 p-6 flex items-center justify-center border-r border-gray-100">
              <img
                src={getValidImageUrl(selectedProduct.imageUrl)}
                alt={selectedProduct.name}
                className="max-h-96 object-contain"
              />
            </div>
            <div className="md:w-1/2 p-6 md:p-8 flex flex-col bg-gray-50/50">
              <span className="text-blue-600 text-xs font-bold uppercase mb-2 tracking-wider">
                {selectedProduct.brand}
              </span>
              <h2 className="text-2xl text-gray-800 font-medium leading-tight mb-3">
                {selectedProduct.name}
              </h2>
              <div className="flex items-center gap-3 mb-4 text-sm text-gray-600 border-b border-gray-200 pb-4">
                {currentReviews.length > 0 ? (
                  <>
                    <span className="text-yellow-400 tracking-widest">
                      {"★".repeat(popupAverageRating)}
                      <span className="text-gray-300">
                        {"★".repeat(5 - popupAverageRating)}
                      </span>
                    </span>
                    <span className="text-blue-600 hover:underline cursor-pointer">
                      {currentReviews.length} Đánh giá
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400">Chưa có đánh giá</span>
                )}
              </div>
              <div className="bg-gray-100/80 p-4 rounded-sm mb-6">
                <span className="text-3xl font-medium text-red-500">
                  {selectedProduct.price.toLocaleString()} ₫
                </span>
              </div>
              <div className="mt-auto flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="flex-1 bg-red-50 border border-red-500 text-red-600 font-medium py-3 rounded-sm hover:bg-red-100"
                >
                  Thêm Vào Giỏ
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePurchaseNow(selectedProduct);
                  }}
                  className="flex-1 bg-red-500 text-white font-medium py-3 rounded-sm hover:bg-red-600 shadow-sm"
                >
                  Mua Ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCart(false)}
          />
          <div className="relative w-full max-w-sm bg-white h-full flex flex-col shadow-2xl">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-medium text-gray-800">
                Giỏ hàng ({cartItems.length})
              </h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-400 hover:text-gray-800"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">
                  Giỏ hàng trống
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="flex gap-3 bg-white p-3 rounded-sm border border-gray-200 relative group hover:border-blue-300"
                  >
                    <img
                      src={getValidImageUrl(item.imageUrl)}
                      alt=""
                      className="w-16 h-16 object-contain border border-gray-100 p-1"
                    />
                    <div className="flex-1 pr-6">
                      <h4 className="text-sm text-gray-800 line-clamp-2">
                        {item.name}
                      </h4>
                      <p className="text-red-500 font-medium mt-1">
                        {item.price.toLocaleString()} ₫
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.id, idx)}
                      className="absolute bottom-3 right-3 text-gray-400 hover:text-red-500 text-xs underline"
                    >
                      Xóa
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex justify-between mb-4">
                <span className="text-gray-600">Tổng tạm tính:</span>
                <span className="text-red-500 font-medium text-xl">
                  {cartItems
                    .reduce((sum, item) => sum + item.price, 0)
                    .toLocaleString()}{" "}
                  ₫
                </span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
                className={`w-full py-3 rounded-sm font-medium transition-colors ${cartItems.length === 0 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-red-500 text-white hover:bg-red-600"}`}
              >
                Tiến hành thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

      {showOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowOrders(false)}
          />
          <div className="bg-[#F5F5FA] rounded-sm shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col relative z-10 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-800">
                Đơn hàng của tôi
              </h2>
              <button
                onClick={() => setShowOrders(false)}
                className="text-gray-400 hover:text-gray-800"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {userOrders.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  Chưa có đơn hàng nào.
                </div>
              ) : (
                userOrders.map((entry, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-gray-200 rounded-sm"
                  >
                    <div className="flex justify-between items-center p-3 border-b border-gray-100 bg-gray-50/50">
                      <div>
                        <span className="text-sm font-medium text-gray-800 mr-3">
                          Mã đơn: #{entry.order.id}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.order.orderDate).toLocaleString(
                            "vi-VN",
                          )}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 uppercase font-medium ${entry.order.status === "HOÀN THÀNH" ? "text-green-600" : "text-blue-600"}`}
                      >
                        {entry.order.status}
                      </span>
                    </div>
                    <div className="p-3">
                      {entry.items.map((item: any, i: number) => (
                        <div
                          key={i}
                          className="flex justify-between items-center mb-3 last:mb-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 border border-gray-100 flex items-center justify-center">
                              <img
                                src={getValidImageUrl(item.product?.imageUrl)}
                                className="max-h-full max-w-full object-contain p-1"
                                alt=""
                              />
                            </div>
                            <div>
                              <p className="text-sm text-gray-800">
                                {item.product?.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                x{item.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-red-500">
                              {item.priceAtPurchase.toLocaleString()} ₫
                            </span>
                            {entry.order.status === "HOÀN THÀNH" && (
                              <button
                                onClick={() =>
                                  setReviewForm({
                                    ...reviewForm,
                                    productId: item.product?.id,
                                  })
                                }
                                className="block mt-1 text-[11px] text-blue-600 border border-blue-600 px-2 py-0.5 rounded-sm hover:bg-blue-50"
                              >
                                Đánh giá
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-100 text-right bg-gray-50/50">
                      <span className="text-sm text-gray-600 mr-2">
                        Tổng số tiền:
                      </span>
                      <span className="text-lg text-red-500 font-medium">
                        {entry.order.totalAmount.toLocaleString()} ₫
                      </span>
                    </div>
                    {reviewForm.productId &&
                      entry.items.some(
                        (it: any) => it.product?.id === reviewForm.productId,
                      ) && (
                        <form
                          onSubmit={submitReview}
                          className="p-4 border-t border-gray-200 bg-blue-50/30"
                        >
                          <p className="text-sm font-medium text-gray-800 mb-2">
                            Đánh giá sản phẩm
                          </p>
                          <select
                            value={reviewForm.rating}
                            onChange={(e) =>
                              setReviewForm({
                                ...reviewForm,
                                rating: Number(e.target.value),
                              })
                            }
                            className="w-full mb-3 p-2 text-sm border border-gray-300 rounded-sm bg-white outline-none focus:border-blue-500"
                          >
                            <option value="5">5 Sao - Rất hài lòng</option>
                            <option value="4">4 Sao - Hài lòng</option>
                            <option value="3">3 Sao - Bình thường</option>
                            <option value="2">2 Sao - Không hài lòng</option>
                            <option value="1">1 Sao - Rất tệ</option>
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
                            className="w-full p-2 text-sm border border-gray-300 rounded-sm bg-white outline-none focus:border-blue-500 min-h-[80px]"
                          />
                          <div className="flex gap-2 mt-2 justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                setReviewForm({
                                  rating: 5,
                                  comment: "",
                                  productId: null,
                                })
                              }
                              className="px-4 py-1.5 text-sm text-gray-600 border border-gray-300 bg-white rounded-sm hover:bg-gray-50"
                            >
                              Hủy
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-1.5 text-sm text-white bg-blue-600 rounded-sm hover:bg-blue-700"
                            >
                              Gửi đánh giá
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
