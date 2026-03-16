

# Relatório Técnico de Migração — PHP + MySQL

---

## 1. Mapeamento de Funcionalidades com Dependência de Backend

| # | Funcionalidade | Onde é usado | Descrição |
|---|---------------|-------------|-----------|
| 1 | **Autenticação** | `AuthContext`, `Login`, `Register` | Signup com email/senha, login, logout, sessão persistente, redirecionamento de confirmação de email |
| 2 | **Perfis de Usuário** | `AuthContext`, `Settings`, `CreatorProfile` | CRUD de perfil (nome, username, bio, avatar, capa, preços), upload de imagens para storage |
| 3 | **Roles (Papéis)** | `AuthContext`, `AdminPanel` | Sistema de roles (`admin`, `moderator`, `user`) com função `has_role()` para RLS |
| 4 | **Feed de Posts** | `Index`, `PostCard` | Listagem de posts com join em profiles, filtros "Para Você" (verificados) e "Seguindo" |
| 5 | **Criar/Editar/Deletar Posts** | `CreatePostModal`, `PostCard` | Posts com texto, mídia (foto/vídeo), tipo de visibilidade (free/subscribers/ppv), enquetes |
| 6 | **Likes** | `PostCard` | Like/unlike com trigger que atualiza `likes_count` |
| 7 | **Comentários** | `PostCard` | CRUD de comentários com trigger que atualiza `comments_count` |
| 8 | **Seguir/Deixar de seguir** | `CreatorProfile` | Follow/unfollow com trigger que atualiza `followers_count` |
| 9 | **Assinaturas** | `SubscribeModal`, `Subscriptions` | Assinatura mensal/anual, trigger de `subscribers_count`, mensagem de boas-vindas automática |
| 10 | **Compras PPV** | `PaymentModal`, `PostCard` | Compra unitária de post pay-per-view |
| 11 | **Presentes (Gifts)** | `GiftModal` | Envio de valor monetário a criadores com notificação |
| 12 | **Chat (Mensagens)** | `Chat` | Conversas 1:1 com mensagens em tempo real (Realtime/WebSocket), marcação de leitura |
| 13 | **Notificações** | `NotificationPanel` | Notificações geradas por triggers (novo seguidor, assinante, presente), marcar como lida |
| 14 | **Aplicação de Criador** | `BecomeCreator` | Formulário 3 etapas com upload de documentos para storage privado |
| 15 | **Painel Admin** | `AdminPanel` | Dashboard com métricas financeiras, gestão de usuários/criadores, aprovação de aplicações, saques, posts |
| 16 | **Saques** | `CreatorDashboard` | Solicitação de saque com dados PIX, aprovação pelo admin |
| 17 | **Explorar** | `Explore` | Listagem de criadores verificados ranqueados por seguidores |
| 18 | **Busca** | `Search` | Busca de criadores por nome/username |
| 19 | **Enquetes** | `CreatePostModal` | Criação de enquetes vinculadas a posts, votação com trigger |
| 20 | **Upload de Mídia** | `CreatePostModal`, `BecomeCreator`, `CreatorProfile` | Upload para bucket `media` (público) e `documents` (privado) |
| 21 | **Referral/Afiliados** | `Referral`, `Affiliates` | Páginas de referência (atualmente frontend-only) |

---

## 2. Dicionário de Endpoints REST (PHP)

### Auth
| Método | Endpoint | Descrição |
|--------|---------|-----------|
| POST | `/api/auth/register` | Criar conta (name, username, email, password, whatsapp) |
| POST | `/api/auth/login` | Login com email/senha, retorna JWT |
| POST | `/api/auth/logout` | Invalidar sessão |
| GET | `/api/auth/session` | Verificar sessão atual |
| GET | `/api/auth/confirm?token=` | Confirmação de email |

### Profiles
| Método | Endpoint | Descrição |
|--------|---------|-----------|
| GET | `/api/profiles/:id` | Buscar perfil por ID |
| GET | `/api/profiles/username/:username` | Buscar perfil por username |
| GET | `/api/profiles?is_creator=true&order=followers_count&limit=10` | Listar criadores |
| GET | `/api/profiles/search?q=` | Buscar por nome/username |
| PUT | `/api/profiles/:id` | Atualizar perfil próprio |
| DELETE | `/api/profiles/:id` | Admin: deletar perfil |

