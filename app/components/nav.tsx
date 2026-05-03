import Link from "next/link";

type NavSection = "feed" | "scrivi" | "echi" | "profilo";

export default function Nav({ active }: { active?: NavSection }) {
  const items: { id: NavSection; label: string; href: string }[] = [
    { id: "feed", label: "feed", href: "/feed" },
    { id: "scrivi", label: "scrivi", href: "/scrivi" },
    { id: "echi", label: "echi", href: "/echi" },
    { id: "profilo", label: "profilo", href: "/profilo" },
  ];

  return (
    <header className="border-b border-rule sticky top-0 bg-paper/95 backdrop-blur-sm z-10">
      <div className="max-w-xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link
          href="/feed"
          className="font-serif text-2xl font-medium leading-none hover:no-underline"
        >
          Cartegg<span className="text-accent italic">i</span>o
        </Link>
        <nav className="flex gap-4 sm:gap-5">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`font-sans text-xs tracking-widest uppercase transition-colors ${
                active === item.id
                  ? "text-accent"
                  : "text-ink-faded hover:text-accent"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
