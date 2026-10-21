// Janela com a prévia do card do Frank e o botão de compartilhar.

import { useEffect, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { ShareCard } from '@/components/ShareCard';
import { Button } from '@/components/ui';
import { FRANK_PHASES } from '@/lib/frank';
import type { FrankPhase } from '@/lib/frank';
import { notify } from '@/lib/format';
import { prepareShareImage, shareImage } from '@/lib/shareCard';
import type { SharePayload } from '@/lib/shareCard';
import { colors, fonts } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  phase: FrankPhase;
  workoutCount: number;
  variant: 'evoluiu' | 'atual';
};

const PREVIEW_W = 220;

export function ShareSheet(props: Props) {
  // O conteúdo só existe com a janela aberta: cada vez que abre, a imagem é gerada de novo.
  return props.visible ? <ShareSheetContent {...props} /> : null;
}

function ShareSheetContent({ onClose, phase, workoutCount, variant }: Props) {
  const cardRef = useRef<ComponentRef<typeof View>>(null);
  const [payload, setPayload] = useState<SharePayload | null>(null);
  const [preparing, setPreparing] = useState(true);

  // A imagem é preparada assim que a janela abre: no navegador, o menu de compartilhar
  // só abre se for chamado logo no toque do botão, sem esperar a imagem ficar pronta.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const ready = await prepareShareImage(cardRef.current);
        if (!cancelled) setPayload(ready);
      } catch (error) {
        console.warn('Não foi possível gerar a imagem do card', error);
      } finally {
        if (!cancelled) setPreparing(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [phase, workoutCount, variant]);

  const name = FRANK_PHASES.find((p) => p.phase === phase)?.name ?? phase;
  const message =
    variant === 'evoluiu'
      ? `Meu Frank evoluiu para ${name} no Gains Club!`
      : `Meu Frank está na fase ${name} no Gains Club!`;

  async function share() {
    if (!payload) return;
    try {
      const shared = await shareImage(payload, message);
      if (!shared) notify('Não deu para compartilhar', 'Este aparelho não permite compartilhar imagens por aqui.');
    } catch {
      notify('Não deu para compartilhar', 'Tente de novo em instantes.');
    }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar">
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Compartilhar</Text>
          <View ref={cardRef} collapsable={false} style={styles.card}>
            <ShareCard phase={phase} workoutCount={workoutCount} variant={variant} width={PREVIEW_W} />
          </View>
          <Button
            title={preparing ? 'Preparando imagem...' : 'Compartilhar imagem'}
            icon="share-social-outline"
            onPress={share}
            disabled={!payload}
          />
          {preparing && <ActivityIndicator color={colors.primary} />}
          <Button title="Fechar" variant="ghost" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: { width: '100%', maxWidth: 360, alignItems: 'stretch', gap: 12 },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 28,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
    marginBottom: 4,
  },
  card: { alignSelf: 'center', borderRadius: 16, overflow: 'hidden' },
});