### Posts
| Método | Endpoint | Descrição |
|--------|---------|-----------|
| GET | `/api/posts?limit=50&order=created_at` | Feed de posts (com dados do criador) |
| GET | `/api/posts?creator_id=:id` | Posts de um criador específico |
| POST | `/api/posts` | Criar post |
| PUT | `/api/posts/:id` | Editar post |
| DELETE | `/api/posts/:id` | Deletar post |

### Likes
| Método | Endpoint | Descrição |
|--------|---------|-----------|
| GET | `/api/likes?user_id=&post_id=` | Verificar se curtiu |
| POST | `/api/likes` | Curtir |
| DELETE | `/api/likes/:post_id` | Descurtir |

### Comments
| Método | Endpoint | Descrição |
|--------|---------|-----------|
| GET | `/api/comments?post_id=` | Listar comentários de um post |
| POST | `/api/comments` | Comentar |
| DELETE | `/api/comments/:id` | Deletar comentário |

### Followers
| Método | Endpoint | Descrição |
|--------|---------|-----------|
| GET | `/api/followers?follower_id=` | Listar quem o usuário segue |
| POST | `/api/followers` | Seguir |
| DELETE | `/api/followers/:creator_id` | Deixar de seguir |

### Subscriptions
| Método | Endpoint | Descrição |
|--------|---------|-----------|
| GET | `/api/subscriptions?subscriber_id=&status=active` | Listar assinaturas do usuário |
| GET | `/api/subscriptions?creator_id=` | Listar assinantes do criador |
| POST | `/api/subscriptions` | Criar assinatura |
| DELETE | `/api/subscriptions/:id` | Cancelar assinatura |

### PPV Purchases
| Método | Endpoint | Descrição |
|--------|---------|-----------|
| GET | `/api/ppv-purchases?buyer_id=` | Listar compras do usuário |
| POST | `/api/ppv-purchases` | Registrar compra |

### Gifts
| Método | Endpoint | Descrição |
|--------|---------|-----------|
| GET | `/api/gifts?creator_id=` | Listar presentes recebidos |
| POST | `/api/gifts` | Enviar presente |

### Conversations & Messages
| Método | Endpoint | Descrição |
|--------|---------|-----------|
| GET | `/api/conversations` | Listar conversas do usuário |
| POST | `/api/conversations` | Criar conversa |
| GET | `/api/messages?conversation_id=` | Listar mensagens |
| POST | `/api/messages` | Enviar mensagem |
| PUT | `/api/messages/:id/read` | Marcar como lida |
| GET | `/api/messages/stream?conversation_id=` | SSE/WebSocket para tempo real |

### Notifications
| Método | Endpoint | Descrição |
|--------|---------|-----------|
| GET | `/api/notifications` | Listar notificações do usuário |
| PUT | `/api/notifications/:id/read` | Marcar como lida |
| PUT | `/api/notifications/read-all` | Marcar todas como lidas |

### Creator Applications
| Método | Endpoint | Descrição |
|--------|---------|-----------|
| GET | `/api/creator-applications?user_id=` | Ver status da aplicação |
| GET | `/api/creator-applications?status=pending` | Admin: listar pendentes |
| POST | `/api/creator-applications` | Submeter aplicação |
| PUT | `/api/creator-applications/:id/approve` | Admin: aprovar |
| PUT | `/api/creator-applications/:id/reject` | Admin: rejeitar |

### Withdrawal Requests
| Método | Endpoint | Descrição |
|--------|---------|-----------|
| GET | `/api/withdrawals?creator_id=` | Listar saques do criador |
| GET | `/api/withdrawals?status=pending` | Admin: listar pendentes |
| POST | `/api/withdrawals` | Solicitar saque |
| PUT | `/api/withdrawals/:id` | Admin: aprovar/rejeitar |

### Polls
| Método | Endpoint | Descrição |
|--------|---------|-----------|
| GET | `/api/polls?post_id=` | Buscar enquete do post |
| POST | `/api/polls` | Criar enquete (com opções) |
| POST | `/api/poll-votes` | Votar |

### User Roles (Admin)
| Método | Endpoint | Descrição |
|--------|---------|-----------|
| GET | `/api/user-roles?user_id=` | Ver roles |
| POST | `/api/user-roles` | Atribuir role |
| DELETE | `/api/user-roles/:id` | Remover role |

### Upload
| Método | Endpoint | Descrição |
|--------|---------|-----------|
| POST | `/api/upload/media` | Upload público (fotos, vídeos) |
| POST | `/api/upload/documents` | Upload privado (documentos de verificação) |

