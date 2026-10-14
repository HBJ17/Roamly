import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { RequireRole, TravellerOnly } from './components/layout/RouteGuards';
import { PageLoader, EmptyState } from './components/ui';

const HomePage = lazy(() => import('./pages/HomePage'));
const DestinationsPage = lazy(() => import('./pages/DestinationsPage'));
const DestinationPage = lazy(() => import('./pages/DestinationPage'));
const HotelsPage = lazy(() => import('./pages/listings/HotelsPage'));
const HotelDetailPage = lazy(() => import('./pages/listings/HotelDetailPage'));
const TransportsPage = lazy(() => import('./pages/listings/TransportsPage'));
const TransportDetailPage = lazy(() => import('./pages/listings/TransportDetailPage'));
const PackagesPage = lazy(() => import('./pages/listings/PackagesPage'));
const PackageDetailPage = lazy(() => import('./pages/listings/PackageDetailPage'));
const ComparePage = lazy(() => import('./pages/listings/ComparePage'));
const OffersPage = lazy(() => import('./pages/listings/OffersPage'));
const CheckoutPage = lazy(() => import('./pages/checkout/CheckoutPage'));
const BookingDetailPage = lazy(() => import('./pages/account/BookingDetailPage'));
const PlannerPage = lazy(() => import('./pages/planner/PlannerPage'));
const AccountLayout = lazy(() => import('./pages/account/AccountLayout'));
const accountPage = (name) => lazy(() => import('./pages/account/AccountPages').then((m) => ({ default: m[name] })));
const AccountOverview = accountPage('AccountOverview');
const MyBookings = accountPage('MyBookings');
const MyTrips = accountPage('MyTrips');
const WalletPage = accountPage('WalletPage');
const SavedPage = accountPage('SavedPage');
const ReviewsPage = accountPage('ReviewsPage');
const ProfilePage = accountPage('ProfilePage');
const Messenger = lazy(() => import('./components/portal/Messenger'));
const NotificationsList = lazy(() => import('./components/portal/NotificationsList'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const PartnerRegisterPage = lazy(() => import('./pages/auth/PartnerRegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/RecoveryPages').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth/RecoveryPages').then((m) => ({ default: m.ResetPasswordPage })));
const VerifyEmailPage = lazy(() => import('./pages/auth/RecoveryPages').then((m) => ({ default: m.VerifyEmailPage })));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const NotFound = () => (
  <div className="main-container">
    <EmptyState title="This page took a wrong turn" action={<Link to="/" className="btn btn-primary">Back to Roamly</Link>}>
      The page you are looking for does not exist or has moved.
    </EmptyState>
  </div>
);

export default function App() {
  return (
    <>
      <div className="halftone-bg" />
      <ScrollToTop />
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 280px)', position: 'relative', zIndex: 1 }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<TravellerOnly><HomePage /></TravellerOnly>} />

            <Route path="/destinations" element={<TravellerOnly><DestinationsPage /></TravellerOnly>} />
            <Route path="/destinations/:slug" element={<TravellerOnly><DestinationPage /></TravellerOnly>} />
            <Route path="/hotels" element={<TravellerOnly><HotelsPage /></TravellerOnly>} />
            <Route path="/hotels/:id" element={<TravellerOnly><HotelDetailPage /></TravellerOnly>} />
            <Route path="/transports" element={<TravellerOnly><TransportsPage /></TravellerOnly>} />
            <Route path="/transports/:id" element={<TravellerOnly><TransportDetailPage /></TravellerOnly>} />
            <Route path="/packages" element={<TravellerOnly><PackagesPage /></TravellerOnly>} />
            <Route path="/packages/:id" element={<TravellerOnly><PackageDetailPage /></TravellerOnly>} />
            <Route path="/compare" element={<TravellerOnly><ComparePage /></TravellerOnly>} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/plan" element={<TravellerOnly><PlannerPage /></TravellerOnly>} />
            <Route path="/plan/:id" element={<RequireRole roles={['user']}><PlannerPage /></RequireRole>} />
            <Route path="/checkout/:id" element={<RequireRole roles={['user']}><CheckoutPage /></RequireRole>} />
            <Route path="/account/bookings/:id" element={<RequireRole roles={['user']}><BookingDetailPage /></RequireRole>} />
            <Route path="/account" element={<RequireRole roles={['user']}><AccountLayout /></RequireRole>}>
              <Route index element={<AccountOverview />} />
              <Route path="bookings" element={<MyBookings />} />
              <Route path="trips" element={<MyTrips />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="saved" element={<SavedPage />} />
              <Route path="messages" element={<Messenger basePath="/account/messages" />} />
              <Route path="messages/:id" element={<Messenger basePath="/account/messages" />} />
              <Route path="notifications" element={<NotificationsList />} />
              <Route path="reviews" element={<ReviewsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/partner/register" element={<PartnerRegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}


