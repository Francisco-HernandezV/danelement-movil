import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Guarda un PDF en la caché de la app y abre el menú nativo para compartirlo
 * (WhatsApp, correo, impresora, "Abrir con" un visor de PDF, etc.).
 *
 * - La caché la puede limpiar el sistema: el archivo es temporal a propósito,
 *   el comprobante siempre se puede volver a generar desde el backend.
 * - `expo-sharing` y `expo-file-system` vienen incluidos en Expo Go (SDK 57).
 */
export async function compartirPdf(bytes: Uint8Array, nombreArchivo: string, titulo: string): Promise<void> {
  if (bytes.length === 0 || !esPdf(bytes)) {
    throw new Error('El servidor no devolvió un PDF válido.');
  }
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Compartir archivos no está disponible en este dispositivo.');
  }

  const archivo = new File(Paths.cache, nombreArchivo);
  archivo.create({ overwrite: true });
  archivo.write(bytes);

  await Sharing.shareAsync(archivo.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: titulo,
  });
}

/** Los PDF empiezan con la firma "%PDF". Evita compartir una página de error. */
function esPdf(bytes: Uint8Array): boolean {
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}
