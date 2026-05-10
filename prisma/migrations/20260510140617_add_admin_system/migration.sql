-- CreateEnum
CREATE TYPE "NoticeType" AS ENUM ('INFO', 'WARNING', 'MAINTENANCE', 'UPDATE');

-- CreateTable
CREATE TABLE "BotFeatureFlags" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "announcements" BOOLEAN NOT NULL DEFAULT true,
    "users" BOOLEAN NOT NULL DEFAULT true,
    "logs" BOOLEAN NOT NULL DEFAULT true,
    "settings" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotFeatureFlags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNotice" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NoticeType" NOT NULL DEFAULT 'INFO',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BotFeatureFlags_botId_key" ON "BotFeatureFlags"("botId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_token_key" ON "AdminSession"("token");

-- AddForeignKey
ALTER TABLE "BotFeatureFlags" ADD CONSTRAINT "BotFeatureFlags_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
