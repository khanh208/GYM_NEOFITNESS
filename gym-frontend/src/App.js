// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- LAYOUTS ---
import PublicLayout from './components/PublicLayout';
import MainLayout from './components/MainLayout';

// --- PAGES: AUTH ---
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// --- PAGES: PUBLIC ---
import HomePage from './pages/public/HomePage';
import ContactPage from './pages/public/ContactPage';
import FaqPage from './pages/public/FaqPage';
import PackagePage from './pages/public/PackagePage';
import PackageDetailPage from './pages/public/PackageDetailPage';
import TrainerPublicListPage from './pages/public/TrainerPublicListPage';
import ServicePublicPage from './pages/public/ServicePublicPage';
import PTPackagePage from './pages/public/PTPackagePage';
import CustomerProfilePage from './pages/public/CustomerProfilePage';
import BookingPage from './pages/public/BookingPage';
import PaymentSuccessPage from './pages/public/PaymentSuccessPage';

// --- PAGES: ADMIN ---
import AdminDashboard from './pages/admin/AdminDashboard';
import BranchListPage from './pages/admin/BranchListPage';
import BranchFormPage from './pages/admin/BranchFormPage';
import PackageListPage from './pages/admin/PackageListPage';
import PackageFormPage from './pages/admin/PackageFormPage';
import PromotionListPage from './pages/admin/PromotionListPage';
import PromotionFormPage from './pages/admin/PromotionFormPage';
import PricingListPage from './pages/admin/PricingListPage';
import PricingFormPage from './pages/admin/PricingFormPage';
import TrainerListPage from './pages/admin/TrainerListPage';
import TrainerFormPage from './pages/admin/TrainerFormPage';
import TrainerServiceAssignmentPage from './pages/admin/TrainerServiceAssignmentPage';
import ServiceListPage from './pages/admin/ServiceListPage';
import ServiceFormPage from './pages/admin/ServiceFormPage';
import CustomerListPage from './pages/admin/CustomerListPage';
import CustomerFormPage from './pages/admin/CustomerFormPage';
import BookingListPage from './pages/admin/BookingListPage';
import PaymentListPage from './pages/admin/PaymentListPage';
import FaqListPage from './pages/admin/FaqListPage';
import FaqFormPage from './pages/admin/FaqFormPage';
import ContactListPage from './pages/admin/ContactListPage';
import GalleryListPage from './pages/admin/GalleryListPage';
import GalleryFormPage from './pages/admin/GalleryFormPage';
import CustomerPackageListPage from './pages/admin/CustomerPackageListPage';
import CheckInPage from './pages/admin/CheckInPage';

// --- PAGES: TRAINER ---
import TrainerProfilePage from './pages/trainer/TrainerProfilePage';
import TrainerBookingListPage from './pages/trainer/TrainerBookingListPage';

// --- PAGES: SHARED ---
import NotFound from './pages/NotFound';

// --- COMPONENTS ---
// Component bảo vệ: Yêu cầu đăng nhập
function ProtectedRoute({ children }) {
    const token = localStorage.getItem('accessToken');
    return token ? children : <Navigate to="/login" replace />;
}

// Component bảo vệ: Yêu cầu vai trò
function RoleProtectedRoute({ allowedRoles, children }) {
    const token = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');

    if (!token) return <Navigate to="/login" replace />;
    if (!allowedRoles || !allowedRoles.includes(userRole)) {
        return <Navigate to="/unauthorized" replace />;
    }
    return children;
}

