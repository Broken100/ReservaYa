import { supabase } from './supabaseClient';

/**
 * Uploads a file to the specified path in the 'public_assets' bucket.
 * Returns the public URL of the uploaded file.
 * 
 * @param file The file object to upload
 * @param path The path inside the bucket (e.g., 'avatars/123.png')
 * @returns The public URL of the uploaded file, or null if an error occurred.
 */
export async function uploadPublicAsset(file: File, path: string): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('public_assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('public_assets')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Unexpected error during upload:', error);
    return null;
  }
}
