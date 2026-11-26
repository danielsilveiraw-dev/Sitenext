import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  jsonb,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { bots } from "./schema";

export const commandStatusEnum = pgEnum("CommandStatus", [
  "PENDING",
  "PROCESSING",
  "DONE",
  "ERROR",
  "EXPIRED",
]);

export const activityTypeEnum = pgEnum("ActivityType", [
  "PLAYING",
  "LISTENING",
  "WATCHING",
  "COMPETING",
]);

export const presenceStatusEnum = pgEnum("PresenceStatus", [
  "ONLINE",
  "IDLE",
  "DND",
  "INVISIBLE",
]);

export const botCommands = pgTable("BotCommand", {
  id: text("id").primaryKey(),
  botId: text("botId")
    .notNull()
    .references(() => bots.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  payload: jsonb("payload").notNull().default({}),
  status: commandStatusEnum("status").default("PENDING").notNull(),
  result: jsonb("result"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  claimedAt: timestamp("claimedAt"),
  finishedAt: timestamp("finishedAt"),
});

export const botStatuses = pgTable(
  "BotStatus",
  {
    id: text("id").primaryKey(),
    botId: text("botId")
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    type: activityTypeEnum("type").default("PLAYING").notNull(),
    text: text("text").notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (t) => [index("BotStatus_botId_idx").on(t.botId)]
);

export const botSettings = pgTable(
  "BotSettings",
  {
    id: text("id").primaryKey(),
    botId: text("botId")
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    presence: presenceStatusEnum("presence").default("ONLINE").notNull(),
    rotateSeconds: integer("rotateSeconds").default(30).notNull(),
    bannerUrl: text("bannerUrl"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("BotSettings_botId_key").on(t.botId)]
);

export const transcripts = pgTable("Transcript", {
  id: text("id").primaryKey(),
  botId: text("botId")
    .notNull()
    .references(() => bots.id, { onDelete: "cascade" }),
  name: text("name"),
  html: text("html").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});