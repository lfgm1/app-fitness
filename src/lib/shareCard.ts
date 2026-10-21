// Transforma o card do Frank em imagem e abre o menu de compartilhar do celular (app nativo).
// A versão do navegador fica em shareCard.web.ts.

import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

/** A imagem pronta para compartilhar: um arquivo no celular (nativo) ou um File (navegador). */
export type SharePayload = string | File;

/** Gera a imagem do card (1080 × 1920) a partir da View que envolve o <ShareCard />. */
export async function prepareShareImage(target: unknown): Promise<SharePayload | null> {
  if (!target) return null;
  return captureRef(target as Parameters<typeof captureRef>[0], {
    format: 'png',
    quality: 1,
    width: 1080,
    height: 1920,
  });
}

/** Abre o menu de compartilhar (WhatsApp, Instagram, TikTok...). Retorna false se não deu. */
export async function shareImage(payload: SharePayload, message: string): Promise<boolean> {
  if (typeof payload !== 'string' || !(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(payload, { mimeType: 'image/png', dialogTitle: message, UTI: 'public.png' });
  return true;
}
