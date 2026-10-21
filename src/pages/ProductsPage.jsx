import { useEffect, useState } from 'react';
import { ChevronDown, Heart, Search, X } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import PageIntro from '../components/PageIntro.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Toast from '../components/Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../hooks/useToast.js';
import { request } from '../lib/api.js';

// Browse the example product catalog and optionally filter to saved favorites.
export default function ProductsPage() {
  // Keep catalog, search, category, and favorites-only view as independent UI state.
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const { user } = useAuth();
  const { show, toast, clear } = useToast();

  // Fetch either the public catalog or this account's saved favorites.
  const loadProducts = () => request(favoritesOnly ? '/api/favorites' : '/api/products')
    .then((data) => setProducts(favoritesOnly
      ? data.products.map((product) => ({ ...product, favorited: 1 }))
      : data.products))
    .catch((error) => show(error.message, 'error'));

  // Re-fetch when switching between the public catalog and personal favorites.
  useEffect(() => { loadProducts(); }, [favoritesOnly]);

  // Category and text filters are combined after loading the selected list.
  const visibleProducts = products.filter((product) => (category === 'All' || product.category === category)
    && `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(query.toLowerCase()));
  const productCategories = ['All', ...new Set(products.map((product) => product.category))];

  return <>
    <main className="content-wrap page-content">
      <PageIntro eyebrow="A little more thoughtful" title="Good things, made better.">
        Everyday favorites with a lighter footprint. Discover pieces designed to be used, loved, and used again.
      </PageIntro>
      <div className="filter-toolbar">
        <label className="search-field">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find something good..." aria-label="Search products" />
          {query && <button className="icon-button" onClick={() => setQuery('')} aria-label="Clear search"><X size={15} /></button>}
        </label>
        <label className="select-field">
          <span className="sr-only">Filter products by category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {productCategories.map((item) => <option key={item}>{item}</option>)}
          </select>
          <ChevronDown size={16} />
        </label>
        {user && <button className={`button button-outline button-small filter-saved ${favoritesOnly ? 'selected' : ''}`}
          onClick={() => setFavoritesOnly(!favoritesOnly)}>
          <Heart size={15} />{favoritesOnly ? 'All products' : 'My favorites'}
        </button>}
      </div>
      <p className="result-count">{visibleProducts.length} thoughtful {visibleProducts.length === 1 ? 'find' : 'finds'}</p>
      {visibleProducts.length
        ? <div className="product-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        : <EmptyState
          icon={<Heart />}
          title={favoritesOnly ? 'Your favorites are waiting' : 'No products found'}
          text={favoritesOnly ? 'Tap the heart on a product to save it here.' : 'Try changing your search or category.'}
          action={favoritesOnly ? () => setFavoritesOnly(false) : null}
          actionLabel="Browse everything"
        />}
      <div className="shop-note"><span aria-hidden="true">🌱</span><span>Thoughtfully picked. Made to last. Better by nature.</span></div>
    </main>
    <Toast toast={toast} clear={clear} />
  </>;
}
