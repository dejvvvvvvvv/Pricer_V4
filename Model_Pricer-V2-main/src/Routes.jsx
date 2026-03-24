import React, { Suspense } from 'react';
import { BrowserRouter, Routes as RouterRoutes, Route } from 'react-router-dom';
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
import PageTransition from './components/PageTransition';
import CalculatorSkeleton from './pages/test-kalkulacka/components/CalculatorSkeleton';
import AdminPageSkeleton from './components/skeletons/AdminPageSkeleton';
import PublicPageSkeleton from './components/skeletons/PublicPageSkeleton';

// Lazy-loaded public pages (heavy components)
const TestKalkulacka = React.lazy(() => import('./pages/test-kalkulacka'));
const TestKalkulackaWhite = React.lazy(() => import('./pages/test-kalkulacka-white'));
const AccountPage = React.lazy(() => import('./pages/account'));
const WidgetPublicPage = React.lazy(() => import('./pages/widget-public/WidgetPublicPage'));
// SlicerPage — stránka neexistuje, zakomentováno dokud nebude implementována
// const SlicerPage = React.lazy(() => import('./pages/slicer'));
const ModelUpload = React.lazy(() => import('./pages/model-upload'));
const OrderTracking = React.lazy(() => import('./pages/order-tracking'));

// Lazy-loaded admin pages
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminBranding = React.lazy(() => import('./pages/admin/AdminBranding'));
const AdminPricing = React.lazy(() => import('./pages/admin/AdminPricing'));
const AdminFees = React.lazy(() => import('./pages/admin/AdminFees'));
const AdminParameters = React.lazy(() => import('./pages/admin/AdminParameters'));
const AdminPresets = React.lazy(() => import('./pages/admin/AdminPresets'));
const AdminOrders = React.lazy(() => import('./pages/admin/AdminOrders'));
const AdminWidget = React.lazy(() => import('./pages/admin/AdminWidget'));
/* WIDGET_BUILDER_DEACTIVATED: vizualni builder deaktivovan pro BETA, zalohovano 2026-03-21
const AdminWidgetBuilder = React.lazy(() => import('./pages/admin/AdminWidgetBuilder'));
*/
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
const AdminActivityLog = React.lazy(() => import('./pages/admin/AdminActivityLog'));
const AdminSystemHealth = React.lazy(() => import('./pages/admin/AdminSystemHealth'));
const AdminWebhooks = React.lazy(() => import('./pages/admin/AdminWebhooks'));
const AdminCustomers = React.lazy(() => import('./pages/admin/AdminCustomers'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));

/** Fallback for public page lazy loading */
const PageFallback = () => <PublicPageSkeleton />;

/** Fallback for calculator lazy loading */
const CalculatorFallback = () => <CalculatorSkeleton />;

/** Fallback for admin panel lazy loading — generic */
const AdminFallback = () => <AdminPageSkeleton variant="default" />;

/** Fallback for admin dashboard */
const AdminDashboardFallback = () => <AdminPageSkeleton variant="dashboard" />;

/** Fallback for admin table pages (orders, presets) */
const AdminTableFallback = () => <AdminPageSkeleton variant="table" />;

/** Fallback for admin form pages (branding, pricing, fees) */
const AdminFormFallback = () => <AdminPageSkeleton variant="form" />;


