import Link from "next/link";
import type { ReactNode } from "react";

type NavSection = "feed" | "scrivi" | "carteggi" | "profilo";

const ICONS: Record<NavSection, ReactNode> = {
  feed: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h11" />
    </svg>
  ),
  scrivi: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  carteggi: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  profilo: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

type Tab = { id: NavSection; label: string; href: string };
const TABS: Tab[] = [
  { id: "feed", label: "feed", href: "/feed" },
  { id: "scrivi", label: "scrivi", href: "/scrivi" },
  { id: "carteggi", label: "carteggi", href: "/carteggi" },
  { id: "profilo", label: "tu", href: "/profilo" },
];

export default function Nav({ active }: { active?: NavSection }) {
  return (
    <>
      {/* Top header — brand only */}
      <header className="sticky top-0 z-10 border-b border-rule bg-paper/95 backdrop-blur-sm">
        <div className="max-w-xl mx-auto px-6 py-3 text-center">
          <Link
            href="/feed"
            className="font-serif text-xl font-medium leading-none hover:no-underline"
          >
            Cartegg<span className="text-accent italic">i</span>o
          </Link>
        </div>
      </header>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-10 border-t border-rule bg-paper/95 backdrop-blur-sm"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-xl mx-auto px-2 py-2 flex justify-around items-center">
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                active === tab.id
                  ? "text-accent"
                  : "text-ink-faded hover:text-accent"
              }`}
            >
              {ICONS[tab.id]}
              <span className="font-sans text-[10px] tracking-widest uppercase">
                {tab.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
