// Costanti per upload foto.

export const FOTO_BUCKET = "foto-profilo";
export const FOTO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const FOTO_MIME_VALIDI = ["image/jpeg", "image/png", "image/webp"];

export const PHOTO_UNLOCK_AFTER_MESSAGES = 5;

export function mimeToExt(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg"; // default per image/jpeg e altri
}
