import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

const UPDATED_AT = '20 de outubro de 2026';

const SECTIONS: { title: string; paragraphs: string[] }[] = [
  {
    title: 'Quais dados coletamos',
    paragraphs: [
      'Dados da conta: e-mail e senha (a senha é guardada de forma criptografada pelo nosso provedor de autenticação; nós não temos acesso a ela). Se você entrar com o Google, recebemos seu nome e e-mail da sua conta Google.',
      'Dados do perfil: nome, data de nascimento e, se você informar, sexo, altura, peso, nível de experiência, meta diária de passos e preferências do app (unidade de peso e séries padrão).',
      'Dados de treino: treinos que você monta, exercícios que você cria e os registros de cada treino (data, séries, cargas e repetições).',
    ],
  },
  {
    title: 'Social (amigos e clubes)',
    paragraphs: [
      'Na aba Social, existe um perfil público com seu @, o nome que você escolher, o Frank da sua fase e um resumo dos números (treinos, recordes e treinos da semana). Você escolhe quem pode ver esse perfil (só amigos e quem está nos seus clubes, ou qualquer pessoa do app) e se o número de recordes aparece. Seus treinos detalhados (cargas e séries) nunca aparecem para os outros.',
      'Mensagens e treinos enviados ficam guardados para que você e as outras pessoas da conversa possam vê-los. Mensagens no privado só são possíveis entre amigos. Você pode apagar suas mensagens, bloquear pessoas e denunciar perfis ou mensagens; as denúncias são analisadas por nós e a pessoa denunciada não fica sabendo quem denunciou.',
    ],
  },
  {
    title: 'Para que usamos',
    paragraphs: [
      'Usamos esses dados apenas para o funcionamento do app: guardar seus treinos, mostrar sua evolução, personalizar metas e permitir que você acesse seus dados em qualquer aparelho.',
      'Não usamos seus dados para publicidade, não vendemos e não compartilhamos seus dados com terceiros para fins comerciais.',
    ],
  },
  {
    title: 'Onde os dados ficam',
    paragraphs: [
      'Os dados ficam no seu celular e em um banco de dados na nuvem do Supabase, com servidores em São Paulo (Brasil). Cada conta só tem acesso aos próprios dados.',
      'A comunicação entre o app e o servidor é criptografada (HTTPS).',
    ],
  },
  {
    title: 'Seus direitos (LGPD)',
    paragraphs: [
      'Você pode, a qualquer momento: ver e corrigir seus dados na aba Perfil; apagar treinos e registros; e excluir sua conta em Configurações > Excluir conta, o que apaga permanentemente todos os seus dados dos nossos servidores, incluindo seu perfil público, amizades, clubes que você criou e suas mensagens.',
    ],
  },
  {
    title: 'Idade mínima',
    paragraphs: ['O app é destinado a pessoas com 13 anos ou mais.'],
  },
  {
    title: 'Alterações nesta política',
    paragraphs: [
      'Se esta política mudar, a nova versão será publicada aqui, com a data de atualização.',
    ],
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.text}>
        Esta política explica quais dados o Gains Club coleta, como eles são usados e quais são os seus direitos.
      </Text>
      <Text style={styles.updated}>Última atualização: {UPDATED_AT}</Text>
      {SECTIONS.map((section) => (
        <View key={section.title} style={{ gap: 8 }}>
          <Text style={styles.title}>{section.title}</Text>
          {section.paragraphs.map((p) => (
            <Text key={p} style={styles.text}>
              {p}
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  updated: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: 13 },
  title: { color: colors.text, fontSize: 21, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.4 },
  text: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 23 },
});
