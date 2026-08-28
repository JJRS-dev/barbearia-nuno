# Barbearia Nuno

Repositório: https://github.com/JJRS-dev/barbearia-nuno

Bem-vindos — este repositório contém o site da Barbearia Nuno. A ideia é centralizar o backend Java (se houver) e o frontend React com animações feitas com Framer Motion. O objetivo imediato: integrar a base existente do site, aplicar animações com Framer Motion e publicar hoje.

Estrutura recomendada
- backend/    → projeto Java (Maven ou Gradle)
- frontend/   → React (Vite / CRA) com Framer Motion
- README.md
- LICENSE     → MIT (já adicionada)
- .gitignore  → já contém template Java; adicione template Node dentro de /frontend

Como adicionar a base do site (passos rápidos)
1. Clone o repo:
   git clone https://github.com/JJRS-dev/barbearia-nuno.git
   cd barbearia-nuno
2. Crie uma branch para subir a base:
   git checkout -b feature/add-existing-site
3. Coloque os arquivos do projeto nas pastas apropriadas:
   - frontend/  (colocar app React ou site estático)
   - backend/   (colocar projeto Java)
   - ou na raiz se preferirem site estático simples
4. Commit e push:
   git add .
   git commit -m "add: base do site"
   git push origin feature/add-existing-site
5. Abra um Pull Request (feature/add-existing-site → main) e marque os revisores

Instruções rápidas para integrar Framer Motion (se frontend for React)
- Vá para a pasta frontend:
  cd frontend
- Instale Framer Motion:
  npm install framer-motion
  ou
  yarn add framer-motion
- Exemplo simples (React):
  import { motion } from 'framer-motion'

  export function Hero() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1>Barbearia Nuno</h1>
      </motion.div>
    )
  }
- Garanta que o build funciona:
  npm install
  npm run build

Checklist mínimo antes do PR final
- [ ] Base do site adicionada em /frontend ou /backend
- [ ] Framer Motion instalado e utilizado em pelo menos 2 componentes visíveis
- [ ] frontend/.gitignore com node_modules, dist/build, .env
- [ ] README atualizado com instruções de execução
- [ ] Build do frontend OK (npm run build)
- [ ] Testado localmente (incluir screenshots ou vídeo curto no PR)

Padrões de branch/PR
- Nome de branch: feature/<descrição> (ex.: feature/framer-motion)
- Título do PR: feat: integrar framer-motion + <resumo>
- Descrição do PR: explicar o que mudou, como testar localmente, e anexar screenshots/gifs
- Revisores: marcar @JJRS-dev e outros colaboradores

Deploy (opções rápidas)
- Frontend estático: Vercel ou Netlify (apontar para /frontend)
- Backend Java: Render, Railway ou outro host que suporte Java/Maven/Gradle

Como coordenar trabalho em equipe
- Cada dev trabalha em sua branch e abre PR para revisão
- Use Issues para tarefas e atribua responsáveis
- Se precisarem, eu (ou o Copilot) podemos criar a estrutura inicial (frontend com Vite + React e Framer Motion) — peça explicitamente no PR ou aqui no chat: "Por favor, crie a estrutura frontend+framer e abra PR"

Contato e prioridade
- Prazo: publicar hoje — priorizem tarefas pequenas e visíveis (hero, header, CTA e build)
- Marquem neste PR quem vai subir a base e quem fará as animações

Boa sorte! Cometem e abram PRs — assim que houver código eu posso ajudar a revisar e finalizar o deploy.
