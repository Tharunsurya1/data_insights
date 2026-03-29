import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SelectRole from "./pages/SelectRole";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Signup from "./pages/Signup";
import MainLayout from './layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import DatasetsPage from './pages/DatasetsPage';
import ChatPage from './pages/ChatPage';
import UploadPage from './pages/UploadPage';
import DataChatPage from './pages/DataChatPage';
import ProtectedRoute from './components/ProtectedRoute';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import LogsPage from './pages/admin/LogsPage';
import PermissionPage from './pages/admin/PermissionPage';

// Employee section pages
import EmployeeDatasetsPage from './pages/employee/EmployeeDatasetsPage';
import EmployeeCleaningPage from './pages/employee/EmployeeCleaningPage';
import EmployeeDashboardPage from './pages/employee/EmployeeDashboardPage';
import EmployeeChatPage from './pages/employee/EmployeeChatPage';
import EmployeeSummaryPage from './pages/employee/EmployeeSummaryPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth / Role Selection */}
        <Route path="/" element={<SelectRole />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/signup/:role" element={<Signup />} />

        {/* Protected Admin Pipeline */}
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/logs" element={<ProtectedRoute><LogsPage /></ProtectedRoute>} />
        <Route path="/admin/permissions" element={<ProtectedRoute><PermissionPage /></ProtectedRoute>} />

        {/* Data Pipeline (wrapped in MainLayout) */}
        <Route path="/upload" element={<MainLayout><UploadPage /></MainLayout>} />
        <Route path="/datasets" element={<MainLayout><DatasetsPage /></MainLayout>} />
        <Route path="/dashboard/:datasetId" element={<MainLayout><DashboardPage /></MainLayout>} />
        <Route path="/chat/:datasetId" element={<MainLayout><ChatPage /></MainLayout>} />
        <Route path="/datachat" element={<MainLayout><DataChatPage /></MainLayout>} />

        {/* Employee Section (dedicated sidebar layout) */}
        <Route path="/employee" element={<Navigate to="/employee/datasets" replace />} />
        <Route path="/employee/datasets" element={<EmployeeDatasetsPage />} />
        <Route path="/employee/cleaning" element={<EmployeeCleaningPage />} />
        <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
        <Route path="/employee/chat" element={<EmployeeChatPage />} />
        <Route path="/employee/summary" element={<EmployeeSummaryPage />} />
      </Routes>
    </BrowserRouter>
  );
}
