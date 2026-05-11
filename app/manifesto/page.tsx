import type { Metadata } from "next";
import Link from "next/link";

// Pagina pubblica, accessibile senza login. È il punto di atterraggio per
// chi clicca "perché Carteggio?" dalla home, o per chi arriva da un link
// esterno (es. il cartoncino dell'azione teatrale di Brescia).
// Niente Nav: l'utente è qui per leggere, non per navigare. Solo un link
// discreto in cima per tornare alla home.

export const metadata: Metadata = {
  title: "Perché Carteggio — manifesto",
  description:
    "Carteggio nasce contro la solitudine delle app di dating. Le parole, prima della foto.",
  openGraph: {
    title: "Perché Carteggio",
    description:
      "Un'app di dating fatta come si scrive una lettera, non come si fa la spesa.",
    type: "article",
    locale: "it_IT",
    url: "https://carteggio.app/manifesto",
    siteName: "Carteggio",
  },
};

export default function ManifestoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 px-6 py-12 md:py-20">
        <article className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-block font-sans text-xs tracking-widest uppercase text-ink-faded hover:text-accent transition-colors mb-12"
          >
            ← carteggio
          </Link>

          <header className="mb-16 text-center">
            <h1 className="font-serif text-5xl md:text-6xl font-medium leading-none">
              Cartegg<span className="text-accent italic">i</span>o
            </h1>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-ink-faded mt-6">
              manifesto · v0.3
            </p>
          </header>

          <div className="font-serif text-lg md:text-xl leading-relaxed text-ink space-y-7">
            <p>
              C&apos;è un modo strano di sentirsi soli che è proprio delle app
              di dating. Non è la solitudine di chi non ha nessuno — è quella
              di chi ha trecento persone davanti agli occhi e nessuna che lo
              riguardi davvero.
            </p>

            <p>
              Alcuni amici hanno descritto questa sensazione con una parola
              precisa: <em>supermercato</em>. Persone come prodotti, ognuna
              con la sua etichetta — altezza, lavoro, foto in primo piano —
              e tu lì, in fila, a passare gli scaffali. Una sensazione che
              corrode. Anche quando funziona.
            </p>

            <p className="font-serif italic text-2xl md:text-3xl text-accent text-center py-4">
              Carteggio nasce contro questa cosa.
            </p>

            <p>
              Parla a chi pensa che le persone siano più dei loro tratti. A
              chi non sa fotografarsi bene ma ha qualcosa da dire che resta
              dentro. A chi sulle altre app si è sentito invisibile, o solo
              un volto in più nella pila.
            </p>
          </div>

          <section className="mt-20">
            <h2 className="font-sans text-xs tracking-[0.3em] uppercase text-ink-faded mb-10 text-center">
              le promesse che ci facciamo
            </h2>

            <div className="space-y-10">
              <div>
                <h3 className="font-serif text-2xl md:text-3xl font-medium text-ink mb-3">
                  Le foto, solo dopo.
                </h3>
                <p className="font-serif text-lg leading-relaxed text-ink-soft">
                  Si sbloccano quando ci si è già scritti per davvero. Il
                  viso è l&apos;ultimo dettaglio, non il primo.
                </p>
              </div>

              <div>
                <h3 className="font-serif text-2xl md:text-3xl font-medium text-ink mb-3">
                  Niente filtri per attributi fisici.
                </h3>
                <p className="font-serif text-lg leading-relaxed text-ink-soft">
                  Mai. Neanche nelle versioni a pagamento.
                </p>
              </div>

              <div>
                <h3 className="font-serif text-2xl md:text-3xl font-medium text-ink mb-3">
                  Niente swipe.
                </h3>
                <p className="font-serif text-lg leading-relaxed text-ink-soft">
                  L&apos;unità di interazione è il pezzo che hai scritto, non
                  il volto. Si scorre come si sfoglia una rivista, non come
                  si gira un mazzo di carte.
                </p>
              </div>

              <div>
                <h3 className="font-serif text-2xl md:text-3xl font-medium text-ink mb-3">
                  Eco, non like.
                </h3>
                <p className="font-serif text-lg leading-relaxed text-ink-soft">
                  Per dire <em>ti ho letto</em> devi scrivere qualcosa. Un
                  piccolo costo che alza la qualità di tutto quello che viene
                  dopo.
                </p>
              </div>

              <div>
                <h3 className="font-serif text-2xl md:text-3xl font-medium text-ink mb-3">
                  Conversazione lenta, all&apos;inizio.
                </h3>
                <p className="font-serif text-lg leading-relaxed text-ink-soft">
                  I primi scambi hanno il ritmo di una lettera. Una risposta
                  al giorno, qualche riga pensata. Poi, se entrambi vogliono,
                  si apre la chat libera.
                </p>
              </div>

              <div>
                <h3 className="font-serif text-2xl md:text-3xl font-medium text-ink mb-3">
                  Niente boost a pagamento.
                </h3>
                <p className="font-serif text-lg leading-relaxed text-ink-soft">
                  Mai. Quel modello distrugge le app di dating
                  dall&apos;interno e non lo replicheremo.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-24">
            <h2 className="font-sans text-xs tracking-[0.3em] uppercase text-ink-faded mb-10 text-center">
              cosa siamo, in fondo
            </h2>

            <div className="font-serif text-lg md:text-xl leading-relaxed text-ink space-y-7">
              <p>
                Un posto dove ci si conosce per quello che si pensa, prima
                che per come si appare. Dove le parole non sono il preludio
                al match — sono <em>il</em> match.
              </p>

              <p>
                Un&apos;app di dating, sì. Ma fatta come si scrive una
                lettera, non come si fa la spesa.
              </p>

              <p className="font-serif italic text-xl md:text-2xl text-ink-soft pt-4 border-t border-rule">
                Se cresceremo, cresceremo lentamente.
                <br />
                Se non cresceremo, saremo stati comunque qualcosa di bello.
              </p>
            </div>
          </section>

          <footer className="mt-24 pt-12 border-t border-rule text-center">
            <p className="font-serif italic text-base text-ink-soft mb-8">
              Adesso che sai perché esistiamo, vuoi entrare?
            </p>
            <Link
              href="/"
              className="inline-block font-sans text-sm tracking-[0.25em] uppercase bg-accent text-paper rounded-full px-8 py-3 hover:opacity-90 transition-opacity"
            >
              torna a carteggio
            </Link>
          </footer>
        </article>
      </main>
    </div>
  );
}
