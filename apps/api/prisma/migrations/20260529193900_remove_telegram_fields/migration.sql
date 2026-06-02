-- DropIndex
DROP INDEX IF EXISTS "users_telegram_id_key";
DROP INDEX IF EXISTS "users_telegram_idx";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "telegram_id";
