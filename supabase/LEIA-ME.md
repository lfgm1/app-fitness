# Configurar o banco de dados (Supabase)

## 1. Criar o projeto
1. Crie uma conta em https://supabase.com e clique em **New project**.
2. Escolha um nome, uma senha forte para o banco (guarde-a) e a região **South America (São Paulo)**.

## 2. Criar as tabelas
1. No painel do projeto, abra **SQL Editor** → **New query**.
2. Cole todo o conteúdo de `supabase/schema.sql` e clique em **Run**.
3. Em **Table Editor** devem aparecer as tabelas `custom_exercises`, `workouts` e `sessions`.

## 3. Ligar o app ao banco
1. No painel, clique em **Connect** (ou **Project Settings → API Keys**).
2. Copie a **Project URL** e a chave **publishable** (ou **anon**). Nunca use a chave *secret* / *service_role*.
3. Preencha o arquivo `.env` na raiz do projeto:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_xxxx
   ```
4. Pare o app (Ctrl+C no terminal) e inicie de novo com `npx expo start`.

## 4. E-mails com código (confirmação e recuperação de senha)
O app pede um **código** em vez de um link. Em **Authentication → Emails → Templates**:

**Confirm signup** — troque o corpo por:
```html
<h2>Confirme seu e-mail</h2>
<p>Seu código de confirmação é:</p>
<h1>{{ .Token }}</h1>
```

**Reset Password** — troque o corpo por:
```html
<h2>Recuperar senha</h2>
<p>Seu código para criar uma nova senha é:</p>
<h1>{{ .Token }}</h1>
```

> O servidor de e-mail padrão do Supabase só envia poucos e-mails por hora (serve para testes).
> Antes de lançar o app, configure um SMTP próprio em **Authentication → Emails → SMTP Settings**
> (por exemplo Resend, Brevo ou Amazon SES).

## 5. Login com Google
1. Em https://console.cloud.google.com crie um projeto → **APIs e serviços → Tela de consentimento OAuth** (tipo Externo).
2. **Credenciais → Criar credenciais → ID do cliente OAuth → Aplicativo da Web**.
3. Em **URIs de redirecionamento autorizados**, adicione:
   `https://SEU-PROJETO.supabase.co/auth/v1/callback`
4. Copie o **Client ID** e o **Client Secret** para o Supabase em **Authentication → Sign In / Providers → Google** e ative.
5. Em **Authentication → URL Configuration → Redirect URLs**, adicione:
   - `http://localhost:8081` (testes no navegador)
   - `exp://**` (testes no Expo Go)
   - `gainsclub://**` (app instalado)

## Sobre estabilidade e backups
- Os dados ficam num banco PostgreSQL gerenciado pelo Supabase.
- Cada pessoa só acessa os próprios dados (Row Level Security, definido no `schema.sql`).
- Exclusões não apagam de verdade: a linha recebe `deleted = true`, então é possível recuperar.
- **Plano gratuito:** o projeto é pausado após ~1 semana sem uso e não tem backup automático diário.
  Para o app em produção, use o **plano Pro**, que tem backups diários e não pausa.
