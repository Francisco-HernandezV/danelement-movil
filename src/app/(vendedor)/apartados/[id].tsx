import { useLocalSearchParams } from 'expo-router';

import { ApartadoDetalleScreen } from '@/features/apartados/screens/ApartadoDetalleScreen';

/** Detalle de un apartado (`/apartados/:id`). */
export default function ApartadoDetalleRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ApartadoDetalleScreen id={Number(id)} />;
}
