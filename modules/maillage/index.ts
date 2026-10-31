import { Platform } from 'react-native';
import { requireOptionalNativeModule, type NativeModule } from 'expo';

type Evenements = {
  recu: (e: { donnees: string; de: string }) => void;
  voisins: (e: { nombre: number }) => void;
  erreur: (e: { message: string }) => void;
  journal: (e: { ligne: string }) => void;
};

declare class MaillageNatif extends NativeModule<Evenements> {
  etatBluetooth(): 'absent' | 'eteint' | 'allume';
  demarrer(): void;
  arreter(): void;
  diffuser(id: string, donnees: string, dureeMs: number, sauf: string | null): void;
  chiffrer(cleHex: string, texte: string): string;
  dechiffrer(cleHex: string, b64: string): string | null;
}

/** Messagerie Bluetooth de proximité (Android) ; `null` sur iOS, dans Expo Go, ou dans un ancien APK. */
export const Maillage = Platform.OS === 'android' ? requireOptionalNativeModule<MaillageNatif>('Maillage') : null;
