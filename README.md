# Loopin CRM

Sistema de gestão financeira para a empresa Loopin.

## Stack

- **Frontend**: Nuxt 3 + Nuxt UI
- **Banco**: SQLite (local) - pode ser migrado para PostgreSQL
- **Hospedagem**: Vercel

## Setup

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview produção
npm run preview
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

1. Conectar repositório no Vercel
2. Deploy automático

## Estrutura

```
loopin-crm/
├── pages/           # Páginas (dashboard, clients, establishments, invoices, financial)
├── components/      # Componentes Vue
├── layouts/         # Layouts
├── server/
│   ├── api/         # API routes
│   ├── db/          # Configuração do banco
│   └── utils/       # Utilitários (auth)
├── composables/     # Composables Vue
└── middleware/      # Middlewares (auth)
```
