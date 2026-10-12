import { Redirect } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { PerfilScreen } from '@/features/perfil/screens/PerfilScreen';

export default function PerfilRoute() {
  const { isRestoring, isAuthenticated } = useAuth();

  if (isRestoring) return null;
  if (!isAuthenticated) {
    return <Redirect href="/sign-in" />;
  }
  return <PerfilScreen />;
}
