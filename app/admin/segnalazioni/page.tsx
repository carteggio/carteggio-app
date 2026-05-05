import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { FORMATO_LABEL, type FormatoPezzo } from "@/lib/formati";
import { formatRelativeDate } from "@/lib/date";
import Nav from "@/app/components/nav";
import {
  respingiSegnalazione,
  accettaSegnalazione,
  accettaESospendi,
  accettaEBanna,
} from "./actions";

export const dynamic = "force-dynamic";

const CATEGORIA_LABEL: Record<string, string> = {
  inappropriato: "Contenuto inappropriato",
  aggressivo: "Comportamento aggressivo",
  bot_scam: "Bot o truffa",
  foto_non_consensuali: "Foto inappropriate",
  altro: "Altro",
};

export default async function AdminSegnalazioniPage() {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding/eta");

  // Verifica admin (con fetch separato per leggere is_admin)
  const supabase = createClient();
  const { data: adminCheck } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminCheck?.is_admin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 pb-32">
          <div className="text-center">
            <h1 className="font-serif text-3xl font-medium">
              Area riservata.
            </h1>
            <p className="font-serif italic text-ink-soft mt-4">
              Questa pagina è per l'amministrazione di Carteggio.
            </p>
            <Link
              href="/feed"
              className="inline-block mt-8 font-sans text-sm tracking-[0.25em] uppercase text-accent border border-accent rounded-full px-8 py-3"
            >
              torna al feed
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Carica tutte le segnalazioni aperte
  const { data: segnalazioni } = await supabase
    .from("segnalazioni")
    .select(
      "id, target_tipo, target_id, categoria, motivazione, stato, created_at, segnalante:users!segnalante_id(nome_battesimo, citta)"
    )
    .eq("stato", "aperta")
    .order("created_at", { ascending: false });

  const items = segnalazioni ?? [];

  // Carica tutte le info per le anteprime
  const pezzoIds = items
    .filter((s) => s.target_tipo === "pezzo")
    .map((s) => s.target_id);
  const ecoIds = items
    .filter((s) => s.target_tipo === "eco")
    .map((s) => s.target_id);
  const userIds = items
    .filter((s) => s.target_tipo === "utente")
    .map((s) => s.target_id);

  const [pezziData, echiData, usersData] = await Promise.all([
    pezzoIds.length > 0
      ? supabase
          .from("pezzi")
          .select(
            "id, formato, contenuto_testo, autore:users!autore_id(id, nome_battesimo)"
          )
          .in("id", pezzoIds)
      : { data: [] },
    ecoIds.length > 0
      ? supabase
          .from("echi")
          .select("id, testo, mittente:users!mittente_id(id, nome_battesimo)")
          .in("id", ecoIds)
      : { data: [] },
    userIds.length > 0
      ? supabase
          .from("users")
          .select("id, nome_battesimo, fascia_eta, citta, stato")
          .in("id", userIds)
      : { data: [] },
  ]);

  const pezziById = new Map(
    (pezziData.data ?? []).map((p) => [p.id, p as unknown as PezzoT])
  );
  const echiById = new Map(
    (echiData.data ?? []).map((e) => [e.id, e as unknown as EcoT])
  );
  const usersById = new Map(
    (usersData.data ?? []).map((u) => [u.id, u as unknown as UserT])
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 px-6 py-12 pb-32">
        <div className="max-w-2xl mx-auto">
          <header className="text-center mb-12">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-3">
              area amministrazione
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-medium leading-tight">
              Segnalazioni aperte.
            </h1>
            <p className="font-serif italic text-base text-ink-soft mt-3">
              {items.length} {items.length === 1 ? "segnalazione" : "segnalazioni"} da
              gestire.
            </p>
          </header>

          {items.length === 0 ? (
            <p className="font-serif italic text-center text-ink-faded">
              Nessuna segnalazione aperta. Carteggio respira.
            </p>
          ) : (
            <div className="space-y-8">
              {items.map((s) => {
                const segnalante = s.segnalante as unknown as
                  | { nome_battesimo: string; citta: string }
                  | null;
                let autoreId: string | null = null;
                let preview: React.ReactNode = null;

                if (s.target_tipo === "pezzo") {
                  const p = pezziById.get(s.target_id);
                  if (p) {
                    autoreId = p.autore?.id ?? null;
                    preview = (
                      <div className="bg-paper-deep rounded-lg p-4">
                        <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-2">
                          {FORMATO_LABEL[p.formato as FormatoPezzo]} · di{" "}
                          {p.autore?.nome_battesimo ?? "anonimo"}
                        </p>
                        <div className="font-serif italic text-base whitespace-pre-line">
                          {p.contenuto_testo}
                        </div>
                      </div>
                    );
                  }
                } else if (s.target_tipo === "eco") {
                  const e = echiById.get(s.target_id);
                  if (e) {
                    autoreId = e.mittente?.id ?? null;
                    preview = (
                      <div className="bg-paper-deep rounded-lg p-4">
                        <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-2">
                          eco di {e.mittente?.nome_battesimo ?? "anonimo"}
                        </p>
                        <blockquote className="font-serif italic text-base">
                          {e.testo}
                        </blockquote>
                      </div>
                    );
                  }
                } else if (s.target_tipo === "utente") {
                  const u = usersById.get(s.target_id);
                  if (u) {
                    autoreId = u.id;
                    preview = (
                      <div className="bg-paper-deep rounded-lg p-4">
                        <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-2">
                          utente segnalato
                        </p>
                        <p className="font-serif text-xl">
                          {u.nome_battesimo}{" "}
                          <span className="text-ink-faded text-base italic">
                            {u.fascia_eta} · {u.citta}
                          </span>
                        </p>
                        <p className="font-sans text-xs text-ink-faded mt-1">
                          stato: <code>{u.stato}</code>
                        </p>
                      </div>
                    );
                  }
                }

                return (
                  <article
                    key={s.id}
                    className="border border-rule rounded-lg p-5"
                  >
                    <header className="flex items-baseline justify-between mb-4">
                      <div>
                        <p className="font-sans text-xs tracking-widest uppercase text-accent mb-1">
                          {CATEGORIA_LABEL[s.categoria]}
                        </p>
                        <p className="font-serif italic text-sm text-ink-faded">
                          segnalata da{" "}
                          {segnalante?.nome_battesimo ?? "anonimo"} ·{" "}
                          {formatRelativeDate(s.created_at)}
                        </p>
                      </div>
                    </header>

                    {preview}

                    {s.motivazione && (
                      <div className="mt-4">
                        <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-2">
                          dettagli del segnalante
                        </p>
                        <p className="font-serif italic text-base">
                          {s.motivazione}
                        </p>
                      </div>
                    )}

                    {/* Azioni */}
                    <div className="mt-6 flex flex-wrap gap-2">
                      <form action={respingiSegnalazione}>
                        <input type="hidden" name="segnalazioneId" value={s.id} />
                        <button
                          type="submit"
                          className="font-sans text-xs tracking-widest uppercase text-ink-faded border border-rule rounded-full px-4 py-2 hover:border-ink hover:text-ink"
                        >
                          respingi
                        </button>
                      </form>

                      <form action={accettaSegnalazione}>
                        <input type="hidden" name="segnalazioneId" value={s.id} />
                        <input type="hidden" name="targetTipo" value={s.target_tipo} />
                        <input type="hidden" name="targetId" value={s.target_id} />
                        <button
                          type="submit"
                          className="font-sans text-xs tracking-widest uppercase text-accent border border-accent rounded-full px-4 py-2 hover:bg-accent hover:text-paper"
                        >
                          accetta · nascondi
                        </button>
                      </form>

                      {autoreId && (
                        <>
                          <form action={accettaESospendi}>
                            <input type="hidden" name="segnalazioneId" value={s.id} />
                            <input type="hidden" name="targetTipo" value={s.target_tipo} />
                            <input type="hidden" name="targetId" value={s.target_id} />
                            <input type="hidden" name="autoreId" value={autoreId} />
                            <button
                              type="submit"
                              className="font-sans text-xs tracking-widest uppercase text-paper bg-accent rounded-full px-4 py-2 hover:bg-ink"
                            >
                              accetta · sospendi 24h
                            </button>
                          </form>

                          <form action={accettaEBanna}>
                            <input type="hidden" name="segnalazioneId" value={s.id} />
                            <input type="hidden" name="targetTipo" value={s.target_tipo} />
                            <input type="hidden" name="targetId" value={s.target_id} />
                            <input type="hidden" name="autoreId" value={autoreId} />
                            <button
                              type="submit"
                              className="font-sans text-xs tracking-widest uppercase text-paper bg-ink rounded-full px-4 py-2 hover:bg-accent"
                            >
                              accetta · banna
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

type PezzoT = {
  id: string;
  formato: string;
  contenuto_testo: string | null;
  autore: { id: string; nome_battesimo: string } | null;
};
type EcoT = {
  id: string;
  testo: string;
  mittente: { id: string; nome_battesimo: string } | null;
};
type UserT = {
  id: string;
  nome_battesimo: string;
  fascia_eta: string;
  citta: string;
  stato: string;
};
