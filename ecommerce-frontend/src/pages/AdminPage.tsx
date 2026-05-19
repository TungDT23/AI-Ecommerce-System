import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import toast from "react-hot-toast";

// --- INTERFACES ---
interface Product {
  id: number;
  name: string;
  price: number;
  brand: string;
  imageUrl?: string;
}
interface UserData {
  userId: number;
  role: string;
  token: string;
}

interface AdminPageProps {
  userAuth: UserData;
  onLogout: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ userAuth, onLogout }) => {
  const [adminTab, setAdminTab] = useState<"dashboard" | "products" | "orders">(
    "dashboard",
  );
  const [adminActivities, setAdminActivities] = useState<any[]>([]);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [productForm, setProductForm] = useState({
    name: "",
    price: 0,
    brand: "",
    imageUrl: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  // EFFECTS
  useEffect(() => {
    fetch("http://localhost:8888/api/admin/activities", {
      headers: { Authorization: `Bearer ${userAuth.token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const sorted = data.sort(
          (a: any, b: any) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
        setAdminActivities(sorted);
      })
      .catch(console.error);
    fetchAdminProducts();
    fetchAdminOrders();
  }, [userAuth]);

  // API CAllS
  const fetchAdminProducts = () => {
    fetch("http://localhost:8888/api/admin/products", {
      headers: { Authorization: `Bearer ${userAuth.token}` },
    })
      .then((res) => res.json())
      .then((data) => setAdminProducts(data));
  };

  const fetchAdminOrders = () => {
    fetch("http://localhost:8888/api/orders/admin/all", {
      headers: { Authorization: `Bearer ${userAuth.token}` },
    })
      .then((res) => res.json())
      .then((data) => setAdminOrders(data));
  };

  const updateOrderStatus = (orderId: number, status: string) => {
    fetch(
      `http://localhost:8888/api/orders/admin/${orderId}/status?status=${status}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${userAuth.token}` },
      },
    ).then((res) => {
      if (res.ok) {
        fetchAdminOrders();
        toast.success(`Đã cập nhật đơn #${orderId} thành ${status}`);
      }
    });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId
      ? `http://localhost:8888/api/admin/products/${editingId}`
      : `http://localhost:8888/api/admin/products`;
    fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userAuth.token}`,
      },
      body: JSON.stringify(productForm),
    }).then(() => {
      fetchAdminProducts();
      setProductForm({ name: "", price: 0, brand: "", imageUrl: "" });
      setEditingId(null);
      toast.success(
        editingId ? "Cập nhật thành công!" : "Thêm mới thành công!",
      );
    });
  };

  const handleEditClick = (prod: Product) => {
    setEditingId(prod.id);
    setProductForm({
      name: prod.name,
      price: prod.price,
      brand: prod.brand,
      imageUrl: prod.imageUrl || "",
    });
  };

  const handleDeleteProduct = (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
    fetch(`http://localhost:8888/api/admin/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${userAuth.token}` },
    }).then((res) => {
      if (res.ok) {
        fetchAdminProducts();
        toast.success("Đã xóa sản phẩm!");
      } else {
        toast.error("Không thể xóa sản phẩm đang có trong lịch sử!");
      }
    });
  };

  // LOGIC BIỂU ĐỒ
  const getPieChartData = () => {
    let views = 0,
      carts = 0,
      purchases = 0;
    adminActivities.forEach((act) => {
      if (act.action === "view_product") views++;
      if (act.action === "add_to_cart") carts++;
      if (act.action === "purchase") purchases++;
    });
    return [
      { name: "Xem SP", value: views },
      { name: "Thêm Giỏ", value: carts },
      { name: "Mua Hàng", value: purchases },
    ];
  };
  const PIE_COLORS = ["#6366f1", "#f59e0b", "#10b981"]; // Đổi màu Xanh dương thành Xanh Chàm (Indigo)

  const getBarChartData = () => {
    const productStats: any = {};
    adminActivities.forEach((act) => {
      const pid = act.productId;
      if (!productStats[pid])
        productStats[pid] = {
          name: `SP #${pid}`,
          view: 0,
          cart: 0,
          purchase: 0,
        };
      if (act.action === "view_product") productStats[pid].view++;
      if (act.action === "add_to_cart") productStats[pid].cart++;
      if (act.action === "purchase") productStats[pid].purchase++;
    });
    return Object.values(productStats)
      .sort((a: any, b: any) => b.purchase - a.purchase || b.cart - a.cart)
      .slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800 flex flex-col">
      {/* HEADER STICKY (NỀN TỐI QUYỀN LỰC) */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 text-white rounded flex items-center justify-center font-black text-xl shadow-inner">
              AD
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none tracking-wide text-indigo-50">
                Kênh Người Bán
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5 uppercase tracking-widest">
                E-Commerce AI System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-900 bg-indigo-100 px-3 py-1.5 rounded-sm shadow-sm">
              Quản trị viên
            </span>
            <span className="text-slate-600">|</span>
            <button
              onClick={onLogout}
              className="text-slate-300 hover:text-red-400 text-sm font-medium transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 py-6 flex-1 w-full flex flex-col">
        {/* NAV TABS (Giao diện thẻ gạch chân tông màu Indigo) */}
        <div className="bg-white rounded-sm shadow-sm border border-slate-200 flex overflow-x-auto mb-6">
          <button
            onClick={() => setAdminTab("dashboard")}
            className={`px-6 py-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${adminTab === "dashboard" ? "border-indigo-600 text-indigo-700 bg-indigo-50/30" : "border-transparent text-slate-500 hover:text-indigo-600 hover:bg-slate-50"}`}
          >
            📡 Tổng quan AI
          </button>
          <button
            onClick={() => setAdminTab("products")}
            className={`px-6 py-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${adminTab === "products" ? "border-indigo-600 text-indigo-700 bg-indigo-50/30" : "border-transparent text-slate-500 hover:text-indigo-600 hover:bg-slate-50"}`}
          >
            📦 Quản lý Sản phẩm
          </button>
          <button
            onClick={() => {
              setAdminTab("orders");
              fetchAdminOrders();
            }}
            className={`px-6 py-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${adminTab === "orders" ? "border-indigo-600 text-indigo-700 bg-indigo-50/30" : "border-transparent text-slate-500 hover:text-indigo-600 hover:bg-slate-50"}`}
          >
            🧾 Quản lý Đơn hàng
          </button>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: DASHBOARD                                                  */}
        {/* ================================================================= */}
        {adminTab === "dashboard" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Chart Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm col-span-1">
                <h3 className="text-slate-700 font-black mb-6 text-xs uppercase tracking-wider">
                  Tỷ lệ Hành vi Khách hàng
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getPieChartData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {getPieChartData().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          borderColor: "#e2e8f0",
                          borderRadius: "4px",
                          fontSize: "12px",
                          color: "#0f172a",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{
                          fontSize: "12px",
                          color: "#475569",
                          fontWeight: 500,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm col-span-2">
                <h3 className="text-slate-700 font-black mb-6 text-xs uppercase tracking-wider">
                  Top 5 Sản phẩm được quan tâm
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getBarChartData()}>
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        fontWeight={500}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={11}
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                      />
                      <RechartsTooltip
                        cursor={{ fill: "#f8fafc" }}
                        contentStyle={{
                          backgroundColor: "#fff",
                          borderColor: "#e2e8f0",
                          borderRadius: "4px",
                          fontSize: "12px",
                          color: "#0f172a",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Legend
                        iconType="circle"
                        wrapperStyle={{
                          fontSize: "12px",
                          color: "#475569",
                          fontWeight: 500,
                        }}
                      />
                      <Bar
                        dataKey="view"
                        name="Lượt Xem"
                        fill="#6366f1"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="cart"
                        name="Thêm Giỏ"
                        fill="#f59e0b"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="purchase"
                        name="Lượt Mua"
                        fill="#10b981"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Live Data Table */}
            <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="text-slate-700 font-black text-xs uppercase tracking-wider">
                  📡 Luồng Dữ Liệu Real-time
                </h3>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                </span>
              </div>
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-white text-slate-400 sticky top-0 border-b border-slate-200 uppercase text-[10px] font-black tracking-wider z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-3">Thời gian</th>
                      <th className="px-6 py-3">Khách hàng</th>
                      <th className="px-6 py-3">Hành vi</th>
                      <th className="px-6 py-3">Sản phẩm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adminActivities.map((act, index) => (
                      <tr
                        key={index}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-3.5 whitespace-nowrap text-xs font-medium text-slate-500">
                          {new Date(act.timestamp).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-slate-800">
                          User #{act.userId}
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-sm text-[10px] font-black border uppercase tracking-wider ${act.action === "purchase" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : act.action === "add_to_cart" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-indigo-50 text-indigo-600 border-indigo-200"}`}
                          >
                            {act.action}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-700 font-medium">
                          Món đồ #{act.productId}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: PRODUCTS                                                   */}
        {/* ================================================================= */}
        {adminTab === "products" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Form Thêm/Sửa */}
            <div className="lg:col-span-1 bg-white p-6 rounded-sm border border-slate-200 shadow-sm h-fit">
              <h3 className="text-slate-700 font-black mb-5 text-xs uppercase tracking-wider border-b border-slate-100 pb-3">
                {editingId ? "✏️ Sửa Sản Phẩm" : "✨ Thêm Sản Phẩm"}
              </h3>
              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm({ ...productForm, name: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 rounded-sm px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Thương hiệu *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.brand}
                    onChange={(e) =>
                      setProductForm({ ...productForm, brand: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 rounded-sm px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Giá bán (VNĐ) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-sm px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Link Ảnh (URL)
                  </label>
                  <input
                    type="text"
                    value={productForm.imageUrl}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        imageUrl: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-sm px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex gap-2 pt-3">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-sm font-bold py-2.5 rounded-sm hover:bg-indigo-700 text-white transition-colors shadow-sm shadow-indigo-200"
                  >
                    {editingId ? "Lưu thay đổi" : "Tạo mới"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setProductForm({
                          name: "",
                          price: 0,
                          brand: "",
                          imageUrl: "",
                        });
                      }}
                      className="px-5 text-sm bg-slate-100 text-slate-600 font-bold rounded-sm hover:bg-slate-200 transition-colors"
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Danh sách SP */}
            <div className="lg:col-span-2 bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="text-slate-700 font-black text-xs uppercase tracking-wider">
                  📦 Kho Hàng Hiện Tại
                </h3>
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-sm font-bold border border-indigo-100">
                  Tổng: {adminProducts.length} SP
                </span>
              </div>
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-white text-slate-400 sticky top-0 border-b border-slate-200 uppercase text-[10px] font-black tracking-wider z-10 shadow-sm">
                    <tr>
                      <th className="px-5 py-3">Sản phẩm</th>
                      <th className="px-5 py-3">Thương hiệu</th>
                      <th className="px-5 py-3">Giá bán</th>
                      <th className="px-5 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adminProducts.map((prod) => (
                      <tr
                        key={prod.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white border border-slate-200 rounded-sm flex items-center justify-center p-0.5 shrink-0">
                              {prod.imageUrl ? (
                                <img
                                  src={prod.imageUrl}
                                  alt=""
                                  className="max-h-full max-w-full object-contain"
                                />
                              ) : (
                                <span className="text-[8px] text-slate-300">
                                  No Img
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-slate-800 line-clamp-2 max-w-[200px] leading-snug">
                              {prod.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-medium text-slate-500">
                          {prod.brand}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-red-500">
                          {prod.price.toLocaleString()} đ
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleEditClick(prod)}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-bold mr-4 transition-colors"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="text-slate-400 hover:text-red-500 text-xs font-bold transition-colors"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: ORDERS                                                     */}
        {/* ================================================================= */}
        {adminTab === "orders" && (
          <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="text-slate-700 font-black text-xs uppercase tracking-wider">
                🧾 Quản Lý Đơn Hàng
              </h3>
            </div>
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-white text-slate-400 sticky top-0 border-b border-slate-200 uppercase text-[10px] font-black tracking-wider z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-3">Mã Đơn</th>
                    <th className="px-6 py-3">Khách Hàng</th>
                    <th className="px-6 py-3">Thời gian tạo</th>
                    <th className="px-6 py-3">Tổng tiền</th>
                    <th className="px-6 py-3">Trạng thái</th>
                    <th className="px-6 py-3 text-right">Xử lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminOrders.map((order, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-slate-800">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        User #{order.user?.id}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {new Date(order.orderDate).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-6 py-4 font-bold text-red-500">
                        {order.totalAmount.toLocaleString()} đ
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-sm text-[10px] font-black border uppercase tracking-wider ${
                            order.status === "CHỜ THANH TOÁN"
                              ? "bg-rose-50 text-rose-600 border-rose-200"
                              : order.status === "ĐÃ THANH TOÁN"
                                ? "bg-amber-50 text-amber-600 border-amber-200"
                                : order.status === "ĐANG GIAO"
                                  ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                                  : "bg-emerald-50 text-emerald-600 border-emerald-200"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {order.status === "ĐÃ THANH TOÁN" && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order.id, "ĐANG GIAO")
                            }
                            className="px-3 py-1.5 bg-indigo-50 border border-indigo-500 text-indigo-700 rounded-sm text-[11px] font-bold hover:bg-indigo-600 hover:text-white transition-colors shadow-sm"
                          >
                            Giao hàng
                          </button>
                        )}
                        {order.status === "ĐANG GIAO" && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order.id, "HOÀN THÀNH")
                            }
                            className="px-3 py-1.5 bg-emerald-50 border border-emerald-500 text-emerald-700 rounded-sm text-[11px] font-bold hover:bg-emerald-600 hover:text-white transition-colors shadow-sm"
                          >
                            Hoàn thành
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {adminOrders.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-10 text-slate-400 font-medium"
                      >
                        Không có đơn hàng nào cần xử lý.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
