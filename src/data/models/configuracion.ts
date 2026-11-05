/**
 * Datos de contacto de la tienda, tal como los devuelve
 * `GET /api/admin/configuracion` (público). Los edita el administrador desde
 * la web, en Configuración; la app solo los muestra.
 */
export interface ConfiguracionTienda {
  nombre_tienda?: string | null;
  ubicacion?: string | null;
  maps_url?: string | null;
  telefono_1?: string | null;
  telefono_2?: string | null;
  whatsapp?: string | null;
  email_contacto?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
}
