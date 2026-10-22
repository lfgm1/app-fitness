// Janela "como funciona o streak": abre ao tocar no selo de semanas (lista de amigos, perfis e Início).
// Mostra de quem é o streak, a regra e os níveis do fogo, com o nível atual destacado.

import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/social/Avatar';
import { Button } from '@/components/ui';
import { DAYS_PER_WEEK, STREAK_LEVELS, streakLevel, weeksLabel } from '@/lib/streak';
import { colors, fonts, outlineColor } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  weeks: number;
  /** De quem é o streak: "Você" ou o nome da pessoa. */
  who: string;
  name?: string;
  icon?: string | null;
};

/** "3 a 5 semanas" / "52+ semanas". */
function rangeOf(index: number) {
  const level = STREAK_LEVELS[index];
  const next = STREAK_LEVELS[index + 1];
  return next ? `${level.from} a ${next.from - 1} semanas` : `${level.from}+ semanas`;
}

export function StreakInfo({ visible, onClose, weeks, who, name, icon }: Props) {
  const current = streakLevel(weeks);
  const isMe = who === 'Você';
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar" />
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <View style={styles.handle} />
        {visible && (
          <ScrollView style={{ maxHeight: 560 }} contentContainerStyle={{ gap: 12 }}>
            <Text style={styles.title}>Streak semanal</Text>
            <Text style={styles.current}>
              {weeks === 0 ? (
                `${who} ainda não tem streak.`
              ) : current.level === 'nenhum' ? (
                // 1 ou 2 semanas: ainda sem fogo.
                `${who} tem ${weeksLabel(weeks)} seguidas. Falta${STREAK_LEVELS[1].from - weeks === 1 ? '' : 'm'} ${
                  STREAK_LEVELS[1].from - weeks
                } para a Faísca.`
              ) : (
                <>
                  {who} está em <Text style={{ color: current.color }}>{current.name}</Text> · {weeksLabel(weeks)}{' '}
                  seguidas
                </>
              )}
            </Text>

            <View style={styles.box}>
              <Text style={styles.boxTitle}>Como funciona</Text>
              {[
                `Treine em ${DAYS_PER_WEEK} dias diferentes de segunda a domingo: a semana soma 1.`,
                'Vários treinos no mesmo dia contam como 1 dia.',
                `Se uma semana acabar com menos de ${DAYS_PER_WEEK} dias, o streak volta a zero.`,
              ].map((line, i) => (
                <View key={i} style={styles.rule}>
                  <View style={styles.ruleNumber}>
                    <Text style={styles.ruleNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.ruleText}>{line}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.boxTitle}>Níveis do fogo</Text>
            {STREAK_LEVELS.slice(1).map((level, i) => {
              const here = level.level === current.level;
              return (
                <View key={level.level} style={[styles.level, here && { borderColor: level.color }]}>
                  <View style={styles.preview}>
                    <Avatar name={name ?? who} icon={icon} size={40} streakWeeks={level.from} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.levelName, { color: level.color }]}>{level.name}</Text>
                    <Text style={styles.levelRange}>
                      {rangeOf(i + 1)}
                      {level.level === 'lendario' ? ' · arco-íris' : ''}
                    </Text>
                  </View>
                  {here && (
                    <View style={[styles.hereTag, { backgroundColor: level.color }]}>
                      <Text style={styles.hereText}>{isMe ? 'Você' : 'Aqui'}</Text>
                    </View>
                  )}
                </View>
              );
            })}
            <Text style={styles.note}>Abaixo de {STREAK_LEVELS[1].from} semanas ainda não aparece fogo.</Text>
          </ScrollView>
        )}
        <Button title="Entendi" onPress={onClose} />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 2.5,
    borderColor: outlineColor,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 12,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.textFaint },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 30,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  current: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, lineHeight: 22 },
  box: { gap: 10, padding: 12, borderRadius: 14, backgroundColor: colors.background },
  boxTitle: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ruleNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleNumberText: { color: colors.primaryText, fontFamily: fonts.bold, fontSize: 13 },
  ruleText: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  level: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
  },
  preview: { width: 52, alignItems: 'center' },
  levelName: { fontFamily: fonts.display, fontSize: 20, textTransform: 'uppercase', letterSpacing: 0.4 },
  levelRange: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13 },
  hereTag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  hereText: { color: colors.primaryText, fontFamily: fonts.bold, fontSize: 12 },
  note: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: 12, textAlign: 'center' },
});
