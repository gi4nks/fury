-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ImportSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileName" TEXT,
    "totalBookmarks" INTEGER NOT NULL,
    "successfulBookmarks" INTEGER NOT NULL,
    "failedBookmarks" INTEGER NOT NULL,
    "skippedBookmarks" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_ImportSession" ("createdAt", "failedBookmarks", "fileName", "id", "successfulBookmarks", "totalBookmarks") SELECT "createdAt", "failedBookmarks", "fileName", "id", "successfulBookmarks", "totalBookmarks" FROM "ImportSession";
DROP TABLE "ImportSession";
ALTER TABLE "new_ImportSession" RENAME TO "ImportSession";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
