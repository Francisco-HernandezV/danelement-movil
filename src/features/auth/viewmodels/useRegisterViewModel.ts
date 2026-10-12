import { useCallback, useState } from 'react';

import { ApiError } from '@/config/http';
import { authRepository } from '@/data/repositories/authRepository';

/** Deja solo dígitos y los formatea como `YYYY-MM-DD` (máx. 10 caracteres). */
function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);
  let out = year;
  if (month) out += `-${month}`;
  if (day) out += `-${day}`;
  return out;
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (date > new Date()) return false;
  if (date.getFullYear() < 1900) return false;
  return true;
}

/** Lógica del formulario de registro de nuevo cliente. */
export function useRegisterViewModel() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setFecha = useCallback((raw: string) => setFechaNacimiento(formatDateInput(raw)), []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const submit = useCallback(async () => {
    setMessage(null);
    setFieldErrors({});

    // Validaciones mínimas en cliente; el backend hace la validación fuerte.
    const localErrors: Record<string, string> = {};
    if (!nombre.trim()) localErrors.nombre = 'El nombre es obligatorio.';
    if (!email.trim()) localErrors.email = 'El correo es obligatorio.';
    if (!password) localErrors.password = 'La contraseña es obligatoria.';
    if (!isValidDate(fechaNacimiento)) {
      localErrors.fecha_nacimiento = 'Usa el formato AAAA-MM-DD (fecha válida y no futura).';
    }
    if (telefono && !/^\d{10}$/.test(telefono)) {
      localErrors.telefono_contacto = 'El teléfono debe tener 10 dígitos.';
    }
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      setMessage('Revisa los campos marcados.');
      return;
    }

    setLoading(true);
    try {
      const res = await authRepository.register({
        nombre: nombre.trim(),
        email: email.trim(),
        password,
        telefono_contacto: telefono.trim() || undefined,
        fecha_nacimiento: fechaNacimiento,
      });
      setSuccess(true);
      setMessage(res.message || 'Registro exitoso. Revisa tu correo para activar tu cuenta.');
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.message);
        if (error.fieldErrors) setFieldErrors(error.fieldErrors);
      } else {
        setMessage('Ocurrió un error inesperado. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }, [nombre, email, telefono, fechaNacimiento, password]);

  return {
    nombre,
    setNombre,
    email,
    setEmail,
    telefono,
    setTelefono,
    fechaNacimiento,
    setFecha,
    password,
    setPassword,
    loading,
    message,
    success,
    fieldErrors,
    clearFieldError,
    submit,
  };
}
