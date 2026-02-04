import { BrowserRouter, Routes as RouterRoutes, Route } from 'react-router-dom';
import Header from './components/ui/Header';
import Footer from './components/ui/Footer';
import SmoothScroll from './components/SmoothScroll';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/home';
import ModelUpload from './pages/model-upload';
import TestKalkulacka from './pages/test-kalkulacka';
import Pricing from './pages/pricing';
import Support from './pages/support';
import AccountPage from './pages/account';
import PrivateRoute from './components/PrivateRoute';
import NotFound from './pages/NotFound';
import Login from './pages/login';
import Register from './pages/register';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBranding from './pages/admin/AdminBranding';
import AdminPricing from './pages/admin/AdminPricing';
import AdminFees from './pages/admin/AdminFees';
import AdminParameters from './pages/admin/AdminParameters';
import AdminPresets from './pages/admin/AdminPresets';
import AdminOrders from './pages/admin/AdminOrders';
import AdminWidget from './pages/admin/AdminWidget';
import AdminWidgetBuilder from './pages/admin/AdminWidgetBuilder';
import AdminTeamAccess from './pages/admin/AdminTeamAccess';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import InviteAccept from './pages/InviteAccept';
import WidgetPublicPage from './pages/widget-public/WidgetPublicPage';


export default function Routes() {
  return (
    <BrowserRouter>
      <RouterRoutes>
        {/* Public Widget Route - no Header/Footer (embeddable) */}
        <Route path="/w/:publicWidgetId" element={<WidgetPublicPage />} />

        {/* Widget Builder - fullscreen, no admin sidebar / Header / Footer */}
        <Route path="/admin/widget/builder/:id" element={<AdminWidgetBuilder />} />

        {/* Main app with Header/Footer */}
        <Route
          path="*"
          element={
            <>
              <SmoothScroll />
              <ScrollToTop />
              <Header />
              <main>
                <RouterRoutes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

          {/* veřejné */}
          <Route path="/" element={<Home />} />
          <Route path="/model-upload" element={<ModelUpload />} />
          <Route path="/test-kalkulacka" element={<TestKalkulacka />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/support" element={<Support />} />

          {/* chráněné - DOČASNĚ VYPNUTO PRO VÝVOJ */}
          {/* <Route element={<PrivateRoute />}> */}
            <Route path="/account" element={<AccountPage />} />
          {/* </Route> */}

          {/* Public invite acceptance (demo) */}
          <Route path="/invite/accept" element={<InviteAccept />} />

          {/* Admin Panel */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="branding" element={<AdminBranding />} />
            <Route path="pricing" element={<AdminPricing />} />
            <Route path="fees" element={<AdminFees />} />
            {/* NOTE: subroutes are handled inside these modules */}
            <Route path="parameters/*" element={<AdminParameters />} />
            <Route path="presets/*" element={<AdminPresets />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="widget" element={<AdminWidget />} />
            {/* widget/builder/:id moved to top-level for fullscreen builder */}
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="team" element={<AdminTeamAccess />} />
          </Route>

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </RouterRoutes>
              </main>
              <Footer />
            </>
          }
        />
      </RouterRoutes>
    </BrowserRouter>
  );
}
