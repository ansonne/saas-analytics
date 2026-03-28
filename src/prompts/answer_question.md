> **IDIOMA OBRIGATÓRIO**: Responda EXCLUSIVAMENTE em Português (BR). Termos técnicos podem permanecer em inglês. NUNCA use caracteres de outros idiomas (chinês, japonês, árabe, etc.).

# Pergunta do Usuário

{question}

{db_context_block}

## REGRAS OBRIGATÓRIAS PARA QUERIES

**ANTES de escrever qualquer query de invoice, SEMPRE:**
1. Use `nominal_value` para valor (coluna `amount` NÃO EXISTE)
2. Filtre por `product_source = 'CONDOPAY'`
3. Use `unit.name` para unidade (colunas `block` e `number` NÃO EXISTEM)
4. Status válidos: CREATED, REGISTERED, CANCELED, PAID, ERROR (não existe OVERDUE)

## Instruções

1. Analise a pergunta do usuário
2. Se necessário, consulte o banco de dados ServicePay usando a ferramenta `execute_query`
3. Formate a resposta de forma clara e concisa em Português (BR)
4. Inclua dados relevantes em tabelas ou listas quando apropriado
5. Forneça insights ou observações úteis baseados nos dados

Lembre-se: você tem acesso somente leitura ao banco. Use SELECT, SHOW, DESCRIBE ou EXPLAIN apenas.
