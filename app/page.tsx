import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative">
      <div className="max-w-xl w-full text-center">
        <p className="font-sans text-xs tracking-[0.3em] uppercase text-ink-faded mb-6">
          in arrivo · brescia · bergamo
        </p>
        <h1 className="font-serif text-7xl md:text-8xl font-medium leading-none">
          Cartegg<span className="text-accent italic">i</span>o
        </h1>
        <p className="font-serif italic text-xl md:text-2xl text-ink-soft mt-6">
          conoscersi per le parole, non per la foto
        </p>
        <div className="w-16 h-px bg-rule mx-auto mt-12" />
        <p className="font-serif italic text-base text-ink-faded mt-12 leading-relaxed">
          Stiamo costruendo qualcosa di piccolo e bello.
          <br />
          Quando sarà il momento, ti scriveremo.
        </p>
      </div>

      {/* Link discreto a /login per le early adopter */}
      <Link
        href="/login"
        className="absolute bottom-8 right-8 font-sans text-xs tracking-widest uppercase text-ink-faded hover:text-accent transition-colors"
      >
        entra
      </Link>
    </main>
  );
}
