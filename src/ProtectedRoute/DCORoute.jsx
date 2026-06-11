
import RoleProtectedRoute from "./RoleProtectedRoute";
export default function DCORoute({ children }) {
  return (
    <RoleProtectedRoute allow={["DCO_APPROVER", "ADMIN"]}>
      {children}
    </RoleProtectedRoute>
  );
}
