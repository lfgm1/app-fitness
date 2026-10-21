// Transforma o card do Frank em imagem e compartilha, no navegador (site e app instalado pela
// tela de início). O card é um SVG: ele é desenhado num <canvas> em 1080 × 1920 e vira um PNG.

/** A imagem pronta para compartilhar: um arquivo no celular (nativo) ou um File (navegador). */
export type SharePayload = string | File;

/** Gera a imagem do card a partir do elemento que envolve o <ShareCard />. */
export async function prepareShareImage(target: unknown): Promise<SharePayload | null> {
  const svg = target instanceof Element ? target.querySelector('svg') : null;
  if (!svg) return null;

  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  copy.setAttribute('width', '1080');
  copy.setAttribute('height', '1920');
  const markup = new XMLSerializer().serializeToString(copy);

  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  canvas.getContext('2d')?.drawImage(image, 0, 0, 1080, 1920);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  return blob ? new File([blob], 'gains-club-frank.png', { type: 'image/png' }) : null;
}

/**
 * Abre o menu de compartilhar do celular com a imagem. Onde não existe (computador), baixa a
 * imagem. Precisa ser chamado direto no toque do botão (o navegador exige isso).
 */
export async function shareImage(payload: SharePayload, message: string): Promise<boolean> {
  if (typeof payload === 'string') return false;
  if (navigator.canShare?.({ files: [payload] })) {
    try {
      await navigator.share({ files: [payload], text: message });
    } catch (error) {
      // Fechar o menu sem escolher nada não é erro.
      if ((error as Error).name !== 'AbortError') throw error;
    }
    return true;
  }
  const url = URL.createObjectURL(payload);
  const link = document.createElement('a');
  link.href = url;
  link.download = payload.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
