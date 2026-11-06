# Сервис опросов — backend

Node.js/Express сервер + PostgreSQL через Prisma ORM.  
Этот этап (неделя 1): подключение к БД и тестовые данные.

## 1. Установка зависимостей

```bash
npm install
```

## 2. Настройка подключения к БД

1. Убедитесь, что локально установлен и запущен PostgreSQL.
2. Создайте базу данных:
   ```bash
   createdb survey_db
   ```
   (или через psql / DBeaver: `CREATE DATABASE survey_db;`)
3. Скопируйте `.env.example` в `.env` и подставьте свои логин/пароль от Postgres:
   ```bash
   cp .env.example .env
   ```

## 3. Применить схему БД (создать таблицы)

```bash
npm run prisma:migrate -- --name init
```

Эта команда создаст таблицы `role`, `user`, `survey`, `question`, `option`, `vote`, `participation`  
по схеме в `prisma/schema.prisma` и сгенерирует Prisma Client.

## 4. Заполнить тестовыми данными

```bash
npm run prisma:seed
```

Создаст:
- 3 роли (`guest`, `user`, `admin`) — системный справочник
- 5 пользователей
- 5 опросов (active / draft / completed + 1 private)
- 5 вопросов
- 21 вариант ответа
- 12 голосов
- 8 участий (Participation)

Пароль у всех тестовых пользователей: `password123` (захеширован через bcrypt).

Приватный опрос «Дизайн-система команды» — пароль: `design2024`.

## 5. Запустить сервер

```bash
npm start
```

Проверить, что всё подключено:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/users
curl http://localhost:3000/surveys
```

## Структура проекта

```
prisma/
  schema.prisma   — описание таблиц и связей (по ERD)
  seed.js         — тестовые данные
src/
  db.js           — единый Prisma Client на всё приложение
  index.js        — Express-сервер
.env.example      — шаблон переменных окружения
```

## Полезно посмотреть данные глазами

```bash
npx prisma studio
```

Откроет веб-интерфейс на localhost:5555 со всеми таблицами и записями —  
удобно для демонстрации преподавателю, что данные реально легли в БД.

## Тестовые аккаунты

| Email                 | Пароль       | Роль  | is_active |
|-----------------------|--------------|-------|-----------|
| admin@example.com     | password123  | admin | true      |
| maria@example.com     | password123  | user  | true      |
| alex@example.com      | password123  | user  | true      |
| olga@example.com      | password123  | user  | true      |
| blocked@example.com   | password123  | user  | false     |
