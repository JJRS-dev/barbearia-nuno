# Nunex Cortes

Site e agenda profissional da Barbearia Nuno, construídos com Next.js, React, PostgreSQL e Better Auth.

## Funcionalidades

- cadastro e login de clientes;
- calendário mensal para escolha do dia;
- agenda de 24 horas em intervalos de 45 minutos;
- reserva e cancelamento pelo cliente;
- painel exclusivo do Nuno em `/barbeiro`;
- abertura de dias e bloqueio/reabertura de horários;
- estados separados para horários livres, reservados e bloqueados;
- interface responsiva com animações em Framer Motion.

## Executar localmente

1. Instale as dependências:

   ```bash
   pnpm install
   ```

2. Crie `.env.local` com as variáveis necessárias:

   ```env
   DATABASE_URL=postgresql://usuario:senha@host:5432/banco
   BETTER_AUTH_SECRET=uma-chave-secreta-forte
   BETTER_AUTH_URL=http://localhost:3000
   BARBER_EMAIL=email-do-nuno@exemplo.com
   ```

3. Inicie o projeto:

   ```bash
   pnpm dev
   ```

4. Acesse `http://localhost:3000`.

## Build

```bash
pnpm build
pnpm start
```

Para publicar, configure no provedor as mesmas variáveis de ambiente usadas localmente. O projeto precisa de um banco PostgreSQL acessível pelo ambiente de produção.
