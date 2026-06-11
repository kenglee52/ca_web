
import { createBrowserRouter, RouterProvider } from "react-router-dom";




import OffiecerRoute from "@/ProtectedRoute/OffiecerRoute";
import AdminRoute from "@/ProtectedRoute/AdminRoute";
import DCORoute from "@/ProtectedRoute/DCORoute";
import CEORoute from "@/ProtectedRoute/CEORoute";
import VerifierRoute from "@/ProtectedRoute/VerifierRoute";

import AdminLayout from "@/layout/AdminLayout";


import VerifierLayout from "@/layout/VerifierLayout";
import Login from "@/page/Login";
import CEOLayout from "@/layout/CEOLayout";

import DCOLayout from "@/layout/DCOLayout";
import AdminDashboard from "@/page/admin/AdminDashboard";
import Manage_Users from "@/page/admin/Manage_Users";
import AuditLog from "@/page/admin/AuditLog";
import Creditofficer_layout from "@/layout/Creditofficer_layout";

import CreditDashboard from "@/page/officer/CreditDashboard";

import Sector from "@/page/admin/Sector";
import Borrower from "@/page/officer/Borrower";

import BorrowerIncomesPage from "@/component/offiecer/BorrowerIncomesPage";
import LoanApplications from "@/page/officer/LoanApplications";
import LoanApplicationDetail from "@/page/officer/LoanApplicationDetail";
import LoanApplicationForm from "@/component/offiecer/LoanApplicationForm";
import BorrowerDetail from "@/component/offiecer/BorrowerDetail";
import VerifierSearch from "@/page/Verify/VerifierSearch";
import VerifierHistory from "@/page/Verify/VerifierHistory";
import VerifierReturned from "@/page/Verify/VerifierReturned";
import VerifierApproved from "@/page/Verify/VerifierApproved";
import VerifierAllCases from "@/page/Verify/VerifierAllCases";
import VerifierInbox from "@/page/Verify/VerifierInbox";
import VerifierDashboard from "@/page/Verify/VerifierDashboard";
import VerifierApplicationDetail from "@/page/Verify/VerifierApplicationDetail";
import Returned from "@/page/officer/Returned";
import LoanApplicationEditAfterReturn from "@/page/officer/LoanApplicationEditAfterReturn";

import Report from "@/page/officer/Report";
import { CountsProvider } from "@/contexts/CountsContext";
import DceoDashboard from "@/page/Dceo/DceoDashboard";
import DceoApproved from "@/page/Dceo/DceoApproved";
import DcoeAllCasws from "@/page/Dceo/DcoeAllCasws";
import DceoApplicationDetail from "@/page/Dceo/DceoApplicationDetail";
import DceoInbox from "@/page/Dceo/DceoInbox";
import DceoHitory from "@/page/Dceo/DceoHitory";
import CEODashboard from "@/page/CEO/CEODashboard";
import CEOApproved from "@/page/CEO/CEOApproved";
import CEOHitory from "@/page/CEO/CEOHitory";
import CEOInbox from "@/page/CEO/CEOInbox";
import CEOApplicationDetail from "@/page/CEO/CEOApplicationDetail";
import CEoAllCasws from "@/page/CEO/CEOAllCasws";
import FullLoanReport from "@/shaere_component/FullLoanReport";
import Approved from "@/page/officer/Approved";
import LoanApplicationReport from "@/shaere_component/LoanApplicationReport";
import CEOHitoryDetail from "@/page/CEO/CEOHitoryDetail";
import DceoHitoryDetail from "@/page/Dceo/DceoHitoryDetail";
import VerifierHistoryDetail from "@/page/Verify/VerifierHistoryDetail";

// ✅ หน้า Unauthorized
const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-3">403</h1>
      <p className="text-gray-600 mb-6">Unauthorized</p>
      <a
        href="/"
        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Back to Home
      </a>
    </div>
  </div>
);

