import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuth, setAuth, clearAuth } from "../utils/authStorage";
import { Url } from "@/lib/Part";

const RoleProtectedRoute = ({ allow = [], children }) => {
  const { token, user } = getAuth();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const verify = async () => {
      // 1) ไม่มี token/user -> ไม่ต้องยิง API
      if (!token || !user) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${Url.base_url}/verify-token`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // token ไม่ถูกต้อง / หมดอายุ
        if (!res.ok) {
          clearAuth();
          setAuthorized(false);
          setLoading(false);
          return;
        }

        const data = await res.json();

        // 2) อัปเดต user ล่าสุดจาก server (เผื่อ role เปลี่ยน)
        if (data?.user) {
          setAuth({ token, user: data.user });
        }

        setAuthorized(true);
        setLoading(false);
      } catch (err) {
        // server ล่ม/เน็ตหลุด -> เพื่อความปลอดภัยให้ deny
        setAuthorized(false);
        setLoading(false);
      }
    };

    verify();
  }, [token]); // token เปลี่ยนค่อยเช็คใหม่

  // ระหว่างเช็ค server
  if (loading) return null;

  // ไม่ผ่าน verify หรือยังไม่ login
  if (!authorized) {
    return <Navigate to="/" replace />;
  }

  // เอา role ล่าสุดที่อัปเดตแล้ว
  const latest = getAuth();
  const latestRole = latest?.user?.role;

  if (!latestRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // เช็ค role ตาม allow
  if (allow.length > 0 && !allow.includes(latestRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleProtectedRoute;
