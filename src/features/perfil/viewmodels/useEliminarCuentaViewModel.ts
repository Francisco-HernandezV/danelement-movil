import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { ApiError } from '@/config/http';
import { useAuth } from '@/context/AuthContext';
import { userRepository } from '@/data/repositories/userRepository';

/**
 * Eliminar mi cuenta: confirma con la contraseña, cierra la sesión local y
 * regresa al catálogo. El backend desactiva la cuenta de inmediato y borra
 * los datos personales a los 30 días (se cancela si vuelve a iniciar sesión).
 */
export function useEliminarCuentaViewModel() {
  const { signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eliminar = useCallback(async () => {
    setError(null);
    if (!password) {
      setError('Escribe tu contraseña para confirmar.');
      return;
    }
    setLoading(true);
    try {
      const res = await userRepository.eliminarCuenta(password);
      // La cuenta ya está desactivada: solo limpiamos la sesión del teléfono.
      router.replace('/');
      await signOut();
      Alert.alert('Cuenta eliminada', res.message);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo eliminar la cuenta. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [password, signOut]);

  return { password, setPassword, loading, error, eliminar };
}