export default function Routes() {
  return (
    <BrowserRouter>
      <RouterRoutes>
        {/* Public Widget Route - no Header/Footer (embeddable) */}
        <Route path="/w/:publicWidgetId" element={
          <ErrorBoundary module="PublicWidget">
            <Suspense fallback={<PageFallback />}>
              <WidgetPublicPage />
            </Suspense>
          </ErrorBoundary>
        } />

        {/* Slicer - zakomentováno, stránka není implementována */}
        {/* <Route path="/slicer" element={
          <ErrorBoundary module="SlicerEditor" fullPage>
            <Suspense fallback={<div style={{
              width:'100vw', height:'100vh', display:'flex',
              alignItems:'center', justifyContent:'center',
              background:'var(--forge-bg-void, #08090C)',
              color:'var(--forge-text-primary, #E8ECF1)'
            }}>Loading Slicer...</div>}>
              <SlicerPage />
            </Suspense>
          </ErrorBoundary>
        } /> */}

        {/* WIDGET_BUILDER_DEACTIVATED: vizualni builder deaktivovan pro BETA, zalohovano 2026-03-21
        <Route element={<PrivateRoute />}>
          <Route path="/admin/widget/builder/:id" element={
            <ErrorBoundary module="WidgetBuilder">
              <Suspense fallback={<PageFallback />}>
                <AdminWidgetBuilder />
              </Suspense>
            </ErrorBoundary>
          } />
        </Route>
        */}

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
          <Route path="/model-upload" element={<Suspense fallback={<PageFallback />}><PageTransition><ModelUpload /></PageTransition></Suspense>} />
          <Route path="/test-kalkulacka" element={<Suspense fallback={<CalculatorFallback />}><PageTransition><TestKalkulacka /></PageTransition></Suspense>} />
          <Route path="/test-kalkulacka-white" element={<Suspense fallback={<CalculatorFallback />}><PageTransition><TestKalkulackaWhite /></PageTransition></Suspense>} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/support" element={<Support />} />
          <Route path="/track" element={<Suspense fallback={<PageFallback />}><PageTransition><OrderTracking /></PageTransition></Suspense>} />

          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/account" element={<Suspense fallback={<PageFallback />}><PageTransition><AccountPage /></PageTransition></Suspense>} />
          </Route>

          {/* Public invite acceptance (demo) */}
          <Route path="/invite/accept" element={<InviteAccept />} />

          {/* Admin Panel (protected) */}
          <Route element={<PrivateRoute />}>
            <Route path="/admin" element={<ErrorBoundary module="AdminPanel"><AdminLayout /></ErrorBoundary>}>
              <Route index element={<Suspense fallback={<AdminDashboardFallback />}><PageTransition><AdminDashboard /></PageTransition></Suspense>} />
              <Route path="branding" element={<Suspense fallback={<AdminFormFallback />}><PageTransition><AdminBranding /></PageTransition></Suspense>} />
              <Route path="pricing" element={<Suspense fallback={<AdminFormFallback />}><PageTransition><AdminPricing /></PageTransition></Suspense>} />
              <Route path="fees" element={<Suspense fallback={<AdminFormFallback />}><PageTransition><AdminFees /></PageTransition></Suspense>} />
              <Route path="parameters/*" element={<Suspense fallback={<AdminTableFallback />}><PageTransition><AdminParameters /></PageTransition></Suspense>} />
              <Route path="presets/*" element={<Suspense fallback={<AdminTableFallback />}><PageTransition><AdminPresets /></PageTransition></Suspense>} />
              <Route path="orders/*" element={<Suspense fallback={<AdminTableFallback />}><PageTransition><AdminOrders /></PageTransition></Suspense>} />
              <Route path="payments" element={<Suspense fallback={<AdminTableFallback />}><PageTransition><AdminPayments /></PageTransition></Suspense>} />
              <Route path="model-storage" element={<Suspense fallback={<AdminTableFallback />}><PageTransition><AdminModelStorage /></PageTransition></Suspense>} />
              <Route path="widget" element={<Suspense fallback={<AdminFormFallback />}><PageTransition><AdminWidget /></PageTransition></Suspense>} />
              {/* Hidden for beta - analytics not ready yet */}
              <Route path="lockanalytics" element={<Suspense fallback={<AdminDashboardFallback />}><PageTransition><AdminAnalytics /></PageTransition></Suspense>} />
              <Route path="team" element={<Suspense fallback={<AdminTableFallback />}><PageTransition><AdminTeamAccess /></PageTransition></Suspense>} />
              <Route path="express" element={<Suspense fallback={<AdminFormFallback />}><PageTransition><AdminExpress /></PageTransition></Suspense>} />
              <Route path="shipping" element={<Suspense fallback={<AdminFormFallback />}><PageTransition><AdminShipping /></PageTransition></Suspense>} />
              <Route path="emails" element={<Suspense fallback={<AdminFormFallback />}><PageTransition><AdminEmails /></PageTransition></Suspense>} />
              <Route path="coupons" element={<Suspense fallback={<AdminTableFallback />}><PageTransition><AdminCoupons /></PageTransition></Suspense>} />
              <Route path="migration" element={<Suspense fallback={<AdminFallback />}><PageTransition><AdminMigration /></PageTransition></Suspense>} />
              <Route path="integrations" element={<Suspense fallback={<AdminFormFallback />}><PageTransition><AdminIntegrations /></PageTransition></Suspense>} />
              <Route path="activity" element={<Suspense fallback={<AdminTableFallback />}><PageTransition><AdminActivityLog /></PageTransition></Suspense>} />
              <Route path="system" element={<Suspense fallback={<AdminFallback />}><PageTransition><AdminSystemHealth /></PageTransition></Suspense>} />
              <Route path="webhooks" element={<Suspense fallback={<AdminTableFallback />}><PageTransition><AdminWebhooks /></PageTransition></Suspense>} />
              <Route path="customers" element={<Suspense fallback={<AdminTableFallback />}><PageTransition><AdminCustomers /></PageTransition></Suspense>} />
              <Route path="settings" element={<Suspense fallback={<AdminFormFallback />}><PageTransition><AdminSettings /></PageTransition></Suspense>} />
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
