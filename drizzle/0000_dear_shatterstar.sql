CREATE TYPE "public"."BotRole" AS ENUM('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');--> statement-breakpoint
CREATE TYPE "public"."NoticeType" AS ENUM('INFO', 'WARNING', 'MAINTENANCE', 'UPDATE');--> statement-breakpoint
CREATE TYPE "public"."PanelLogCategory" AS ENUM('MESSAGE_SENT', 'MESSAGE_EDITED', 'USER_ADDED', 'USER_REMOVED', 'SYSTEM');--> statement-breakpoint
CREATE TABLE "AdminNotice" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" "NoticeType" DEFAULT 'INFO' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AdminSession" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"userId" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "AdminSession_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "BotAccess" (
	"id" text PRIMARY KEY NOT NULL,
	"botId" text NOT NULL,
	"userId" text NOT NULL,
	"role" "BotRole" DEFAULT 'OWNER' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "BotFeatureFlags" (
	"id" text PRIMARY KEY NOT NULL,
	"botId" text NOT NULL,
	"announcements" boolean DEFAULT true NOT NULL,
	"users" boolean DEFAULT true NOT NULL,
	"logs" boolean DEFAULT true NOT NULL,
	"settings" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "BotFeatureFlags_botId_unique" UNIQUE("botId")
);
--> statement-breakpoint
CREATE TABLE "Bot" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"avatar" text,
	"apiUrl" text,
	"requiredRoleId" text,
	"userId" text NOT NULL,
	"lastHeartbeat" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PanelLog" (
	"id" text PRIMARY KEY NOT NULL,
	"botId" text NOT NULL,
	"userId" text NOT NULL,
	"category" "PanelLogCategory" DEFAULT 'SYSTEM' NOT NULL,
	"action" text NOT NULL,
	"detail" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"avatar" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "BotAccess" ADD CONSTRAINT "BotAccess_botId_Bot_id_fk" FOREIGN KEY ("botId") REFERENCES "public"."Bot"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BotAccess" ADD CONSTRAINT "BotAccess_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BotFeatureFlags" ADD CONSTRAINT "BotFeatureFlags_botId_Bot_id_fk" FOREIGN KEY ("botId") REFERENCES "public"."Bot"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Bot" ADD CONSTRAINT "Bot_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PanelLog" ADD CONSTRAINT "PanelLog_botId_Bot_id_fk" FOREIGN KEY ("botId") REFERENCES "public"."Bot"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PanelLog" ADD CONSTRAINT "PanelLog_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "AdminSession_userId_idx" ON "AdminSession" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession" USING btree ("expiresAt");--> statement-breakpoint
CREATE UNIQUE INDEX "BotAccess_botId_userId_key" ON "BotAccess" USING btree ("botId","userId");--> statement-breakpoint
CREATE INDEX "BotAccess_userId_idx" ON "BotAccess" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "BotAccess_botId_idx" ON "BotAccess" USING btree ("botId");--> statement-breakpoint
CREATE INDEX "Bot_userId_idx" ON "Bot" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "PanelLog_botId_idx" ON "PanelLog" USING btree ("botId");--> statement-breakpoint
CREATE INDEX "PanelLog_userId_idx" ON "PanelLog" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "PanelLog_category_idx" ON "PanelLog" USING btree ("category");--> statement-breakpoint
CREATE INDEX "PanelLog_createdAt_idx" ON "PanelLog" USING btree ("createdAt");