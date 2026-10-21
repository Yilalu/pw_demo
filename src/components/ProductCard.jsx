import { Heart } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { request } from '../lib/api.js';
import { useToast } from '../hooks/useToast.js';
import Toast from './Toast.jsx';

// Show product details and keep its favorite button synchronized with the account API.
export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { show, toast, clear } = useToast();
  const [favorited, setFavorited] = useState(Boolean(product.favorited));

  const toggleFavorite = async () => {
    if (!user) return show('Sign in to save products you love.', 'error');
    try {
      // The API owns the saved state; only update the UI after it confirms the change.
      const result = await request(`/api/favorites/${product.id}`, { method: favorited ? 'DELETE' : 'PUT' });
      setFavorited(result.favorited);
      show(result.favorited ? 'Added to your favorites.' : 'Removed from your favorites.');
    } catch (error) {
      show(error.message, 'error');
    }
  };

  return <>
    <article className="product-card">
      <div className={`product-art product-${product.id % 4}`}>
        <span className="product-badge">{product.badge}</span>
        <button className={`favorite-button ${favorited ? 'active' : ''}`} onClick={toggleFavorite}
          aria-label={favorited ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}>
          <Heart size={18} fill={favorited ? 'currentColor' : 'none'} />
        </button>
        <span className="product-emoji" aria-hidden="true">{product.emoji}</span>
      </div>
      <div className="product-details">
        <div className="product-topline"><span>{product.category}</span><span className="rating">★ {Number(product.rating).toFixed(1)}</span></div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="product-price">${Number(product.price).toFixed(2)}<span> USD</span></div>
      </div>
    </article>
    <Toast toast={toast} clear={clear} />
  </>;
}
