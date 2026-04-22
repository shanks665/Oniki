import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
} from "firebase/auth";
import { getClientAuth } from "./config";

export async function signIn(
  email: string,
  password: string
): Promise<User> {
  const result = await signInWithEmailAndPassword(getClientAuth(), email, password);
  return result.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(getClientAuth());
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(getClientAuth(), callback);
}

export function getCurrentUser(): User | null {
  return getClientAuth().currentUser;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = getClientAuth().currentUser;
  if (!user || !user.email) throw new Error("ログインが必要です");

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}
