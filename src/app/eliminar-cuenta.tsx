import { Redirect } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/data/models/user';
import { EliminarCuentaScreen } from '@/features/perfil/screens/EliminarCuentaScreen';

/** Solo los clientes eliminan su cuenta; al personal lo da de baja el admin. */
export default function EliminarCuentaRoute() {
  const { isRestoring, isAuthenticated, role } = useAuth();

  if (isRestoring) return null;
  if (!isAuthenticated) return <Redirect href="/sign-in" />;
  if (role !== ROLES.cliente) return <Redirect href="/perfil" />;
  return <EliminarCuentaScreen />;
}
