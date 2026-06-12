// src/pages/Login.jsx
import React, { useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { Url } from "@/lib/Part";

import { setAuth } from "@/utils/authStorage";

const roleRedirect = (role) => {
  switch (role) {
    case "ADMIN":
      return "/admin";

    case "CREDIT_OFFICER":
      return "/creditofficer";

    case "VERIFIER":
      return "/verifier";

    case "DCO_APPROVER":
      return "/dceo";     
    case "CEO_APPROVER":
      return "/ceo";     
    default:
      return "/unauthorized";
  }
};


const Login = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // ✅ เรียก backend (ตรงกับ routes/authen.js)
      const res = await axios.post(`${Url.base_url}/login`, {
        username: form.username.trim(),
        password: form.password,
      });
      if(res.status === 429){
        toast.warning(`${res.message}`)
      }
      const { token, user, message } = res.data;

      // ✅ เก็บ key เดียวกับ ProtectedRoute
      setAuth({ token, user });

      toast.success(message || "Login ສຳເລັດ");

      // ✅ redirect ตาม role
      navigate(roleRedirect(user?.role), { replace: true });
    } catch (err) {
  console.error("Login error:", err);

  // ✅ ถ้า server ไม่ตอบกลับเลย (server ปิด/เน็ตมีปัญหา/CORS)
  if (!err.response) {
    const msg = "ຕໍ່ Server ບໍ່ໄດ້ (Server ອາດປິດ / ພອດຜິດ / CORS)";
    setError(msg);
    toast.error(msg);
    return;
  }

  // ✅ ถ้า server ตอบกลับมาแล้ว (รหัสผิด/ข้อมูลผิด)
  const msg = err.response?.data?.message || "Login failed";
  setError(msg);
  toast.error(msg);
}
 finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
      <div className="max-w-md w-full mx-auto p-8 bg-white border border-gray-200 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <div className="w-28 h-28">
              <img src="fina.png" alt="fina" />
            </div>
            <span className="text-orange-500">Credit</span>
            <span>Portal</span>
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
            <span className="font-medium">ຜິດພາດ:</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                id="username"
                name="username"
                value={form.username}
                onChange={handleChange}
                className="pl-10 py-6 focus:ring-blue-500 focus:border-blue-500"
                placeholder="admin"
                required
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="pl-10 pr-12 py-6 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className={`w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 ${
              loading ? "opacity-70 cursor-not-allowed" : "hover:shadow-lg"
            }`}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>loading...</span>
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                <span>Login</span>
              </>
            )}
          </Button>
        </form>
      </div>

      <ToastContainer position="top-center" autoClose={4000} />
    </div>
  );
};

export default Login;
