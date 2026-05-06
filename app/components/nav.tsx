"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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

function detectActive(pathname: string): NavSection | undefined {
  if (pathname.startsWith("/feed") || pathname.startsWith("/eco")) return "feed";
  if (pathname.startsWith("/scrivi")) return "scrivi";
  if (pathname.startsWith("/carteggi")) return "carteggi";
  if (pathname.startsWith("/profilo") || pathname.startsWith("/admin")) return "profilo";
  return undefined;
}

// Nota: il prop `active` è opzionale e ignorato (mantenuto per compatibilità
// con pagine vecchie che ancora lo passano). L'highlight è sempre derivato
// da usePathname.
// Il prop `hideTopHeader` permette ad alcune pagine (es. carteggio singolo)
// di mostrare un proprio header sticky al posto del logo.
type NavProps = { active?: NavSection; hideTopHeader?: boolean };

export default function Nav(props: NavProps = {}) {
  const hideTopHeader = props.hideTopHeader ?? false;
  const pathname = usePathname();
  const active = detectActive(pathname);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchUnread() {
      try {
        // cache: no-store + cache-buster query: il count deve sempre essere fresco,
        // soprattutto dopo che apri un carteggio e i messaggi vengono marcati letti.
        const res = await fetch(`/api/unread?t=${Date.now()}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!cancelled) setUnread(typeof data.count === "number" ? data.count : 0);
      } catch {
        // silently ignore
      }
    }

    fetchUnread();

    const onFocus = () => fetchUnread();
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchUnread();
    };
    // Evento custom: le pagine che marcano qualcosa come letto (es. apertura
    // di un singolo carteggio) lo dispatchano dopo il mount via il componente
    // <RefreshUnread />. Permette di rinfrescare il badge anche su iOS PWA
    // dove il pathname change da solo non sempre triggera l'effetto.
    const onUnreadChanged = () => fetchUnread();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("unread-changed", onUnreadChanged);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("unread-changed", onUnreadChanged);
    };
  }, [pathname]);

  return (
    <>
      {!hideTopHeader && (
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
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-10 border-t border-rule bg-paper/95 backdrop-blur-sm"
        style={{
          // Su iPhone con home indicator: oltre alla safe-area-inset-bottom
          // aggiungiamo 1rem (~16px) di respiro sopra, simile al pattern di
          // WhatsApp, così le icone non sono attaccate alla barra di sistema.
          paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)",
          paddingTop: "0.25rem",
        }}
      >
        <div className="max-w-xl mx-auto px-2 py-2 flex justify-around items-center">
          {TABS.map((tab) => {
            const showBadge = tab.id === "carteggi" && unread > 0;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                prefetch={true}
                className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                  active === tab.id
                    ? "text-accent"
                    : "text-ink-faded hover:text-accent"
                }`}
              >
                <div className="relative">
                  {ICONS[tab.id]}
                  {showBadge && (
                    <span
                      className="absolute -top-1.5 -right-2 bg-accent text-paper text-[10px] font-sans font-semibold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center leading-none"
                      aria-label={`${unread} non letti`}
                    >
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </div>
                <span className="font-sans text-[10px] tracking-widest uppercase">
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
