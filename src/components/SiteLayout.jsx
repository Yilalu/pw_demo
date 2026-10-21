import { ArrowRight, Leaf, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { request } from '../lib/api.js';

// Shared navigation adapts its links and account actions to the current session.
export function Header() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  const logout = async () => {
    try {
      // Destroy the server session first; update the visible UI only after success.
      await request('/api/auth/logout', { method: 'POST' });
      setUser(null);
      navigate('/');
    } catch (error) {
      window.alert(error.message);
    }
  };

  return <header className="site-header">
    <div className="nav-wrap">
      <Link to="/" className="brand" onClick={closeMenu}><span className="brand-icon"><Leaf size={20} fill="currentColor" /></span>eco<span>life</span></Link>
      <button className="mobile-menu icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X /> : <Menu />}</button>
      <nav className={`main-nav ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
        <NavLink to="/about" onClick={closeMenu}>About</NavLink>
        <NavLink to="/tips" onClick={closeMenu}>Eco tips</NavLink>
        <NavLink to="/products" onClick={closeMenu}>Shop</NavLink>
        {user && <NavLink to="/dashboard" onClick={closeMenu}>My space</NavLink>}
      </nav>
      <div className={`nav-actions ${menuOpen ? 'open' : ''}`}>
        {user ? <>
          <Link className="nav-user" to="/dashboard"><span className="avatar">{user.name.charAt(0).toUpperCase()}</span>{user.name.split(' ')[0]}</Link>
          <button className="button button-outline button-small" onClick={logout}><LogOut size={15} /> Log out</button>
        </> : <>
          <Link className="login-link" to="/login">Log in</Link>
          <Link className="button button-primary button-small" to="/register">Get started <ArrowRight size={15} /></Link>
        </>}
      </div>
    </div>
  </header>;
}

// Shared footer links are available from every route.
export function Footer() {
  return <footer className="site-footer"><div className="footer-inner">
    <Link to="/" className="brand"><span className="brand-icon"><Leaf size={19} fill="currentColor" /></span>eco<span>life</span></Link>
    <p>Thoughtful living, one little step at a time.</p>
    <div><Link to="/about">About</Link><Link to="/tips">Eco tips</Link><Link to="/products">Shop</Link></div>
    <span className="copyright">© 2026 EcoLife. Made with a little more care.</span>
  </div></footer>;
}

// Guard private routes while the session loads and send signed-out users to login.
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="loading-page"><span className="loading-leaf"><Leaf /></span>Finding your way…</div>;
  return user ? children : <Navigate to="/login" state={{ from: location.pathname }} replace />;
}
