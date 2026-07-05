import { supabase } from "@/integrations/supabase/client";

export const EXERCISE_IMAGES_BUCKET = "exercise-images";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/svg+xml",
];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Formato no permitido. Usa JPG, PNG, WebP o SVG.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `La imagen excede 5MB (${(file.size / 1024 / 1024).toFixed(1)}MB).`;
  }
  return null;
}

export async function uploadExerciseImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(EXERCISE_IMAGES_BUCKET)
    .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  if (error) throw new Error(error.message);
  return path;
}

export async function uploadUniversityLogo(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `logos/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(EXERCISE_IMAGES_BUCKET)
    .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  if (error) throw new Error(error.message);
  return path;
}

export async function getExerciseImageUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(EXERCISE_IMAGES_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function deleteExerciseImage(path: string): Promise<void> {
  await supabase.storage.from(EXERCISE_IMAGES_BUCKET).remove([path]);
}
