import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SelectRole from "./pages/SelectRole";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Signup from "./pages/Signup";
import MainLayout from './layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import DatasetsPage from './pages/DatasetsPage';
import ChatPage from './pages/ChatPage';
import UploadPage from './pages/UploadPage';
import ProtectedRoute from './components/ProtectedRoute';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import LogsPage from './pages/admin/LogsPage';
import PermissionPage from './pages/admin/PermissionPage';

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
        <Route path="/admin" element={<ProtectedRoute><MainLayout><AdminDashboard /></MainLayout></ProtectedRoute>} />
        <Route path="/admin/logs" element={<ProtectedRoute><MainLayout><LogsPage /></MainLayout></ProtectedRoute>} />
        <Route path="/admin/permissions" element={<ProtectedRoute><MainLayout><PermissionPage /></MainLayout></ProtectedRoute>} />

        {/* Data Pipeline (wrapped in MainLayout) */}
        <Route path="/upload" element={<MainLayout><UploadPage /></MainLayout>} />
        <Route path="/datasets" element={<MainLayout><DatasetsPage /></MainLayout>} />
        <Route path="/dashboard/:datasetId" element={<MainLayout><DashboardPage /></MainLayout>} />
        <Route path="/chat/:datasetId" element={<MainLayout><ChatPage /></MainLayout>} />
      </Routes>
    </BrowserRouter>
  );
}
