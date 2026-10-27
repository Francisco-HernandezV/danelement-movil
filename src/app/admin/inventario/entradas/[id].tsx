import { useLocalSearchParams } from 'expo-router';

import { DetalleEntradaScreen } from '@/features/inventario/screens/DetalleEntradaScreen';

/** Detalle de una entrada (`/admin/inventario/entradas/:id`). */
export default function DetalleEntradaRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DetalleEntradaScreen id={Number(id)} />;
}
