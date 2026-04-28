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

// Component nhận vào 2 props từ App.tsx: thông tin user và hàm đăng xuất
interface AdminPageProps {
  userAuth: UserData;
  onLogout: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ userAuth, onLogout }) => {
  // STATE CỦA RIÊNG ADMIN
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

  // EFFECTS: NẠP DỮ LIỆU KHI VÀO TRANG ADMIN
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

  // CÁC HÀM GỌI API
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
  const PIE_COLORS = ["#3b82f6", "#f59e0b", "#10b981"];

  const getBarChartData = () => {
    const productStats: any = {};
    adminActivities.forEach((act) => {
      const pid = act.productId;
      if (!productStats[pid])
        productStats[pid] = {
          name: `Mã SP #${pid}`,
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
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-bold text-blue-400">Admin Panel</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setAdminTab("dashboard")}
                className={`px-4 py-2 rounded-lg font-bold transition-colors ${adminTab === "dashboard" ? "bg-blue-600" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
              >
                📡 AI Dash
              </button>
              <button
                onClick={() => setAdminTab("products")}
                className={`px-4 py-2 rounded-lg font-bold transition-colors ${adminTab === "products" ? "bg-green-600" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
              >
                📦 Kho hàng
              </button>
              <button
                onClick={() => {
                  setAdminTab("orders");
                  fetchAdminOrders();
                }}
                className={`px-4 py-2 rounded-lg font-bold transition-colors ${adminTab === "orders" ? "bg-yellow-600" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
              >
                🧾 Đơn hàng
              </button>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="bg-red-500 px-6 py-2 rounded-lg font-bold hover:bg-red-600"
          >
            Đăng xuất
          </button>
        </div>

        {/* Tab 1: Dashboard */}
        {adminTab === "dashboard" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 col-span-1">
                <h3 className="text-gray-400 font-medium mb-4 text-center">
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
                        paddingAngle={5}
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
                          backgroundColor: "#1f2937",
                          borderColor: "#374151",
                          color: "#fff",
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 col-span-2">
                <h3 className="text-gray-400 font-medium mb-4 text-center">
                  Top 5 Sản phẩm được quan tâm nhất
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getBarChartData()}>
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" allowDecimals={false} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          borderColor: "#374151",
                          color: "#fff",
                        }}
                        cursor={{ fill: "#374151" }}
                      />
                      <Legend />
                      <Bar
                        dataKey="view"
                        name="Lượt Xem"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="cart"
                        name="Thêm Giỏ"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="purchase"
                        name="Lượt Mua"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold">📡 Live Stream Data</h2>
              </div>
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-gray-700/50 text-gray-300 sticky top-0">
                    <tr>
                      <th className="px-6 py-4">Thời gian</th>
                      <th className="px-6 py-4">User ID</th>
                      <th className="px-6 py-4">Hành vi</th>
                      <th className="px-6 py-4">Sản phẩm ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {adminActivities.map((act, index) => (
                      <tr key={index} className="hover:bg-gray-700/30">
                        <td className="px-6 py-4">
                          {new Date(act.timestamp).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-6 py-4 font-bold text-white">
                          User {act.userId}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${act.action === "purchase" ? "bg-green-900/50 text-green-400" : "bg-blue-900/50 text-blue-400"}`}
                          >
                            {act.action.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">Món đồ #{act.productId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Quản lý Sản phẩm */}
        {adminTab === "products" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 bg-gray-800 p-6 rounded-2xl border border-gray-700 h-fit">
              <h2 className="text-xl font-bold mb-4">
                {editingId ? "✏️ Sửa Sản Phẩm" : "✨ Thêm Sản Phẩm"}
              </h2>
              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Tên sản phẩm
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm({ ...productForm, name: e.target.value })
                    }
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Thương hiệu
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.brand}
                    onChange={(e) =>
                      setProductForm({ ...productForm, brand: e.target.value })
                    }
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Giá bán (VNĐ)
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
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
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
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-green-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 font-bold py-2 rounded-lg hover:bg-green-700 text-white"
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
                      className="px-4 bg-gray-700 font-bold rounded-lg hover:bg-gray-600"
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            </div>
            <div className="md:col-span-2 bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold">
                  📦 Danh sách sản phẩm trong kho
                </h2>
              </div>
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-gray-700/50 text-gray-300 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Ảnh</th>
                      <th className="px-4 py-3">Tên SP</th>
                      <th className="px-4 py-3">Thương hiệu</th>
                      <th className="px-4 py-3">Giá</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {adminProducts.map((prod) => (
                      <tr key={prod.id} className="hover:bg-gray-700/30">
                        <td className="px-4 py-3">
                          {prod.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt="img"
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-700 rounded"></div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold text-white">
                          {prod.name}
                        </td>
                        <td className="px-4 py-3">{prod.brand}</td>
                        <td className="px-4 py-3 text-green-400">
                          {prod.price.toLocaleString()} đ
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleEditClick(prod)}
                            className="text-blue-400 hover:text-blue-300 mr-4 font-bold"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="text-red-400 hover:text-red-300 font-bold"
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

        {/* Tab 3: Quản lý Đơn hàng */}
        {adminTab === "orders" && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold">🧾 Danh sách Đơn hàng</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-gray-700/50 text-gray-300">
                  <tr>
                    <th className="px-6 py-4">Mã ĐH</th>
                    <th className="px-6 py-4">User ID</th>
                    <th className="px-6 py-4">Thời gian</th>
                    <th className="px-6 py-4">Tổng tiền</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {adminOrders.map((order, idx) => (
                    <tr key={idx} className="hover:bg-gray-700/30">
                      <td className="px-6 py-4 font-bold text-white">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4">Khách #{order.user?.id}</td>
                      <td className="px-6 py-4">
                        {new Date(order.orderDate).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-6 py-4 font-bold text-green-400">
                        {order.totalAmount.toLocaleString()} đ
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${order.status === "CHỜ THANH TOÁN" ? "bg-red-900/50 text-red-400" : order.status === "ĐÃ THANH TOÁN" ? "bg-green-900/50 text-green-400" : order.status === "ĐANG GIAO" ? "bg-blue-900/50 text-blue-400" : "bg-gray-600 text-white"}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {order.status === "ĐÃ THANH TOÁN" && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order.id, "ĐANG GIAO")
                            }
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Giao hàng
                          </button>
                        )}
                        {order.status === "ĐANG GIAO" && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order.id, "HOÀN THÀNH")
                            }
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Hoàn thành
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
