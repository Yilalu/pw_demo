import { ArrowRight, BookOpen, Heart, Leaf, Sprout, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

const pillars = [
  {
    icon: <BookOpen size={23} />,
    title: 'Learn something practical',
    text: 'Browse approachable ideas about food, energy, transport, waste, nature, and fashion. Search and filter to find a step that fits your life.',
  },
  {
    icon: <Heart size={23} />,
    title: 'Keep what inspires you',
    text: 'Create a free account to bookmark tips and save products you would like to come back to. Your saved lists are private to your account.',
  },
  {
    icon: <Target size={23} />,
    title: 'Make progress your own',
    text: 'Use your dashboard to write down habits you want to try, mark them complete, and update your profile. Start small and choose your own pace.',
  },
];

// Explain the purpose of EcoLife and clarify what its tips, dashboard, and
// illustrative product catalog are intended to help visitors do.
export default function AboutPage() {
  return <main className="content-wrap page-content about-page">
    <section className="about-hero">
      <div className="about-hero-copy">
        <span className="eyebrow">A little more about us</span>
        <h1>Greener living,<br /><em>made doable.</em></h1>
        <p>EcoLife is a simple guide to making more thoughtful everyday choices. Find useful ideas, discover reusable alternatives, and keep track of the small habits you want to build.</p>
        <Link to="/tips" className="button button-primary">Find your first small step <ArrowRight size={16} /></Link>
      </div>
      <div className="about-art" role="img" aria-label="Illustration of a growing plant">
        <span className="about-art-sun"></span>
        <span className="about-art-leaf leaf-one"></span>
        <span className="about-art-leaf leaf-two"></span>
        <span className="about-art-leaf leaf-three"></span>
        <span className="about-art-stem"></span>
        <span className="about-art-ground"></span>
        <span className="about-art-caption"><Leaf size={15} /> A little can grow a lot</span>
      </div>
    </section>

    <section className="about-purpose">
      <div className="about-purpose-icon"><Sprout size={25} /></div>
      <div>
        <span className="eyebrow">Why EcoLife exists</span>
        <h2>Sustainability shouldn’t feel like an all-or-nothing choice.</h2>
        <p>It can be hard to know where to begin, or which changes are realistic to keep up. EcoLife brings everyday ideas and simple tools together so you can explore options, decide what works for you, and build habits at your own pace. There is no perfect checklist—just a place to start.</p>
      </div>
    </section>

    <section className="about-pillars">
      <div className="section-title">
        <div><span className="eyebrow">What you can do here</span><h2>A helpful place to start and keep going.</h2></div>
      </div>
      <div className="about-pillar-grid">
        {pillars.map((pillar, index) => <article className="about-pillar" key={pillar.title}>
          <span className={`about-pillar-icon pillar-${index}`}>{pillar.icon}</span>
          <h3>{pillar.title}</h3>
          <p>{pillar.text}</p>
        </article>)}
      </div>
    </section>

    <section className="about-note">
      <span className="eyebrow">A note on the shop</span>
      <p>Products are here as examples of reusable and thoughtful alternatives—not a requirement to buy anything. Reusing what you already own, repairing it, or borrowing from someone can be a good place to begin, too.</p>
    </section>

    <section className="join-card about-cta">
      <div className="join-leaf"><Leaf size={30} /></div>
      <div><span className="eyebrow">Whenever you’re ready</span><h2>Your next small step is yours to choose.</h2><p>Explore the tips, or make a free account to save ideas and track your habits.</p></div>
      <Link to="/register" className="button button-light">Get started <ArrowRight size={16} /></Link>
    </section>
  </main>;
}
