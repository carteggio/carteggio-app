import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  type CipherGCM,
  type DecipherGCM,
} from "crypto";

// Crittografia simmetrica per messaggi e echi privati.
// AES-256-GCM (authenticated encryption: garantisce sia confidenzialità sia
// integrità — un ciphertext modificato fallisce la decifratura, niente
// padding oracle e niente attacchi di tipo "bit flipping").
//
// Cosa cifriamo: messaggi.contenuto_testo + echi.testo (contenuti privati,
// scambiati tra due persone).
// Cosa NON cifriamo: pezzi.contenuto_testo (pubblici per la città, devono
// essere visibili al feed e moderabili in chiaro), profili (dati di prodotto
// da mostrare), foto (gestite su Storage con encryption-at-rest separata).
//
// Chiave: una sola chiave master simmetrica in env var
// MESSAGES_ENCRYPTION_KEY, generata via `openssl rand -base64 32` (32 byte
// di random codificati base64 = 44 caratteri stringa). Mai esposta al client.
//
// Format del ciphertext salvato a DB:
//   "enc:v1:" + base64(iv ‖ authTag ‖ encryptedBytes)
//
//   - iv  = 12 byte random per ogni messaggio (best practice GCM)
//   - tag = 16 byte (authenticator GCM)
//   - encryptedBytes = lunghezza variabile, uguale al plaintext UTF-8
//
// Il prefisso "enc:v1:" serve a due scopi:
//   1. Permettere la coesistenza con i messaggi storici ancora in chiaro
//      durante la fase di migrazione (la decifra funziona con entrambi).
//   2. Versionare il formato: se in futuro cambiamo cipher o KDF, useremo
//      un prefisso diverso ("enc:v2:") senza dover migrare tutto subito.

const PREFIX = "enc:v1:";
const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;
const KEY_LEN = 32;

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.MESSAGES_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "MESSAGES_ENCRYPTION_KEY non configurata. Senza chiave non posso cifrare/decifrare i messaggi privati."
    );
  }

  const buf = Buffer.from(raw, "base64");
  if (buf.length !== KEY_LEN) {
    throw new Error(
      `MESSAGES_ENCRYPTION_KEY deve essere 32 byte in base64 (44 caratteri). Ricevuti ${buf.length} byte. Genera con: openssl rand -base64 32`
    );
  }

  cachedKey = buf;
  return buf;
}

/**
 * Cifra una stringa di testo con AES-256-GCM. L'output è una stringa con
 * prefisso "enc:v1:" sicura da salvare a DB. Idempotente per gli input già
 * cifrati: se il testo inizia già con "enc:v1:", lo restituisce invariato
 * (safety net contro doppia cifratura accidentale).
 *
 * Restituisce stringa vuota per input vuoto/null (preserva semantica DB).
 */
export function cifraMessaggio(plaintext: string | null | undefined): string {
  if (!plaintext) return plaintext ?? "";
  if (plaintext.startsWith(PREFIX)) return plaintext;

  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv) as CipherGCM;

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return PREFIX + Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

/**
 * Decifra una stringa che inizia con "enc:v1:". Se il testo NON inizia col
 * prefisso, viene restituito invariato (legacy: messaggi pre-migration in
 * chiaro). Questo permette al codice di funzionare durante la transizione
 * senza preoccuparsi di "è già cifrato o no".
 */
export function decifraMessaggio(text: string | null): string | null {
  if (text === null) return null;
  if (!text.startsWith(PREFIX)) {
    // Legacy: messaggio pre-migration ancora in chiaro. Pass-through.
    return text;
  }

  const key = getKey();
  const buf = Buffer.from(text.slice(PREFIX.length), "base64");

  if (buf.length < IV_LEN + TAG_LEN) {
    // Ciphertext troncato/corrotto. Logghiamo e restituiamo segnaposto
    // anziché lanciare: una pagina con un messaggio rotto è meglio di una
    // pagina che crasha tutta.
    console.error("[crypto-messaggi] ciphertext troncato:", text.slice(0, 30));
    return "[messaggio non leggibile]";
  }

  try {
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const ciphertext = buf.subarray(IV_LEN + TAG_LEN);

    const decipher = createDecipheriv(ALGO, key, iv) as DecipherGCM;
    decipher.setAuthTag(tag);

    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return plaintext.toString("utf8");
  } catch (e) {
    console.error("[crypto-messaggi] decifratura fallita:", e);
    return "[messaggio non leggibile]";
  }
}

/**
 * Helper per controllare se una stringa è ciphertext "v1" o testo legacy.
 * Utile per la migration script che deve identificare cosa cifrare.
 */
export function isCiphertext(text: string | null | undefined): boolean {
  return typeof text === "string" && text.startsWith(PREFIX);
}
