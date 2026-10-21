import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, StyleSheet, View } from 'react-native';

import { EXERCISE_IMAGES } from '@/data/exerciseImages';
import { colors } from '@/theme';

type Props = { exerciseId: string; size?: number };

/** Foto do exercício; exercícios sem foto (ex: personalizados) mostram um ícone. */
export function ExerciseImage({ exerciseId, size = 48 }: Props) {
  const source = EXERCISE_IMAGES[exerciseId];
  const box = { width: size, height: size, borderRadius: Math.round(size / 5) };
  if (!source) {
    return (
      <View style={[styles.placeholder, box]}>
        <Ionicons name="barbell-outline" size={size * 0.5} color={colors.textFaint} />
      </View>
    );
  }
  return <Image source={source} style={[styles.image, box]} resizeMode="cover" accessibilityIgnoresInvertColors />;
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.cardAlt },
  placeholder: { backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
});
