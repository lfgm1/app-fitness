import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card } from '@/components/ui';
import { useAuth } from '@/data/auth';
import { clearLocalData, useStore } from '@/data/store';
import type { SyncStatus } from '@/data/store';
import { confirmAction, formatDateLong } from '@/lib/format';
import type { IconName } from '@/components/ui';
import { colors, statusColors } from '@/theme';

const STATUS: Record<SyncStatus, { icon: IconName; color: string; label: string }> = {
  carregando: { icon: 'cloud-outline', color: colors.textMuted, label: 'Conectando...' },
  sincronizando: { icon: 'sync-outline', color: colors.textMuted, label: 'Sincronizando...' },
  sincronizado: { icon: 'cloud-done-outline', color: statusColors.carga, label: 'Tudo salvo na nuvem' },
  offline: { icon: 'cloud-offline-outline', color: statusColors.manteve, label: 'Sem internet' },
  erro: { icon: 'alert-circle-outline', color: colors.danger, label: 'Erro ao sincronizar' },
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function AccountScreen() {
  const { session, signOut } = useAuth();
  const { sync, syncNow, pendingNow, sessions, workouts } = useStore();
  const [leaving, setLeaving] = useState(false);

  const status =
    sync.pending > 0 && sync.status === 'sincronizado'
      ? { ...STATUS.sincronizando, label: 'Enviando alterações...' }
      : STATUS[sync.status];
  const last = sync.lastSyncedAt ? new Date(sync.lastSyncedAt) : null;

  async function leave() {
    setLeaving(true);
    await syncNow(); // tenta enviar tudo antes de sair
    const pending = pendingNow();
    setLeaving(false);
    const doSignOut = async () => {
      await clearLocalData();
      await signOut();
    };
    if (pending > 0) {
      confirmAction(
        'Há dados não enviados',
        `${pending} alteração(ões) ainda não chegaram à nuvem (sem internet?). Se sair agora, elas serão perdidas. Conecte-se à internet e tente de novo, ou saia mesmo assim.`,
        'Sair mesmo assim',
        doSignOut
      );
    } else {
      confirmAction('Sair da conta?', 'Seus dados continuam salvos na nuvem.', 'Sair', doSignOut);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card style={styles.row}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={22} color={colors.primaryText} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Conectado como</Text>
          <Text style={styles.email} numberOfLines={1}>
            {session?.user.email}
          </Text>
        </View>
      </Card>

      <Card style={{ gap: 10 }}>
        <View style={styles.row}>
          <Ionicons name={status.icon} size={24} color={status.color} />
          <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
        </View>
        <Text style={styles.detail}>
          {sync.pending > 0
            ? `${sync.pending} alteração(ões) aguardando envio. Elas estão salvas no celular e serão enviadas assim que houver internet.`
            : `${workouts.length} treinos e ${sessions.length} registros guardados com segurança.`}
        </Text>
        {last && (
          <Text style={styles.detail}>
            Última sincronização: {formatDateLong(last.toISOString())} às {pad(last.getHours())}:
            {pad(last.getMinutes())}
          </Text>
        )}
        {sync.status === 'erro' && sync.error && <Text style={styles.errorText}>{sync.error}</Text>}
        <Button
          title="Sincronizar agora"
          icon="sync-outline"
          variant="secondary"
          small
          onPress={() => void syncNow()}
          disabled={sync.status === 'sincronizando'}
        />
      </Card>

      <Button
        title={leaving ? 'Salvando...' : 'Sair da conta'}
        icon="log-out-outline"
        variant="danger"
        onPress={leave}
        disabled={leaving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: colors.textMuted, fontSize: 13 },
  email: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 2 },
  status: { fontSize: 16, fontWeight: '700' },
  detail: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  errorText: { color: colors.danger, fontSize: 13 },
});