// --- MAIN APP ---
function App() {
    return (
        <Router>
            <Routes>
                {/* ================= PUBLIC ROUTES ================= */}
                <Route path="/" element={<PublicLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="hlv-ca-nhan" element={<TrainerPublicListPage />} />
                    <Route path="goi-tap" element={<PackagePage />} />
                    <Route path="goi-tap/:id" element={<PackageDetailPage />} />
                    <Route path="goi-pt" element={<PTPackagePage />} />
                    <Route path="dich-vu" element={<ServicePublicPage />} />
                    <Route path="hoi-dap" element={<FaqPage />} />
                    <Route path="lien-he" element={<ContactPage />} />
                    
                    {/* Public routes yêu cầu đăng nhập (Customer) */}
                    <Route path="dat-lich" element={<BookingPage />} />
                    <Route path="ho-so-cua-toi" element={<CustomerProfilePage />} />
                    <Route path="payment-success" element={<PaymentSuccessPage />} />
                </Route>

                {/* ================= AUTH ROUTES ================= */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* ================= ADMIN ROUTES ================= */}
                <Route path="/admin" element={
                    <ProtectedRoute>
                        <RoleProtectedRoute allowedRoles={['admin']}>
                            <MainLayout />
                        </RoleProtectedRoute>
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    
                    {/* Quản lý chung */}
                    <Route path="branches" element={<BranchListPage />} />
                    <Route path="branches/new" element={<BranchFormPage />} />
                    <Route path="branches/:id/edit" element={<BranchFormPage />} />
                    
                    <Route path="packages" element={<PackageListPage />} />
                    <Route path="packages/new" element={<PackageFormPage />} />
                    <Route path="packages/:id/edit" element={<PackageFormPage />} />
                    
                    <Route path="promotions" element={<PromotionListPage />} />
                    <Route path="promotions/new" element={<PromotionFormPage />} />
                    <Route path="promotions/:id/edit" element={<PromotionFormPage />} />
                    
                    <Route path="pricings" element={<PricingListPage />} />
                    <Route path="pricings/new" element={<PricingFormPage />} />
                    <Route path="pricings/:id/edit" element={<PricingFormPage />} />
                    
                    <Route path="trainers" element={<TrainerListPage />} />
                    <Route path="trainers/new" element={<TrainerFormPage />} />
                    <Route path="trainers/:id/edit" element={<TrainerFormPage />} />
                    <Route path="trainers/:trainerId/manage-services" element={<TrainerServiceAssignmentPage />} />
                    
                    <Route path="services" element={<ServiceListPage />} />
                    <Route path="services/new" element={<ServiceFormPage />} />
                    <Route path="services/:id/edit" element={<ServiceFormPage />} />
                    
                    <Route path="customers" element={<CustomerListPage />} />
                    <Route path="customers/:id/edit" element={<CustomerFormPage />} />
                    
                    <Route path="bookings" element={<BookingListPage />} />
                    <Route path="payments" element={<PaymentListPage />} />
                    <Route path="customer-packages" element={<CustomerPackageListPage />} />
                    <Route path="check-in" element={<CheckInPage />} />
                    
                    <Route path="faqs" element={<FaqListPage />} />
                    <Route path="faqs/new" element={<FaqFormPage />} />
                    <Route path="faqs/:id/edit" element={<FaqFormPage />} />
                    
                    <Route path="contacts" element={<ContactListPage />} />
                    
                    <Route path="gallery" element={<GalleryListPage />} />
                    <Route path="gallery/new" element={<GalleryFormPage />} />
                    <Route path="gallery/:id/edit" element={<GalleryFormPage />} />
                </Route>

                {/* ================= TRAINER ROUTES ================= */}
                <Route path="/trainer" element={
                    <ProtectedRoute>
                        <RoleProtectedRoute allowedRoles={['trainer']}>
                            <MainLayout />
                        </RoleProtectedRoute>
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="schedule" replace />} />
                    <Route path="schedule" element={<TrainerBookingListPage />} />
                    <Route path="profile" element={<TrainerProfilePage />} />
                    <Route path="check-in" element={<CheckInPage />} />
                </Route>

                {/* ================= ERROR & REDIRECTS ================= */}
                <Route path="/unauthorized" element={
                    <div style={{ padding: '50px', textAlign: 'center' }}>
                        <h1>403 - Không có quyền truy cập</h1>
                        <a href="/login">Quay lại Đăng nhập</a>
                    </div>
                } />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );
}

export default App;