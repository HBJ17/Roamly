import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { RequireRole, TravellerOnly } from './components/layout/RouteGuards';
import { PageLoader, EmptyState } from './components/ui';

const HomePage = lazy(() => import('./pages/HomePage'));
const DestinationsPage = lazy(() => import('./pages/DestinationsPage'));
const DestinationPage = lazy(() => import('./pages/DestinationPage'));
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


