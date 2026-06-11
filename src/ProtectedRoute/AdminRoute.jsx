
import RoleProtectedRoute from "./RoleProtectedRoute";
export default function AdminRoute({ children }) {
  return <RoleProtectedRoute allow={["ADMIN"]}>{children}</RoleProtectedRoute>;
}
