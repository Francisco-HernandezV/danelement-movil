import { TERMINOS } from '@/features/legal/content/terminos';
import { LegalDocScreen } from '@/features/legal/screens/LegalDocScreen';

export default function TerminosRoute() {
  return <LegalDocScreen doc={TERMINOS} />;
}
