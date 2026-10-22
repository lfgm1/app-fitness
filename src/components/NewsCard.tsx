// Card de novidade no topo da aba Início. As novidades que a pessoa ainda não fechou se alternam
// sozinhas (com bolinhas embaixo), e cada uma fica até ela tocar no X. "Ver como funciona" abre o passo a passo.
// As fechadas ficam guardadas no celular, por conta.

import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { StreakStamp } from '@/components/social/StreakStamp';
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/data/auth';
import { NEWS } from '@/data/news';
import type { NewsArt } from '@/data/news';
import { colors, fonts, hardShadow, outlineColor } from '@/theme';

const keyFor = (userId: string) => `news:dismissed:${userId}`;
// De quanto em quanto tempo troca de novidade.
const ROTATE_MS = 6000;

/** Desenho de cada novidade. */
function NewsArtwork({ art }: { art: NewsArt }) {
  if (art === 'streak') {
    // O selo do streak, o mesmo do perfil.
    return (
      <View style={styles.art}>
        <StreakStamp weeks={10} decorative />
      </View>
    );
  }
  // Frank Flap: o Frank voando entre as barras com anilhas.
  return (
    <View style={styles.art}>
      <Svg width={58} height={58} viewBox="-29 -29 58 58">
        <Rect x={12} y={-29} width={6} height={14} fill={colors.textMuted} />
        <Rect
          x={5}
          y={-17}
          width={20}
          height={8}
          rx={2}
          fill={colors.primary}
          stroke={outlineColor}
          strokeWidth={1.5}
        />
        <Rect x={12} y={14} width={6} height={15} fill={colors.textMuted} />
        <Rect x={5} y={8} width={20} height={8} rx={2} fill={colors.primary} stroke={outlineColor} strokeWidth={1.5} />
        <G transform="translate(-8 0) scale(0.75) rotate(-12)">
          <Circle cx={-6} cy={-15} r={6} fill={colors.crista} />
          <Circle cx={1} cy={-18} r={6.5} fill={colors.crista} />
          <Circle cx={8} cy={-14} r={5.5} fill={colors.crista} />
          <Circle r={15} fill={colors.pena} />
          <Path d="M13 -3 L23 1 L13 5 Z" fill={colors.bico} />
          <Ellipse cx={6} cy={-3} rx={3.2} ry={3.8} fill="#15161A" />
        </G>
      </Svg>
    </View>
  );
}

export function NewsCard() {
  const { session } = useAuth();
  const userId = session?.user.id;
  // Quem criou a conta depois da novidade não a vê (ela já faz parte do app para essa pessoa).
  const joined = session?.user.created_at?.slice(0, 10) ?? '';
  const [dismissed, setDismissed] = useState<string[] | null>(null);
  const [details, setDetails] = useState(false);
  // Qual novidade está aparecendo (elas se alternam sozinhas até a pessoa fechar).
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!userId) return;
    AsyncStorage.getItem(keyFor(userId))
      .then((raw) => setDismissed(raw ? (JSON.parse(raw) as string[]) : []))
      .catch(() => setDismissed([]));
  }, [userId]);

  const visible = NEWS.filter((n) => !(dismissed ?? []).includes(n.id) && n.date >= joined);
  const count = visible.length;

  // Troca a cada alguns segundos; para enquanto a explicação está aberta.
  useEffect(() => {
    if (details || count < 2) return;
    const timer = setInterval(() => setIndex((i) => i + 1), ROTATE_MS);
    return () => clearInterval(timer);
  }, [details, count]);

  if (!userId || dismissed === null || count === 0) return null;
  const position = index % count;
  const item = visible[position];

  function dismiss() {
    const next = [...dismissed!, item!.id];
    setDismissed(next);
    AsyncStorage.setItem(keyFor(userId!), JSON.stringify(next)).catch(() => {});
  }

  return (
    <>
      <Card style={styles.card}>
        <Pressable style={styles.close} onPress={dismiss} hitSlop={10} accessibilityLabel="Fechar novidade">
          <Ionicons name="close" size={20} color={colors.textMuted} />
        </Pressable>
        <View style={styles.tag}>
          <Text style={styles.tagText}>Novidade</Text>
        </View>
        <View style={styles.row}>
          <NewsArtwork art={item.art} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.summary}>{item.summary}</Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Pressable style={styles.more} onPress={() => setDetails(true)} accessibilityRole="button">
            <Text style={styles.moreText}>Ver como funciona</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </Pressable>
          {count > 1 && (
            <View style={styles.dots}>
              {visible.map((n, i) => (
                <Pressable
                  key={n.id}
                  onPress={() => setIndex(i)}
                  hitSlop={6}
                  accessibilityLabel={`Ver novidade ${n.title}`}
                  style={[styles.dot, i === position && styles.dotOn]}
                />
              ))}
            </View>
          )}
        </View>
      </Card>

      <Modal visible={details} transparent animationType="slide" onRequestClose={() => setDetails(false)}>
        <Pressable style={styles.backdrop} onPress={() => setDetails(false)} accessibilityLabel="Fechar" />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={[styles.tag, { marginTop: 4 }]}>
            <Text style={styles.tagText}>Novidade</Text>
          </View>
          <Text style={styles.sheetTitle}>{item.title}</Text>
          <Text style={styles.intro}>{item.intro}</Text>
          <View style={{ gap: 12 }}>
            {item.steps.map((step, i) => (
              <View key={i} style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
          <Button title="Entendi" onPress={() => setDetails(false)} style={{ marginTop: 6 }} />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, borderColor: colors.primary, ...hardShadow(outlineColor) },
  close: { position: 'absolute', top: 10, right: 10, zIndex: 1 },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 1,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: outlineColor,
    transform: [{ rotate: '-2deg' }],
  },
  tagText: {
    color: colors.primaryText,
    fontFamily: fonts.bold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  art: {
    width: 62,
    height: 62,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    borderWidth: 2,
    borderColor: outlineColor,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summary: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  more: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
  dotOn: { width: 18, backgroundColor: colors.primary },
  moreText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 13 },
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
    gap: 10,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.textFaint },
  sheetTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 30,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  intro: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { color: colors.primaryText, fontFamily: fonts.bold, fontSize: 14 },
  stepText: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
});
