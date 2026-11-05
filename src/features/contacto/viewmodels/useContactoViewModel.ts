import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import { ApiError } from '@/config/http';
import type { ConfiguracionTienda } from '@/data/models/configuracion';
import { configRepository } from '@/data/repositories/configRepository';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface MedioContacto {
  key: string;
  icono: IconName;
  etiqueta: string;
  valor: string;
  url: string;
}

const soloDigitos = (v: string) => v.replace(/\D/g, '');

/** WhatsApp necesita el número con lada de país; en México es 52. */
function urlWhatsApp(numero: string): string {
  const d = soloDigitos(numero);
  return `https://wa.me/${d.length === 10 ? `52${d}` : d}`;
}

/** Convierte la configuración en la lista de medios que se muestran. */
function construirMedios(c: ConfiguracionTienda): {
  contacto: MedioContacto[];
  redes: MedioContacto[];
} {
  const contacto: MedioContacto[] = [];
  const redes: MedioContacto[] = [];

  const telefonos = [c.telefono_1, c.telefono_2].filter((t): t is string => Boolean(t?.trim()));
  // Evita mostrar dos veces el mismo número.
  [...new Set(telefonos.map((t) => t.trim()))].forEach((tel, i) =>
    contacto.push({
      key: `tel-${i}`,
      icono: 'call-outline',
      etiqueta: 'Llamar',
      valor: tel,
      url: `tel:${soloDigitos(tel)}`,
    }),
  );
  if (c.whatsapp?.trim()) {
    contacto.push({
      key: 'whatsapp',
      icono: 'logo-whatsapp',
      etiqueta: 'WhatsApp',
      valor: c.whatsapp.trim(),
      url: urlWhatsApp(c.whatsapp),
    });
  }
  if (c.email_contacto?.trim()) {
    contacto.push({
      key: 'correo',
      icono: 'mail-outline',
      etiqueta: 'Correo',
      valor: c.email_contacto.trim(),
      url: `mailto:${c.email_contacto.trim()}`,
    });
  }
  if (c.ubicacion?.trim()) {
    contacto.push({
      key: 'ubicacion',
      icono: 'location-outline',
      etiqueta: 'Ubicación',
      valor: c.ubicacion.trim(),
      url:
        c.maps_url?.trim() ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.ubicacion.trim())}`,
    });
  }

  const sociales: [keyof ConfiguracionTienda, IconName, string][] = [
    ['facebook', 'logo-facebook', 'Facebook'],
    ['instagram', 'logo-instagram', 'Instagram'],
    ['tiktok', 'logo-tiktok', 'TikTok'],
    ['twitter', 'logo-twitter', 'X (Twitter)'],
  ];
  for (const [campo, icono, etiqueta] of sociales) {
    const url = c[campo]?.trim();
    if (url) redes.push({ key: campo, icono, etiqueta, valor: etiqueta, url });
  }

  return { contacto, redes };
}

/** Carga los medios de contacto de la tienda y abre cada uno al tocarlo. */
export function useContactoViewModel() {
  const [config, setConfig] = useState<ConfiguracionTienda | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avisoApertura, setAvisoApertura] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cargar = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const data = await configRepository.getConfiguracion(controller.signal);
      setConfig(data);
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(e instanceof ApiError ? e.message : 'No se pudo cargar la información de contacto.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
    return () => abortRef.current?.abort();
  }, [cargar]);

  const abrir = useCallback(async (url: string) => {
    setAvisoApertura(null);
    try {
      await Linking.openURL(url);
    } catch {
      setAvisoApertura('No se pudo abrir este medio de contacto en tu teléfono.');
    }
  }, []);

  const medios = config ? construirMedios(config) : { contacto: [], redes: [] };

  return {
    nombreTienda: config?.nombre_tienda?.trim() || 'DanElement Boutique',
    contacto: medios.contacto,
    redes: medios.redes,
    loading,
    error,
    avisoApertura,
    reintentar: cargar,
    abrir,
  };
}
