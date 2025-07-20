import { 
  users, 
  cvAnalyses, 
  chatMessages, 
  voiceSessions,
  type User, 
  type InsertUser, 
  type CvAnalysis, 
  type InsertCvAnalysis,
  type ChatMessage,
  type InsertChatMessage,
  type VoiceSession,
  type InsertVoiceSession
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createCvAnalysis(analysis: InsertCvAnalysis): Promise<CvAnalysis>;
  getCvAnalysis(id: number): Promise<CvAnalysis | undefined>;
  updateCvAnalysis(id: number, updates: Partial<CvAnalysis>): Promise<CvAnalysis | undefined>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(limit?: number): Promise<ChatMessage[]>;
  updateChatMessage(id: number, updates: Partial<ChatMessage>): Promise<ChatMessage | undefined>;
  createVoiceSession(session: InsertVoiceSession): Promise<VoiceSession>;
  getVoiceSession(sessionId: string): Promise<VoiceSession | undefined>;
  updateVoiceSession(sessionId: string, updates: Partial<VoiceSession>): Promise<VoiceSession | undefined>;
  healthCheck(): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createCvAnalysis(analysis: InsertCvAnalysis): Promise<CvAnalysis> {
    const [cvAnalysis] = await db
      .insert(cvAnalyses)
      .values({
        ...analysis,
        status: "processing"
      })
      .returning();
    return cvAnalysis;
  }

  async getCvAnalysis(id: number): Promise<CvAnalysis | undefined> {
    const [analysis] = await db.select().from(cvAnalyses).where(eq(cvAnalyses.id, id));
    return analysis || undefined;
  }

  async updateCvAnalysis(id: number, updates: Partial<CvAnalysis>): Promise<CvAnalysis | undefined> {
    const [updated] = await db
      .update(cvAnalyses)
      .set(updates)
      .where(eq(cvAnalyses.id, id))
      .returning();
    return updated || undefined;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [chatMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return chatMessage;
  }

  async getChatMessages(limit: number = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  async updateChatMessage(id: number, updates: Partial<ChatMessage>): Promise<ChatMessage | undefined> {
    const [updated] = await db
      .update(chatMessages)
      .set(updates)
      .where(eq(chatMessages.id, id))
      .returning();
    return updated || undefined;
  }

  async createVoiceSession(session: InsertVoiceSession): Promise<VoiceSession> {
    const [voiceSession] = await db
      .insert(voiceSessions)
      .values(session)
      .returning();
    return voiceSession;
  }

  async getVoiceSession(sessionId: string): Promise<VoiceSession | undefined> {
    const [session] = await db
      .select()
      .from(voiceSessions)
      .where(eq(voiceSessions.sessionId, sessionId));
    return session || undefined;
  }

  async updateVoiceSession(sessionId: string, updates: Partial<VoiceSession>): Promise<VoiceSession | undefined> {
    const [updated] = await db
      .update(voiceSessions)
      .set(updates)
      .where(eq(voiceSessions.sessionId, sessionId))
      .returning();
    return updated || undefined;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple query to test database connectivity
      await db.select().from(users).limit(1);
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
