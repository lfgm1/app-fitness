// Janela de confirmação/aviso do próprio app, usada no navegador (site e app instalado pela tela de
// início). As janelas do navegador (window.confirm) podem ser bloqueadas no iPhone, e aí ações como
// "Excluir treino" não aconteciam. No app nativo continuam as janelas do sistema (Alert).

import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { setDialogHandler } from '@/lib/format';
import type { DialogRequest } from '@/lib/format';
import { colors, fonts, hardShadow, outline, radius } from '@/theme';

export function DialogHost() {
  const [dialog, setDialog] = useState<DialogRequest | null>(null);
  // Aberta ou não fica separado do conteúdo: ao fechar, o texto continua na tela enquanto a janela
  // some (senão, durante a animação, aparecia uma janela vazia com o botão "Entendi").
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    setDialogHandler((request) => {
      setDialog(request);
      setOpen(true);
    });
    return () => setDialogHandler(null);
  }, []);

  const close = () => setOpen(false);
  const confirm = () => {
    const action = dialog?.onConfirm;
    setOpen(false);
    action?.();
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Fechar">
        {/* Tocar dentro do card não fecha a janela */}
        <Pressable style={styles.card} onPress={() => {}} accessibilityRole="alert">
          <Text style={styles.title}>{dialog?.title}</Text>
          <Text style={styles.message}>{dialog?.message}</Text>
          {dialog?.onConfirm ? (
            <View style={styles.actions}>
              <Button title="Cancelar" variant="secondary" onPress={close} style={styles.flex} />
              <Button
                title={dialog.confirmLabel ?? 'Confirmar'}
                variant="danger"
                onPress={confirm}
                style={styles.flex}
              />
            </View>
          ) : (
            <Button title="Entendi" onPress={close} />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    gap: 12,
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: radius + 4,
    ...outline,
    ...hardShadow(colors.primary),
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 26,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  message: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  flex: { flex: 1 },
});
