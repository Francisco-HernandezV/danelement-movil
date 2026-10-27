import { VentaEnCursoProvider } from '@/features/ventas/context/VentaEnCursoContext';
import { NuevoApartadoScreen } from '@/features/apartados/screens/NuevoApartadoScreen';

/**
 * Nuevo apartado. Monta su PROPIO `VentaEnCursoProvider`: el carrito del
 * apartado es independiente del de la venta en curso del POS.
 */
export default function NuevoApartadoRoute() {
  return (
    <VentaEnCursoProvider>
      <NuevoApartadoScreen />
    </VentaEnCursoProvider>
  );
}
