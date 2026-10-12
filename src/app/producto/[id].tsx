import { useLocalSearchParams } from 'expo-router';

import { ProductDetailScreen } from '@/features/catalogo/screens/ProductDetailScreen';

export default function ProductoDetalleRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProductDetailScreen id={id} />;
}
