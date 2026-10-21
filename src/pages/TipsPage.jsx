import { useEffect, useState } from 'react';
import { Bookmark, ChevronDown, Leaf, Search, X } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import PageIntro from '../components/PageIntro.jsx';
import TipCard from '../components/TipCard.jsx';
import Toast from '../components/Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../hooks/useToast.js';
import { categories, request } from '../lib/api.js';

// Browse the full tips catalog, filter it in the browser, and manage bookmarks.
export default function TipsPage() {
  const { user } = useAuth();
  const { show, toast, clear } = useToast();
  // Search/filter state stays in the browser, while the source list comes from the API.
  const [tips, setTips] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [savedOnly, setSavedOnly] = useState(false);

  // The saved-only switch selects the signed-in user's bookmarks endpoint.
  const loadTips = () => request(savedOnly ? '/api/bookmarks' : '/api/tips')
    .then((data) => setTips(data.tips))
    .catch((error) => show(error.message, 'error'));

  // Re-fetch the correct collection when the saved-only view changes.
  useEffect(() => { loadTips(); }, [savedOnly]);

  const toggleBookmark = async (tip) => {
    if (!user) return show('Sign in to save your favorite tips.', 'error');
    try {
      // Use PUT to save and DELETE to unsave; reload to reflect authoritative API state.
      await request(`/api/bookmarks/${tip.id}`, { method: tip.bookmarked ? 'DELETE' : 'PUT' });
      await loadTips();
      show(tip.bookmarked ? 'Tip removed from your saved list.' : 'Tip saved to your collection.');
    } catch (error) {
      show(error.message, 'error');
    }
  };

  // Apply both controls locally so changing a filter does not need another request.
  const filteredTips = tips.filter((tip) => (category === 'All' || tip.category === category)
    && `${tip.title} ${tip.description} ${tip.category}`.toLowerCase().includes(query.toLowerCase()));

  return <>
    <main className="content-wrap page-content">
      <PageIntro eyebrow="A greener everyday" title="Good ideas grow here.">
        Little changes, shared freely. Find the ones that feel right for you.
      </PageIntro>
      <div className="filter-toolbar">
        <label className="search-field">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tips..." aria-label="Search tips" />
          {query && <button className="icon-button" onClick={() => setQuery('')} aria-label="Clear search"><X size={15} /></button>}
        </label>
        <label className="select-field">
          <span className="sr-only">Filter tips by category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
          <ChevronDown size={16} />
        </label>
        {user && <button className={`button button-outline button-small filter-saved ${savedOnly ? 'selected' : ''}`}
          onClick={() => setSavedOnly(!savedOnly)}>
          <Bookmark size={15} />{savedOnly ? 'All tips' : 'My saved tips'}
        </button>}
      </div>
      <p className="result-count">{filteredTips.length} {filteredTips.length === 1 ? 'idea' : 'ideas'} to explore</p>
      {filteredTips.length
        ? <div className="tip-grid">{filteredTips.map((tip, index) =>
          <TipCard key={tip.id} tip={tip} index={index} onToggle={toggleBookmark} />)}</div>
        : <EmptyState
          icon={<Leaf />}
          title={savedOnly ? 'No saved tips just yet' : 'No tips found'}
          text={savedOnly ? 'Save a tip that speaks to you and it will show up here.' : 'Try a different search or choose another category.'}
          action={savedOnly ? () => setSavedOnly(false) : null}
          actionLabel="Explore all tips"
        />}
    </main>
    <Toast toast={toast} clear={clear} />
  </>;
}
