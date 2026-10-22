// Descanso entre as séries, na tela de registrar treino: o botão "Descansar" fixo embaixo abre a
// escolha do tempo (o último usado vem destacado) e, depois, o cronômetro com o Frank Flap. O tempo escolhido e a opção "Jogar / Só cronômetro"
// ficam guardados no celular para os próximos treinos.

import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FrankFlap } from '@/components/rest/FrankFlap';
import { colors, fonts, outline, outlineColor } from '@/theme';

const PRESETS = [30, 60, 90, 120, 180];
// Tempo personalizado: de 15 em 15 segundos, de 15 s a 10 min.
const CUSTOM_MIN = 15;
const CUSTOM_MAX = 600;
const CUSTOM_STEP = 15;
const DEFAULT_SECONDS = 90;
const KEY_SECONDS = 'rest:seconds';
const KEY_MODE = 'rest:mode';

type Mode = 'jogar' | 'cronometro';

function clockLabel(totalSeconds: number) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Hora atual em milissegundos (fora da renderização). */
function clock() {
  return Date.now();
}

export function RestControls({ workoutId }: { workoutId: string }) {
  const { width } = useWindowDimensions();
  const [seconds, setSeconds] = useState(DEFAULT_SECONDS);
  const [mode, setMode] = useState<Mode>('jogar');
  // Quando o descanso acaba (null = sem descanso agora) e quanto ele tinha no total.
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [total, setTotal] = useState(DEFAULT_SECONDS);
  const [remaining, setRemaining] = useState(0);
  const [ended, setEnded] = useState(false);
  const [open, setOpen] = useState(false);
  const [choosing, setChoosing] = useState(false);
  // Escolhendo um tempo personalizado (e qual).
  const [customizing, setCustomizing] = useState(false);
  const [custom, setCustom] = useState(DEFAULT_SECONDS);

  // Último tempo e modo usados.
  useEffect(() => {
    AsyncStorage.multiGet([KEY_SECONDS, KEY_MODE])
      .then(([[, s], [, m]]) => {
        if (s && Number(s) > 0) setSeconds(Number(s));
        if (m === 'jogar' || m === 'cronometro') setMode(m);
      })
      .catch(() => {});
  }, []);

  // Contagem: o tempo é calculado pela hora de término, então não atrasa.
  useEffect(() => {
    if (endsAt === null || ended) return;
    const update = () => {
      const left = (endsAt - clock()) / 1000;
      setRemaining(Math.max(0, left));
      if (left <= 0) setEnded(true);
    };
    update();
    const timer = setInterval(update, 250);
    return () => clearInterval(timer);
  }, [endsAt, ended]);

  function remember(next: number) {
    setSeconds(next);
    AsyncStorage.setItem(KEY_SECONDS, String(next)).catch(() => {});
  }

  function start(duration = seconds) {
    setEndsAt(clock() + duration * 1000);
    setTotal(duration);
    setRemaining(duration);
    setEnded(false);
    setChoosing(false);
    setOpen(true);
  }

  function finish() {
    setEndsAt(null);
    setEnded(false);
    setChoosing(false);
    setOpen(false);
  }

  /** −15s / +15s: vale só para este descanso (o tempo padrão não muda). */
  function adjust(delta: number) {
    if (endsAt === null || ended) return;
    const left = Math.max(5, remaining + delta);
    setEndsAt(clock() + left * 1000);
    setRemaining(left);
    setTotal((t) => Math.max(left, t + delta));
  }

  function choose(duration: number) {
    remember(duration);
    start(duration);
  }

  function changeMode(next: Mode) {
    setMode(next);
    AsyncStorage.setItem(KEY_MODE, next).catch(() => {});
  }

  const resting = endsAt !== null;
  // Tempos prontos + o último usado, se tiver sido um tempo personalizado (aparece destacado).
  const options = PRESETS.includes(seconds) ? PRESETS : [...PRESETS, seconds].sort((a, b) => a - b);
  const gameWidth = Math.min(width, 460) - 40;
  const progress = total > 0 ? 1 - remaining / total : 1;

  return (
    <>
      {/* Botão fixo embaixo */}
      <SafeAreaView edges={['bottom']} style={styles.bar} pointerEvents="box-none">
        <Pressable
          style={[styles.restButton, ended && styles.restButtonEnded]}
          onPress={() => {
            setCustomizing(false);
            setOpen(true);
          }}
          accessibilityRole="button">
          <Ionicons name={ended ? 'alarm-outline' : 'hourglass-outline'} size={20} color={colors.primaryText} />
          <Text style={styles.restButtonText}>
            {ended ? 'Descanso acabou!' : resting ? 'Descansando' : 'Descansar'}
          </Text>
          {resting && !ended && <Text style={styles.restButtonTime}>{clockLabel(remaining)}</Text>}
        </Pressable>
      </SafeAreaView>

      {/* Janela do descanso */}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Fechar" />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <Pressable onPress={() => setOpen(false)} hitSlop={12} style={styles.handleArea} accessibilityLabel="Fechar">
            <View style={styles.handle} />
          </Pressable>

          {!resting ? (
            // Antes de começar: escolher o tempo. O último usado vem destacado.
            <>
              <Text style={styles.pickTitle}>Quanto tempo de descanso?</Text>
              {customizing ? (
                // Tempo personalizado: de 15 em 15 segundos, até 10 minutos.
                <View style={styles.customBox}>
                  <View style={styles.customRow}>
                    <Pressable
                      style={styles.customStep}
                      onPress={() => setCustom((c) => Math.max(CUSTOM_MIN, c - CUSTOM_STEP))}
                      accessibilityLabel="Menos 15 segundos">
                      <Ionicons name="remove" size={26} color={colors.text} />
                    </Pressable>
                    <Text style={styles.customTime}>{clockLabel(custom)}</Text>
                    <Pressable
                      style={styles.customStep}
                      onPress={() => setCustom((c) => Math.min(CUSTOM_MAX, c + CUSTOM_STEP))}
                      accessibilityLabel="Mais 15 segundos">
                      <Ionicons name="add" size={26} color={colors.text} />
                    </Pressable>
                  </View>
                  <Pressable style={styles.backButton} onPress={() => choose(custom)} accessibilityRole="button">
                    <Text style={styles.backButtonText}>Descansar {clockLabel(custom)}</Text>
                  </Pressable>
                  <Pressable onPress={() => setCustomizing(false)} hitSlop={8} accessibilityRole="button">
                    <Text style={styles.skip}>Voltar aos tempos prontos</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.pickGrid}>
                  {options.map((p) => (
                    <Pressable
                      key={p}
                      style={[styles.pickOption, p === seconds && styles.pickOptionOn]}
                      onPress={() => choose(p)}
                      accessibilityRole="button"
                      accessibilityLabel={`Descansar ${clockLabel(p)}`}>
                      <Text style={[styles.pickTime, p === seconds && { color: colors.primaryText }]}>
                        {clockLabel(p)}
                      </Text>
                      {p === seconds && <Text style={styles.pickLast}>último usado</Text>}
                    </Pressable>
                  ))}
                  <Pressable
                    style={styles.pickOption}
                    onPress={() => {
                      setCustom(seconds);
                      setCustomizing(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Escolher outro tempo">
                    <Ionicons name="create-outline" size={22} color={colors.text} />
                    <Text style={styles.pickOther}>Outro tempo</Text>
                  </Pressable>
                </View>
              )}
              <Pressable onPress={() => setOpen(false)} hitSlop={8} accessibilityRole="button">
                <Text style={styles.skip}>Cancelar</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.timerRow}>
                <Pressable
                  onPress={() => !ended && setChoosing((c) => !c)}
                  accessibilityRole="button"
                  accessibilityLabel="Trocar o tempo de descanso">
                  <Text style={styles.label}>Descanso{!ended ? ' · toque para trocar' : ''}</Text>
                  <Text style={[styles.clock, ended && { color: colors.crista }]}>{clockLabel(remaining)}</Text>
                </Pressable>
                {!ended && (
                  <View style={styles.adjust}>
                    <Pressable
                      style={styles.adjustButton}
                      onPress={() => adjust(-15)}
                      accessibilityLabel="Menos 15 segundos">
                      <Text style={styles.adjustText}>−15s</Text>
                    </Pressable>
                    <Pressable
                      style={styles.adjustButton}
                      onPress={() => adjust(15)}
                      accessibilityLabel="Mais 15 segundos">
                      <Text style={styles.adjustText}>+15s</Text>
                    </Pressable>
                  </View>
                )}
              </View>
              <View style={styles.progress}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>

              {choosing && (
                <View style={styles.presets}>
                  {PRESETS.map((p) => (
                    <Pressable key={p} style={[styles.chip, p === seconds && styles.chipOn]} onPress={() => choose(p)}>
                      <Text style={[styles.chipText, p === seconds && { color: colors.primary }]}>{clockLabel(p)}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {mode === 'jogar' ? (
                <View>
                  <FrankFlap workoutId={workoutId} playing={open && resting && !ended} width={gameWidth} />
                  {ended && (
                    <View style={styles.endOverlay}>
                      <Text style={styles.endTitle}>Descanso acabou!</Text>
                      <Text style={styles.endText}>
                        Bora pra próxima série. O jogo fica pausado e continua no próximo descanso.
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={[styles.onlyClock, { width: gameWidth }]}>
                  <Ionicons name={ended ? 'alarm-outline' : 'hourglass-outline'} size={48} color={colors.textMuted} />
                  <Text style={styles.endText}>
                    {ended ? 'Descanso acabou! Bora pra próxima série.' : 'Respira e se prepara para a próxima série.'}
                  </Text>
                </View>
              )}

              {ended ? (
                <Pressable style={styles.backButton} onPress={finish} accessibilityRole="button">
                  <Text style={styles.backButtonText}>Voltar ao treino</Text>
                </Pressable>
              ) : (
                <>
                  <View style={styles.modes}>
                    {(
                      [
                        ['jogar', 'Jogar', 'game-controller-outline'],
                        ['cronometro', 'Só cronômetro', 'time-outline'],
                      ] as const
                    ).map(([key, label, icon]) => (
                      <Pressable
                        key={key}
                        style={[styles.chip, mode === key && styles.chipOn]}
                        onPress={() => changeMode(key)}>
                        <Ionicons name={icon} size={15} color={mode === key ? colors.primary : colors.textMuted} />
                        <Text style={[styles.chipText, mode === key && { color: colors.primary }]}>{label}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Pressable onPress={finish} hitSlop={8} accessibilityRole="button">
                    <Text style={styles.skip}>Pular descanso</Text>
                  </Pressable>
                </>
              )}
            </>
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 16, right: 16, bottom: 12 },
  restButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.primary,
    ...outline,
  },
  restButtonEnded: { backgroundColor: colors.crista },
  restButtonText: { flex: 1, color: colors.primaryText, fontFamily: fonts.bold, fontSize: 16 },
  restButtonTime: { color: colors.primaryText, fontFamily: fonts.mono, fontSize: 16 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 2.5,
    borderColor: outlineColor,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
    alignItems: 'center',
  },
  handleArea: { paddingVertical: 10, alignSelf: 'stretch', alignItems: 'center' },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.textFaint },
  timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch' },
  label: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12 },
  clock: { color: colors.primary, fontFamily: fonts.mono, fontSize: 38 },
  adjust: { flexDirection: 'row', gap: 8 },
  adjustButton: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  adjustText: { color: colors.text, fontFamily: fonts.bold, fontSize: 13 },
  progress: { alignSelf: 'stretch', height: 6, borderRadius: 3, backgroundColor: colors.cardAlt, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  presets: { flexDirection: 'row', gap: 6, alignSelf: 'stretch' },
  pickTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 26,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingVertical: 6 },
  pickOption: {
    width: 96,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 2.5,
    borderColor: colors.border,
  },
  pickOptionOn: { backgroundColor: colors.primary, borderColor: outlineColor },
  pickTime: { color: colors.text, fontFamily: fonts.mono, fontSize: 22 },
  pickOther: { color: colors.text, fontFamily: fonts.bold, fontSize: 12, marginTop: 4 },
  customBox: { alignSelf: 'stretch', alignItems: 'center', gap: 14, paddingVertical: 6 },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  customStep: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 2.5,
    borderColor: outlineColor,
  },
  customTime: { color: colors.primary, fontFamily: fonts.mono, fontSize: 44, minWidth: 130, textAlign: 'center' },
  pickLast: { color: colors.primaryText, fontFamily: fonts.bold, fontSize: 11, marginTop: 2 },
  modes: { flexDirection: 'row', gap: 8, alignSelf: 'stretch' },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipOn: { borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 13 },
  skip: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 14, paddingVertical: 4 },
  endOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(14,15,18,0.85)',
  },
  endTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 30, textTransform: 'uppercase' },
  endText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  onlyClock: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40 },
  backButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: colors.primary,
    ...outline,
  },
  backButtonText: { color: colors.primaryText, fontFamily: fonts.bold, fontSize: 16 },
});
