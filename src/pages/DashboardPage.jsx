import { useEffect, useState } from 'react';
import { Bookmark, Check, CheckCircle2, Heart, Leaf, Plus, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Toast from '../components/Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../hooks/useToast.js';
import { categories, request } from '../lib/api.js';

// Small dashboard sections are separate components so the page's data behavior
// can be read independently from its presentation.
function DashboardWelcome({ name, onEdit, editing }) {
  return <div className="dashboard-welcome">
    <div><span className="eyebrow">Your little corner of the planet</span><h1>Good to have you, {name.split(' ')[0]}.</h1><p>Every greener choice is progress worth celebrating.</p></div>
    <button className="button button-outline button-small" onClick={onEdit}>
      {editing ? <X size={15} /> : <Leaf size={15} />}{editing ? 'Close profile' : 'Edit profile'}
    </button>
  </div>;
}

function ProfileForm({ profile, setProfile, onSave }) {
  // The parent owns profile state and submits this controlled form to the API.
  return <form className="profile-form panel" onSubmit={onSave}>
    <h2>Your profile</h2>
    <label>Name<input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} required maxLength="80" /></label>
    <label>Location <span className="optional">(optional)</span>
      <input value={profile.location} onChange={(event) => setProfile({ ...profile, location: event.target.value })}
        maxLength="100" placeholder="A city, a neighborhood, a little place" />
    </label>
    <button className="button button-primary button-small">Save changes <Check size={15} /></button>
  </form>;
}

function DashboardStats({ completed, savedTips, favorites }) {
  // Derive the summary cards from the collections already loaded by the page.
  return <div className="stats-grid">
    <div className="stat-card stat-green"><span className="stat-icon"><CheckCircle2 /></span><span className="stat-label">Habits completed</span><strong>{completed}</strong><small>little wins for the planet</small></div>
    <div className="stat-card stat-yellow"><span className="stat-icon"><Bookmark /></span><span className="stat-label">Saved ideas</span><strong>{savedTips.length}</strong><small>{savedTips.length > 3 ? 'and more waiting for you' : 'ready when you are'}</small></div>
    <div className="stat-card stat-lilac"><span className="stat-icon"><Heart /></span><span className="stat-label">Thoughtful finds</span><strong>{favorites.length}</strong><small>on your wishlist</small></div>
  </div>;
}

function ActivityList({ activities, onToggle, onRemove }) {
  // Show an invitation when the account has no activities yet.
  if (!activities.length) return <div className="activities-empty"><span>🌱</span><div><strong>A fresh page, full of possibility.</strong><p>Add one small habit you would like to try this week.</p></div></div>;
  // Completion and deletion are callbacks so API work remains in DashboardPage.
  return <div className="activity-list">{activities.map((activity) =>
    <div className={`activity-row ${activity.completed ? 'completed' : ''}`} key={activity.id}>
      <button className="check-toggle" onClick={() => onToggle(activity)}
        aria-label={activity.completed ? 'Mark activity incomplete' : 'Mark activity complete'}>
        {activity.completed && <Check size={14} />}
      </button>
      <div className="activity-info"><strong>{activity.title}</strong>
        <span>{activity.category} <span className="activity-dot">·</span> {activity.impact}</span>
      </div>
      <button className="icon-button delete-activity" onClick={() => onRemove(activity.id)}
        aria-label={`Remove ${activity.title}`}><Trash2 size={16} /></button>
    </div>)}
  </div>;
}

function ActivityPanel({ activities, completed, form, setForm, busy, onAdd, onToggle, onRemove }) {
  // Collect the activity form, progress count, and activity list in one section.
  return <section className="dashboard-panel panel">
    <div className="section-title dashboard-section-title">
      <div><span className="eyebrow">Small actions, real progress</span><h2>My everyday habits</h2></div>
      <span className="task-progress">{completed} / {activities.length} done</span>
    </div>
    <form className="activity-form" onSubmit={onAdd}>
      <label className="sr-only" htmlFor="new-activity">Add a good habit</label>
      <input id="new-activity" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })}
        placeholder="What greener habit would you like to try?" required maxLength="120" />
      <select aria-label="Activity category" value={form.category}
        onChange={(event) => setForm({ ...form, category: event.target.value })}>
        {['Everyday', ...categories.slice(1)].map((item) => <option key={item}>{item}</option>)}
      </select>
      <button className="button button-primary button-small" disabled={busy}><Plus size={17} /><span>Add habit</span></button>
    </form>
    <ActivityList activities={activities} onToggle={onToggle} onRemove={onRemove} />
  </section>;
}

