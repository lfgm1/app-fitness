// Conversa (grupo ou privado): mensagens chegando na hora, enviar texto ou um treino montado,
// copiar treino ou bloco recebido, apagar a própria mensagem e denunciar a dos outros.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/social/Avatar';
import { useSharedTraining } from '@/components/social/useSharedTraining';
import { Button, Card } from '@/components/ui';
import {
  DELETE_WINDOW_MS,
  deleteMessage,
  getProfiles,
  getReadStatus,
  hideMessage,
  listHiddenIds,
  listMessages,
  markChatRead,
  report,
  sendMessage,
  subscribeMessages,
} from '@/data/social';
import type { Message, SharedBlock, SharedWorkout, SocialProfile } from '@/data/social';
import { useStore } from '@/data/store';
import type { Workout, WorkoutBlock } from '@/data/store';
import { blockWorkouts } from '@/lib/blocks';
import { confirmAction, notify } from '@/lib/format';
import { colors, fonts, hardShadow, outline, outlineColor, radius } from '@/theme';

type Props = {
  userId: string;
  target: { clubId?: string; peerId?: string };
};

function timeLabel(iso: string) {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

/** "Hoje", "Ontem" ou a data, para o separador entre os dias. */
function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Hoje';
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
  const dm = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  return date.getFullYear() === today.getFullYear() ? dm : `${dm}/${date.getFullYear()}`;
}

type MenuOption = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  danger?: boolean;
  onPress: () => void;
};

type Content = { text: string } | { workout: SharedWorkout } | { block: SharedBlock };

// Azul dos risquinhos de "visualizada" (mais escuro que o do app, para aparecer no balão verde).
const READ_BLUE = '#0B63C5';
const UNREAD_GRAY = 'rgba(14,15,18,0.45)';
// De quanto em quanto tempo confere se os outros já leram.
const READ_POLL_MS = 8000;

/** 1 risquinho: ainda não chegou no servidor. 2: enviada. 3 azuis: visualizada. */
function Ticks({ count, read }: { count: 1 | 2 | 3; read: boolean }) {
  return (
    <View style={styles.ticks} accessibilityLabel={read ? 'Visualizada' : count === 1 ? 'Enviando' : 'Enviada'}>
      {Array.from({ length: count }, (_, i) => (
        <Ionicons
          key={i}
          name="checkmark"
          size={14}
          color={read ? READ_BLUE : UNREAD_GRAY}
          style={i > 0 ? { marginLeft: -8 } : undefined}
        />
      ))}
    </View>
  );
}

let localSeq = 0;

/** Hora atual (fora do componente, para a regra de pureza do React). */
function clock() {
  return Date.now();
}

// Cada pessoa do grupo ganha sempre a mesma cor no nome.
const SENDER_COLORS = [colors.primary, colors.crista, '#4CC9F0', '#A78BFA', colors.bico, '#FF8FB1', '#5DCAA5'];
function senderColor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return SENDER_COLORS[hash % SENDER_COLORS.length];
}

