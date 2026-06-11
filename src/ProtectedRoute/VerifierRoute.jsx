// src/routes/guards/VerifierRoute.jsx
import RoleProtectedRoute from "./RoleProtectedRoute";
export default function VerifierRoute({ children }) {
  return (
    <RoleProtectedRoute allow={["VERIFIER", "ADMIN"]}>
      {children}
    </RoleProtectedRoute>
  );
}
