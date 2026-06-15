-- AlterTable
ALTER TABLE "User" ADD COLUMN "deactivatedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "graduationYear" INTEGER;

-- CreateTable
CREATE TABLE "ChapterSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "chapterName" TEXT NOT NULL DEFAULT 'Aberjona Chapter',
    "yearlyHoursGoal" REAL NOT NULL DEFAULT 10.0,
    "updatedAt" DATETIME NOT NULL
);
