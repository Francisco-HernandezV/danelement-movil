/**
 * Construye una URL optimizada de Cloudinary a partir de la URL guardada en la
 * BD (misma lógica que la web). Las transformaciones se inyectan después de
 * "/upload/". `f_auto` entrega webp/avif según el cliente y `q_auto` comprime.
 *
 *   cldUrl(url, 'w_600,h_600,c_fill')  -> miniatura cuadrada
 *   cldUrl(url, 'w_1000')              -> versión grande para el detalle
 */
export function cldUrl(url: string | null | undefined, transformaciones = 'w_600'): string {
  if (!url) return PLACEHOLDER;
  if (!url.includes('/upload/')) return url; // no es de Cloudinary: se deja igual
  return url.replace('/upload/', `/upload/f_auto,q_auto,${transformaciones}/`);
}

/** Imagen de respaldo cuando el producto todavía no tiene fotos. */
export const PLACEHOLDER =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
       <rect width="400" height="400" fill="#1f242c"/>
       <text x="50%" y="50%" fill="#8b949e" font-family="sans-serif"
             font-size="20" text-anchor="middle" dominant-baseline="middle">
         Sin imagen
       </text>
     </svg>`,
  );
