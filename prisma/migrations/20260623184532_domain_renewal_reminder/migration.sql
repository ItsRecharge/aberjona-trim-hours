-- AlterTable
ALTER TABLE "ChapterSettings" ADD COLUMN "domainReminderSentYear" INTEGER;

-- CreateTable
CREATE TABLE "DomainReminderDismissal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "dismissedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DomainReminderDismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DomainReminderDismissal_userId_year_key" ON "DomainReminderDismissal"("userId", "year");
