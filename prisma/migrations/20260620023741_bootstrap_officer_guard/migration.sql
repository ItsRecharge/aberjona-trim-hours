-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "pendingEmail" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "isBootstrapOfficer" BOOLEAN NOT NULL DEFAULT false,
    "graduationYear" INTEGER,
    "deactivatedAt" DATETIME,
    "emailVerifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "deactivatedAt", "email", "emailVerifiedAt", "firstName", "graduationYear", "id", "lastName", "passwordHash", "pendingEmail", "role") SELECT "createdAt", "deactivatedAt", "email", "emailVerifiedAt", "firstName", "graduationYear", "id", "lastName", "passwordHash", "pendingEmail", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
