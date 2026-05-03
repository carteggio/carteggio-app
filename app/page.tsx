import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
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

        <div className="mt-12">
          <Link
            href="/login"
            className="inline-block font-sans text-sm tracking-[0.25em] uppercase text-accent border border-accent rounded-full px-8 py-3 hover:bg-accent hover:text-paper transition-colors"
          >
            entra
          </Link>
        </div>
      </div>
    </main>
  );
}
