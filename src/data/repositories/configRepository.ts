import { http } from '@/config/http';
import type { ConfiguracionTienda } from '@/data/models/configuracion';

/** Configuración pública de la tienda (la misma que usa el pie de la web). */
export const configRepository = {
  getConfiguracion(signal?: AbortSignal): Promise<ConfiguracionTienda> {
    return http.get<ConfiguracionTienda>('/admin/configuracion', { auth: false, signal });
  },
};
