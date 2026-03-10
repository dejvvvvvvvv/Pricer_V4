import React, { Suspense } from 'react';
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
import Header from './components/ui/Header';
import Footer from './components/ui/Footer';
import SmoothScroll from './components/SmoothScroll';
import ScrollToTop from './components/ScrollToTop';
import ScrollToTopButton from './components/ui/ScrollToTopButton';
import Home from './pages/home';
import Pricing from './pages/pricing';
import Support from './pages/support';
import PrivateRoute from './components/PrivateRoute';
import NotFound from './pages/NotFound';
import Login from './pages/login';
import Register from './pages/register';
import AdminLayout from './pages/admin/AdminLayout';
import InviteAccept from './pages/InviteAccept';
import ErrorBoundary from './components/ErrorBoundary';
import { SkeletonCard } from './components/ui/forge/ForgeSkeleton';

// Lazy-loaded public pages (heavy components)
const TestKalkulacka = React.lazy(() => import('./pages/test-kalkulacka'));
const TestKalkulackaWhite = React.lazy(() => import('./pages/test-kalkulacka-white'));
const AccountPage = React.lazy(() => import('./pages/account'));
const WidgetPublicPage = React.lazy(() => import('./pages/widget-public/WidgetPublicPage'));
const SlicerPage = React.lazy(() => import('./pages/slicer'));

// Lazy-loaded admin pages
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminBranding = React.lazy(() => import('./pages/admin/AdminBranding'));
const AdminPricing = React.lazy(() => import('./pages/admin/AdminPricing'));
const AdminFees = React.lazy(() => import('./pages/admin/AdminFees'));
const AdminParameters = React.lazy(() => import('./pages/admin/AdminParameters'));
const AdminPresets = React.lazy(() => import('./pages/admin/AdminPresets'));
const AdminOrders = React.lazy(() => import('./pages/admin/AdminOrders'));
const AdminWidget = React.lazy(() => import('./pages/admin/AdminWidget'));
const AdminWidgetBuilder = React.lazy(() => import('./pages/admin/AdminWidgetBuilder'));
const AdminTeamAccess = React.lazy(() => import('./pages/admin/AdminTeamAccess'));
const AdminAnalytics = React.lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminExpress = React.lazy(() => import('./pages/admin/AdminExpress'));
const AdminShipping = React.lazy(() => import('./pages/admin/AdminShipping'));
const AdminEmails = React.lazy(() => import('./pages/admin/AdminEmails'));
const AdminCoupons = React.lazy(() => import('./pages/admin/AdminCoupons'));
const AdminMigration = React.lazy(() => import('./pages/admin/AdminMigration'));
const AdminIntegrations = React.lazy(() => import('./pages/admin/AdminIntegrations'));
const AdminPayments = React.lazy(() => import('./pages/admin/AdminPayments'));
const AdminModelStorage = React.lazy(() => import('./pages/admin/AdminModelStorage'));

/** Fallback for public page lazy loading */
const PageFallback = () => (
  <div style={{ padding: '48px 24px', maxWidth: '800px', margin: '0 auto' }}>
    <SkeletonCard />
  </div>
);

/** Fallback for admin panel lazy loading */
const AdminFallback = () => (
  <div style={{ padding: '24px', display: 'grid', gap: '16px' }}>
    <SkeletonCard />
    <SkeletonCard />
  </div>
);


