/**
 * Pruebas de integración: repositorio de auth + cliente HTTP trabajando juntos.
 * Solo se simula `fetch` (la red); el resto del código corre real.
 */
import { ApiError, http, setAuthToken, setUnauthorizedHandler } from '@/config/http';
import { API_BASE_URL } from '@/config/env';
import { authRepository } from '@/data/repositories/authRepository';
import { userRepository } from '@/data/repositories/userRepository';

/** Respuesta falsa con la forma mínima que usa el cliente HTTP. */
function respuesta(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
    arrayBuffer: async () => new ArrayBuffer(0),
  };
}

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  setAuthToken(null);
  setUnauthorizedHandler(null);
});

/** Headers que recibió `fetch` en la llamada número `n`. */
const headersDeLlamada = (n = 0) =>
  (fetchMock.mock.calls[n][1] as { headers: Record<string, string> }).headers;

describe('authRepository.login', () => {
  it('envía las credenciales sin token y mapea la respuesta a dominio', async () => {
    fetchMock.mockResolvedValueOnce(
      respuesta(200, {
        message: 'Bienvenido',
        token: 'jwt-123',
        requirePasswordChange: false,
        usuario: { id: 7, email: 'ana@test.com', nombre: 'Ana', rol: null },
      }),
    );

    const result = await authRepository.login('ana@test.com', 'secreta');

    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/users/login`);
    expect(headersDeLlamada().Authorization).toBeUndefined();
    expect(result.token).toBe('jwt-123');
    // Sin rol en el backend, el dominio asume cliente.
    expect(result.user.rol).toBe('rol_cliente');
  });

  it('convierte errores de validación del backend en errores por campo', async () => {
    fetchMock.mockResolvedValueOnce(
      respuesta(422, {
        message: 'Datos inválidos',
        errors: [{ path: 'email', msg: 'Correo inválido' }],
      }),
    );

    await expect(authRepository.login('mal', 'x')).rejects.toMatchObject({
      status: 422,
      message: 'Datos inválidos',
      fieldErrors: { email: 'Correo inválido' },
    });
  });
});

describe('cliente HTTP con sesión (JWT Bearer)', () => {
  it('agrega Authorization: Bearer con el token de sesión', async () => {
    setAuthToken('jwt-abc');
    fetchMock.mockResolvedValueOnce(respuesta(200, { ok: true }));

    await http.get('/perfil');

    expect(headersDeLlamada().Authorization).toBe('Bearer jwt-abc');
  });

  it('un 401 con sesión dispara el cierre de sesión automático', async () => {
    const onUnauthorized = jest.fn();
    setAuthToken('jwt-vencido');
    setUnauthorizedHandler(onUnauthorized);
    fetchMock.mockResolvedValueOnce(respuesta(401, { message: 'Token expirado' }));

    await expect(http.get('/perfil')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('un 401 en una llamada pública NO cierra la sesión', async () => {
    const onUnauthorized = jest.fn();
    setAuthToken('jwt-abc');
    setUnauthorizedHandler(onUnauthorized);
    fetchMock.mockResolvedValueOnce(respuesta(401, { message: 'Credenciales incorrectas' }));

    await expect(authRepository.login('a@test.com', 'mala')).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('un fallo de red se normaliza como ApiError con status 0', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(http.get('/productos')).rejects.toMatchObject({ status: 0 });
  });
});

describe('userRepository: derechos ARCO', () => {
  it('Acceso: GET /users/profile con el token de sesión', async () => {
    setAuthToken('jwt-abc');
    fetchMock.mockResolvedValueOnce(
      respuesta(200, { id: 1, nombre: 'Ana', email: 'ana@test.com', telefono_contacto: null }),
    );

    const perfil = await userRepository.getProfile();

    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/users/profile`);
    expect(headersDeLlamada().Authorization).toBe('Bearer jwt-abc');
    expect(perfil.email).toBe('ana@test.com');
  });

  it('Cancelación: eliminar cuenta envía la contraseña con el token', async () => {
    setAuthToken('jwt-abc');
    fetchMock.mockResolvedValueOnce(
      respuesta(200, {
        message: 'Tu cuenta se eliminará en 30 días.',
        anonimizacion_programada: '2026-12-05T00:00:00.000Z',
      }),
    );

    const res = await userRepository.eliminarCuenta('secreta');
    const opciones = fetchMock.mock.calls[0][1] as { method: string; body: string };

    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/users/eliminar-cuenta`);
    expect(opciones.method).toBe('POST');
    expect(JSON.parse(opciones.body)).toEqual({ password: 'secreta' });
    expect(headersDeLlamada().Authorization).toBe('Bearer jwt-abc');
    expect(res.anonimizacion_programada).toBe('2026-12-05T00:00:00.000Z');
  });

  it('Cancelación: contraseña incorrecta llega como ApiError con el mensaje del backend', async () => {
    setAuthToken('jwt-abc');
    fetchMock.mockResolvedValueOnce(respuesta(400, { message: 'Contraseña incorrecta' }));

    await expect(userRepository.eliminarCuenta('mala')).rejects.toMatchObject({
      status: 400,
      message: 'Contraseña incorrecta',
    });
  });
});

describe('authRepository: recuperación de contraseña', () => {
  it('valida el código enviando también el correo y sin token', async () => {
    setAuthToken('jwt-abc');
    fetchMock.mockResolvedValueOnce(respuesta(200, { message: 'Código válido' }));

    await authRepository.recoverValidateToken('ana@test.com', '123456');
    const opciones = fetchMock.mock.calls[0][1] as { body: string };

    expect(JSON.parse(opciones.body)).toEqual({ email: 'ana@test.com', token: '123456' });
    expect(headersDeLlamada().Authorization).toBeUndefined();
  });
});
