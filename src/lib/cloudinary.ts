import { Platform } from 'react-native';

export async function uploadToCloudinary(uri: string): Promise<string> {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();

  if (!cloudName || !uploadPreset) {
    throw new Error('Missing Cloudinary env vars');
  }

  const formData = new FormData();

  if (Platform.OS === 'web') {
    // Browsers need a real Blob/File, not a { uri, type, name } object
    const blob = await (await fetch(uri)).blob();
    formData.append('file', blob, 'upload.jpg');
  } else {
    // React Native (iOS/Android) understands this object form
    formData.append('file', { uri, type: 'image/jpeg', name: 'upload.jpg' } as any);
  }

  formData.append('upload_preset', uploadPreset);

  // Don't set Content-Type yourself; the runtime adds the multipart boundary
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? 'Upload failed');
  return data.secure_url as string;
}