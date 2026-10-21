import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

type PartageLocalNatif = {
  cheminApk(): string;
  demarrerWifi(): Promise<{ ssid: string | null; motDePasse: string | null }>;
  arreterWifi(): void;
  demarrerServeur(racine: string, port: number): number;
  arreterServeur(): void;
  adressesIp(): string[];
};

/** Module natif Android de partage hors ligne ; `null` sur iOS et dans Expo Go. */
export const PartageLocal = Platform.OS === 'android' ? requireOptionalNativeModule<PartageLocalNatif>('PartageLocal') : null;
