import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import AdminPage from "./pages/AdminPage";
import UserPage from "./pages/UserPage";

// --- INTERFACE CHUNG ---
interface UserData {
  userId: number;
  role: string;
  token: string;
}

function App() {
  // STATE CHUNG TOÀN ỨNG DỤNG
  const [userAuth, setUserAuth] = useState<UserData | null>(() => {
    const saved = localStorage.getItem("userAuth");
    return saved ? JSON.parse(saved) : null;
  });
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    fetch("http://localhost:8888/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: usernameInput,
        password: passwordInput,
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Sai tài khoản hoặc mật khẩu!");
        return res.json();
      })
      .then((data: UserData) => {
        setUserAuth(data);
        localStorage.setItem("userAuth", JSON.stringify(data));
        toast.success(`Chào mừng trở lại!`, { icon: "👋" });
      })
      .catch((err) => setLoginError(err.message));
  };

  const handleLogout = () => {
    setUserAuth(null);
    localStorage.removeItem("userAuth");
    toast("Đã đăng xuất", { icon: "🚪" });
  };

  // --- RENDER GIAO DIỆN CHÍNH (ROUTER) ---

  // 1. Nếu chưa đăng nhập: Hiện Form Login
  if (!userAuth) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Toaster position="top-right" />
        <div className="bg-white p-8 rounded-2xl shadow-xl w-96">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Đăng Nhập
          </h2>
          <p className="text-center text-gray-500 mb-6">
            Hệ thống AI E-Commerce
          </p>
          {loginError && (
            <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {loginError}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tài khoản
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700"
            >
              Vào hệ thống
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Nếu là Admin: Mở AdminPage
  if (userAuth.role === "ROLE_ADMIN") {
    return (
      <>
        <Toaster
          position="top-right"
          toastOptions={{ style: { background: "#333", color: "#fff" } }}
        />
        <AdminPage userAuth={userAuth} onLogout={handleLogout} />
      </>
    );
  }

  // 3. Nếu là User: Mở UserPage
  return (
    <>
      <Toaster position="top-right" />
      <UserPage userAuth={userAuth} onLogout={handleLogout} />
    </>
  );
}

export default App;
