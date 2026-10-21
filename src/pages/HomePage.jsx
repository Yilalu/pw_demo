import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Leaf, Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import TipCard from '../components/TipCard.jsx';
import Toast from '../components/Toast.jsx';
import WeatherCard from '../components/WeatherCard.jsx';
import { useToast } from '../hooks/useToast.js';
import { request } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

function Hero() {
  // The top-of-home-page introduction and primary routes into the site.
  return <section className="hero">
    <div className="hero-copy">
      <div className="hero-kicker"><span className="kicker-dot" /> A little better, every day</div>
      <h1>Live a little<br /><em>greener.</em></h1>
      <p>Good for the planet. Good for you. Discover simple ideas that make sustainable living feel like second nature.</p>
      <div className="hero-actions">
        <Link to="/tips" className="button button-primary">Explore eco tips <ArrowRight size={17} /></Link>
        <Link to="/register" className="button button-plain">Start your journey <ArrowUpRight size={16} /></Link>
      </div>
      <div className="hero-note"><div className="note-avatars"><span>🌿</span><span>☀️</span><span>🌱</span></div><span>Join a community making a difference</span></div>
    </div>
    <div className="hero-art">
      <div className="hero-photo" role="img" aria-label="A sunny green botanical illustration"></div>
      <div className="hero-sticker"><span className="sticker-icon"><Sprout size={21} /></span><span><strong>Little steps.</strong><small>Lasting change.</small></span></div>
      <div className="hero-stamp"><span>GROW<br />WITH<br />CARE</span><Leaf size={23} /></div>
      <div className="hero-curve"></div>
    </div>
  </section>;
}

function JoinCard({ user }) {
  // Signed-in visitors go to their dashboard; others can create an account.
  return <section className="join-card">
    <div className="join-leaf"><Sprout size={32} /></div>
    <div><span className="eyebrow">Your greener days start here</span><h2>A few good habits go a long way.</h2><p>Save your favorite tips, track your progress, and find your own version of a greener life.</p></div>
    <Link to={user ? '/dashboard' : '/register'} className="button button-light">
      {user ? 'Visit my space' : 'Create your free account'} <ArrowRight size={16} />
    </Link>
  </section>;
}

// Assemble the landing page from reusable cards and small featured API samples.
export default function HomePage() {
  const [tips, setTips] = useState([]);
  const [products, setProducts] = useState([]);
  const { user } = useAuth();
  const { show, toast, clear } = useToast();

  useEffect(() => {
    // Load a few records for the homepage preview; full browsing happens on
    // the dedicated tips and products pages.
    request('/api/tips')
      .then((data) => setTips(data.tips.slice(0, 3)))
      .catch((error) => show(error.message, 'error'));
    request('/api/products')
      .then((data) => setProducts(data.products.slice(0, 3)))
      .catch((error) => show(error.message, 'error'));
  }, []);

  return <>
    <Hero />
    <WeatherCard />
    <main className="content-wrap">
      <section className="home-section">
        <SectionTitle eyebrow="A place to start" title="Small changes, big impact" link="All eco tips" to="/tips" />
        <div className="tip-grid">{tips.map((tip, index) => <TipCard key={tip.id} tip={tip} index={index} />)}</div>
      </section>
      <section className="home-section products-home">
        <SectionTitle eyebrow="Thoughtful finds" title="Good things, made better" link="Browse the shop" to="/products" />
        <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>
      <JoinCard user={user} />
    </main>
    <Toast toast={toast} clear={clear} />
  </>;
}
