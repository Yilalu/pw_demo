import { useState } from 'react';
import { ArrowLeft, ArrowRight, Leaf } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../hooks/useToast.js';
import { request } from '../lib/api.js';

// One shared form handles both registration and login; mode selects its fields,
// validation hints, and matching server endpoint.
export default function AuthPage({ mode }) {
  const { setUser, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { show, toast } = useToast();
  const isRegister = mode === 'register';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  // A signed-in user should not see the sign-in/register form again.
  if (user) return <Navigate to="/dashboard" replace />;

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      // Registration and login share the form; mode chooses the matching API route.
      const result = await request(`/api/auth/${isRegister ? 'register' : 'login'}`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      // Save the returned public user in shared state and resume a protected
      // page if login was triggered by its route guard.
      setUser(result.user);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (error) {
      show(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return <>
    <main className="auth-page">
      <div className="auth-side">
        <div className="auth-decoration"><span>☘</span></div>
        <span className="eyebrow">A gentler kind of progress</span>
        <h2>Growing better,<br /><em>together.</em></h2>
        <p>Every mindful choice is a little seed. Let’s see what yours can grow into.</p>
        <Link to="/" className="auth-back"><ArrowLeft size={15} /> Back to the good stuff</Link>
      </div>
      <section className="auth-card">
        <div className="auth-mobile-brand">
          <Link to="/" className="brand"><span className="brand-icon"><Leaf size={19} fill="currentColor" /></span>eco<span>life</span></Link>
        </div>
        <span className="eyebrow">{isRegister ? 'A fresh start' : 'Welcome back'}</span>
        <h1>{isRegister ? 'Join the journey.' : 'Good to see you.'}</h1>
        <p className="auth-description">
          {isRegister ? 'Create your free account and find your own greener rhythm.' : 'Sign in to pick up where your greener days left off.'}
        </p>
        <form onSubmit={submit} className="auth-form">
          {isRegister && <label>Your name
            <input name="name" autoComplete="name" value={form.name} onChange={update}
              placeholder="Alex Green" required minLength="1" maxLength="80" />
          </label>}
          <label>Email address
            <input type="email" name="email" autoComplete="email" value={form.email} onChange={update}
              placeholder="you@example.com" required maxLength="254" />
          </label>
          <label>Password
            <input type="password" name="password" autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={form.password} onChange={update} placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
              required minLength={isRegister ? 8 : 1} maxLength="128" />
          </label>
          {toast && <div className="inline-error" role="alert">{toast.message}</div>}
          <button className="button button-primary auth-submit" disabled={busy}>
            {busy ? 'One moment…' : isRegister ? 'Create my account' : 'Sign in'} <ArrowRight size={17} />
          </button>
        </form>
        <p className="auth-switch">
          {isRegister ? 'Already part of the journey?' : 'New around here?'}
          <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link>
        </p>
      </section>
    </main>
  </>;
}
