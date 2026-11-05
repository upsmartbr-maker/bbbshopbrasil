# Guia de Configuração e Deploy na Vercel — BBB Shop Brasil

Este documento lista todas as variáveis de ambiente e configurações necessárias para publicar o e-commerce **BBB Shop Brasil** na **Vercel** conectado ao repositório GitHub (`https://github.com/upsmartbr-maker/bbbshopbrasil.git`).

---

## 1. Como Importar o Projeto na Vercel

1. Acesse [https://vercel.com/new](https://vercel.com/new) e autentique-se com sua conta do GitHub.
2. Selecione o repositório **`upsmartbr-maker/bbbshopbrasil`** e clique em **Import**.
3. Confirme as configurações de build detectadas automaticamente:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `./`
   - **Build Command:** `next build` (ou `npm run build`)
   - **Output Directory:** `.next` (padrão Next.js)
   - **Install Command:** `npm install`

---

## 2. Variáveis de Ambiente Obrigatórias (`Project Settings -> Environment Variables`)

No painel da Vercel, acesse **Settings → Environment Variables** e adicione as variáveis abaixo (marque os ambientes **Production**, **Preview** e **Development**):

### 2.1. Banco de Dados, Autenticação e Storage (Supabase)

| Nome da Variável | Obrigatória | Escopo | Onde obter / Exemplo |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Sim** | Público (Cliente + Servidor) | No painel do Supabase: *Project Settings → API → Project URL* (ex.: `https://xyzcompany.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Sim** | Público (Cliente + Servidor) | No painel do Supabase: *Project Settings → API → Project API keys → `anon` `public`* |
| `SUPABASE_SERVICE_ROLE_KEY` | **Sim** | Secreto (Apenas Servidor) | No painel do Supabase: *Project Settings → API → Project API keys → `service_role` `secret`*. Usado pelas rotas de API para gravar pedidos, configurações e uploads no Supabase Storage ignorando RLS. |

---

### 2.2. Gateways de Pagamento (Mercado Pago & PagSeguro / PagBank API v4)

> **Nota:** As credenciais também podem ser gerenciadas diretamente pelo painel administrativo em `/admin/configuracoes` (tabela `settings` no Supabase). As variáveis abaixo funcionam como configuração padrão/fallback seguro do servidor.

| Nome da Variável | Obrigatória | Escopo | Onde obter / Exemplo |
| :--- | :---: | :--- | :--- |
| `ACTIVE_PAYMENT_GATEWAY` | **Sim** | Servidor | Define o gateway padrão inicial: `mercadopago` ou `pagseguro` |
| `MERCADO_PAGO_PUBLIC_KEY` | **Sim** (se usar MP) | Público / Servidor | Painel Mercado Pago Developers → *Suas integrações → Credenciais de Produção → Public Key* (`APP_USR-...`) |
| `MERCADO_PAGO_ACCESS_TOKEN` | **Sim** (se usar MP) | Secreto (Servidor) | Painel Mercado Pago Developers → *Suas integrações → Credenciais de Produção → Access Token* (`APP_USR-...`) |
| `PAGSEGURO_EMAIL` | **Sim** (se usar PagSeguro) | Servidor | E-mail da conta empresarial PagBank / PagSeguro |
| `PAGSEGURO_TOKEN` | **Sim** (se usar PagSeguro) | Secreto (Servidor) | Portal PagBank → *Vendas Online → Integrações → Gerar Token Bearer API v4* |
| `PAGSEGURO_APP_ID` | Opcional | Servidor | ID da Aplicação PagBank (`app...`) |
| `PAGSEGURO_APP_KEY` | Opcional | Secreto (Servidor) | Chave da Aplicação PagBank |
| `PAGSEGURO_ENV` | Opcional | Servidor | `production` (para produção) ou `sandbox` (padrão de testes) |

---

### 2.3. URL Pública e Acesso Administrativo de Contingência

| Nome da Variável | Obrigatória | Escopo | Descrição / Exemplo |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_SITE_URL` | Recomendada | Público | URL canônica de produção para SEO/OpenGraph e URLs de retorno/webhook dos gateways (ex.: `https://bbbshopbrasil.vercel.app` ou `https://www.bbbshopbrasil.com.br`) |
| `ADMIN_EMAIL` | Opcional | Servidor | E-mail administrativo de contingência para `/admin/login` (além dos usuários criados no Supabase Auth) |
| `ADMIN_PASSWORD` | Opcional | Secreto (Servidor) | Senha administrativa de contingência para `/admin/login` |

---

## 3. Bloco Rápido (Copia e Cola para a Vercel)

Você pode colar o bloco abaixo diretamente no campo de variáveis de ambiente da Vercel e preencher os valores correspondentes:

```env
NEXT_PUBLIC_SITE_URL=https://bbbshopbrasil.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ACTIVE_PAYMENT_GATEWAY=mercadopago
MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-0000000000000000-000000-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-000000000
PAGSEGURO_EMAIL=financeiro@bbbshopbrasil.com.br
PAGSEGURO_TOKEN=seu_token_pagbank_v4
PAGSEGURO_APP_ID=seu_app_id
PAGSEGURO_APP_KEY=sua_app_key
PAGSEGURO_ENV=production
```

---

## 4. Migrações SQL e Buckets no Supabase

Antes do primeiro acesso em produção, execute no **SQL Editor** do Supabase os 3 scripts disponíveis em `supabase/migrations/`:

1. `supabase/migrations/01_init.sql` — Cria as tabelas `settings`, `banners`, `products`, `product_images` (com trigger de limite de 8 fotos), `orders` e os buckets públicos `products` e `banners` no Supabase Storage.
2. `supabase/migrations/02_newsletter_testimonials.sql` — Cria as tabelas `newsletter_subscribers` e `testimonials`.
3. `supabase/migrations/03_admin_settings.sql` — Adiciona suporte às chaves de aplicação do PagSeguro e políticas RLS para administradores autenticados.

---

## 5. Configuração de Webhooks nos Gateways

Após o deploy na Vercel, cadastre as seguintes URLs de notificação nos painéis dos provedores de pagamento para atualização automática do status dos pedidos na tabela `orders`:

- **Mercado Pago:** `https://SEU-DOMINIO.vercel.app/api/webhooks/mercadopago`
- **PagSeguro (PagBank):** `https://SEU-DOMINIO.vercel.app/api/webhooks/pagseguro`
