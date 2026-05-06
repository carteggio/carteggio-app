import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { canSendMessage } from "@/lib/carteggio-server";
import { markMessaggiAsLetti } from "@/lib/unread-server";
import { SLOW_PHASE_MESSAGGI } from "@/lib/carteggio";
import { PHOTO_UNLOCK_AFTER_MESSAGES } from "@/lib/foto";
import { formatRelativeDate } from "@/lib/date";
import Nav from "@/app/components/nav";
import RefreshUnread from "@/app/components/refresh-unread";
import ScrollToBottom from "@/app/components/scroll-to-bottom";
import MessaggioForm from "./messaggio-form";
import { sbloccaFoto } from "./actions";
import CarteggioMenu from "./menu";

export const dynamic = "force-dynamic";

type Messaggio = {
  id: string;
  mittente_id: string;
  tipo: string;
  contenuto_testo: string | null;
  contenuto_audio_url: string | null;
  created_at: string;
};

export default async function CarteggioPage({
  params,
}: {
  params: { id: string };
}) {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding/eta");

  const supabase = createClient();

  const { data: carteggio } = await supabase
    .from("carteggi")
    .select(
      `
      id, partecipante_a_id, partecipante_b_id, stato,
      foto_sbloccata_a, foto_sbloccata_b,
      eco_origine_id, created_at,
      a:users!partecipante_a_id ( nome_battesimo, fascia_eta, foto_url ),
      b:users!partecipante_b_id ( nome_battesimo, fascia_eta, foto_url )
    `
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!carteggio) notFound();

  if (
    carteggio.partecipante_a_id !== user.id &&
    carteggio.partecipante_b_id !== user.id
  ) {
    notFound();
  }

  // Le tre query secondarie (eco di origine, messaggi, mark letti) sono
  // indipendenti l'una dall'altra: lanciate in parallelo per ridurre la
  // latenza totale della pagina.
  const [ecoOrigineRes, messaggiRes] = await Promise.all([
    supabase
      .from("echi")
      .select("id, testo, mittente_id")
      .eq("id", carteggio.eco_origine_id)
      .maybeSingle(),
    supabase
      .from("messaggi")
      .select(
        "id, mittente_id, tipo, contenuto_testo, contenuto_audio_url, created_at"
      )
      .eq("carteggio_id", params.id)
      .order("created_at", { ascending: true }),
    // L'utente sta leggendo il carteggio: marca i messaggi dell'altra persona
    // come letti, così il badge nel bottom nav e sull'icona PWA si azzerano.
    markMessaggiAsLetti(user.id, params.id),
  ]);

  const ecoOrigine = ecoOrigineRes.data;
  const messaggi = (messaggiRes.data ?? []) as Messaggio[];

  const a = carteggio.a as unknown as {
    nome_battesimo: string;
    fascia_eta: string;
    foto_url: string | null;
  } | null;
  const b = carteggio.b as unknown as {
    nome_battesimo: string;
    fascia_eta: string;
    foto_url: string | null;
  } | null;

  const sonoA = carteggio.partecipante_a_id === user.id;
  const altro = sonoA ? b : a;
  const altroId = sonoA ? carteggio.partecipante_b_id : carteggio.partecipante_a_id;
  const io = sonoA ? a : b;

  const ioSbloccato = sonoA
    ? carteggio.foto_sbloccata_a
    : carteggio.foto_sbloccata_b;
  const altroSbloccato = sonoA
    ? carteggio.foto_sbloccata_b
    : carteggio.foto_sbloccata_a;

  function nomeDi(mittente_id: string): string {
    if (mittente_id === user!.id) return profile!.nome_battesimo;
    if (mittente_id === carteggio!.partecipante_a_id)
      return a?.nome_battesimo ?? "anonimo";
    return b?.nome_battesimo ?? "anonimo";
  }

  const sendCheck = canSendMessage({
    messages: messaggi.map((m) => ({
      id: m.id,
      mittente_id: m.mittente_id,
      created_at: m.created_at,
    })),
    currentUserId: user.id,
    altroPartecipante: altro
      ? { id: altroId, nome: altro.nome_battesimo }
      : undefined,
  });

  const numMessaggi = messaggi.length;
  const photoUnlockAvailable = numMessaggi >= PHOTO_UNLOCK_AFTER_MESSAGES;
  const entrambiSbloccati = ioSbloccato && altroSbloccato;
  const carteggioAttivo = carteggio.stato === "attivo";

  return (
    <div className="min-h-screen flex flex-col">
      <Nav hideTopHeader />
      {/* Forza il refresh del badge unread dopo che il server ha marcato i
          messaggi come letti — il pathname change da solo su iOS PWA non basta */}
      <RefreshUnread />
      {/* Apre la chat con la pagina già scrollata in fondo, come WhatsApp */}
      <ScrollToBottom />
      {/* Header sticky della chat: back arrow sempre visibile + nome dell'altra persona */}
      <header className="sticky top-0 z-10 border-b border-rule bg-paper/95 backdrop-blur-sm">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/carteggi"
            aria-label="torna ai carteggi"
            className="text-2xl text-ink-faded hover:text-accent transition-colors leading-none"
          >
            ←
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-xl font-medium leading-tight truncate">
              {altro?.nome_battesimo ?? "anonimo"}
              {altro?.fascia_eta && (
                <span className="font-serif italic text-base text-ink-faded ml-2">
                  {altro.fascia_eta}
                </span>
              )}
            </h1>
            <p className="font-sans text-[10px] tracking-widest uppercase text-ink-faded">
              {!carteggioAttivo
                ? "archiviato"
                : sendCheck.phase === "slow"
                  ? `lettera ${numMessaggi} di ${SLOW_PHASE_MESSAGGI}`
                  : "chat libera"}
            </p>
          </div>
          {/* Menu kebab: segnala / blocca, solo se carteggio attivo */}
          {altro && carteggioAttivo && (
            <CarteggioMenu
              carteggioId={carteggio.id}
              altroId={altroId}
              altroNome={altro.nome_battesimo}
            />
          )}
        </div>
      </header>
      <main className="flex-1 px-6 py-8 pb-32">
        <div className="max-w-xl mx-auto">

          {photoUnlockAvailable && carteggioAttivo && (
            <section className="mb-10">
              {entrambiSbloccati ? (
                <div className="flex justify-center gap-6 py-4">
                  <div className="text-center">
                    <p className="font-sans text-[10px] tracking-widest uppercase text-ink-faded mb-2">
                      tu
                    </p>
                    {io?.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={io.foto_url}
                        alt={profile.nome_battesimo}
                        className="w-32 h-32 object-cover rounded-full border border-rule"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full border border-dashed border-rule flex items-center justify-center font-serif italic text-xs text-ink-faded text-center px-2">
                        nessuna foto
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-sans text-[10px] tracking-widest uppercase text-ink-faded mb-2">
                      {altro?.nome_battesimo ?? "lui/lei"}
                    </p>
                    {altro?.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={altro.foto_url}
                        alt={altro?.nome_battesimo ?? ""}
                        className="w-32 h-32 object-cover rounded-full border border-accent"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full border border-dashed border-rule flex items-center justify-center font-serif italic text-xs text-ink-faded text-center px-2">
                        nessuna foto
                      </div>
                    )}
                  </div>
                </div>
              ) : ioSbloccato ? (
                <div className="border border-rule rounded-lg p-5 text-center">
                  <p className="font-serif italic text-base text-ink-soft leading-relaxed">
                    Hai sbloccato la tua foto.
                    <br />
                    Quando anche {altro?.nome_battesimo ?? "l'altra persona"}{" "}
                    sbloccherà,
                    <br />
                    le vedrete entrambe.
                  </p>
                </div>
              ) : altroSbloccato ? (
                <div className="border border-accent rounded-lg p-5 text-center bg-paper-deep">
                  <p className="font-serif italic text-base text-ink leading-relaxed mb-4">
                    {altro?.nome_battesimo ?? "L'altra persona"} ha sbloccato la
                    sua foto.
                    <br />
                    Vuoi sbloccare anche tu?
                  </p>
                  <form action={sbloccaFoto}>
                    <input type="hidden" name="carteggioId" value={carteggio.id} />
                    <button
                      type="submit"
                      className="font-sans text-sm tracking-[0.25em] uppercase text-paper bg-accent rounded-full px-6 py-2 hover:bg-ink transition-colors"
                    >
                      sblocca le foto
                    </button>
                  </form>
                </div>
              ) : (
                <div className="border border-rule rounded-lg p-5 text-center">
                  <p className="font-serif italic text-base text-ink-soft leading-relaxed mb-4">
                    Avete scambiato cinque messaggi.
                    <br />
                    Se entrambi sbloccate, vedrete le vostre foto.
                  </p>
                  <form action={sbloccaFoto}>
                    <input type="hidden" name="carteggioId" value={carteggio.id} />
                    <button
                      type="submit"
                      className="font-sans text-sm tracking-[0.25em] uppercase text-accent border border-accent rounded-full px-6 py-2 hover:bg-accent hover:text-paper transition-colors"
                    >
                      sblocca la mia foto
                    </button>
                  </form>
                </div>
              )}
            </section>
          )}

          {ecoOrigine && (
            <details className="mb-10 border border-rule rounded-lg p-4 bg-paper-deep">
              <summary className="font-sans text-xs tracking-widest uppercase text-ink-faded cursor-pointer hover:text-accent">
                eco di partenza
              </summary>
              <blockquote className="mt-3 font-serif italic text-base leading-relaxed text-ink border-l-2 border-accent pl-4">
                {ecoOrigine.testo}
              </blockquote>
            </details>
          )}

          {messaggi.length === 0 ? (
            <p className="font-serif italic text-center text-ink-faded">
              Il carteggio è vuoto.
            </p>
          ) : (
            <div className="space-y-12 mb-12">
              {messaggi.map((m, idx) => (
                <article key={m.id}>
                  <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-3">
                    {nomeDi(m.mittente_id)} ·{" "}
                    {formatRelativeDate(m.created_at)}
                    {sendCheck.phase === "slow" &&
                      idx < SLOW_PHASE_MESSAGGI && (
                        <span className="ml-2 text-accent">
                          · lettera {idx + 1} di {SLOW_PHASE_MESSAGGI}
                        </span>
                      )}
                  </p>
                  <div className="font-serif text-lg leading-relaxed whitespace-pre-line text-ink">
                    {m.contenuto_testo}
                  </div>
                </article>
              ))}
            </div>
          )}

          {carteggioAttivo && (
            <div className="border-t border-rule pt-8">
              {sendCheck.canSend ? (
                <MessaggioForm
                  carteggioId={carteggio.id}
                  phase={sendCheck.phase}
                  minLength={sendCheck.minLength}
                  maxLength={sendCheck.maxLength}
                />
              ) : (
                <p className="font-serif italic text-center text-ink-soft leading-relaxed">
                  {sendCheck.reason}
                </p>
              )}
            </div>
          )}

          {!carteggioAttivo && (
            <div className="border-t border-rule pt-8 text-center">
              <p className="font-serif italic text-ink-soft">
                Questo carteggio è archiviato. Le lettere restano leggibili,
                ma non si possono più scambiare messaggi.
              </p>
            </div>
          )}

          {/* Segnala/blocca sono ora nel menu kebab in alto a destra */}
        </div>
      </main>
    </div>
  );
}
