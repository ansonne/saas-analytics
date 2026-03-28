# ServicePay Database Schema

## Tabelas Principais

### audit_log
Registro de atividades de clientes.
```sql
- id: INT
- customer_id: INT (FK customer)
- action: VARCHAR (LOGIN_SUCCEEDED, LOGIN_FAILED, SUBSCRIPTION_*, PAYMENT_*, CARD_*, INVOICE_*)
- ip_address: VARCHAR
- user_agent: TEXT
- metadata: JSON
- created_at: DATETIME
```

### condominium
Condomínios cadastrados.
```sql
- id: INT
- name: VARCHAR
- cnpj: VARCHAR
- credit_factor: DECIMAL
- provider_id: INT
- created_at: DATETIME
- updated_at: DATETIME
- deleted_at: DATETIME
```

### unit
Unidades (apartamentos).
```sql
- id: INT (PK, auto_increment)
- provider_id: INT (UNI)
- erp_id: VARCHAR(32)
- owner_id: INT (FK customer)
- tenant_id: INT (FK customer)
- billed: ENUM('OWNER','TENANT')
- name: VARCHAR(255) -- identificador da unidade (ex: "Bloco A - 101")
- condominium_id: INT (FK condominium)
- created_at: TIMESTAMP(6)
- updated_at: TIMESTAMP(6)
- deleted_at: TIMESTAMP(6)
```

**NOTA:** Não existem colunas `block` ou `number` separadas. Use `name` para identificar a unidade.

### customer
Clientes (proprietários e inquilinos).
```sql
- id: INT
- name: VARCHAR
- email: VARCHAR
- cpf: VARCHAR
- phone: VARCHAR
- created_at: DATETIME
- updated_at: DATETIME
- deleted_at: DATETIME
```

### customer_card
Cartões de pagamento.
```sql
- id: INT
- customer_id: INT (FK customer)
- brand: VARCHAR
- last_four: VARCHAR
- expiry_month: INT
- expiry_year: INT
- is_default: BOOLEAN
- status: VARCHAR (ACTIVE, INACTIVE)
- created_at: DATETIME
- updated_at: DATETIME
```

### invoice
Faturas (boletos).
```sql
- id: VARCHAR(36) (PK, UUID)
- collection_invoice_id: INT
- unit_id: INT (FK unit)
- customer_id: INT (FK customer, nullable)
- reference_month: DATE
- billed: ENUM('OWNER','TENANT')
- your_number: VARCHAR(16)
- nominal_value: DECIMAL(10,2) -- valor da fatura (NÃO use 'amount')
- payer_tax_number: VARCHAR(14) -- CPF/CNPJ do pagador
- payer_name: VARCHAR(100)
- payer_address: VARCHAR(100)
- payer_number: VARCHAR(10)
- payer_address_complement: VARCHAR(80)
- payer_neighborhood: VARCHAR(80)
- payer_city: VARCHAR(80)
- payer_state: VARCHAR(2)
- payer_zipcode: VARCHAR(8)
- payer_email: VARCHAR(100)
- payer_phone: VARCHAR(100)
- description: TEXT
- due_date: DATE
- expiration_days: INT
- vouch_link_status: ENUM('PENDING','READY')
- status: ENUM('CREATED','REGISTERED','CANCELED','PAID','ERROR')
- product_source: ENUM('RG','CONDOPAY') -- SEMPRE filtrar por product_source = 'CONDOPAY'
- display_id: BIGINT (auto_increment)
- provider_agreement_id: INT
- type: ENUM('NORMAL','AGREEMENT_INSTALLMENT')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- deleted_at: TIMESTAMP(6)
```

**IMPORTANTE:**
- Sempre incluir `WHERE product_source = 'CONDOPAY'` em queries de invoice
- Use `nominal_value` para valor (NÃO existe coluna 'amount')
- Dados do pagador estão diretamente na invoice (payer_*), não precisa JOIN com customer

