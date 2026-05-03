import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TABLES = [
  "users",
  "pezzi",
  "echi",
  "carteggi",
  "messaggi",
  "segnalazioni",
  "spunti",
] as const;

type TableStatus = {
  name: string;
  ok: boolean;
  count: number | null;
  error: string | null;
};

async function checkTable(supabase: ReturnType<typeof createClient>, name: string): Promise<TableStatus> {
  try {
    const { count, error } = await supabase
      .from(name)
      .select("*", { count: "exact", head: true });
    if (error) {
      return { name, ok: false, count: null, error: error.message };
    }
    return { name, ok: true, count: count ?? 0, error: null };
  } catch (e) {
    return { name, ok: false, count: null, error: String(e) };
  }
}

export default async function TestDb() {
  const supabase = createClient();
  const results = await Promise.all(TABLES.map((t) => checkTable(supabase, t)));
  const allOk = results.every((r) => r.ok);

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-serif text-4xl font-medium mb-4">
          Test connessione database
        </h1>
        <p className="font-serif italic text-ink-soft mb-10">
          Pagina interna di verifica — non visibile agli utenti finali.
        </p>

        <div className="border border-rule rounded-lg overflow-hidden">
          <div className="px-5 py-4 bg-paper-deep border-b border-rule flex items-center justify-between">
            <span className="font-sans text-xs tracking-widest uppercase text-ink-faded font-semibold">
              Stato
            </span>
            <span
              className={`font-sans text-sm font-semibold ${
                allOk ? "text-accent" : "text-ink-soft"
              }`}
            >
              {allOk ? "✓ tutte le tabelle ok" : "alcune tabelle mancano"}
            </span>
          </div>

          {results.map((r) => (
            <div
              key={r.name}
              className="px-5 py-4 border-b border-rule last:border-b-0 flex items-start justify-between gap-4"
            >
              <div className="flex-1">
                <code className="font-mono text-sm text-accent">{r.name}</code>
                {r.error && (
                  <p className="text-xs text-ink-faded mt-1 font-mono">
                    {r.error}
                  </p>
                )}
              </div>
              <div className="text-right">
                {r.ok ? (
                  <span className="font-serif text-lg text-ink">
                    {r.count} righe
                  </span>
                ) : (
                  <span className="font-sans text-xs uppercase tracking-wider text-ink-faded">
                    non trovata
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="font-serif italic text-sm text-ink-faded mt-8 text-center leading-relaxed">
          Se alcune tabelle dicono &quot;non trovata&quot;, vuol dire che lo schema
          SQL non è stato ancora applicato in Supabase. È normale al primo deploy.
        </p>
      </div>
    </main>
  );
}
