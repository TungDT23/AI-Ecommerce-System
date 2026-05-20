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

  const [showAuth, setShowAuth] = useState(false);
  // State mới: Điều khiển việc bật/tắt Popup xác nhận đăng xuất
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Hàm thực thi việc đăng xuất (Chỉ gọi khi bấm Nút Đỏ)
  const executeLogout = () => {
    setUserAuth(null);
    localStorage.removeItem("userAuth");
    window.location.reload(); // Reload để reset lại trạng thái
  };

  const handleLoginSuccess = (data: UserData) => {
    setUserAuth(data);
    localStorage.setItem("userAuth", JSON.stringify(data));
    setShowAuth(false);
  };

  // ==============================================================
  // COMPONENT: POPUP XÁC NHẬN ĐĂNG XUẤT (Tự code chuẩn E-commerce)
  // ==============================================================
  const LogoutModal = () => {
    if (!showLogoutConfirm) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white p-6 rounded-sm shadow-2xl w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl leading-none">⚠️</span>
          </div>
          <h3 className="text-lg font-black text-gray-800 mb-2 uppercase tracking-wide">
            Xác nhận đăng xuất
          </h3>
          <p className="text-sm text-gray-500 mb-6 font-medium">
            Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-sm hover:bg-gray-200 transition-colors"
            >
              Không, quay lại
            </button>
            <button
              onClick={executeLogout}
              className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 rounded-sm hover:bg-red-700 transition-colors shadow-sm"
            >
              Có, đăng xuất
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==============================================================
  // RENDER GIAO DIỆN CHÍNH
  // ==============================================================

  // 1. TRƯỜNG HỢP ADMIN: Luôn yêu cầu đăng nhập
  if (userAuth?.role === "ROLE_ADMIN") {
    return (
      <>
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: "#333", color: "#fff", fontWeight: "bold" },
          }}
        />
        {/* Truyền hàm bật popup thay vì gọi window.confirm */}
        <AdminPage
          userAuth={userAuth}
          onLogout={() => setShowLogoutConfirm(true)}
        />
        <LogoutModal />
      </>
    );
  }

  // 2. TRƯỜNG HỢP HIỆN FORM ĐĂNG NHẬP
  if (showAuth) {
    return (
      <>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontWeight: "bold",
              padding: "12px 24px",
              fontSize: "14px",
            },
          }}
        />
        <AuthPage
          onLoginSuccess={handleLoginSuccess}
          onCancel={() => setShowAuth(false)}
        />
      </>
    );
  }

  // 3. TRANG CHỦ (Cho cả Khách vãng lai và User đã đăng nhập)
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { fontWeight: "bold", padding: "12px 24px", fontSize: "14px" },
        }}
      />
      <UserPage
        userAuth={userAuth}
        // Truyền hàm bật popup thay vì gọi window.confirm
        onLogout={() => setShowLogoutConfirm(true)}
        onLoginClick={() => setShowAuth(true)}
      />
      <LogoutModal />
    </>
  );
}

export default App;