---

## 3. Lógica de Negócio (Triggers/Functions → PHP)

Não existem Edge Functions neste projeto. Toda a lógica de negócio está em **database triggers e functions** que precisarão ser reimplementadas no PHP:

| Função/Trigger | O que faz | Implementação em PHP |
|---------------|-----------|---------------------|
| `handle_new_user()` | Cria perfil + role "user" automaticamente ao registrar | Fazer no endpoint `POST /api/auth/register` |
| `handle_follow()` | Incrementa/decrementa `followers_count` em profiles | Fazer nos endpoints de follow/unfollow |
| `handle_subscription()` | Incrementa/decrementa `subscribers_count` | Fazer nos endpoints de subscription |
| `handle_like()` | Incrementa/decrementa `likes_count` em posts | Fazer nos endpoints de like/unlike |
| `handle_comment()` | Incrementa/decrementa `comments_count` em posts | Fazer nos endpoints de comment |
| `handle_poll_vote()` | Incrementa `votes_count` na opção votada | Fazer no endpoint de votação |
| `notify_new_follower()` | Cria notificação quando alguém segue | Fazer no endpoint de follow |
| `notify_new_subscriber()` | Cria notificação quando alguém assina | Fazer no endpoint de subscribe |
| `notify_new_gift()` | Cria notificação quando recebe presente | Fazer no endpoint de gift |
| `send_welcome_message_on_subscribe()` | Cria conversa + mensagem de boas-vindas | Fazer no endpoint de subscribe |
| `approve_creator()` | Atualiza aplicação + perfil como criador | Fazer no endpoint de aprovação |
| `reject_creator()` | Atualiza status da aplicação | Fazer no endpoint de rejeição |
| `has_role()` | Verifica se usuário tem determinado role | Middleware PHP de autorização |

**Cálculos financeiros no frontend (migrar para PHP):**
- Dashboard do criador: cálculo de faturamento bruto, comissão da plataforma, saldo disponível, já sacado
- Admin: faturamento global, receita líquida por comissão individual de cada criador, gráfico de 6 meses

**Realtime (Chat):** Atualmente usa Supabase Realtime (WebSocket). Em PHP, implementar com **SSE (Server-Sent Events)**, **WebSocket via Ratchet/Swoole**, ou **polling**.

---

## 4. Estrutura de Banco MySQL

