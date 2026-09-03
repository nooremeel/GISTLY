import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Tag, FolderOpen, ArrowRight, Bookmark } from 'lucide-react';

/**
 * Public landing page — shown to unauthenticated visitors at `/`.
 * Authenticated users are silently redirected to `/library`.
 *
 * Design system alignment (gistly-design-system.md):
 *   §1  — Warm paper background, ink text, calm chrome. No glow, no blur.
 *   §3  — Fraunces display serif for the hero headline ONLY (§3: "the one or
 *          two genuinely editorial moments the app has"). Manrope everywhere else.
 *   §2  — Violet used once (the "Get started" primary button). Not on text.
 *   §21 — animate-fade-in on the hero text only. No decorative motion.
 *   §6  — No shadow on the demo card (border-only elevation at rest, per §9).
 */
export default function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Silently send authenticated users to their library.
  useEffect(() => {
    if (!loading && user) {
      navigate('/library', { replace: true });
    }
  }, [user, loading, navigate]);

  // Render nothing while the auth check is in flight — avoids a flash of
  // the landing page for users who are already logged in.
  if (loading) return null;

  return (
    <div className="min-h-[100svh] flex flex-col bg-paper">

      {/* ── Top Nav ──────────────────────────────────────────────────────── */}
      <header className="flex h-16 shrink-0 items-center justify-between px-6 md:px-12 border-b border-line bg-paper">
        <span className="font-sans text-h3 font-semibold tracking-tight text-ink select-none">
          Gistly
        </span>
        <nav className="flex items-center gap-3" aria-label="Site navigation">
          <Link
            to="/login"
            className={[
              'inline-flex items-center h-10 px-4 rounded-md',
              'font-sans text-body font-medium text-muted',
              'hover:text-ink transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
            ].join(' ')}
          >
            Log in
          </Link>
          <Link
            to="/register"
            className={[
              'hidden sm:inline-flex items-center justify-center gap-1 h-10 px-4 rounded-md',
              'bg-ink text-paper font-sans text-body font-medium',
              'hover:brightness-90 hover:shadow-sm transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
            ].join(' ')}
          >
            Get started
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </nav>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="flex flex-col items-center text-center px-6 pt-24 pb-20 md:pt-32 md:pb-28 animate-fade-in"
        aria-labelledby="hero-heading"
      >
        {/* Eyebrow label — Micro, tracked, Violet — §3 + §11 */}
        <div className="flex items-center gap-1.5 mb-8 px-3 py-1 rounded-full border border-line bg-surface text-micro font-semibold uppercase tracking-widest text-accent">
          <Sparkles className="size-3" aria-hidden="true" />
          AI-powered reading memory
        </div>

        <h1
          id="hero-heading"
          className="font-display text-ink leading-[1.1] tracking-tight mb-6 max-w-3xl"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
        >
          Save less.<br />
          Understand more.
        </h1>

        <p className="text-body-lg text-muted max-w-xl mb-10 leading-relaxed">
          Gistly reads every page you bookmark and writes you a sharp, honest summary —
          so your library stays useful long after you've forgotten why you saved something.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/register"
            className={[
              'inline-flex items-center justify-center gap-1.5 h-11 px-6 rounded-md',
              'bg-ink text-paper font-sans font-medium text-body',
              'hover:brightness-90 hover:shadow-sm transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
            ].join(' ')}
          >
            Start your library — it's free
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            to="/login"
            className={[
              'inline-flex items-center justify-center gap-1.5 h-11 px-6 rounded-md',
              'bg-surface border border-line text-ink font-sans font-medium text-body',
              'hover:bg-line/20 transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
            ].join(' ')}
          >
            Log in
          </Link>
        </div>
      </section>

      {/* ── Demo Card ────────────────────────────────────────────────────── */}
      {/*
        A static, hardcoded replica of a real BookmarkCard so visitors see
        exactly what the product looks like — no screenshots, no mocks,
        just actual design-system tokens rendering the real thing.
        §9 + §10: border-only elevation at rest, surface background, radius-lg.
      */}
      <section
        className="px-6 pb-20 md:pb-28 flex flex-col items-center"
        aria-label="Product preview"
      >
        <div className="w-full max-w-2xl">
          {/* Section label above the card */}
          <p className="text-small text-muted text-center mb-6 font-medium">
            This is what a saved article looks like in Gistly
          </p>

          {/* Card — replicates BookmarkCard's visual structure with static data */}
          <article
            className={[
              'bg-surface border border-line rounded-lg p-6 flex flex-col gap-4',
              'shadow-sm',
            ].join(' ')}
            aria-label="Demo bookmark card"
          >
            {/* Domain row */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-small text-muted tracking-tight">
                jalammar.github.io
              </span>
              <Bookmark className="size-4 text-faint" aria-hidden="true" />
            </div>

            {/* Title — §10: H3, Ink, heaviest element on the card */}
            <h3 className="text-h3 font-semibold text-ink leading-snug">
              The Illustrated Transformer
            </h3>

            {/* Gist block — §11: lime-wash background, Micro label, Body text */}
            <div
              className="rounded-md p-4 flex flex-col gap-2"
              style={{ background: 'var(--lime-wash)', border: '1px solid rgba(223,255,87,0.3)' }}
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-3 text-accent" aria-hidden="true" />
                <span className="text-micro font-semibold uppercase tracking-widest text-accent">
                  Gist
                </span>
              </div>
              <p className="text-body text-ink leading-relaxed">
                The clearest visual explanation of how transformers work — attention heads,
                positional encoding, and the encoder–decoder stack demystified with diagrams.
                Essential reading before diving into any GPT-family model internals.
              </p>
            </div>

            {/* Tags + meta row — §12 + §10 */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {['#ml', '#transformers', '#explainer'].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded-sm border border-line bg-paper text-small font-medium text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <span className="text-micro text-faint font-medium shrink-0">2 min ago</span>
            </div>
          </article>

          <p className="text-micro text-faint text-center mt-4 tracking-wide uppercase">
            The Gist is written by AI. The rest is yours.
          </p>
        </div>
      </section>

      {/* ── Feature Row ──────────────────────────────────────────────────── */}
      <section
        className="px-6 pb-24 md:pb-32"
        aria-labelledby="features-heading"
      >
        <h2
          id="features-heading"
          className="sr-only"
        >
          Features
        </h2>

        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              icon: <Sparkles className="size-5 text-accent" aria-hidden="true" />,
              title: 'AI Summaries',
              body: 'Every page you save gets a sharp, readable summary — written instantly, without you lifting a finger.',
            },
            {
              icon: <Tag className="size-5 text-accent" aria-hidden="true" />,
              title: 'Auto-tagged',
              body: 'Gistly suggests tags based on content. Browse by topic, not by the order you happened to save things.',
            },
            {
              icon: <FolderOpen className="size-5 text-accent" aria-hidden="true" />,
              title: 'Organised by default',
              body: 'Collections keep your reading life sorted. Research, design, dev, personal — each in its own place.',
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="flex flex-col gap-3">
              <div className="flex items-center justify-center size-10 rounded-md bg-accent-subtle shrink-0">
                {icon}
              </div>
              <h3 className="text-body font-semibold text-ink">{title}</h3>
              <p className="text-small text-muted leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer CTA ───────────────────────────────────────────────────── */}
      <section className="mt-auto border-t border-line bg-surface px-6 py-16 flex flex-col items-center text-center gap-6">
        <h2 className="text-h2 font-semibold text-ink max-w-md">
          Build the library your future self will thank you for.
        </h2>
        <Link
          to="/register"
          className={[
            'inline-flex items-center justify-center gap-1.5 h-11 px-6 rounded-md',
            'bg-ink text-paper font-sans font-medium text-body',
            'hover:brightness-90 hover:shadow-sm transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
          ].join(' ')}
        >
          Get started — it's free
        </Link>
        <p className="text-small text-faint">No credit card. No ads. Just your library.</p>
      </section>

      {/* ── Minimal footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-line px-6 py-5 flex items-center justify-between text-micro text-faint">
        <span className="font-semibold text-muted">Gistly</span>
        <span>Built with care.</span>
      </footer>
    </div>
  );
}