export default function Routes() {
  return (
    <BrowserRouter>
      <RouterRoutes>
        {/* Public Widget Route - no Header/Footer (embeddable) */}
        <Route path="/w/:publicWidgetId" element={
          <Suspense fallback={<PageFallback />}>
            <WidgetPublicPage />
          </Suspense>
        } />

        {/* Slicer - fullscreen, no Header/Footer */}
        <Route path="/slicer" element={
          <Suspense fallback={<div style={{
            width:'100vw', height:'100vh', display:'flex',
            alignItems:'center', justifyContent:'center',
            background:'var(--forge-bg-void, #08090C)',
            color:'var(--forge-text-primary, #E8ECF1)'
          }}>Loading Slicer...</div>}>
            <SlicerPage />
          </Suspense>
        } />

        {/* Widget Builder - fullscreen, no admin sidebar / Header / Footer */}
        <Route path="/admin/widget/builder/:id" element={
          <Suspense fallback={<PageFallback />}>
            <AdminWidgetBuilder />
          </Suspense>
        } />

        {/* Main app with Header/Footer */}
        <Route
          path="*"
          element={
            <>
              <a href="#main-content" className="skip-to-content">
                Skip to content
              </a>
              <SmoothScroll />
              <ScrollToTop />
              <Header />
              <main id="main-content">
                <ErrorBoundary module="PublicRoutes">
                <RouterRoutes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

          {/* veřejné */}
          <Route path="/" element={<Home />} />
          <Route path="/model-upload" element={<Navigate to="/test-kalkulacka-white" replace />} />
          <Route path="/test-kalkulacka" element={<Suspense fallback={<PageFallback />}><TestKalkulacka /></Suspense>} />
          <Route path="/test-kalkulacka-white" element={<Suspense fallback={<PageFallback />}><TestKalkulackaWhite /></Suspense>} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/support" element={<Support />} />

          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/account" element={<Suspense fallback={<PageFallback />}><AccountPage /></Suspense>} />
          </Route>

          {/* Public invite acceptance (demo) */}
          <Route path="/invite/accept" element={<InviteAccept />} />

          {/* Admin Panel (protected) */}
          <Route element={<PrivateRoute />}>
            <Route path="/admin" element={<ErrorBoundary module="AdminPanel"><AdminLayout /></ErrorBoundary>}>
              <Route index element={<Suspense fallback={<AdminFallback />}><AdminDashboard /></Suspense>} />
              <Route path="branding" element={<Suspense fallback={<AdminFallback />}><AdminBranding /></Suspense>} />
              <Route path="pricing" element={<Suspense fallback={<AdminFallback />}><AdminPricing /></Suspense>} />
              <Route path="fees" element={<Suspense fallback={<AdminFallback />}><AdminFees /></Suspense>} />
              <Route path="parameters/*" element={<Suspense fallback={<AdminFallback />}><AdminParameters /></Suspense>} />
              <Route path="presets/*" element={<Suspense fallback={<AdminFallback />}><AdminPresets /></Suspense>} />
              <Route path="orders/*" element={<Suspense fallback={<AdminFallback />}><AdminOrders /></Suspense>} />
              <Route path="payments" element={<Suspense fallback={<AdminFallback />}><AdminPayments /></Suspense>} />
              <Route path="model-storage" element={<Suspense fallback={<AdminFallback />}><AdminModelStorage /></Suspense>} />
              <Route path="widget" element={<Suspense fallback={<AdminFallback />}><AdminWidget /></Suspense>} />
              <Route path="analytics" element={<Suspense fallback={<AdminFallback />}><AdminAnalytics /></Suspense>} />
              <Route path="team" element={<Suspense fallback={<AdminFallback />}><AdminTeamAccess /></Suspense>} />
              <Route path="express" element={<Suspense fallback={<AdminFallback />}><AdminExpress /></Suspense>} />
              <Route path="shipping" element={<Suspense fallback={<AdminFallback />}><AdminShipping /></Suspense>} />
              <Route path="emails" element={<Suspense fallback={<AdminFallback />}><AdminEmails /></Suspense>} />
              <Route path="coupons" element={<Suspense fallback={<AdminFallback />}><AdminCoupons /></Suspense>} />
              <Route path="migration" element={<Suspense fallback={<AdminFallback />}><AdminMigration /></Suspense>} />
              <Route path="integrations" element={<Suspense fallback={<AdminFallback />}><AdminIntegrations /></Suspense>} />
            </Route>
          </Route>

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </RouterRoutes>
                </ErrorBoundary>
              </main>
              <Footer />
              <ScrollToTopButton />
            </>
          }
        />
      </RouterRoutes>
    </BrowserRouter>
  );
}