```text
┌──────────────────────┐     ┌──────────────────────┐
│       users          │     │     user_roles        │
│──────────────────────│     │──────────────────────│
│ id (PK, UUID/BIGINT) │◄────│ user_id (FK)         │
│ email (UNIQUE)       │     │ role ENUM(admin,      │
│ password_hash        │     │   moderator,user)     │
│ email_verified_at    │     │ id (PK)              │
│ created_at           │     └──────────────────────┘
└──────────┬───────────┘
           │ 1:1
┌──────────▼───────────┐     ┌──────────────────────┐
│      profiles        │     │  creator_applications │
│──────────────────────│     │──────────────────────│
│ id (PK, FK→users)    │     │ id (PK)              │
│ name                 │     │ user_id (FK→users)   │
│ username (UNIQUE)    │     │ full_name, cpf, phone│
│ email                │     │ avatar_url, cover_url│
│ bio, avatar_url      │     │ document_front_url   │
│ cover_url, category  │     │ document_back_url    │
│ price_monthly DECIMAL│     │ selfie_url           │
│ price_yearly DECIMAL │     │ status ENUM(pending, │
│ commission_rate DEC  │     │   approved,rejected) │
│ is_creator BOOLEAN   │     │ admin_notes          │
│ verified BOOLEAN     │     │ reviewed_at, created │
│ blocked BOOLEAN      │     └──────────────────────┘
│ whatsapp             │
│ welcome_message      │     ┌──────────────────────┐
│ followers_count INT  │     │     followers         │
│ subscribers_count INT│     │──────────────────────│
│ created_at,updated_at│     │ id (PK)              │
└──────────────────────┘     │ follower_id (FK)     │
                             │ creator_id (FK)      │
┌──────────────────────┐     │ created_at           │
│       posts          │     │ UNIQUE(follower,     │
│──────────────────────│     │   creator)           │
│ id (PK)              │     └──────────────────────┘
│ creator_id (FK)      │
│ content TEXT          │     ┌──────────────────────┐
│ media_url, media_type│     │   subscriptions      │
│ post_visibility ENUM │     │──────────────────────│
│   (free,subscribers, │     │ id (PK)              │
│    ppv)              │     │ subscriber_id (FK)   │
│ ppv_price DECIMAL    │     │ creator_id (FK)      │
│ likes_count INT      │     │ plan ENUM(monthly,   │
│ comments_count INT   │     │   yearly)            │
│ comments_enabled BOOL│     │ amount DECIMAL       │
│ created_at           │     │ status, payment_method│
└──────────────────────┘     │ expires_at, created  │
                             └──────────────────────┘
┌──────────────────────┐
│       likes          │     ┌──────────────────────┐
│──────────────────────│     │   ppv_purchases      │
│ id (PK)              │     │──────────────────────│
│ user_id (FK)         │     │ id (PK)              │
│ post_id (FK)         │     │ buyer_id (FK)        │
│ UNIQUE(user,post)    │     │ post_id (FK)         │
│ created_at           │     │ amount DECIMAL       │
└──────────────────────┘     │ payment_method       │
                             │ created_at           │
┌──────────────────────┐     └──────────────────────┘
│     comments         │
│──────────────────────│     ┌──────────────────────┐
│ id (PK)              │     │       gifts          │
│ user_id (FK)         │     │──────────────────────│
│ post_id (FK)         │     │ id (PK)              │
│ content TEXT         │     │ sender_id (FK)       │
│ created_at           │     │ creator_id (FK)      │
└──────────────────────┘     │ post_id (FK, nullable│
                             │ amount DECIMAL       │
┌──────────────────────┐     │ payment_method       │
│   conversations      │     │ created_at           │
│──────────────────────│     └──────────────────────┘
│ id (PK)              │
│ participant_1 (FK)   │     ┌──────────────────────┐
│ participant_2 (FK)   │     │   notifications      │
│ last_message_at      │     │──────────────────────│
│ created_at           │     │ id (PK)              │
└──────────┬───────────┘     │ user_id (FK)         │
           │ 1:N             │ from_user_id (FK)    │
┌──────────▼───────────┐     │ post_id (FK,nullable)│
│      messages        │     │ type, title, message │
│──────────────────────│     │ read BOOLEAN         │
│ id (PK)              │     │ created_at           │
│ conversation_id (FK) │     └──────────────────────┘
│ sender_id (FK)       │
│ content TEXT          │     ┌──────────────────────┐
│ `read` BOOLEAN       │     │ withdrawal_requests  │
│ created_at           │     │──────────────────────│
└──────────────────────┘     │ id (PK)              │
                             │ creator_id (FK)      │
┌──────────────────────┐     │ amount DECIMAL       │
│       polls          │     │ pix_key, holder_name │
│──────────────────────│     │ bank_name            │
│ id (PK)              │     │ status ENUM(pending, │
│ post_id (FK, UNIQUE) │     │   approved,rejected) │
│ created_at           │     │ admin_notes          │
└──────────┬───────────┘     │ reviewed_at,created  │
           │ 1:N             └──────────────────────┘
┌──────────▼───────────┐
│    poll_options       │
│──────────────────────│
│ id (PK)              │
│ poll_id (FK)         │
│ text, position INT   │
│ votes_count INT      │
└──────────┬───────────┘
           │ 1:N
┌──────────▼───────────┐
│     poll_votes       │
│──────────────────────│
│ id (PK)              │
│ poll_id (FK)         │
│ option_id (FK)       │
│ user_id (FK)         │
│ UNIQUE(poll,user)    │
└──────────────────────┘
```

**Total: 16 tabelas MySQL** (users substitui auth.users, as demais mantêm paridade 1:1).

### Observações importantes para a migração:

1. **Autenticação**: Substituir Supabase Auth por JWT próprio (ex: Firebase JWT ou `firebase/php-jwt`). Implementar hash bcrypt para senhas.
2. **Storage**: Substituir Supabase Storage por upload direto para servidor ou S3. Bucket `media` = público, `documents` = privado com acesso autenticado.
3. **RLS → Middleware PHP**: Toda a lógica de Row-Level Security deve virar middleware/guards nos controllers PHP.
4. **Realtime → WebSocket/SSE**: O chat em tempo real requer Ratchet, Swoole ou polling como alternativa.
5. **ENUM MySQL**: `app_role` → `ENUM('admin','moderator','user')`, `post_visibility` → `ENUM('free','subscribers','ppv')`.

