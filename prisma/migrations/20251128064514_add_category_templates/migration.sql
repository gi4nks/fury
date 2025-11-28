-- AlterTable
ALTER TABLE "Category" ADD COLUMN "keywords" TEXT;

-- CreateTable
CREATE TABLE "CategoryTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "keywords" TEXT NOT NULL,
    "urlPatterns" TEXT,
    "parentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "isCustom" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "templateSetId" TEXT,
    CONSTRAINT "CategoryTemplate_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CategoryTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CategoryTemplate_templateSetId_fkey" FOREIGN KEY ("templateSetId") REFERENCES "CategoryTemplateSet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CategoryTemplateSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
