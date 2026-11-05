import { PRIVACIDAD } from '@/features/legal/content/privacidad';
import { LegalDocScreen } from '@/features/legal/screens/LegalDocScreen';

export default function PrivacidadRoute() {
  return <LegalDocScreen doc={PRIVACIDAD} />;
}
