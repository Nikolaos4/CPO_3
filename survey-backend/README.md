# Сервис опросов Backend

REST API учебного сервиса опросов на Node.js, Express, PostgreSQL и Prisma. Бэкенд реализует регистрацию и JWT-сессии, каталог, публичные и приватные опросы, черновики, голосование, историю прохождений, результаты, CSV и административные операции.

## Запуск

Требования: Node.js 20+ и PostgreSQL.

```bash
npm ci
cp .env.example .env
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Перед первым запуском укажите рабочий `DATABASE_URL` и замените JWT-секреты в `.env`.

Проверка сервера и базы:

```bash
curl http://localhost:3000/health
```

## Авторизация

Регистрация и вход возвращают:

```json
{
  "user": {},
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_expires_in": 2592000
}
```

Фронтенд хранит оба JWT в `localStorage`. Защищённые запросы передают access-токен:

```http
Authorization: Bearer <access_token>
```

Access-токен действует 15 минут, refresh-токен — 30 дней. `POST /api/auth/refresh` ротирует refresh-токен: после успешного обновления старый refresh-токен использовать нельзя. Logout и блокировка аккаунта отзывают серверную сессию, поэтому связанные access- и refresh-токены перестают работать сразу.

## Приватные опросы

1. Вызвать `POST /api/surveys/{id}/verify-password` с `{ "password": "..." }`.
2. Сохранить полученный `survey_access_token`.
3. В течение 20 минут передавать его при чтении опроса, сохранении/удалении ответов и завершении участия:

```http
X-Survey-Access-Token: <survey_access_token>
```

Токен привязан к пользователю, JWT-сессии и одному опросу. Создателю опроса и уже завершившему его участнику повторное подтверждение пароля не требуется.

## Формат ошибок

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Описание ошибки",
    "details": {}
  }
}
```

Основные статусы: `400` — валидация, `401` — токен отсутствует или истёк, `403` — недостаточно прав, `404` — ресурс не найден, `409` — конфликт состояния.

## API

### Авторизация и профиль

| Метод | Путь | Доступ | Назначение |
|---|---|---|---|
| POST | `/api/auth/register` | Гость | Регистрация |
| POST | `/api/auth/login` | Гость | Вход |
| POST | `/api/auth/refresh` | Refresh JWT | Обновить пару токенов |
| POST | `/api/auth/logout` | Пользователь | Отозвать текущую сессию |
| GET | `/api/users/me` | Пользователь | Профиль и статистика |

### Каталог и управление опросами

| Метод | Путь | Доступ | Назначение |
|---|---|---|---|
| GET | `/api/surveys` | Все | Каталог активных опросов |
| GET | `/api/surveys/{id}` | Пользователь | Опрос, вопросы и свои ответы |
| POST | `/api/surveys/{id}/verify-password` | Пользователь | Получить 20-минутный доступ к приватному опросу |
| POST | `/api/surveys` | Пользователь | Создать черновик или сразу опубликовать |
| PUT | `/api/surveys/{id}` | Создатель | Полностью обновить черновик |
| POST | `/api/surveys/{id}/publish` | Создатель | Опубликовать черновик |
| POST | `/api/surveys/{id}/close` | Создатель | Закрыть активный опрос |
| DELETE | `/api/surveys/{id}` | Создатель, админ | Каскадно удалить опрос |
| GET | `/api/users/me/surveys` | Пользователь | Собственные опросы |

Параметры каталога: `search`, `filter=popular|newest|oldest|private|public|all`, `page`, `limit`. По умолчанию `popular` возвращает до шести записей.

Тело создания и полного обновления:

```json
{
  "title": "Любимый язык программирования",
  "short_description": "Короткое описание",
  "full_description": "Полное описание",
  "is_private": true,
  "password": "secret",
  "is_anonymous": true,
  "deadline": null,
  "publish": false,
  "questions": [
    {
      "text": "Какие языки вы используете?",
      "allow_multiple": true,
      "options": ["Python", "Java", "JavaScript"]
    }
  ]
}
```

`publish` используется в `POST`; `PUT` всегда сохраняет статус `draft`. Черновик может не иметь вопросов или иметь незавершённые вопросы. Для публикации требуется хотя бы один вопрос и 2–10 вариантов в каждом вопросе. `deadline` может быть `null`; заданный дедлайн должен находиться в будущем.

### Голосование и прохождения

| Метод | Путь | Доступ | Назначение |
|---|---|---|---|
| POST | `/api/surveys/{id}/votes` | Пользователь | Сохранить или заменить переданные ответы |
| DELETE | `/api/surveys/{id}/votes` | Пользователь | Удалить незавершённые ответы |
| POST | `/api/surveys/{id}/complete-participation` | Пользователь | Зафиксировать прохождение |
| GET | `/api/users/me/participations` | Пользователь | История и собственные ответы |

Тело сохранения ответов:

```json
{
  "answers": [
    { "question_id": 1, "option_ids": [2] },
    { "question_id": 2, "option_ids": [5, 7] }
  ]
}
```

Ответы можно изменять до завершения. В результатах учитываются только голоса пользователей, у которых создана запись `Participation`. Завершение выполняется транзакционно и требует ответа на каждый вопрос.

### Результаты и администрирование

| Метод | Путь | Доступ | Назначение |
|---|---|---|---|
| GET | `/api/surveys/{id}/results` | Создатель | Результаты активного или завершённого опроса |
| GET | `/api/surveys/{id}/export` | Создатель | CSV завершённого опроса |
| GET | `/api/admin/surveys` | Админ | Активные и завершённые опросы для модерации |
| GET | `/api/users` | Админ | Пользователи |
| PATCH | `/api/users/{id}/block` | Админ | Заблокировать пользователя |
| PATCH | `/api/users/{id}/unblock` | Админ | Разблокировать пользователя |

В анонимном опросе результаты содержат только агрегаты. В неанонимном создателю также возвращаются участники и их ответы. Администратор не получает чужие результаты и не может удалять чужие черновики.

## Пагинация

Списочные endpoint’ы возвращают:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "pages": 0
  }
}
```

## Тестовые данные

После `npm run prisma:seed`:

| Email | Пароль | Роль |
|---|---|---|
| `admin@example.com` | `password123` | admin |
| `maria@example.com` | `password123` | user |
| `alex@example.com` | `password123` | user |
| `olga@example.com` | `password123` | user |
| `blocked@example.com` | `password123` | заблокирован |

Пароль тестового приватного опроса: `design2024`.

## Команды

```bash
npm start                 # production-запуск
npm run dev               # запуск с node --watch
npm run prisma:migrate    # применить/создать миграции
npm run prisma:generate   # сгенерировать Prisma Client
npm run prisma:seed       # заполнить тестовыми данными
npm run prisma:validate   # проверить Prisma-схему
npm run check             # проверить синтаксис точки входа
```
