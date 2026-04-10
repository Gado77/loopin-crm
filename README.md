# Loopin CRM

Sistema de gestão financeira para a empresa Loopin.

## Stack

- **Frontend**: Nuxt 3 + Nuxt UI
- **Banco**: PostgreSQL (Supabase)
- **Hospedagem**: Vercel

## Setup Local

```bash
# Instalar dependências
npm install

# Criar banco de dados no Supabase e rodar o schema
# (veja supabase-schema.sql)

# Criar arquivo .env.local com as variáveis
cp .env.example .env.local

# Rodar em desenvolvimento
npm run dev
```

## Login Padrão

- **Email**: admin@loopin.com
- **Senha**: admin123

## Funcionalidades

- [x] Dashboard com métricas e gráficos
- [x] CRUD de Clientes (com configuração de inadimplência)
- [x] CRUD de Estabelecimentos (vinculados a clientes)
- [x] CRUD de Faturas (com status: pendente, paga, vencida, cancelada, barter)
- [x] Financeiro (transações manuais + fluxo de caixa)
- [x] Autenticação simples

## Deploy no Vercel

1. Criar projeto no Supabase
2. Rodar o SQL do `supabase-schema.sql` no Supabase (SQL Editor)
3. Conectar repo ao Vercel
4. Configurar variáveis de ambiente no Vercel:
   - `DATABASE_URL` - URL do Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key do Supabase
   - `JWT_SECRET` - Uma chave secreta para JWT

## Estrutura

```
loopin-crm/
├── pages/           # Páginas (dashboard, clients, establishments, invoices, financial)
├── components/      # Componentes Vue
├── layouts/         # Layouts
├── server/
│   ├── api/         # API routes
│   └── utils/       # Utilitários (db, auth)
├── composables/     # Composables Vue
└── middleware/      # Middlewares (auth)
```
