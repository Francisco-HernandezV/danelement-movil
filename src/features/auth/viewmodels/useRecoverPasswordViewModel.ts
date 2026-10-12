import { useCallback, useState } from 'react';

import { ApiError } from '@/config/http';
import { authRepository } from '@/data/repositories/authRepository';

export type RecoverStep = 1 | 2 | 3;

/**
 * Lógica del flujo de recuperación de contraseña en 3 pasos:
 *   1) enviar código al correo, 2) validar el código de 6 dígitos,
 *   3) definir la nueva contraseña.
 */
export function useRecoverPasswordViewModel() {
  const [step, setStep] = useState<RecoverStep>(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'info' | 'success'>('error');
  const [success, setSuccess] = useState(false);

  const handleError = useCallback((error: unknown, fallback: string) => {
    setMessageType('error');
    setMessage(error instanceof ApiError ? error.message : fallback);
  }, []);

  const sendEmail = useCallback(async () => {
    setMessage(null);
    if (!email.trim()) {
      setMessageType('error');
      setMessage('Ingresa tu correo electrónico.');
      return;
    }
    setLoading(true);
    try {
      await authRepository.recoverSendEmail(email.trim());
      setStep(2);
      setMessageType('info');
      setMessage('Código enviado. Revisa tu correo.');
    } catch (error) {
      handleError(error, 'No se pudo enviar el correo.');
    } finally {
      setLoading(false);
    }
  }, [email, handleError]);

  const validateToken = useCallback(async () => {
    setMessage(null);
    if (!/^\d{6}$/.test(token.trim())) {
      setMessageType('error');
      setMessage('El código es de 6 dígitos.');
      return;
    }
    setLoading(true);
    try {
      await authRepository.recoverValidateToken(token.trim());
      setStep(3);
    } catch (error) {
      handleError(error, 'Código inválido o expirado.');
    } finally {
      setLoading(false);
    }
  }, [token, handleError]);

  const resetPassword = useCallback(async () => {
    setMessage(null);
    setMessageType('error');
    if (nuevaPassword.length < 8) {
      setMessage('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      setMessage('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await authRepository.recoverReset(token.trim(), nuevaPassword);
      setSuccess(true);
      setMessageType('success');
      setMessage('Contraseña actualizada correctamente.');
    } catch (error) {
      handleError(error, 'No se pudo actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  }, [token, nuevaPassword, confirmarPassword, handleError]);

  const backToEmail = useCallback(() => {
    setStep(1);
    setMessage(null);
    setToken('');
  }, []);

  return {
    step,
    email,
    setEmail,
    token,
    setToken,
    nuevaPassword,
    setNuevaPassword,
    confirmarPassword,
    setConfirmarPassword,
    loading,
    message,
    messageType,
    success,
    sendEmail,
    validateToken,
    resetPassword,
    backToEmail,
  };
}
