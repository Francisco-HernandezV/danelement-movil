import { useCallback, useState } from 'react';

import { ApiError } from '@/config/http';
import { useAuth } from '@/context/AuthContext';
import { authRepository } from '@/data/repositories/authRepository';

/**
 * Lógica de la pantalla de inicio de sesión.
 *
 * Maneja además el caso `requirePasswordChange`: cuando el backend obliga a un
 * empleado a definir una contraseña nueva, guardamos el token temporal y
 * mostramos un segundo formulario antes de completar el acceso.
 */
export function useLoginViewModel() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'info'>('error');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Cambio de contraseña obligatorio (clave temporal de empleado).
  const [requireChange, setRequireChange] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleError = useCallback((error: unknown) => {
    setMessageType('error');
    if (error instanceof ApiError) {
      setMessage(error.message);
      if (error.fieldErrors) setFieldErrors(error.fieldErrors);
    } else {
      setMessage('Ocurrió un error inesperado. Inténtalo de nuevo.');
    }
  }, []);

  const submit = useCallback(async () => {
    setMessage(null);
    setFieldErrors({});
    if (!email.trim() || !password) {
      setMessageType('error');
      setMessage('Ingresa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const res = await authRepository.login(email.trim(), password);
      if (res.requirePasswordChange) {
        setRequireChange(true);
        setTempToken(res.token);
        setMessageType('info');
        setMessage('Por seguridad, define una contraseña definitiva para continuar.');
      } else {
        // Al guardar la sesión, el layout de (auth) redirige al área del rol.
        await signIn({ token: res.token, user: res.user });
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [email, password, signIn, handleError]);

  const submitNewPassword = useCallback(async () => {
    setMessage(null);
    setMessageType('error');
    if (newPassword.length < 8) {
      setMessage('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.');
      return;
    }
    if (!tempToken) {
      setRequireChange(false);
      setMessage('La sesión temporal expiró. Inicia sesión de nuevo.');
      return;
    }
    setLoading(true);
    try {
      const session = await authRepository.forcePasswordChange(newPassword, tempToken);
      await signIn(session);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [newPassword, confirmPassword, tempToken, signIn, handleError]);

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    message,
    messageType,
    fieldErrors,
    clearFieldError,
    requireChange,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    submit,
    submitNewPassword,
  };
}