// ===============================
// ROUTER CONFIG
// ===============================
const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  {
    path: "/creditofficer/applications-detail/:id",
    element: (
      <OffiecerRoute>
        <LoanApplicationDetail />
      </OffiecerRoute>
    ),
  },
  // USER (เฉพาะ USER)
  {
    path: "/creditofficer",
    element: (
      <OffiecerRoute>
        <Creditofficer_layout />
      </OffiecerRoute>
    ),
    children: [
      { index: true, element: <CreditDashboard /> },
      { path: "applications", element: <LoanApplications /> },
      { path: "applications/create", element: <LoanApplicationForm /> },
      { path: "returned/:id", element: <LoanApplicationForm /> },
      { path: "report/:id", element: <LoanApplicationReport /> },


      { path: "borrower", element: <Borrower /> },
      { path: "report", element: <Report /> },
 
      { path: "borrower/:id", element: <BorrowerDetail /> },
      { path: "borrower/:borrowerId/incomes", element: <BorrowerIncomesPage /> },
      { path: "returned", element: <Returned /> },
      { path: "returned/:id/edit-after-return", element: <LoanApplicationEditAfterReturn /> },
      { path: "approved", element: <Approved /> },


       { path: "approved/:id/full-report", element: <FullLoanReport /> },






    ],
  },

  // ADMIN (เฉพาะ ADMIN)
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "users", element: <Manage_Users /> },
      { path: "auditLog", element: <AuditLog /> },
      { path: "sectors", element: <Sector /> }

    ],
  },

  // DCO_APPROVER (+ ADMIN)
  {
    path: "/dceo",
    element: (
      <DCORoute>
        <CountsProvider>  
                <DCOLayout />
          </CountsProvider>

      </DCORoute>
    ),
    children: [
      { index: true, element: <DceoDashboard /> },
      { path: "approved", element: <DceoApproved /> },
      { path: "history", element: <DceoHitory /> },
      { path: "history/:id", element: <DceoHitoryDetail /> },

      { path: "inbox", element: <DceoInbox /> },
      { path: "inbox/:id", element: <DceoApplicationDetail /> },
      
      { path: "all-cases/:id", element: <LoanApplicationReport /> },

      { path: "approved/:id/full-report", element: <FullLoanReport /> },
      { path: "all-cases", element: <DcoeAllCasws /> }

    ],


  },

  // APPROVER (+ ADMIN)
  {
    path: "/ceo",
    element: (
      <CEORoute>
        <CountsProvider>
          <CEOLayout />
          </CountsProvider>



      </CEORoute>

    ),
 children: [
      { index: true, element: <CEODashboard /> },
      { path: "approved", element: <CEOApproved /> },
      { path: "history", element: <CEOHitory /> },
      { path: "history/:id", element: <CEOHitoryDetail /> },

      { path: "inbox", element: <CEOInbox/> },
      { path: "all-cases/:id", element: <LoanApplicationReport /> },

      { path: "inbox/:id", element: <CEOApplicationDetail /> },
      { path: "all-cases", element: <CEoAllCasws /> },
       { path: "approved/:id/full-report", element: <FullLoanReport /> },
  
    ],
  },

  // VERIFIER (+ ADMIN)
  {
    path: "/verifier",
    element: (
      <VerifierRoute>
        <CountsProvider>
          <VerifierLayout />
        </CountsProvider>
      </VerifierRoute>
    ),
    children: [
      { index: true, element: <VerifierDashboard /> },
      { path: "inbox", element: <VerifierInbox /> },
      { path: "cases", element: <VerifierAllCases /> },
      { path: "approved", element: <VerifierApproved /> },
      { path: "returned", element: <VerifierReturned /> },
      { path: "history", element: <VerifierHistory /> },
      { path: "history/:id", element: <VerifierHistoryDetail /> },

      { path: "search", element: <VerifierSearch /> },
      { path: "inbox/:id", element: <VerifierApplicationDetail /> },
       { path: "approved/:id/full-report", element: <FullLoanReport /> },
         { path: "cases/:id", element: <LoanApplicationReport /> },

    ],
  },

  // 404 PAGE
  {
    path: "*",
    element: (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-7xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-2">Page not found</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Back to Home
          </a>
        </div>
      </div>
    ),
  },
]);

const AppRoute = () => <RouterProvider router={router} />;

export default AppRoute;
