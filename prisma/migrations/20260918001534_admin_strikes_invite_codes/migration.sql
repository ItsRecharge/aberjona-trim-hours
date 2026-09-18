-- AlterTable
ALTER TABLE "InviteToken" ADD COLUMN "code" TEXT;
ALTER TABLE "InviteToken" ADD COLUMN "email" TEXT;

-- CreateTable
CREATE TABLE "Strike" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "issuedById" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Strike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Strike_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Rename the bootstrap flag in place so existing admins keep their status.
ALTER TABLE "User" RENAME COLUMN "isBootstrapOfficer" TO "isAdmin";

-- CreateIndex
CREATE INDEX "Strike_userId_idx" ON "Strike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteToken_code_key" ON "InviteToken"("code");

