import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getClientStorage } from "./config";

export async function uploadStoreImage(
  storeId: string,
  file: File,
  index: number
): Promise<string> {
  const extension = file.name.split(".").pop() || "jpg";
  const path = `stores/${storeId}/${Date.now()}_${index}.${extension}`;
  const storageRef = ref(getClientStorage(), path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

function extractStoragePath(downloadUrl: string): string | null {
  try {
    const url = new URL(downloadUrl);
    const encoded = url.pathname.split("/o/")[1];
    if (!encoded) return null;
    return decodeURIComponent(encoded.split("?")[0]);
  } catch {
    return null;
  }
}

export async function deleteStoreImage(imageUrl: string): Promise<void> {
  try {
    const path = extractStoragePath(imageUrl);
    if (!path) return;
    const storageRef = ref(getClientStorage(), path);
    await deleteObject(storageRef);
  } catch {
    // Image may already be deleted
  }
}