### invoice_history
Histórico de transições de faturas.
```sql
- id: INT
- invoice_id: INT (FK invoice)
- from_status: VARCHAR
- to_status: VARCHAR
- metadata: JSON
- created_at: DATETIME
```

### subscription
Assinaturas de débito automático.
```sql
- id: INT
- unit_id: INT (FK unit)
- customer_id: INT (FK customer)
- customer_card_id: INT (FK customer_card)
- status: VARCHAR (ACTIVE, INACTIVE, CANCELED)
- payment_day: INT
- created_at: DATETIME
- updated_at: DATETIME
- deleted_at: DATETIME
```

### subscription_payment
Pagamentos de assinaturas.
```sql
- id: INT
- subscription_id: INT (FK subscription)
- invoice_id: INT (FK invoice)
- amount: DECIMAL
- status: VARCHAR (PENDING, SUCCESS, FAILED)
- failure_reason: VARCHAR
- created_at: DATETIME
- updated_at: DATETIME
```

### subscription_optin
Consentimento de assinaturas.
```sql
- id: INT
- subscription_id: INT (FK subscription)
- customer_id: INT (FK customer)
- status: VARCHAR (ACCEPTED, CANCELLED)
- reason: VARCHAR
- ip_address: VARCHAR
- created_at: DATETIME
```

### assignment
Atribuições RG.
```sql
- id: INT
- unit_id: INT (FK unit)
- customer_id: INT (FK customer)
- status: VARCHAR (OPEN, APPROVED, REJECTED)
- created_at: DATETIME
- updated_at: DATETIME
```

### assignment_composition
Composição de atribuições.
```sql
- id: INT
- assignment_id: INT (FK assignment)
- invoice_id: VARCHAR(36) (FK invoice)
- amount: DECIMAL
- created_at: DATETIME
```

## Queries de Exemplo

### DAU (Daily Active Users)
```sql
SELECT DATE(created_at) as date, COUNT(DISTINCT customer_id) as dau
FROM audit_log
WHERE action = 'LOGIN_SUCCEEDED'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at);
```

### Faturas ServicePay (SEMPRE filtrar por product_source)
```sql
SELECT
  i.id,
  i.nominal_value AS valor,
  i.due_date AS data_vencimento,
  i.status,
  i.reference_month,
  i.payer_name,
  i.payer_email,
  u.name AS unidade,
  c.name AS condominio
FROM invoice i
JOIN unit u ON i.unit_id = u.id
JOIN condominium c ON u.condominium_id = c.id
WHERE i.product_source = 'CONDOPAY'
  AND i.deleted_at IS NULL
ORDER BY i.created_at DESC
LIMIT 20;
```

### Taxa de Sucesso de Pagamentos
```sql
SELECT
  SUM(CASE WHEN action = 'SUBSCRIPTION_PAYMENT_OK' THEN 1 ELSE 0 END) as success,
  SUM(CASE WHEN action = 'SUBSCRIPTION_PAYMENT_FAILED' THEN 1 ELSE 0 END) as failed
FROM audit_log
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);
```

### Assinaturas Ativas por Condomínio
```sql
SELECT c.name, COUNT(s.id) as active_subscriptions
FROM subscription s
JOIN unit u ON s.unit_id = u.id
JOIN condominium c ON u.condominium_id = c.id
WHERE s.status = 'ACTIVE' AND s.deleted_at IS NULL
GROUP BY c.id ORDER BY active_subscriptions DESC LIMIT 20;
```

### Total Faturado ServicePay por Mês
```sql
SELECT
  DATE_FORMAT(reference_month, '%Y-%m') AS mes,
  COUNT(*) AS total_faturas,
  SUM(nominal_value) AS valor_total
FROM invoice
WHERE product_source = 'CONDOPAY'
  AND status = 'PAID'
  AND deleted_at IS NULL
GROUP BY DATE_FORMAT(reference_month, '%Y-%m')
ORDER BY mes DESC
LIMIT 12;
```
