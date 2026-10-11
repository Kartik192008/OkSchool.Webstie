import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const userProfilesTable = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  supabaseUserId: text("supabase_user_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at").notNull().defaultNow(),
});

export const userVisitsTable = pgTable("user_visits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => userProfilesTable.id, { onDelete: "cascade" }),
  page: text("page").notNull(),
  action: text("action"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
