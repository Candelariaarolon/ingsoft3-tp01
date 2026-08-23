-- DropIndex
DROP INDEX "User_verificationToken_key";

-- DropIndex
DROP INDEX "User_resetToken_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerified",
DROP COLUMN "verificationToken",
DROP COLUMN "verificationTokenExpiry",
DROP COLUMN "resetToken",
DROP COLUMN "resetTokenExpiry";
