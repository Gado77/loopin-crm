# Integração Asaas - Loopin CRM

## Resumo
Sistema de cobrança integrado com o Asaas para gerar cobranças via Pix e Boleto diretamente pelo CRM.

## Estrutura de Arquivos

```
server/
├── utils/
│   └── asaas.ts                    # Cliente da API do Asaas
│       ├── criarClienteAsaas()     # Cria/atualiza cliente no Asaas
│       ├── buscarClienteAsaas()    # Busca dados do cliente
│       ├── criarCobrancaAsaas()    # Cria cobrança Pix/Boleto
│       ├── buscarCobrancaAsaas()   # Consulta status da cobrança
│       ├── obterQrCodePix()        # Retorna QR Code e payload
│       ├── criarLinkPagamento()    # Cria link de pagamento
│       └── mapearStatusAsaas()     # Converte status Asaas -> CRM
│
└── api/asaas/
    ├── create-customer.post.ts     # POST /api/asaas/create-customer
    ├── create-payment.post.ts      # POST /api/asaas/create-payment
    ├── payment-status/[id].get.ts # GET /api/asaas/payment-status/:id
    └── webhook.post.ts             # POST /api/asaas/webhook
```

## Variáveis de Ambiente (.env)

```env
ASAAS_API_KEY=sua_chave_api_asaas
ASAAS_WEBHOOK_SECRET=seu_secret_webhook
```

## Campos no Banco

### clients
- `asaas_customer_id` - ID do cliente no Asaas (TEXT)

### invoices
- `asaas_payment_id` - ID da cobrança no Asaas (TEXT)
- `asaas_billing_type` - Tipo: PIX, BOLETO, CREDIT_CARD (TEXT)

## Fluxo de Uso

1. **Criar Cliente no Asaas** (se ainda não existir)
   - Endpoint: `POST /api/asaas/create-customer`
   - Body: `{ clientId: "uuid-do-cliente" }`

2. **Gerar Cobrança**
   - Endpoint: `POST /api/asaas/create-payment`
   - Body: `{ invoiceId: "uuid-da-fatura", billingType: "PIX" | "BOLETO" }`
   - Retorna: QR Code (Pix) ou link do boleto

3. **Verificar Status**
   - Endpoint: `GET /api/asaas/payment-status/:id`
   - Consulta status no Asaas e atualiza fatura se pago

4. **Webhook** (configurar no painel Asaas)
   - URL: `https://seu-dominio/api/asaas/webhook`
   - Eventos: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_UPDATED`

## Configuração do Webhook no Asaas

1. Acesse: https://www.asaas.com -> Configurações -> Integrações -> Webhooks
2. URL: `https://seu-dominio/api/asaas/webhook`
3. Eventos marcar:
   - `PAYMENT_RECEIVED`
   - `PAYMENT_CONFIRMED`
   - `PAYMENT_UPDATED`
4. Copiar o Secret gerado para `ASAAS_WEBHOOK_SECRET`

## Mapeamento de Status

| Asaas       | CRM      |
|-------------|----------|
| CONFIRMED   | paid     |
| RECEIVED    | paid     |
| OVERDUE     | overdue  |
| CANCELLED   | cancelled|
| PENDING     | pending  |

## URLs da API Asaas

- Sandbox: `https://api-sandbox.asaas.com`
- Produção: `https://api.asaas.com`

**ATENÇÃO**: O código usa `api-sandbox`. Para produção, mudar em `server/utils/asaas.ts`.

## Próximos Passos (Pendente)

- [ ] Mudar URL para produção quando pronto
- [ ] Adicionar suporte a cartão de crédito
- [ ] Adicionar refund/cancelamento de cobrança
- [ ] Notificação por email/SMS ao cliente
- [ ] Dashboard de inadimplência
