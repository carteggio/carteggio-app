export type FormatoPezzo =
  | "sei-parole"
  | "ricordo"
  | "confessione"
  | "luogo"
  | "piccola-felicita"
  | "voce";

export type FormatoConfig = {
  id: FormatoPezzo;
  label: string;
  description: string;
  placeholder: string;
  prompt?: string;
  exactWords?: number;
  maxChars: number;
  multiline: boolean;
};

export const FORMATI: FormatoConfig[] = [
  {
    id: "sei-parole",
    label: "Sei parole",
    description: "Esattamente sei. Né più né meno.",
    placeholder: "Volevo restare. Nessuno me l'ha chiesto.",
    exactWords: 6,
    maxChars: 80,
    multiline: false,
  },
  {
    id: "ricordo",
    label: "Ricordo",
    description: "Un frammento di memoria.",
    placeholder: "Le domeniche di mio padre\nsapevano di caffè...",
    maxChars: 280,
    multiline: true,
  },
  {
    id: "confessione",
    label: "Confessione",
    description: "Una cosa che non diresti subito.",
    placeholder: "Ho imparato a stare sola al cinema...",
    maxChars: 280,
    multiline: true,
  },
  {
    id: "luogo",
    label: "Luogo",
    description: "Se fossi un luogo, saresti…",
    placeholder: "una libreria di paese chiusa il martedì,\ncon un gatto che dorme sulla vetrina.",
    prompt: "Se fossi un luogo, sarei…",
    maxChars: 200,
    multiline: true,
  },
  {
    id: "piccola-felicita",
    label: "Una piccola felicità",
    description: "Una felicità ordinaria di oggi.",
    placeholder: "La cassiera del Conad mi ha riconosciuto...",
    maxChars: 240,
    multiline: true,
  },
];

export const FORMATO_LABEL: Record<FormatoPezzo, string> = {
  "sei-parole": "Sei parole",
  ricordo: "Ricordo",
  confessione: "Confessione",
  luogo: "Luogo",
  "piccola-felicita": "Una piccola felicità",
  voce: "Voce",
};

export function findFormato(id: string): FormatoConfig | undefined {
  return FORMATI.find((f) => f.id === id);
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}
