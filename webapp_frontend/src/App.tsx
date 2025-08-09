import { useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LoginPrompt from "./components/LoginPrompt";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import ToastContainer from "./components/ToastContainer";
import { useEffect, useMemo, useState } from "react";
import { ToastProps } from "./components/Toast";

function App() {
  const account = useCurrentAccount();
  const isLoggedIn = useMemo(() => Boolean(account), [account]);
  const navigate = useNavigate();
  const { mutateAsync: disconnect } = useDisconnectWallet();
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  useEffect(() => {
    if (isLoggedIn) navigate("/dashboard");
    else navigate("/");
  }, [isLoggedIn, navigate]);

  const addToast = (toast: Omit<ToastProps, "onClose" | "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id, onClose: removeToast }]);
  };
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  return (
    <div className="w-full h-full min-h-screen flex flex-col cyber-gradient">
      <Header
        isLoggedIn={isLoggedIn}
        onSignOut={async () => {
          try {
            await disconnect();
          } finally {
            navigate("/");
          }
        }}
      />
      <main className="flex-1 flex flex-col overflow-auto">
        <div className="p-4">
          {/* Expose address globally for quick backend usage; consider refactor to context later */}
          <script
            dangerouslySetInnerHTML={{
              __html: `window.currentSuiAddress = ${JSON.stringify(
                account?.address || null
              )};`,
            }}
          />
          <Routes>
            <Route
              path="/"
              element={
                <LoginPrompt
                  onLoginClick={() => {
                    /* wallet connect handled in prompt */
                  }}
                />
              }
            />
            <Route
              path="/dashboard"
              element={
                isLoggedIn ? (
                  <Dashboard
                    onSignOut={() => disconnect()}
                    addToast={addToast}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="*"
              element={
                <Navigate to={isLoggedIn ? "/dashboard" : "/"} replace />
              }
            />
          </Routes>
        </div>
      </main>
      <Footer />
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}

export default App;
