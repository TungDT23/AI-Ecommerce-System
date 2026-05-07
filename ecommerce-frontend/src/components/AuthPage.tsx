import React, { useState } from "react";
import toast from "react-hot-toast";

interface AuthPageProps {
  onLoginSuccess: (data: any) => void;
}

type AuthView = "LOGIN" | "REGISTER" | "FORGOT_PASSWORD";

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
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
          // Thành công: Backend trả về JSON
          const data = await res.json();
          toast.success("Đăng nhập thành công!");
          onLoginSuccess(data);
        } else {
          // Thất bại: Backend trả về chuỗi Text thường
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-gray-800 mb-2">
            {currentView === "LOGIN" && "Đăng Nhập"}
            {currentView === "REGISTER" && "Tạo Tài Khoản"}
            {currentView === "FORGOT_PASSWORD" && "Khôi Phục Mật Khẩu"}
          </h2>
          <p className="text-gray-500 font-medium">Hệ thống AI E-Commerce</p>
        </div>

        {currentView === "LOGIN" && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Tài khoản
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-2"
                placeholder="Nhập tên đăng nhập"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-bold text-gray-700">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => setCurrentView("FORGOT_PASSWORD")}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-2"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? "Đang xử lý..." : "Vào hệ thống"}
            </button>
            <p className="text-center text-sm text-gray-500 mt-4">
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
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Tài khoản
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-2"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 disabled:bg-gray-400"
            >
              {isLoading ? "Đang xử lý..." : "Đăng ký tài khoản"}
            </button>
            <p className="text-center text-sm text-gray-500 mt-4">
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
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <p className="text-sm text-gray-600 text-center mb-4">
              Nhập email để nhận liên kết đặt lại mật khẩu.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-2"
              placeholder="Email của bạn"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-xl hover:bg-orange-600 disabled:bg-gray-400"
            >
              {isLoading ? "Đang gửi..." : "Gửi link khôi phục"}
            </button>
            <p className="text-center mt-4">
              <button
                type="button"
                onClick={() => setCurrentView("LOGIN")}
                className="text-sm text-gray-500 font-bold hover:text-gray-800"
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
