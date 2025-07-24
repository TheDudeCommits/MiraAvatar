import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique(),
  username: text("username"),
  password: text("password"), // Optional for social logins
  profileImage: text("profile_image"),
  displayName: text("display_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userAccounts = pgTable("user_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // google, twitter, wallet
  providerAccountId: text("provider_account_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  walletAddress: text("wallet_address"), // For wallet connect
  metadata: jsonb("metadata").$type<{
    twitterHandle?: string;
    googleProfile?: any;
    walletType?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cvAnalyses = pgTable("cv_analyses", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  extractedText: text("extracted_text").notNull(),
  analysis: jsonb("analysis").$type<{
    strengths: string[];
    improvements: string[];
    score: number;
    feedback: string;
    rawFeedback?: string;
  }>(),
  audioUrl: text("audio_url"),
  status: text("status").notNull().default("processing"), // processing, completed, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  response: text("response").notNull(),
  audioUrl: text("audio_url"),
  type: text("type").notNull().default("text"), // text, voice
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const voiceSessions = pgTable("voice_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  status: text("status").notNull().default("inactive"), // inactive, active, processing
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  messageCount: integer("message_count").notNull().default(0),
  lastMessage: text("last_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessionMessages = pgTable("session_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => chatSessions.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  type: text("type").notNull(), // user, assistant
  messageType: text("message_type").notNull().default("text"), // text, voice, cv_analysis
  audioUrl: text("audio_url"),
  metadata: jsonb("metadata").$type<{
    cvAnalysisId?: number;
    voiceSessionId?: string;
    responseLength?: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
  profileImage: true,
  displayName: true,
});

export const insertUserAccountSchema = createInsertSchema(userAccounts).pick({
  userId: true,
  provider: true,
  providerAccountId: true,
  accessToken: true,
  refreshToken: true,
  expiresAt: true,
  walletAddress: true,
  metadata: true,
});

export const insertCvAnalysisSchema = createInsertSchema(cvAnalyses).pick({
  fileName: true,
  extractedText: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  message: true,
  response: true,
  type: true,
});

export const insertVoiceSessionSchema = createInsertSchema(voiceSessions).pick({
  sessionId: true,
  status: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  title: true,
});

export const insertSessionMessageSchema = createInsertSchema(sessionMessages).pick({
  sessionId: true,
  content: true,
  type: true,
  messageType: true,
  audioUrl: true,
  metadata: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserAccount = typeof userAccounts.$inferSelect;
export type InsertUserAccount = z.infer<typeof insertUserAccountSchema>;
export type CvAnalysis = typeof cvAnalyses.$inferSelect;
export type InsertCvAnalysis = z.infer<typeof insertCvAnalysisSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type VoiceSession = typeof voiceSessions.$inferSelect;
export type InsertVoiceSession = z.infer<typeof insertVoiceSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type SessionMessage = typeof sessionMessages.$inferSelect;
export type InsertSessionMessage = z.infer<typeof insertSessionMessageSchema>;
