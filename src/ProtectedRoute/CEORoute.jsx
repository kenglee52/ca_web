
import RoleProtectedRoute from "./RoleProtectedRoute";
export default function CEORoute({ children }) {
  return (
    <RoleProtectedRoute allow={["CEO_APPROVER", "ADMIN"]}>
      {children}
    </RoleProtectedRoute>
  );
}
