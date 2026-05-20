import React, { useState } from "react";
import toast from "react-hot-toast";

interface AuthPageProps {
  onLoginSuccess: (data: any) => void;
  onCancel: () => void; // Thêm prop để quay lại trang chủ
}

type AuthView = "LOGIN" | "REGISTER" | "FORGOT_PASSWORD";

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, onCancel }) => {
  const [currentView, setCurrentView] = useState<AuthView>("LOGIN");
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password)
      return toast.error("Vui lòng nhập đủ thông tin!");

    setIsLoading(true);
    fetch("http://localhost:8888/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          toast.success("Đăng nhập thành công!");
          onLoginSuccess(data);
        } else {
          const err = await res.text();
          toast.error(err || "Sai tài khoản hoặc mật khẩu!");
        }
      })
      .catch(() => toast.error("Lỗi kết nối máy chủ!"))
      .finally(() => setIsLoading(false));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password)
      return toast.error("Điền đủ thông tin!");

    setIsLoading(true);
    fetch("http://localhost:8888/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    })
      .then(async (res) => {
        if (res.ok) {
          toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
          setCurrentView("LOGIN");
          setPassword("");
        } else {
          const err = await res.text();
          toast.error(err || "Đăng ký thất bại!");
        }
      })
      .finally(() => setIsLoading(false));
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Vui lòng nhập email!");
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Link khôi phục đã được gửi vào Email!");
      setCurrentView("LOGIN");
      setEmail("");
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Nút thoát */}
      <button
        onClick={onCancel}
        className="absolute top-6 left-6 text-white font-bold flex items-center gap-1 hover:text-gray-200 transition-colors"
      >
        ← Quay lại cửa hàng
      </button>

      <div className="bg-white p-8 rounded-sm shadow-2xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-gray-800 mb-2 uppercase tracking-widest">
            {currentView === "LOGIN" && "Đăng Nhập"}
            {currentView === "REGISTER" && "Đăng Ký"}
            {currentView === "FORGOT_PASSWORD" && "Khôi Phục Mật Khẩu"}
          </h2>
          <p className="text-gray-400 text-xs uppercase tracking-widest">
            Hệ thống AI E-Commerce
          </p>
        </div>

        {currentView === "LOGIN" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Tài khoản
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2.5 rounded-sm border border-gray-300 outline-none focus:border-blue-600 transition-all text-sm"
                placeholder="Nhập tên đăng nhập"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => setCurrentView("FORGOT_PASSWORD")}
                  className="text-[10px] text-blue-600 font-bold hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 rounded-sm border border-gray-300 outline-none focus:border-blue-600 transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-sm hover:bg-blue-700 disabled:bg-gray-400 transition-all"
            >
              {isLoading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
            <p className="text-center text-xs text-gray-500 mt-4">
              Chưa có tài khoản?{" "}
              <button
                type="button"
                onClick={() => setCurrentView("REGISTER")}
                className="text-blue-600 font-bold hover:underline"
              >
                Đăng ký ngay
              </button>
            </p>
          </form>
        )}

        {currentView === "REGISTER" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Tài khoản
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2.5 rounded-sm border border-gray-300 outline-none focus:border-blue-600 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 rounded-sm border border-gray-300 outline-none focus:border-blue-600 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 rounded-sm border border-gray-300 outline-none focus:border-blue-600 transition-all text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-sm hover:bg-green-700 disabled:bg-gray-400 transition-all"
            >
              {isLoading ? "Đang xử lý..." : "Đăng ký tài khoản"}
            </button>
            <p className="text-center text-xs text-gray-500 mt-4">
              Đã có tài khoản?{" "}
              <button
                type="button"
                onClick={() => setCurrentView("LOGIN")}
                className="text-blue-600 font-bold hover:underline"
              >
                Quay lại
              </button>
            </p>
          </form>
        )}

        {currentView === "FORGOT_PASSWORD" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-xs text-gray-600 text-center mb-4">
              Nhập email để nhận liên kết đặt lại mật khẩu.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-sm border border-gray-300 outline-none focus:border-blue-600 transition-all text-sm"
              placeholder="Email của bạn"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 text-white font-bold py-3 rounded-sm hover:bg-orange-600 disabled:bg-gray-400 transition-all"
            >
              {isLoading ? "Đang gửi..." : "Gửi link khôi phục"}
            </button>
            <p className="text-center mt-4">
              <button
                type="button"
                onClick={() => setCurrentView("LOGIN")}
                className="text-xs text-gray-500 font-bold hover:text-gray-800"
              >
                ← Quay lại đăng nhập
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
