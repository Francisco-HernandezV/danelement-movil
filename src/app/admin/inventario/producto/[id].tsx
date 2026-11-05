import { useLocalSearchParams } from 'expo-router';

import { MatrizVariantesScreen } from '@/features/inventario/screens/MatrizVariantesScreen';

/** Matriz de variantes de un producto (`/admin/inventario/producto/:id`). */
export default function MatrizVariantesRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MatrizVariantesScreen productoId={Number(id)} />;
}
