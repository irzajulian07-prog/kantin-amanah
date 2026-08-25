import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { DataProvider } from './context/DataContext';

import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { KasirPage } from './pages/KasirPage';
import { TopupPage } from './pages/TopupPage';
import { SantriwatiPage } from './pages/SantriwatiPage';
import { InventoryPage } from './pages/InventoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogPage } from './pages/AuditLogPage';

export default function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <DataProvider>
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Authenticated Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  {/* Dashboard: Admin & Supervisor */}
                  <Route element={<ProtectedRoute allowedRoles={['admin', 'supervisor']} />}>
                    <Route path="/" element={<DashboardPage />} />
                  </Route>

                  {/* Kasir POS: Admin & Kasir */}
                  <Route element={<ProtectedRoute allowedRoles={['admin', 'kasir']} />}>
                    <Route path="/kasir" element={<KasirPage />} />
                  </Route>

                  {/* Top Up: Admin Only */}
                  <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/topup" element={<TopupPage />} />
                  </Route>

                  {/* Santriwati: Admin, Supervisor, Kasir (Kasir is read-only) */}
                  <Route element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'kasir']} />}>
                    <Route path="/santriwati" element={<SantriwatiPage />} />
                  </Route>

                  {/* Inventori, Produk, Supplier, Laporan, Audit Log: Admin & Supervisor */}
                  <Route element={<ProtectedRoute allowedRoles={['admin', 'supervisor']} />}>
                    <Route path="/inventory" element={<InventoryPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/categories" element={<CategoriesPage />} />
                    <Route path="/suppliers" element={<SuppliersPage />} />
                    <Route path="/audit-logs" element={<AuditLogPage />} />
                  </Route>

                  {/* Admin Only Route */}
                  <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/users" element={<UsersPage />} />
                  </Route>
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </DataProvider>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}
