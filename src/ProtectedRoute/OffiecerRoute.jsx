
import RoleProtectedRoute from "./RoleProtectedRoute";
export default function OffiecerRoute({ children }) {
  return <RoleProtectedRoute allow={["CREDIT_OFFICER"]}>{children}</RoleProtectedRoute>;
}
