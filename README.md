# NovaRaid

Plataforma web para **e-sports**, com foco em **criação e gestão de campeonatos**, vitrine pública e painel de administração simples (MVP em evolução).

## Status do projeto
MVP funcional (frontend + backend) rodando localmente, com:
- Autenticação (registro/login) e sessão via token
- Gestão de campeonatos: criar rascunho, publicar, despublicar e excluir
- Vitrine pública: lista apenas campeonatos publicados
- Página pública de detalhe: acessível apenas para campeonatos publicados
- Dashboard: painel para gerenciar campeonatos

> Observação: nesta fase, os dados estão em memória (reiniciar o backend apaga usuários/campeonatos). Persistência em banco de dados será adicionada em etapas futuras.

## Stack
- **Frontend:** React + Vite
- **Backend:** FastAPI (Python)
- **Auth:** JWT (token)
- **Ambiente:** Windows (PowerShell)

## Estrutura do repositório
NovaRaid/
  backend/      # FastAPI
  frontend/     # React (Vite)

## Como rodar localmente (exemplo)

### 1 Backend (FastAPI)
Abra um terminal:

cd C:\Users\Enzo\NovaRaid\backend
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000

Verifique:
- Health: http://127.0.0.1:8000/health
- Docs (Swagger): http://127.0.0.1:8000/docs

### 2 Frontend (React)
Abra outro terminal:

cd C:\Users\Enzo\NovaRaid\frontend
npm install
npm run dev

Acesse:
- http://localhost:5173

## Rotas principais (Frontend)
- / → Vitrine (pública)
- /championships/:id → Detalhe (público, apenas published)
- /dashboard → Painel (login/cadastro + gestão)

## Endpoints principais (Backend)

### Público
- GET /public/championships → lista publicados
- GET /public/championships/{id} → detalhe publicado

### Auth
- POST /auth/register
- POST /auth/login
- GET /auth/me

### Campeonatos (painel)
- GET /championships
- POST /championships (requer login)
- PATCH /championships/{id}/publish (requer login)
- PATCH /championships/{id}/unpublish (requer login)
- DELETE /championships/{id} (requer login)

## Próximos passos (roadmap curto)
- Persistência em banco (PostgreSQL)
- Times e elenco
- Inscrições e aprovação
- Chaveamento e resultados
- Papéis/permissões (admin/organizador)

## Licença
A definir.