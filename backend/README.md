# Prisma + Neon + Git Workflow

This project uses **Prisma** ORM with a **Neon** PostgreSQL database.  
To ensure schema consistency across environments, we use **Prisma Migrate** with version control.

---

## 🔁 Workflow: Making Schema Changes

If you're the developer making changes to the database schema, follow these steps:

### 1. Modify the Prisma Schema
Edit the `prisma/schema.prisma` file as needed. Example:
```prisma
model User {
  id    Int    @id @default(autoincrement())
  name  String
  email String @unique
}
```

### 2. Create a Migration
Generate a new migration using:

```bash
npx prisma migrate dev --name your_migration_name
```

✅ This will:
- Generate a new folder inside `prisma/migrations/`
- Update your local database
- Update the Prisma client

### 3. Test your changes
Run any local development/test scripts to make sure the schema works correctly.

### 4. Commit Your Changes
```bash
git add prisma/schema.prisma prisma/migrations/ ...
git commit -m "feat: updated schema with user table"
git push
```

---

## 👥 Team Members / Production Sync

If you're **not the one who made the schema change**, but you pulled recent changes from Git:

### 1. Pull the latest code:
```bash
git pull origin main
```

### 2. Install dependencies:
```bash
npm install
```

### 3. Apply the migrations to your local database:
```bash
npx prisma migrate deploy
```

✅ This will apply all SQL migration files under `prisma/migrations/` to your DB.

---

## 🧠 Important Notes

### ✅ What to Commit:
| File/Folder           | Commit? | Why                                         |
|-----------------------|---------|----------------------------------------------|
| `prisma/schema.prisma` | ✅      | Contains the Prisma schema                  |
| `prisma/migrations/`   | ✅      | Required for `prisma migrate deploy` to work |
| `.env.example`         | ✅      | Helps others configure their own `.env`     |
| `.env`                 | ❌      | Contains secrets; never commit              |
| `node_modules/`        | ❌      | Always ignore; use `.gitignore`             |

---

## ❌ What Happens If You Skip Committing `prisma/migrations/`

If `prisma/migrations/` is **not committed**, your teammates will get errors like:

```
Error: No migration files found in prisma/migrations
```

And `npx prisma migrate deploy` will **fail**, because there's no record of the migration history.

---

## 📦 Prisma Commands Reference

| Command | Purpose |
|--------|---------|
| `npx prisma migrate dev --name <name>` | Generate a new migration and apply to local DB |
| `npx prisma migrate deploy` | Apply committed migrations to DB (used in production or by other devs) |
| `npx prisma generate` | Regenerate the Prisma client |
| `npx prisma studio` | Open a GUI to explore the DB |

---

## ✅ Best Practices Summary

- Always use `migrate dev` when making schema changes.
- Always commit the `migrations/` folder with `schema.prisma`.
- Never commit `.env` files with secrets.
- Use `.env.example` to help teammates configure.

---

## 🛠 Example `.env.example`
```env
DATABASE_URL="postgresql://username:password@host/dbname?schema=public"
```

---

For questions or issues, refer to the [Prisma Docs](https://www.prisma.io/docs) or contact the project maintainer.