export function ChatView({ userId, target }: Props) {
  const { workouts, blocks } = useStore();
  const { toSharedWorkout, toSharedBlock, copyWorkout, copyBlock } = useSharedTraining();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [profiles, setProfiles] = useState<Record<string, SocialProfile>>({});
  const [text, setText] = useState('');
  // Até quando cada um dos outros leu (vazio se a confirmação de leitura estiver desligada).
  const [readers, setReaders] = useState<{ userId: string; readAt: string | null }[]>([]);
  // Conteúdo das mensagens que estão enviando ou falharam, para poder reenviar.
  const pendingContent = useRef(new Map<string, Content>());
  const [picking, setPicking] = useState(false);
  // Mensagens que eu apaguei só para mim, e a mensagem com o menu aberto.
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [menuFor, setMenuFor] = useState<Message | null>(null);
  const isClub = Boolean(target.clubId);
  const chatId = (target.clubId ?? target.peerId)!;

  /** Junta mensagens novas ou atualizadas (sem repetir), em ordem. */
  const merge = useCallback((incoming: Message[]) => {
    setMessages((current) => {
      const byId = new Map((current ?? []).map((m) => [m.id, m]));
      for (const m of incoming) byId.set(m.id, m);
      return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const t = target.clubId ? { clubId: target.clubId } : { peerId: target.peerId };
    listMessages(userId, t)
      .then(async (list) => {
        const hiddenIds = await listHiddenIds(list.map((m) => m.id)).catch(() => new Set<string>());
        if (cancelled) return;
        setHidden(hiddenIds);
        merge(list);
      })
      .catch((e) => !cancelled && notify('Não deu para carregar', (e as Error).message));
    // Abriu a conversa: tudo o que chegou até agora está lido.
    markChatRead(chatId).catch(() => {});
    const stop = subscribeMessages(userId, t, (m) => {
      merge([m]);
      // Chegou mensagem de outra pessoa com a conversa aberta: já foi vista.
      if (m.senderId !== userId) markChatRead(chatId).catch(() => {});
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, [userId, target.clubId, target.peerId, chatId, merge]);

  // Confere de tempos em tempos até onde os outros leram (para os risquinhos azuis).
  useEffect(() => {
    let cancelled = false;
    const t = target.clubId ? { clubId: target.clubId } : { peerId: target.peerId };
    const check = () =>
      getReadStatus(t)
        .then((list) => !cancelled && setReaders(list))
        .catch(() => {});
    check();
    const timer = setInterval(check, READ_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [target.clubId, target.peerId]);

  /** A mensagem já foi vista por todos os outros da conversa? */
  function wasRead(message: Message) {
    if (readers.length === 0) return false;
    const sent = new Date(message.createdAt).getTime();
    return readers.every((r) => r.readAt !== null && new Date(r.readAt).getTime() >= sent);
  }

  // Nomes e Frank de quem mandou cada mensagem.
  const senderIds = [...new Set((messages ?? []).map((m) => m.senderId))].sort().join(',');
  useEffect(() => {
    const ids = senderIds ? senderIds.split(',').filter((id) => !profiles[id]) : [];
    if (ids.length === 0) return;
    getProfiles(ids)
      .then((found) => setProfiles((p) => ({ ...p, ...found })))
      .catch(() => {});
  }, [senderIds, profiles]);

  /** Mostra a mensagem na hora (1 risquinho) e troca pela do servidor quando ela chega lá. */
  async function send(content: Content, retryId?: string) {
    const tempId = retryId ?? `local-${++localSeq}`;
    const temp: Message = {
      id: tempId,
      clubId: target.clubId ?? null,
      senderId: userId,
      recipientId: target.peerId ?? null,
      kind: 'text' in content ? 'text' : 'workout' in content ? 'workout' : 'block',
      body: 'text' in content ? content.text.trim() : 'workout' in content ? content.workout.name : content.block.name,
      workout: 'workout' in content ? content.workout : null,
      block: 'block' in content ? content.block : null,
      deleted: false,
      createdAt: new Date().toISOString(),
      pending: 'sending',
    };
    pendingContent.current.set(tempId, content);
    merge([temp]);
    if ('text' in content && !retryId) setText('');
    try {
      const t = target.clubId ? { clubId: target.clubId } : { peerId: target.peerId };
      const saved = await sendMessage(userId, t, content);
      pendingContent.current.delete(tempId);
      setMessages((current) => (current ?? []).filter((m) => m.id !== tempId));
      merge([saved]);
    } catch {
      // Fica com 1 risquinho; segurando a mensagem dá para reenviar.
      merge([{ ...temp, pending: 'failed' }]);
    }
  }

  function shareWorkout(workout: Workout) {
    setPicking(false);
    send({ workout: toSharedWorkout(workout) });
  }

  function shareBlock(block: WorkoutBlock) {
    setPicking(false);
    send({ block: toSharedBlock(block) });
  }

  function onLongPress(message: Message) {
    if (message.kind === 'system') return;
    if (message.pending === 'failed') {
      const content = pendingContent.current.get(message.id);
      confirmAction('Mensagem não enviada', 'Verifique sua internet e tente de novo.', 'Reenviar', () => {
        if (content) send(content, message.id);
      });
      return;
    }
    if (message.pending) return;
    setMenuFor(message);
  }

  /** O que aparece no menu ao segurar a mensagem. */
  function menuOptions(message: Message): MenuOption[] {
    const options: MenuOption[] = [];
    const mine = message.senderId === userId;
    // Apagar para todos: só a própria mensagem, nos primeiros 5 minutos.
    if (mine && !message.deleted && clock() - new Date(message.createdAt).getTime() <= DELETE_WINDOW_MS) {
      options.push({
        label: 'Apagar para todos',
        icon: 'trash-outline',
        danger: true,
        onPress: () =>
          confirmAction('Apagar para todos?', 'A mensagem some para todos na conversa.', 'Apagar', () =>
            deleteMessage(message.id)
              .then(() => merge([{ ...message, deleted: true }]))
              .catch((e) => notify('Não deu para apagar', (e as Error).message))
          ),
      });
    }
    options.push({
      label: 'Apagar para você',
      icon: 'eye-off-outline',
      danger: true,
      onPress: () => {
        setHidden((current) => new Set(current).add(message.id));
        hideMessage(message.id).catch((e) => {
          setHidden((current) => {
            const next = new Set(current);
            next.delete(message.id);
            return next;
          });
          notify('Não deu para apagar', (e as Error).message);
        });
      },
    });
    if (!mine && !message.deleted) {
      options.push({
        label: 'Denunciar',
        icon: 'flag-outline',
        onPress: () =>
          confirmAction(
            'Denunciar mensagem?',
            'Se ela for ofensiva, abusiva ou spam, avise a gente. A pessoa não fica sabendo.',
            'Denunciar',
            () =>
              report(message.senderId, 'Mensagem denunciada pelo app', message.id)
                .then(() => notify('Denúncia enviada', 'Obrigado por avisar. Vamos analisar.'))
                .catch((e) => notify('Não deu para denunciar', (e as Error).message))
          ),
      });
    }
    return options;
  }

  const reversed = (messages ?? []).filter((m) => !hidden.has(m.id)).reverse();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}>
      {messages === null ? (
        <ActivityIndicator color={colors.primary} style={styles.flex} />
      ) : (
        <FlatList
          style={styles.flex}
          contentContainerStyle={styles.list}
          data={reversed}
          inverted
          keyExtractor={(m) => m.id}
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma mensagem ainda. Diga oi! 👋</Text>}
          renderItem={({ item, index }) => {
            const mine = item.senderId === userId;
            const sender = profiles[item.senderId];
            // A lista é invertida: index + 1 é a mensagem de cima (mais antiga), index - 1 a de baixo.
            const older = reversed[index + 1];
            const newer = reversed[index - 1];
            const newDay = !older || !sameDay(older.createdAt, item.createdAt);
            const dayPill = newDay && (
              <View style={styles.dayPill}>
                <Text style={styles.dayText}>{dayLabel(item.createdAt)}</Text>
              </View>
            );
            // Aviso do grupo ("Fulano adicionou Ciclano"): uma faixa no meio, sem balão.
            if (item.kind === 'system') {
              return (
                <View style={{ marginTop: 10 }}>
                  {dayPill}
                  <View style={styles.systemPill}>
                    <Text style={styles.systemText}>{item.body}</Text>
                  </View>
                </View>
              );
            }
            // Sequência de mensagens seguidas da mesma pessoa no mesmo dia (um aviso quebra a sequência).
            const firstOfRun = newDay || older.senderId !== item.senderId || older.kind === 'system';
            const lastOfRun =
              !newer ||
              newer.senderId !== item.senderId ||
              newer.kind === 'system' ||
              !sameDay(newer.createdAt, item.createdAt);
            const showName = isClub && !mine && firstOfRun;
            const isText = item.deleted || item.kind === 'text';
            return (
              <View style={{ marginTop: firstOfRun ? 10 : 3 }}>
                {dayPill}
                <View style={[styles.row, mine && styles.rowMine]}>
                  {isClub && !mine && (
                    <Pressable
                      style={styles.avatarSlot}
                      disabled={!lastOfRun}
                      onPress={() => router.push({ pathname: '/usuario/[id]', params: { id: item.senderId } })}>
                      {lastOfRun && <Avatar name={sender?.displayName} icon={sender?.avatar} size={34} />}
                    </Pressable>
                  )}
                  <Pressable
                    onLongPress={() => onLongPress(item)}
                    delayLongPress={350}
                    style={[
                      styles.bubble,
                      mine ? styles.bubbleMine : styles.bubbleOther,
                      lastOfRun && (mine ? styles.tailMine : styles.tailOther),
                      !isText && styles.bubbleWide,
                    ]}>
                    {showName && (
                      <Text style={[styles.sender, { color: senderColor(item.senderId) }]} numberOfLines={1}>
                        {sender?.displayName ?? '...'}
                      </Text>
                    )}
                    {item.deleted ? null : item.kind === 'workout' && item.workout ? (
                      <View style={{ gap: 6 }}>
                        <Text style={[styles.workoutLabel, mine && { color: colors.primaryText }]}>
                          Treino compartilhado
                        </Text>
                        <Text style={[styles.workoutName, mine && { color: colors.primaryText }]}>
                          {item.workout.name}
                        </Text>
                        <Text style={[styles.body, mine && styles.bodyMine]} numberOfLines={4}>
                          {item.workout.exercises.map((e) => e.name).join(' · ')}
                        </Text>
                        {!mine && (
                          <Button
                            title="Copiar para meus treinos"
                            icon="copy-outline"
                            small
                            onPress={() => {
                              copyWorkout(item.workout!);
                              notify('Treino copiado!', `"${item.workout!.name}" está agora em Meus treinos.`);
                            }}
                          />
                        )}
                      </View>
                    ) : item.kind === 'block' && item.block ? (
                      <View style={{ gap: 6 }}>
                        <Text style={[styles.workoutLabel, mine && { color: colors.primaryText }]}>
                          Bloco de treino compartilhado
                        </Text>
                        <Text style={[styles.workoutName, mine && { color: colors.primaryText }]}>
                          {item.block.emoji} {item.block.name}
                        </Text>
                        <Text style={[styles.body, mine && styles.bodyMine]} numberOfLines={6}>
                          {item.block.workouts.map((w, i) => `${i + 1}. ${w.name}`).join('\n')}
                        </Text>
                        {!mine && (
                          <Button
                            title="Copiar bloco"
                            icon="copy-outline"
                            small
                            onPress={() => {
                              copyBlock(item.block!);
                              notify(
                                'Bloco copiado!',
                                `"${item.block!.name}" e os treinos dele estão em Meus treinos.`
                              );
                            }}
                          />
                        )}
                      </View>
                    ) : null}
                    {/* Texto e horário na mesma linha; se não couber, o horário desce para o canto. */}
                    <View style={styles.textRow}>
                      {isText && (
                        <Text style={[styles.body, mine && styles.bodyMine, item.deleted && styles.deleted]}>
                          {item.deleted ? 'Mensagem apagada' : item.body}
                        </Text>
                      )}
                      <View style={styles.meta}>
                        <Text style={[styles.time, mine && styles.timeMine]}>{timeLabel(item.createdAt)}</Text>
                        {mine && !item.deleted && (
                          <Ticks
                            count={item.pending ? 1 : wasRead(item) ? 3 : 2}
                            read={!item.pending && wasRead(item)}
                          />
                        )}
                      </View>
                    </View>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}

      <SafeAreaView edges={['bottom']} style={styles.composer}>
        <Pressable
          style={styles.attach}
          onPress={() => setPicking(true)}
          accessibilityLabel="Enviar um treino ou bloco"
          hitSlop={6}>
          <Ionicons name="add" size={28} color={colors.text} />
        </Pressable>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Mensagem"
          placeholderTextColor={colors.textFaint}
          multiline
          maxLength={2000}
        />
        <Pressable
          style={[styles.send, !text.trim() && { opacity: 0.4 }]}
          onPress={() => send({ text })}
          disabled={!text.trim()}
          accessibilityLabel="Enviar">
          <Ionicons name="send" size={18} color={colors.primaryText} />
        </Pressable>
      </SafeAreaView>

      {/* Menu ao segurar uma mensagem */}
      <Modal visible={menuFor !== null} transparent animationType="fade" onRequestClose={() => setMenuFor(null)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuFor(null)}>
          <Pressable style={styles.picker} onPress={() => {}}>
            {menuFor &&
              menuOptions(menuFor).map((option) => (
                <Pressable
                  key={option.label}
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuFor(null);
                    option.onPress();
                  }}>
                  <Ionicons name={option.icon} size={20} color={option.danger ? colors.danger : colors.text} />
                  <Text style={[styles.menuText, option.danger && { color: colors.danger }]}>{option.label}</Text>
                </Pressable>
              ))}
            <Button title="Cancelar" variant="ghost" onPress={() => setMenuFor(null)} />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={picking} transparent animationType="fade" onRequestClose={() => setPicking(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPicking(false)}>
          <Pressable style={styles.picker} onPress={() => {}}>
            <Text style={styles.pickerTitle}>Enviar um treino</Text>
            {workouts.length === 0 && <Text style={styles.empty}>Você ainda não tem treinos montados.</Text>}
            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 8 }}>
              {blocks.map((b) => {
                const count = blockWorkouts(b, workouts).length;
                if (count === 0) return null;
                return (
                  <Pressable key={b.id} onPress={() => shareBlock(b)}>
                    <Card style={styles.pickerRow}>
                      <Text style={styles.pickerEmoji}>{b.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pickerName}>{b.name}</Text>
                        <Text style={styles.pickerMeta}>
                          Bloco · {count} treino{count === 1 ? '' : 's'}
                        </Text>
                      </View>
                      <Ionicons name="send" size={18} color={colors.primary} />
                    </Card>
                  </Pressable>
                );
              })}
              {workouts.map((w) => (
                <Pressable key={w.id} onPress={() => shareWorkout(w)}>
                  <Card style={styles.pickerRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickerName}>{w.name}</Text>
                      <Text style={styles.pickerMeta}>
                        {w.exerciseIds.length} exercício{w.exerciseIds.length === 1 ? '' : 's'}
                      </Text>
                    </View>
                    <Ionicons name="send" size={18} color={colors.primary} />
                  </Card>
                </Pressable>
              ))}
            </ScrollView>
            <Button title="Cancelar" variant="ghost" onPress={() => setPicking(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingHorizontal: 10, paddingVertical: 12 },
  empty: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, textAlign: 'center', padding: 24 },
  dayPill: {
    alignSelf: 'center',
    marginVertical: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: outlineColor,
  },
  dayText: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  systemPill: {
    alignSelf: 'center',
    maxWidth: '85%',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: colors.cardAlt,
  },
  systemText: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 13, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  rowMine: { justifyContent: 'flex-end' },
  avatarSlot: { width: 34 },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 7,
    paddingBottom: 6,
    gap: 3,
    borderWidth: 2,
  },
  bubbleWide: { minWidth: '70%' },
  bubbleMine: { backgroundColor: colors.primary, borderColor: outlineColor },
  bubbleOther: { backgroundColor: colors.card, borderColor: colors.border },
  // A "pontinha" do balão fica na última mensagem da sequência, do lado de quem mandou.
  tailMine: { borderBottomRightRadius: 4 },
  tailOther: { borderBottomLeftRadius: 4 },
  sender: { fontFamily: fonts.bold, fontSize: 14 },
  textRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    columnGap: 10,
  },
  body: { flexShrink: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 16, lineHeight: 22 },
  bodyMine: { color: colors.primaryText },
  deleted: { fontStyle: 'italic', color: colors.textFaint },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto', paddingTop: 2 },
  ticks: { flexDirection: 'row' },
  time: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 11 },
  timeMine: { color: 'rgba(14,15,18,0.6)' },
  workoutLabel: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 12 },
  workoutName: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 10,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  attach: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderRadius: 22,
    ...outline,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: outlineColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 },
  picker: {
    gap: 10,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: radius + 4,
    ...outline,
    ...hardShadow(colors.primary),
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  pickerTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 24,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  menuText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 16 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  pickerEmoji: { fontSize: 24 },
  pickerName: { color: colors.text, fontFamily: fonts.bold, fontSize: 15 },
  pickerMeta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13 },
});
