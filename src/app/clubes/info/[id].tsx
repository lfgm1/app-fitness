import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/social/Avatar';
import { FriendChecklist } from '@/components/social/FriendChecklist';
import { GroupIcon } from '@/components/social/GroupIcon';
import { GroupIconPicker } from '@/components/social/GroupIconPicker';
import { Button, Card, SectionTitle } from '@/components/ui';
import { useAuth } from '@/data/auth';
import {
  acceptFriend,
  addClubMembers,
  deleteClub,
  getProfiles,
  inviteLink,
  listClubMembers,
  listFriendships,
  listMyClubs,
  removeClubMember,
  removeFriendship,
  requestFriend,
  setClubAdmin,
  setClubIcon,
  shareText,
  transferClubOwner,
} from '@/data/social';
import type { Club, ClubMember, Friendship, SocialProfile } from '@/data/social';
import { confirmAction, notify } from '@/lib/format';
import { colors, fonts, hardShadow, outline, radius } from '@/theme';

type MenuOption = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  danger?: boolean;
  onPress: () => void;
};

/** Membros do grupo, convite, administradores e sair/excluir. */
export default function ClubInfoScreen() {
  const { id, novo } = useLocalSearchParams<{ id: string; novo?: string }>();
  const { session } = useAuth();
  const userId = session!.user.id;
  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [people, setPeople] = useState<Record<string, SocialProfile>>({});
  // Amizades (e pedidos) com os membros, para as opções de amizade no menu.
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  // "Adicionar amigos": aberto ou não, e quem foi marcado.
  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  // Membro com o menu dos 3 pontinhos aberto.
  const [menuFor, setMenuFor] = useState<ClubMember | null>(null);
  const [pickingIcon, setPickingIcon] = useState(false);

  const load = useCallback(async () => {
    try {
      const [clubs, list, friends] = await Promise.all([listMyClubs(), listClubMembers(id), listFriendships(userId)]);
      setClub(clubs.find((c) => c.id === id) ?? null);
      setMembers(list);
      setFriendships(friends);
      setPeople(await getProfiles(list.map((m) => m.userId)));
    } catch (e) {
      notify('Não deu para carregar', (e as Error).message);
    }
  }, [id, userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!club) return <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />;
  const isOwner = club.ownerId === userId;
  const myRole = isOwner ? 'owner' : members.find((m) => m.userId === userId)?.role;
  // Ordem: dono, administradores, depois os outros.
  const ORDER = { owner: 0, admin: 1, member: 2 };
  const sorted = [...members].sort((a, b) => ORDER[a.role] - ORDER[b.role]);

  function changeAdmin(member: ClubMember) {
    const name = nameOf(member);
    const giving = member.role === 'member';
    confirmAction(
      giving ? `Tornar ${name} administrador?` : `Tirar o administrador de ${name}?`,
      giving
        ? 'Administradores podem adicionar amigos, remover membros e tornar outras pessoas administradoras.'
        : `${name} volta a ser um membro comum.`,
      giving ? 'Tornar admin' : 'Tirar admin',
      () =>
        setClubAdmin(id, member.userId, giving)
          .then(load)
          .catch((e) => notify('Não deu certo', (e as Error).message))
    );
  }

  function changeIcon(icon: string) {
    setClubIcon(id, icon)
      .then(load)
      .catch((e) => notify('Não deu para trocar o ícone', (e as Error).message));
  }

  function nameOf(member: ClubMember) {
    return people[member.userId]?.displayName ?? 'A pessoa';
  }

  function makeOwner(member: ClubMember) {
    const name = nameOf(member);
    confirmAction(
      `Tornar ${name} dono do grupo?`,
      `${name} passa a ser o dono e você vira administrador. Só o novo dono pode desfazer isso.`,
      'Tornar dono',
      () =>
        transferClubOwner(id, member.userId)
          .then(load)
          .catch((e) => notify('Não deu certo', (e as Error).message))
    );
  }

  function remove(member: ClubMember) {
    const name = nameOf(member);
    confirmAction('Remover do grupo?', `${name} sai do grupo.`, 'Remover', () =>
      removeClubMember(id, member.userId)
        .then(load)
        .catch((e) => notify('Não deu certo', (e as Error).message))
    );
  }

  /** O que eu posso fazer com esse membro (o que aparece nos 3 pontinhos). */
  function friendshipWith(member: ClubMember) {
    return friendships.find((fr) => fr.otherId === member.userId);
  }

  async function friendAction(action: () => Promise<void>, title: string, message: string) {
    try {
      await action();
      notify(title, message);
      await load();
    } catch (e) {
      notify('Não deu certo', (e as Error).message);
    }
  }

  function optionsFor(member: ClubMember): MenuOption[] {
    const options: MenuOption[] = [];
    if (member.userId === userId) return options;
    const name = nameOf(member);
    // Amizade: quem está no grupo e ainda não é amigo pode receber um pedido.
    const friendship = friendshipWith(member);
    if (!friendship) {
      options.push({
        label: 'Adicionar amigo',
        icon: 'person-add-outline',
        onPress: () =>
          friendAction(
            () => requestFriend(userId, member.userId),
            'Pedido enviado!',
            `Quando ${name} aceitar, vocês viram amigos.`
          ),
      });
    } else if (friendship.status === 'pending' && friendship.sentByMe) {
      options.push({
        label: 'Cancelar pedido de amizade',
        icon: 'close-circle-outline',
        onPress: () => friendAction(() => removeFriendship(friendship.id), 'Pedido cancelado', ''),
      });
    } else if (friendship.status === 'pending') {
      options.push({
        label: 'Aceitar pedido de amizade',
        icon: 'checkmark-circle-outline',
        onPress: () =>
          friendAction(
            () => acceptFriend(friendship.id),
            'Agora vocês são amigos!',
            'Vocês já podem conversar no privado.'
          ),
      });
    }
    if (member.role === 'owner') return options;
    if (member.role === 'member' && (myRole === 'owner' || myRole === 'admin')) {
      options.push({ label: 'Tornar admin', icon: 'shield-checkmark-outline', onPress: () => changeAdmin(member) });
    }
    if (member.role === 'admin' && myRole === 'owner') {
      options.push({ label: 'Tirar admin', icon: 'shield-outline', onPress: () => changeAdmin(member) });
    }
    if (myRole === 'owner') {
      options.push({ label: 'Tornar dono do grupo', icon: 'key-outline', onPress: () => makeOwner(member) });
    }
    if (myRole === 'owner' || (myRole === 'admin' && member.role === 'member')) {
      options.push({
        label: 'Remover do grupo',
        icon: 'person-remove-outline',
        danger: true,
        onPress: () => remove(member),
      });
    }
    return options;
  }

  async function invite() {
    const how = await shareText(
      `Entra no meu grupo "${club!.name}" no Gains Club: ${inviteLink(club!.inviteCode)} (código ${club!.inviteCode})`
    ).catch(() => null);
    if (how === 'copiado') notify('Convite copiado', 'Cole na conversa com quem você quer chamar.');
  }

  async function addPicked() {
    setSaving(true);
    try {
      const count = await addClubMembers(id, picked);
      notify(count === 1 ? '1 pessoa entrou no grupo' : `${count} pessoas entraram no grupo`, '');
      setAdding(false);
      setPicked([]);
      await load();
    } catch (e) {
      notify('Não deu para adicionar', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function leave() {
    if (isOwner) {
      confirmAction('Excluir o grupo?', 'O grupo e todas as mensagens somem para todos os membros.', 'Excluir', () =>
        deleteClub(id)
          .then(() => router.dismissTo('/clube'))
          .catch((e) => notify('Não deu certo', (e as Error).message))
      );
    } else {
      confirmAction(
        'Sair do grupo?',
        'Você deixa de ver as mensagens. Pode voltar com o código de convite.',
        'Sair',
        () =>
          removeClubMember(id, userId)
            .then(() => router.dismissTo('/clube'))
            .catch((e) => notify('Não deu certo', (e as Error).message))
      );
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: club.name }} />

      {/* Ícone e nome do grupo. O dono toca no ícone para trocar. */}
      <View style={styles.top}>
        <Pressable
          disabled={!isOwner}
          onPress={() => setPickingIcon(true)}
          accessibilityLabel="Trocar o ícone do grupo">
          <GroupIcon icon={club.icon} emoji={club.emoji} size={96} />
          {isOwner && (
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={14} color={colors.primaryText} />
            </View>
          )}
        </Pressable>
        <Text style={styles.groupName}>{club.name}</Text>
      </View>
      <GroupIconPicker
        visible={pickingIcon}
        value={club.icon}
        onChange={changeIcon}
        onClose={() => setPickingIcon(false)}
      />

      {novo === '1' && <Text style={styles.intro}>Grupo criado! Agora chame a galera mandando o convite.</Text>}

      <Card style={styles.inviteCard}>
        <Text style={styles.muted}>Código do grupo</Text>
        <Text style={styles.code}>{club.inviteCode}</Text>
        <Button title="Convidar pessoas" icon="share-social-outline" onPress={invite} />
      </Card>

      {novo === '1' && (
        <Button
          title="Ir para o chat do grupo"
          variant="secondary"
          onPress={() => router.replace({ pathname: '/clubes/[id]', params: { id } })}
        />
      )}

      {adding ? (
        <>
          <SectionTitle>Adicionar amigos</SectionTitle>
          <FriendChecklist
            userId={userId}
            exclude={members.map((m) => m.userId)}
            selected={picked}
            onChange={setPicked}
          />
          <View style={styles.addActions}>
            <Button
              title="Cancelar"
              variant="ghost"
              style={{ flex: 1 }}
              onPress={() => {
                setAdding(false);
                setPicked([]);
              }}
            />
            <Button
              title={saving ? 'Adicionando...' : `Adicionar${picked.length ? ` (${picked.length})` : ''}`}
              icon="person-add-outline"
              style={{ flex: 1 }}
              onPress={addPicked}
              disabled={saving || picked.length === 0}
            />
          </View>
        </>
      ) : (
        <Button
          title="Adicionar amigos"
          icon="person-add-outline"
          variant="secondary"
          onPress={() => setAdding(true)}
        />
      )}

      <SectionTitle>Membros ({members.length})</SectionTitle>
      {sorted.map((member) => {
        const person = people[member.userId];
        const isMe = member.userId === userId;
        return (
          <Pressable
            key={member.userId}
            disabled={isMe}
            onPress={() => router.push({ pathname: '/usuario/[id]', params: { id: member.userId } })}>
            <Card style={styles.row}>
              <Avatar name={person?.displayName} icon={person?.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {person?.displayName ?? 'Membro'}
                  {isMe ? ' (você)' : ''}
                </Text>
                <Text style={styles.muted}>
                  {[
                    member.role === 'owner'
                      ? 'Dono do grupo'
                      : member.role === 'admin'
                        ? `Administrador · @${person?.username ?? ''}`
                        : `@${person?.username ?? ''}`,
                    friendshipWith(member)?.status === 'pending'
                      ? friendshipWith(member)!.sentByMe
                        ? 'Pedido enviado'
                        : 'Te mandou um pedido'
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
              {!isMe && optionsFor(member).length > 0 && (
                <Pressable
                  hitSlop={10}
                  onPress={() => setMenuFor(member)}
                  accessibilityLabel={`Opções para ${person?.displayName ?? 'membro'}`}>
                  <Ionicons name="ellipsis-vertical" size={22} color={colors.textMuted} />
                </Pressable>
              )}
            </Card>
          </Pressable>
        );
      })}

      <Button title={isOwner ? 'Excluir grupo' : 'Sair do grupo'} variant="danger" onPress={leave} />

      {/* Menu dos 3 pontinhos de um membro */}
      <Modal visible={menuFor !== null} transparent animationType="fade" onRequestClose={() => setMenuFor(null)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuFor(null)}>
          <Pressable style={styles.menu} onPress={() => {}}>
            {menuFor && (
              <>
                <Text style={styles.menuTitle}>{nameOf(menuFor)}</Text>
                {optionsFor(menuFor).map((option) => (
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
              </>
            )}
            <Button title="Cancelar" variant="ghost" onPress={() => setMenuFor(null)} />
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  addActions: { flexDirection: 'row', gap: 10 },
  top: { alignItems: 'center', gap: 8, paddingVertical: 4 },
  groupName: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 30,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  intro: { color: colors.primary, fontFamily: fonts.bold, fontSize: 15 },
  inviteCard: { alignItems: 'center', gap: 8 },
  code: { color: colors.primary, fontFamily: fonts.mono, fontSize: 30, letterSpacing: 5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { color: colors.text, fontFamily: fonts.bold, fontSize: 15 },
  muted: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 },
  menu: {
    gap: 4,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: radius + 4,
    ...outline,
    ...hardShadow(colors.primary),
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  menuTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 24,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  menuText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 16 },
});
