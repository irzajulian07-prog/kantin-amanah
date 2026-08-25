import { storage, isFirebaseConfigured } from './config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export type StorageCategory = 'santriwati' | 'products' | 'qris' | 'payments';

/**
 * Uploads a file (image) to Firebase Storage or converts to base64 data URL if storage is not connected
 * @param file The File or Blob to upload
 * @param folder Folder category: 'santriwati' | 'products' | 'qris' | 'payments'
 * @param customFileName Optional filename identifier
 * @returns Promise<string> Download URL or base64 URL
 */
export async function uploadMediaFile(
  file: File | Blob,
  folder: StorageCategory,
  customFileName?: string
): Promise<string> {
  const timestamp = Date.now();
  const fileExt = file instanceof File ? file.name.split('.').pop() || 'jpg' : 'jpg';
  const fileName = customFileName ? `${customFileName}.${fileExt}` : `${folder}_${timestamp}.${fileExt}`;
  const fullPath = `amanah_mart/${folder}/${fileName}`;

  if (isFirebaseConfigured && storage) {
    try {
      const storageReference = ref(storage, fullPath);
      const snapshot = await uploadBytes(storageReference, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Failed to upload to Firebase Storage, falling back to Data URL preview:', error);
    }
  }

  // Fallback to Data URL for instant preview & local persistence
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (err) => {
      reject(err);
    };
    reader.readAsDataURL(file);
  });
}
