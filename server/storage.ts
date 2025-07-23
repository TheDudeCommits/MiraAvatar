import { 
  users, 
  cvAnalyses, 
  chatMessages, 
  voiceSessions,
  chatSessions,
  sessionMessages,
  type User, 
  type InsertUser, 
  type CvAnalysis, 
  type InsertCvAnalysis,
  type ChatMessage,
  type InsertChatMessage,
  type VoiceSession,
  type InsertVoiceSession,
  type ChatSession,
  type InsertChatSession,
  type SessionMessage,
  type InsertSessionMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

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
  
  // Chat Session Management
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSessions(limit?: number): Promise<ChatSession[]>;
  getChatSession(id: number): Promise<ChatSession | undefined>;
  updateChatSession(id: number, updates: Partial<ChatSession>): Promise<ChatSession | undefined>;
  deleteChatSession(id: number): Promise<boolean>;
  setActiveSession(id: number): Promise<void>;
  
  // Session Messages
  createSessionMessage(message: InsertSessionMessage): Promise<SessionMessage>;
  getSessionMessages(sessionId: number, limit?: number): Promise<SessionMessage[]>;
  updateSessionMessage(id: number, updates: Partial<SessionMessage>): Promise<SessionMessage | undefined>;
  deleteSessionMessage(id: number): Promise<boolean>;
  
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

  // Chat Session Management
  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    // Set all existing sessions to inactive first
    await db.update(chatSessions).set({ isActive: false });
    
    const [chatSession] = await db
      .insert(chatSessions)
      .values({
        ...session,
        isActive: true,
        messageCount: 0
      })
      .returning();
    return chatSession;
  }

  async getChatSessions(limit: number = 50): Promise<ChatSession[]> {
    return await db
      .select()
      .from(chatSessions)
      .orderBy(desc(chatSessions.updatedAt))
      .limit(limit);
  }

  async getChatSession(id: number): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, id));
    return session || undefined;
  }

  async updateChatSession(id: number, updates: Partial<ChatSession>): Promise<ChatSession | undefined> {
    const [updated] = await db
      .update(chatSessions)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(chatSessions.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteChatSession(id: number): Promise<boolean> {
    try {
      await db.delete(chatSessions).where(eq(chatSessions.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting chat session:', error);
      return false;
    }
  }

  async setActiveSession(id: number): Promise<void> {
    // Set all sessions to inactive
    await db.update(chatSessions).set({ isActive: false });
    // Set the specified session to active
    await db.update(chatSessions).set({ isActive: true }).where(eq(chatSessions.id, id));
  }

  // Session Messages
  async createSessionMessage(message: InsertSessionMessage): Promise<SessionMessage> {
    const [sessionMessage] = await db
      .insert(sessionMessages)
      .values(message)
      .returning();

    // Update the parent session with message count and last message
    const messageCount = await db
      .select()
      .from(sessionMessages)
      .where(eq(sessionMessages.sessionId, message.sessionId));
    
    await db
      .update(chatSessions)
      .set({
        messageCount: messageCount.length + 1,
        lastMessage: message.content.substring(0, 100),
        updatedAt: new Date()
      })
      .where(eq(chatSessions.id, message.sessionId));

    return sessionMessage;
  }

  async getSessionMessages(sessionId: number, limit: number = 100): Promise<SessionMessage[]> {
    return await db
      .select()
      .from(sessionMessages)
      .where(eq(sessionMessages.sessionId, sessionId))
      .orderBy(sessionMessages.createdAt)
      .limit(limit);
  }

  async updateSessionMessage(id: number, updates: Partial<SessionMessage>): Promise<SessionMessage | undefined> {
    const [updated] = await db
      .update(sessionMessages)
      .set(updates)
      .where(eq(sessionMessages.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSessionMessage(id: number): Promise<boolean> {
    try {
      await db.delete(sessionMessages).where(eq(sessionMessages.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting session message:', error);
      return false;
    }
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
