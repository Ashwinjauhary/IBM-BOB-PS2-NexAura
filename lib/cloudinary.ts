// lib/cloudinary.ts
// Client-side direct upload to Cloudinary using unsigned upload preset.
// This avoids proxying through our API route — faster for the user.

export function getCloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"
    );
  }

  return { cloudName, uploadPreset };
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export async function uploadToCloudinary(
  file: File
): Promise<{ data: CloudinaryUploadResult | null; error: string | null }> {
  try {
    const { cloudName, uploadPreset } = getCloudinaryConfig();
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "lost-and-found");

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cloudinary upload failed:", errorText);
      return { data: null, error: "Image upload failed. Please try again." };
    }

    const result = (await response.json()) as CloudinaryUploadResult;
    return { data: result, error: null };
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return { data: null, error: "Image upload failed. Please try again." };
  }
}
