import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Almacenamiento seguro multiplataforma.
 *
 * - En nativo (iOS/Android) usa `expo-secure-store` (Keychain / Keystore).
 * - En web `expo-secure-store` no existe: caemos a `localStorage`.
 *
 * Todas las operaciones son tolerantes a fallos (p. ej. modo incógnito o
 * almacenamiento bloqueado) para no tumbar la app por un error de storage.
 *
 * Nota: SecureStore tiene un límite ~2KB por valor; guardamos solo el token y
 * un objeto de usuario pequeño, muy por debajo de ese límite.
 */

const isWeb = Platform.OS === 'web';

function webStorage(): Storage | null {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      return (globalThis as unknown as { localStorage: Storage }).localStorage;
    }
  } catch {
    // acceso a localStorage puede lanzar en algunos entornos
  }
  return null;
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    if (isWeb) {
      webStorage()?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.warn(`[storage] no se pudo guardar "${key}":`, error);
  }
}

export async function getItem(key: string): Promise<string | null> {
  try {
    if (isWeb) {
      return webStorage()?.getItem(key) ?? null;
    }
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.warn(`[storage] no se pudo leer "${key}":`, error);
    return null;
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    if (isWeb) {
      webStorage()?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.warn(`[storage] no se pudo borrar "${key}":`, error);
  }
}
