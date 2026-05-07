import { useState } from "react";
import { Toaster } from "react-hot-toast";
import AuthPage from "./components/AuthPage";
import AdminPage from "./pages/AdminPage";
import UserPage from "./pages/UserPage";

interface UserData {
  userId: number;
  role: string;
  token: string;
  username?: string;
}

function App() {
  const [userAuth, setUserAuth] = useState<UserData | null>(() => {
    const saved = localStorage.getItem("userAuth");
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogout = () => {
    setUserAuth(null);
    localStorage.removeItem("userAuth");
  };

  const handleLoginSuccess = (data: UserData) => {
    setUserAuth(data);
    localStorage.setItem("userAuth", JSON.stringify(data));
  };

  // 1. CHƯA ĐĂNG NHẬP -> HIỆN AUTH FORM (Login/Register/Forgot)
  if (!userAuth) {
    return (
      <>
        <Toaster position="top-right" />
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  // 2. ĐÃ ĐĂNG NHẬP LÀ ADMIN -> HIỆN ADMIN DASHBOARD
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

  // 3. ĐÃ ĐĂNG NHẬP LÀ USER -> HIỆN TRANG MUA SẮM CÓ AI
  return (
    <>
      <Toaster position="top-right" />
      <UserPage userAuth={userAuth} onLogout={handleLogout} />
    </>
  );
}

export default App;
