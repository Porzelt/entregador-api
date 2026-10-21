# Entregador Demo API

API em **NestJS + TypeScript + PostgreSQL** do app de entregador [Entregador Demo](https://github.com/Porzelt/entregador-demo) (React Native + Expo). É a segunda metade de um mesmo produto: o app mostra a interface e esta API guarda as regras e os dados. Todos os dados são simulados.

Mantém o contrato e as regras de negócio do app:

- status da entrega: `a_caminho_coleta` → `coletado` → `a_caminho_entrega` → `entregue`;
- **uma entrega ativa por vez**;
- pedidos tratados (aceitos ou recusados) **não reaparecem**;
- **ganhos do dia** somados em centavos (sem erro de ponto flutuante);
- pedidos só são listados e tratados quando o entregador está **online**.

## Como rodar

Requer Docker.

```bash
cp .env.example .env      # valores falsos, só para desenvolvimento
docker compose up --build
```

Sobe o PostgreSQL e a API em `http://localhost:3000`. Ao iniciar, a API aplica as migrations e o seed (um entregador de demonstração e 8 pedidos fictícios). Documentação Swagger: **http://localhost:3000/docs**.

Credenciais de demonstração (as do `.env.example`): `entregador@example.com` / `demo-senha-falsa`.

### Desenvolvimento local (API fora do Docker)

```bash
npm install
npm run db:up        # só o PostgreSQL pelo Docker
npm run seed         # migrations + seed
npm run start:dev
```

## Scripts

| Script | O que faz |
|---|---|
| `npm run build` | compila para `dist/` |
| `npm run start:dev` | API com reload |
| `npm run lint` | ESLint |
| `npm test` | testes unitários (não precisam de banco) |
| `npm run test:e2e` | testes e2e com supertest; precisam do PostgreSQL (`npm run db:up`) e usam o banco separado `entregador_test` |
| `npm run seed` | aplica migrations e seed (idempotente) |

## Contrato dos endpoints

Todas as rotas, exceto o login, exigem `Authorization: Bearer <token>`. Erros vêm no formato padrão do Nest (`statusCode`, `message`, `error`) com mensagens em português: `400` validação, `401` sem token/credencial inválida, `404` não encontrado, `409` regra de negócio violada.

| Método e rota | Descrição |
|---|---|
| `POST /auth/login` | `{ email, password }` → `{ accessToken, courier }` |
| `PUT /courier/online` | `{ online: boolean }` → `{ online }` |
| `GET /orders/available` | pedidos livres que o entregador não recusou (lista vazia se offline) |
| `POST /orders/:id/accept` | aceita e inicia a entrega; `409` se já houver entrega ativa, se estiver offline ou se o pedido já foi tratado |
| `POST /orders/:id/decline` | recusa; o pedido não volta a aparecer para este entregador |
| `GET /deliveries/current` | entrega em andamento (`404` se não houver) |
| `POST /deliveries/current/advance` | avança o status na ordem; `409` se já estiver `entregue` |
| `POST /deliveries/current/complete` | conclui; `409` se o status não for `entregue` |
| `GET /deliveries/history` | `{ earningsToday, deliveriesToday, deliveries[] }` |

Os objetos seguem os tipos do app: um pedido é `{ id, restaurant, address, fee, distanceKm }` e uma entrega é `{ id, status, statusLabel, completedAt, order }`.

### Exemplo com curl

```bash
# login
TOKEN=$(curl -s -X POST localhost:3000/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"entregador@example.com","password":"demo-senha-falsa"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).accessToken')

# ficar online e listar pedidos
curl -s -X PUT localhost:3000/courier/online -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"online":true}'
curl -s localhost:3000/orders/available -H "Authorization: Bearer $TOKEN"

# recusar um pedido, aceitar outro e avançar até entregue
curl -s -X POST localhost:3000/orders/ped-001/decline -H "Authorization: Bearer $TOKEN"
curl -s -X POST localhost:3000/orders/ped-002/accept -H "Authorization: Bearer $TOKEN"
curl -s -X POST localhost:3000/deliveries/current/advance -H "Authorization: Bearer $TOKEN"   # coletado
curl -s -X POST localhost:3000/deliveries/current/advance -H "Authorization: Bearer $TOKEN"   # a_caminho_entrega
curl -s -X POST localhost:3000/deliveries/current/advance -H "Authorization: Bearer $TOKEN"   # entregue

# concluir e ver histórico com os ganhos do dia
curl -s -X POST localhost:3000/deliveries/current/complete -H "Authorization: Bearer $TOKEN"
curl -s localhost:3000/deliveries/history -H "Authorization: Bearer $TOKEN"
```

## Como o app se conecta

O app acessa os dados por uma interface `OrderRepository`. Para usar esta API, basta uma implementação com `fetch` apontando para `/orders/available` (e métodos novos para aceitar, recusar e mudar status), enviando o token do login. Essa integração ainda **não foi feita no app**: hoje ele continua com dados simulados locais.

## Decisões de arquitetura

- **Módulos por domínio**: `auth`, `couriers`, `orders` e `deliveries`, cada um com controller, service e entidades.
- **Regra de status pura**: `src/deliveries/domain/delivery-status.ts` não depende de Nest nem de banco (transições, conclusão, ganhos em centavos, limites do dia). Ela lança `DomainError`, que um filtro global converte em `409`.
- **TypeORM** (em vez de Prisma): decorators e injeção de repositórios combinam com o estilo do Nest e permitem migrations em SQL explícito, sem etapa de geração de código.
- **Migrations em vez de `synchronize`**: o esquema vem de `src/database/migrations`. A regra "uma entrega ativa por vez" também é garantida no banco, por índice único parcial (`uq_deliveries_one_active`), então vale mesmo sob requisições concorrentes; `order_id` único em `deliveries` impede dois entregadores com o mesmo pedido.
- **Validação**: DTOs com `class-validator`, `whitelist` e mensagens em português.
- **JWT simples**: um `JwtAuthGuard` próprio sobre `@nestjs/jwt`; senha com `bcryptjs`. Sem refresh token nem cadastro: só o entregador de demonstração do seed.
- **Ganhos do dia**: considera o dia no fuso do processo (`TZ`, `America/Sao_Paulo` no compose).
- **Nest 11 / CommonJS**: escolhido por compatibilidade simples com Jest.

## Testes

```bash
npm test            # unitários: regra de status, serviços de pedidos, entregas e login
npm run db:up && npm run test:e2e
```

Os e2e cobrem o fluxo completo (login, ficar online, listar, recusar, aceitar, avançar todos os status, concluir, histórico e ganhos) e os erros: aceitar com entrega ativa, concluir antes de `entregue`, pedido recusado que não volta, offline, token inválido e validação do corpo.

## Fora do escopo da V1

Pagamento, mapas, serviços de terceiros, cadastro de entregadores, múltiplos entregadores com concorrência intensa em testes, refresh token e limite de requisições.

## Sobre este projeto

Projeto próprio de estudo e portfólio, feito para praticar NestJS, TypeScript e PostgreSQL. Não é um sistema em produção, não tem clientes e todos os dados (restaurantes, endereços, valores, credenciais) são fictícios. Não há experiência profissional com Node.js por trás dele: é aprendizado aplicado a um produto que eu já tinha desenhado no [app](https://github.com/Porzelt/entregador-demo).
