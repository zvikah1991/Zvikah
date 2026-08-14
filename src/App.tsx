import { Routes, Route } from 'react-router-dom';
import { isSupabaseConfigured } from './lib/supabase';
import SetupRequired from './pages/SetupRequired';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import { RequireAuth, RequireRole, RequireSessionOnly } from './routes/ProtectedRoute';

import EmployeeLayout from './components/layout/EmployeeLayout';
import EmployeeHome from './pages/employee/EmployeeHome';
import MyHours from './pages/employee/MyHours';
import CorrectionRequest from './pages/employee/CorrectionRequest';
import Absences from './pages/employee/Absences';

import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminEmployees from './pages/admin/AdminEmployees';
import AdminRequests from './pages/admin/AdminRequests';
import AdminAbsences from './pages/admin/AdminAbsences';
import AdminReports from './pages/admin/AdminReports';
import AdminPayroll from './pages/admin/AdminPayroll';
import AdminSettings from './pages/admin/AdminSettings';
import AdminAuditLog from './pages/admin/AdminAuditLog';

export default function App() {
  if (!isSupabaseConfigured) {
    return <SetupRequired />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/change-password"
        element={
          <RequireSessionOnly>
            <ChangePassword />
          </RequireSessionOnly>
        }
      />

      <Route
        element={
          <RequireAuth>
            <RequireRole role="employee">
              <EmployeeLayout />
            </RequireRole>
          </RequireAuth>
        }
      >
        <Route path="/" element={<EmployeeHome />} />
        <Route path="/my-hours" element={<MyHours />} />
        <Route path="/correction" element={<CorrectionRequest />} />
        <Route path="/absences" element={<Absences />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RequireAuth>
            <RequireRole role="admin">
              <AdminLayout />
            </RequireRole>
          </RequireAuth>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="employees" element={<AdminEmployees />} />
        <Route path="requests" element={<AdminRequests />} />
        <Route path="absences" element={<AdminAbsences />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="payroll" element={<AdminPayroll />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="audit-log" element={<AdminAuditLog />} />
      </Route>
    </Routes>
  );
}
