# Integração Loopin.tv ↔ Loopin CRM

## Sincronização Bidirecional

Este CRM agora está integrado com o [[../Loopin.tv/00 - Visão Geral|Loopin.tv]] para sincronização automática de clientes/anunciantes.

## Fluxo

```
CRM (clients) ←───────────────→ Loopin.tv (advertisers)
     ↓                                      ↑
     │                                      │
Criar/Editar cliente ──→ create-advertiser ─┘
     ↑                                      │
     │                                      │
     └───── sync-advertisers (já existia) ←─┘
```

## Configuração

### 1. Variáveis de Ambiente

No **CRM** (`supabase/.env.local`), adicione:

```env
LOOPIN_TV_FUNCTIONS_URL=https://sxsmirhqbslmvyesikgg.supabase.co/functions/v1
LOOPIN_TV_SERVICE_ROLE_KEY=chave-service-role-do-loopin-tv
```

### 2. Deploy da Edge Function

No projeto **Loopin.tv**, faça deploy da função:

```bash
cd Loopin.tv-main
supabase functions deploy create-advertiser
```

Ou pelo dashboard do Supabase:
1. Vá em SQL Editor
2. Cole o conteúdo de `supabase/functions/create-advertiser/index.ts`
3. Execute como Edge Function

### 3. Variáveis no Loopin.tv

No projeto Loopin.tv, configure:
- `LOOPIN_TV_SERVICE_ROLE_KEY` - Service Role Key do Loopin.tv

## O que é sincronizado

| Campo (CRM) | Campo (Loopin.tv) |
|-------------|-------------------|
| id | id |
| name | name |
| email | contact_email |
| phone | contact_phone |
| segment | category |
| contact_name | contact_name |

## Testando

1. Crie um novo cliente no CRM
2. Verifique se o advertiser foi criado no Loopin.tv:
   ```sql
   SELECT * FROM advertisers WHERE name = 'Nome do Cliente';
   ```

## Troubleshooting

Se a sincronização falhar:
1. Verifique se `LOOPIN_TV_SERVICE_ROLE_KEY` está configurado corretamente
2. Verifique os logs da Edge Function no Supabase do Loopin.tv
3. A sincronização falhou NÃO bloqueia a criação do cliente no CRM
