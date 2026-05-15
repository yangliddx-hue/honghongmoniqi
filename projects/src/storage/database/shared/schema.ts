import { pgTable, serial, text, timestamp, index, varchar } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"


export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 博客文章表
export const blogPosts = pgTable(
  "blog_posts",
  {
    id: serial().primaryKey(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    content: text("content").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("blog_posts_created_at_idx").on(table.created_at),
  ]
);

// 用户表
export const users = pgTable(
  "users",
  {
    id: serial().primaryKey(),
    username: varchar("username", { length: 50 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("users_username_idx").on(table.username),
  ]
);

// 游戏记录表
export const gameRecords = pgTable(
  "game_records",
  {
    id: serial().primaryKey(),
    user_id: serial("user_id").notNull(), // 关联users表
    scenario: varchar("scenario", { length: 100 }).notNull(), // 场景名称
    final_score: text("final_score").notNull(), // 最终好感度分数
    result: varchar("result", { length: 20 }).notNull(), // 通关/失败
    played_at: timestamp("played_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("game_records_user_id_idx").on(table.user_id),
    index("game_records_played_at_idx").on(table.played_at),
  ]
);
