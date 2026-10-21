import { Link, Route, Routes } from 'react-router-dom';
import { ArrowRight, Leaf } from 'lucide-react';
import Toast from './components/Toast.jsx';
import { Footer, Header, ProtectedRoute } from './components/SiteLayout.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AuthPage from './pages/AuthPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import HomePage from './pages/HomePage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import TipsPage from './pages/TipsPage.jsx';

// Friendly fallback for URLs that do not match one of the pages below.
function NotFoundPage() {
  return <main className="content-wrap not-found">
    <Leaf size={38} />
    <h1>Looks like this path is still growing.</h1>
    <Link className="button button-primary" to="/">Back to home <ArrowRight size={16} /></Link>
  </main>;
}

// Keep route declarations in one place so page modules can focus on their own UI and data.
function AppRoutes() {
  const { authError, clearAuthError } = useAuth();

  return <div className="app-shell">
    <Header />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/tips" element={<TipsPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    <Toast toast={authError ? { message: authError, type: 'error' } : null} clear={clearAuthError} />
    <Footer />
  </div>;
}

// The auth provider makes the signed-in user available to navigation and every page.
export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}
