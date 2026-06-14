/*
  Warnings:

  - You are about to drop the column `date` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `hoursValue` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `eventId` on the `EventSignup` table. All the data in the column will be lost.
  - Added the required column `timeslotId` to the `EventSignup` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Timeslot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "hoursValue" REAL NOT NULL DEFAULT 1.0,
    "quota" INTEGER NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "Timeslot_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HourReport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "date" DATETIME NOT NULL,
    "hoursRequested" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedById" INTEGER,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HourReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HourReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "userAgent" TEXT,
    "lastUsedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdById" INTEGER NOT NULL,
    "approvedById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Event_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("approvedById", "createdAt", "createdById", "description", "id", "location", "status", "title") SELECT "approvedById", "createdAt", "createdById", "description", "id", "location", "status", "title" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_status_idx" ON "Event"("status");
CREATE TABLE "new_EventSignup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timeslotId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "signedUpAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "markedById" INTEGER,
    CONSTRAINT "EventSignup_timeslotId_fkey" FOREIGN KEY ("timeslotId") REFERENCES "Timeslot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventSignup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EventSignup_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EventSignup" ("attended", "id", "markedById", "signedUpAt", "userId") SELECT "attended", "id", "markedById", "signedUpAt", "userId" FROM "EventSignup";
DROP TABLE "EventSignup";
ALTER TABLE "new_EventSignup" RENAME TO "EventSignup";
CREATE UNIQUE INDEX "EventSignup_timeslotId_userId_key" ON "EventSignup"("timeslotId", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Timeslot_eventId_idx" ON "Timeslot"("eventId");

-- CreateIndex
CREATE INDEX "Timeslot_date_idx" ON "Timeslot"("date");

-- CreateIndex
CREATE INDEX "HourReport_status_idx" ON "HourReport"("status");

-- CreateIndex
CREATE INDEX "HourReport_userId_idx" ON "HourReport"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
