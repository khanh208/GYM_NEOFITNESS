
// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- Import Pages ---
// Auth
import LoginPage from './pages/auth/LoginPage';

// Public
import HomePage from './pages/public/HomePage';

// Admin Pages
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
import TrainerServiceAssignmentPage from './pages/admin/TrainerServiceAssignmentPage';
import ContactPage from './pages/public/ContactPage';
import FaqPage from './pages/public/FaqPage';
import PackagePage from './pages/public/PackagePage';
import TrainerPublicListPage from './pages/public/TrainerPublicListPage';
import PackageDetailPage from './pages/public/PackageDetailPage';
import PaymentSuccessPage from './pages/public/PaymentSuccessPage';
import CustomerProfilePage from './pages/public/CustomerProfilePage';
import BookingPage from './pages/public/BookingPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import CustomerPackageListPage from './pages/admin/CustomerPackageListPage';

// Trainer Pages
import TrainerProfilePage from './pages/trainer/TrainerProfilePage';
import TrainerBookingListPage from './pages/trainer/TrainerBookingListPage';

// Shared Page
import NotFound from './pages/NotFound';

// --- Import Layouts ---
import PublicLayout from './components/PublicLayout';
import MainLayout from './components/MainLayout';

// --- Component Bảo vệ Route: Kiểm tra đăng nhập ---
function ProtectedRoute({ children }) {
    const token = localStorage.getItem('accessToken');
    return token ? children : <Navigate to="/login" replace />;
    
}

// --- Component Bảo vệ Route theo Vai trò ---
function RoleProtectedRoute({ allowedRoles, children }) {
    const token = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');

    // Thêm log để kiểm tra
    console.log("RoleProtectedRoute Check:");
    console.log("Token:", token ? 'Exists' : 'Missing');
    console.log("User Role:", userRole);
    console.log("Allowed Roles:", allowedRoles);
    console.log("Is Role Allowed?", allowedRoles && userRole ? allowedRoles.includes(userRole) : 'N/A');

    if (!token) {
        return <Navigate to="/login" replace />;
    }
    if (!allowedRoles || !allowedRoles.includes(userRole)) {
        console.warn(`Vai trò ${userRole} không được phép truy cập.`);
        return <Navigate to="/unauthorized" replace />;
    }
    return children;
}

// --- Main App Component ---
function App() {
    return (
        <Router>
            <Routes>
                {/* === Public Routes === */}
                <Route path="/" element={<PublicLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="lien-he" element={<ContactPage />} />
                    <Route path="hoi-dap" element={<FaqPage />} />
                    <Route path="goi-tap" element={<PackagePage />} />
                    <Route path="goi-tap/:id" element={<PackageDetailPage />} />
                    <Route path="hlv-ca-nhan" element={<TrainerPublicListPage />} />
                    <Route path="payment-success" element={<PaymentSuccessPage />} />
                    <Route path="ho-so-cua-toi" element={<CustomerProfilePage />} />
                    <Route path="dat-lich" element={<BookingPage />} />
                    {/* <Route path="hlv-ca-nhan" element={<TrainersPage />} /> */}
                    {/* <Route path="goi-tap" element={<PackagesPage />} /> */}
                </Route>

                {/* === Auth Routes === */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                {/* TODO: Add routes for Register, Forgot Password */}

                {/* === Admin Protected Routes === */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute>
                            <RoleProtectedRoute allowedRoles={['admin']}>
                                <MainLayout />
                            </RoleProtectedRoute>
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    {/* Branches */}
                    <Route path="branches" element={<BranchListPage />} />
                    <Route path="branches/new" element={<BranchFormPage />} />
                    <Route path="branches/:id/edit" element={<BranchFormPage />} />
                    {/* Packages */}
                    <Route path="packages" element={<PackageListPage />} />
                    <Route path="packages/new" element={<PackageFormPage />} />
                    <Route path="packages/:id/edit" element={<PackageFormPage />} />
                    {/* Promotions */}
                    <Route path="promotions" element={<PromotionListPage />} />
                    <Route path="promotions/new" element={<PromotionFormPage />} />
                    <Route path="promotions/:id/edit" element={<PromotionFormPage />} />
                    {/* Pricings */}
                    <Route path="pricings" element={<PricingListPage />} />
                    <Route path="pricings/new" element={<PricingFormPage />} />
                    <Route path="pricings/:id/edit" element={<PricingFormPage />} />
                    {/* Trainers */}
                    <Route path="trainers" element={<TrainerListPage />} />
                    <Route path="trainers/new" element={<TrainerFormPage />} />
                    <Route path="trainers/:id/edit" element={<TrainerFormPage />} />
                    <Route path="trainers/:trainerId/manage-services" element={<TrainerServiceAssignmentPage />} />
                    {/* Services */}
                    <Route path="services" element={<ServiceListPage />} />
                    <Route path="services/new" element={<ServiceFormPage />} />
                    <Route path="services/:id/edit" element={<ServiceFormPage />} />
                    {/* Customers */}
                    <Route path="customers" element={<CustomerListPage />} />
                    <Route path="customers/:id/edit" element={<CustomerFormPage />} />
                    {/* Bookings */}
                    <Route path="bookings" element={<BookingListPage />} />
                    {/* Payments */}
                    <Route path="payments" element={<PaymentListPage />} />
                    {/* FAQs */}
                    <Route path="faqs" element={<FaqListPage />} />
                    <Route path="faqs/new" element={<FaqFormPage />} />
                    <Route path="faqs/:id/edit" element={<FaqFormPage />} />
                    {/* Contacts */}
                    <Route path="contacts" element={<ContactListPage />} />
                    {/* Gallery */}
                    <Route path="gallery" element={<GalleryListPage />} />
                    <Route path="gallery/new" element={<GalleryFormPage />} />
                    <Route path="gallery/:id/edit" element={<GalleryFormPage />} />
                    <Route path="customer-packages" element={<CustomerPackageListPage />} />
                </Route>

                {/* === Trainer Protected Routes === */}
                <Route
                    path="/trainer"
                    element={
                        <ProtectedRoute>
                            <RoleProtectedRoute allowedRoles={['trainer']}>
                                <MainLayout />
                            </RoleProtectedRoute>
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="schedule" replace />} />
                    <Route path="schedule" element={<TrainerBookingListPage />} />
                    <Route path="profile" element={<TrainerProfilePage />} />
                </Route>

                {/* === Redirects and Catch-all === */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Unauthorized Page */}
                <Route path="/unauthorized" element={
                    <div style={{ padding: '50px', textAlign: 'center' }}>
                        <h1>403 - Không có quyền truy cập</h1>
                        <p>Bạn không có quyền truy cập vào trang này.</p>
                        <a href="/login">Quay lại Đăng nhập</a>
                    </div>
                } />

                {/* Not Found Page */}
                <Route path="*" element={<NotFound />} />

            </Routes>
        </Router>
    );
}

export default App;