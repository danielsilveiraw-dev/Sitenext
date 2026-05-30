import {
  pgTable,
  pgEnum,
  text,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const botRoleEnum = pgEnum("BotRole", [
  "OWNER",
  "ADMIN",
  "EDITOR",
  "VIEWER",
]);

export const noticeTypeEnum = pgEnum("NoticeType", [
  "INFO",
  "WARNING",
  "MAINTENANCE",
  "UPDATE",
]);

export const panelLogCategoryEnum = pgEnum("PanelLogCategory", [
  "MESSAGE_SENT",
  "MESSAGE_EDITED",
  "USER_ADDED",
  "USER_REMOVED",
  "SYSTEM",
]);

// Tables
export const users = pgTable("User", {
  id: text("id").primaryKey(),
  name: text("name"),
  avatar: text("avatar"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const bots = pgTable(
  "Bot",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    avatar: text("avatar"),
    apiUrl: text("apiUrl"),
    requiredRoleId: text("requiredRoleId"),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastHeartbeat: timestamp("lastHeartbeat"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (t) => [index("Bot_userId_idx").on(t.userId)]
);

export const botFeatureFlags = pgTable("BotFeatureFlags", {
  id: text("id").primaryKey(),
  botId: text("botId")
    .notNull()
    .unique()
    .references(() => bots.id, { onDelete: "cascade" }),
  announcements: boolean("announcements").default(true).notNull(),
  users: boolean("users").default(true).notNull(),
  logs: boolean("logs").default(true).notNull(),
  settings: boolean("settings").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const adminNotices = pgTable("AdminNotice", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: noticeTypeEnum("type").default("INFO").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const adminSessions = pgTable(
  "AdminSession",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    userId: text("userId").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [
    index("AdminSession_userId_idx").on(t.userId),
    index("AdminSession_expiresAt_idx").on(t.expiresAt),
  ]
);

export const botAccesses = pgTable(
  "BotAccess",
  {
    id: text("id").primaryKey(),
    botId: text("botId")
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: botRoleEnum("role").default("OWNER").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("BotAccess_botId_userId_key").on(t.botId, t.userId),
    index("BotAccess_userId_idx").on(t.userId),
    index("BotAccess_botId_idx").on(t.botId),
  ]
);

export const panelLogs = pgTable(
  "PanelLog",
  {
    id: text("id").primaryKey(),
    botId: text("botId")
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: panelLogCategoryEnum("category").default("SYSTEM").notNull(),
    action: text("action").notNull(),
    detail: text("detail"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [
    index("PanelLog_botId_idx").on(t.botId),
    index("PanelLog_userId_idx").on(t.userId),
    index("PanelLog_category_idx").on(t.category),
    index("PanelLog_createdAt_idx").on(t.createdAt),
  ]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bots: many(bots),
  accesses: many(botAccesses),
  logs: many(panelLogs),
}));

export const botsRelations = relations(bots, ({ one, many }) => ({
  user: one(users, { fields: [bots.userId], references: [users.id] }),
  accesses: many(botAccesses),
  logs: many(panelLogs),
  features: one(botFeatureFlags, { fields: [bots.id], references: [botFeatureFlags.botId] }),
}));

export const botFeatureFlagsRelations = relations(botFeatureFlags, ({ one }) => ({
  bot: one(bots, { fields: [botFeatureFlags.botId], references: [bots.id] }),
}));

export const botAccessesRelations = relations(botAccesses, ({ one }) => ({
  bot: one(bots, { fields: [botAccesses.botId], references: [bots.id] }),
  user: one(users, { fields: [botAccesses.userId], references: [users.id] }),
}));

export const panelLogsRelations = relations(panelLogs, ({ one }) => ({
  bot: one(bots, { fields: [panelLogs.botId], references: [bots.id] }),
  user: one(users, { fields: [panelLogs.userId], references: [users.id] }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Bot = typeof bots.$inferSelect;
export type NewBot = typeof bots.$inferInsert;
export type BotFeatureFlags = typeof botFeatureFlags.$inferSelect;
export type AdminNotice = typeof adminNotices.$inferSelect;
export type AdminSession = typeof adminSessions.$inferSelect;
export type BotAccess = typeof botAccesses.$inferSelect;
export type PanelLog = typeof panelLogs.$inferSelect;