function SavedItems({ savedTips, favorites }) {
  // Give quick links to the three most recent saved tips and favorite products.
  return <section className="dashboard-bottom">
    <div className="panel mini-panel">
      <div className="mini-panel-head"><div><span className="eyebrow">Tucked away for later</span><h2>Saved tips</h2></div>
        <Link to="/tips" className="round-arrow" aria-label="Explore all tips"><span aria-hidden="true">→</span></Link></div>
      {savedTips.length ? savedTips.slice(0, 3).map((tip) =>
        <Link to="/tips" className="saved-row" key={tip.id}>
          <span className="saved-leaf"><Leaf size={16} /></span>
          <span><strong>{tip.title}</strong><small>{tip.category} · {tip.read_time} min read</small></span>
          <span aria-hidden="true">↗</span>
        </Link>)
        : <p className="mini-empty">Save an idea from the <Link to="/tips">eco tips</Link> page and it will be waiting here.</p>}
    </div>
    <div className="panel mini-panel">
      <div className="mini-panel-head"><div><span className="eyebrow">The things you love</span><h2>Your favorites</h2></div>
        <Link to="/products" className="round-arrow" aria-label="Shop eco-friendly products"><span aria-hidden="true">→</span></Link></div>
      {favorites.length ? favorites.slice(0, 3).map((product) =>
        <Link to="/products" className="saved-row" key={product.id}>
          <span className="favorite-emoji">{product.emoji}</span>
          <span><strong>{product.name}</strong><small>{product.category} · ${Number(product.price).toFixed(2)}</small></span>
          <span aria-hidden="true">↗</span>
        </Link>)
        : <p className="mini-empty">Find something you love in the <Link to="/products">thoughtful shop</Link>.</p>}
    </div>
  </section>;
}

// Load and mutate the signed-in user's profile, activities, bookmarks, and favorites.
export default function DashboardPage() {
  const { user, setUser } = useAuth();
  const { show, toast, clear } = useToast();
  const [activities, setActivities] = useState([]);
  const [savedTips, setSavedTips] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [form, setForm] = useState({ title: '', category: 'Everyday' });
  const [profile, setProfile] = useState({ name: user.name, location: user.location || '' });
  const [showProfile, setShowProfile] = useState(false);
  const [busy, setBusy] = useState(false);

  // Refresh all dashboard data after mutations so counts and lists stay in sync.
  const reload = async () => {
    // These independent requests can run together rather than sequentially.
    const [activityData, tipData, productData] = await Promise.all([
      request('/api/activities'), request('/api/bookmarks'), request('/api/favorites'),
    ]);
    setActivities(activityData.activities);
    setSavedTips(tipData.tips);
    setFavorites(productData.products);
  };

  // Load personal collections once after the protected page is mounted.
  useEffect(() => { reload().catch((error) => show(error.message, 'error')); }, []);
  const completed = activities.filter((activity) => activity.completed).length;

  const addActivity = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      // Clear the form and reload only after the server accepts the new activity.
      await request('/api/activities', { method: 'POST', body: JSON.stringify(form) });
      setForm({ title: '', category: 'Everyday' });
      await reload();
      show('A new good habit is on your list.');
    } catch (error) {
      show(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggleActivity = async (activity) => {
    try {
      // Send the opposite completion state; the API verifies activity ownership.
      await request(`/api/activities/${activity.id}`, {
        method: 'PATCH', body: JSON.stringify({ completed: !activity.completed }),
      });
      await reload();
    } catch (error) {
      show(error.message, 'error');
    }
  };

  const removeActivity = async (id) => {
    try {
      // The delete route is scoped to the signed-in user on the server.
      await request(`/api/activities/${id}`, { method: 'DELETE' });
      await reload();
      show('Activity removed from your list.');
    } catch (error) {
      show(error.message, 'error');
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      // Replace local auth/profile state with the server's updated public user.
      const result = await request('/api/profile', { method: 'PATCH', body: JSON.stringify(profile) });
      setUser(result.user);
      setProfile({ name: result.user.name, location: result.user.location });
      setShowProfile(false);
      show('Your profile is up to date.');
    } catch (error) {
      show(error.message, 'error');
    }
  };

  return <>
    <main className="content-wrap page-content dashboard-page">
      <DashboardWelcome name={user.name} editing={showProfile} onEdit={() => setShowProfile(!showProfile)} />
      {showProfile && <ProfileForm profile={profile} setProfile={setProfile} onSave={saveProfile} />}
      <DashboardStats completed={completed} savedTips={savedTips} favorites={favorites} />
      <ActivityPanel activities={activities} completed={completed} form={form} setForm={setForm} busy={busy}
        onAdd={addActivity} onToggle={toggleActivity} onRemove={removeActivity} />
      <SavedItems savedTips={savedTips} favorites={favorites} />
    </main>
    <Toast toast={toast} clear={clear} />
  </>;
}
