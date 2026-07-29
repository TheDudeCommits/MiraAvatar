import type { Express } from "express";
import { createServer, type Server } from "http";
import { randomUUID } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import { storage } from "./storage";
import { setupAuthRoutes, requireAuth, optionalAuth } from "./auth";
import { pdfParser } from "./services/pdf-parser";
import { openaiService } from "./services/openai";
import { elevenLabsService } from "./services/elevenlabs";
import { mlAiDetectorService } from "./services/mlAiDetector";
import { insertCvAnalysisSchema, insertChatSessionSchema, insertSessionMessageSchema } from "@shared/schema";
import { z } from "zod";
import { apiRateLimiter, logErrorEvent, logInfoEvent } from "./security";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit for audio
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/webm', 'audio/ogg'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.wav') || file.originalname.endsWith('.mp3') || file.originalname.endsWith('.webm')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {


  // Setup authentication first
  setupAuthRoutes(app);
  app.use("/api", apiRateLimiter);

  // Enhanced health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const healthStatus = {
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        services: {
          database: false,
          openai: !!process.env.OPENAI_API_KEY,
          elevenlabs: !!process.env.ELEVENLABS_API_KEY
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      };

      // Test database connection
      try {
        await storage.healthCheck();
        healthStatus.services.database = true;
      } catch {
        logErrorEvent("database_health_check_failed");
        healthStatus.services.database = false;
      }

      const allServicesHealthy = Object.values(healthStatus.services).every(Boolean);
      
      if (allServicesHealthy) {
        res.json(healthStatus);
      } else {
        res.status(503).json({
          ...healthStatus,
          status: "degraded",
          message: "Some services are not available"
        });
      }
    } catch {
      logErrorEvent("health_check_failed");
      res.status(500).json({
        status: "error",
        timestamp: new Date().toISOString(),
        message: "Health check failed"
      });
    }
  });

  // Upload and analyze CV (unified chat endpoint)
  app.post("/api/upload-cv", upload.single('cv'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Extract text from PDF
      const extractedText = await pdfParser.extractText(req.file.buffer);
      
      // Create initial analysis record
      const analysis = await storage.createCvAnalysis({
        fileName: req.file.originalname,
        extractedText
      });

      // Start async processing
      processAnalysis(analysis.id);

      res.json({ 
        id: analysis.id, 
        status: "processing",
        message: "CV uploaded successfully. Analysis in progress." 
      });

    } catch {
      logErrorEvent("cv_upload_failed");
      res.status(500).json({ message: "Failed to process CV upload" });
    }
  });

  // Get analysis status and results
  app.get("/api/cv/analysis/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getCvAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      logInfoEvent("cv_analysis_returned", { analysisId: id });
      
      // Create a response object with important fields first and truncated text
      const response = {
        id: analysis.id,
        status: analysis.status,
        fileName: analysis.fileName,
        analysis: analysis.analysis,
        audioUrl: analysis.audioUrl,
        createdAt: analysis.createdAt,
        // Truncate extracted text to prevent response size issues
        extractedText: analysis.extractedText.substring(0, 1000) + (analysis.extractedText.length > 1000 ? '...' : '')
      };
      
      logInfoEvent("cv_analysis_response_sent", { analysisId: id });
      res.json(response);
    } catch {
      logErrorEvent("cv_analysis_lookup_failed");
      res.status(500).json({ message: "Failed to get analysis" });
    }
  });

  // Direct AI Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, includeVoice = false } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      // Get AI response
      const aiResponse = await openaiService.chatWithAI(message, includeVoice);
      
      // Save to database
      const chatMessage = await storage.createChatMessage({
        message,
        response: aiResponse.text,
        type: includeVoice ? "voice" : "text"
      });

      // Update with audio URL if voice was requested
      if (includeVoice && aiResponse.audioUrl) {
        await storage.updateChatMessage(chatMessage.id, {
          audioUrl: aiResponse.audioUrl
        });
      }

      res.json({
        id: chatMessage.id,
        message,
        response: aiResponse.text,
        audioUrl: aiResponse.audioUrl,
        type: includeVoice ? "voice" : "text"
      });

    } catch {
      logErrorEvent("chat_request_failed");
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Get chat history
  app.get("/api/chat/history", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const messages = await storage.getChatMessages(limit);
      res.json(messages.reverse()); // Return in chronological order
    } catch {
      logErrorEvent("chat_history_lookup_failed");
      res.status(500).json({ message: "Failed to get chat history" });
    }
  });

  // AI Text Detection endpoint (no auth required)
  app.post("/api/ai-detect", async (req, res) => {
    try {
      console.log('=== AI Detection API Called ===');
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ message: "Text is required for AI detection" });
      }

      if (text.length < 10) {
        return res.status(400).json({ message: "Text too short for reliable detection (minimum 10 characters)" });
      }

      logInfoEvent("ai_detection_requested", { characterCount: text.length });

      // Run AI detection
      console.log('About to call mlAiDetectorService.detectAIText...');
      const result = await mlAiDetectorService.detectAIText(text);
      console.log('ML AI Detection service completed');

      res.json({
        probability: result.probability,
        label: result.label,
        confidence: result.confidence,
        analysis: result.miraAnalysis,
        textLength: text.length
      });

    } catch {
      logErrorEvent("ai_detection_failed");
      res.status(500).json({ message: "Failed to analyze text for AI detection" });
    }
  });

  // Voice chat endpoint (for live voice input)
  app.post("/api/voice/chat", audioUpload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Audio file is required" });
      }

      // Process voice input
      const result = await openaiService.processVoiceInput(req.file.buffer);
      
      // Save to database
      const chatMessage = await storage.createChatMessage({
        message: result.text,
        response: result.response,
        type: "voice"
      });

      await storage.updateChatMessage(chatMessage.id, {
        audioUrl: result.audioUrl
      });

      res.json({
        id: chatMessage.id,
        userText: result.text,
        response: result.response,
        audioUrl: result.audioUrl,
        type: "voice"
      });

    } catch {
      logErrorEvent("voice_chat_failed");
      res.status(500).json({ message: "Failed to process voice input" });
    }
  });

  // Voice session management
  app.post("/api/voice/session", async (req, res) => {
    try {
      const sessionId = `session_${randomUUID()}`;
      
      const session = await storage.createVoiceSession({
        sessionId,
        status: "active"
      });

      res.json({
        sessionId: session.sessionId,
        status: session.status
      });

    } catch {
      logErrorEvent("voice_session_creation_failed");
      res.status(500).json({ message: "Failed to create voice session" });
    }
  });

  app.put("/api/voice/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { status } = req.body;

      const session = await storage.updateVoiceSession(sessionId, {
        status,
        lastActivity: new Date()
      });

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      res.json({
        sessionId: session.sessionId,
        status: session.status
      });

    } catch {
      logErrorEvent("voice_session_update_failed");
      res.status(500).json({ message: "Failed to update voice session" });
    }
  });

  // Chat Session Management API Routes
  
  // Create new chat session
  app.post("/api/sessions", async (req, res) => {
    try {
      const { title } = req.body;
      
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ message: "Session title is required" });
      }

      const session = await storage.createChatSession({ title });
      res.json(session);
    } catch {
      logErrorEvent("chat_session_creation_failed");
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  // Get all chat sessions (optional auth - shows user's sessions if authenticated)
  app.get("/api/sessions", optionalAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const userId = req.isAuthenticated() ? (req.user as any)?.id : null;
      const sessions = await storage.getChatSessions(limit, userId);
      res.json(sessions);
    } catch {
      logErrorEvent("chat_session_list_failed");
      res.status(500).json({ message: "Failed to get chat sessions" });
    }
  });

  // Get specific chat session
  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getChatSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      res.json(session);
    } catch {
      logErrorEvent("chat_session_lookup_failed");
      res.status(500).json({ message: "Failed to get chat session" });
    }
  });

  // Update chat session
  app.put("/api/sessions/:id", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const updates = req.body;

      const session = await storage.updateChatSession(sessionId, updates);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      res.json(session);
    } catch {
      logErrorEvent("chat_session_update_failed");
      res.status(500).json({ message: "Failed to update chat session" });
    }
  });

  // Delete chat session
  app.delete("/api/sessions/:id", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const deleted = await storage.deleteChatSession(sessionId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Session not found" });
      }

      res.json({ message: "Session deleted successfully" });
    } catch {
      logErrorEvent("chat_session_delete_failed");
      res.status(500).json({ message: "Failed to delete chat session" });
    }
  });

  // Set active session
  app.put("/api/sessions/:id/activate", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      await storage.setActiveSession(sessionId);
      res.json({ message: "Session activated successfully" });
    } catch {
      logErrorEvent("chat_session_activation_failed");
      res.status(500).json({ message: "Failed to activate session" });
    }
  });

  // Session Messages API

  // Get messages for a session
  app.get("/api/sessions/:id/messages", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 100;
      
      const messages = await storage.getSessionMessages(sessionId, limit);
      res.json(messages);
    } catch {
      logErrorEvent("chat_session_messages_lookup_failed");
      res.status(500).json({ message: "Failed to get session messages" });
    }
  });

  // Add message to session
  app.post("/api/sessions/:id/messages", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { content, type, messageType, audioUrl, metadata } = req.body;
      
      if (!content || !type) {
        return res.status(400).json({ message: "Content and type are required" });
      }

      const message = await storage.createSessionMessage({
        sessionId,
        content,
        type,
        messageType: messageType || 'text',
        audioUrl,
        metadata
      });

      res.json(message);
    } catch {
      logErrorEvent("chat_session_message_creation_failed");
      res.status(500).json({ message: "Failed to create session message" });
    }
  });

  // Background processing function
  async function processAnalysis(id: number) {
    try {
      logInfoEvent("cv_analysis_processing_started", { analysisId: id });
      const analysis = await storage.getCvAnalysis(id);
      if (!analysis) {
        logErrorEvent("cv_analysis_not_found");
        return;
      }

      logInfoEvent("cv_analysis_text_loaded", {
        analysisId: id,
        characterCount: analysis.extractedText.length,
      });

      // Optimize processing: just do OpenAI analysis first, then speech
      console.log("Starting optimized CV analysis...");
      
      const aiAnalysis = await openaiService.analyzeCv(analysis.extractedText);
      logInfoEvent("openai_cv_analysis_completed", { analysisId: id });
      
      // Generate speech with the feedback (faster single step)
      const finalAudioUrl = await elevenLabsService.generateSpeech(aiAnalysis.feedback);
      logInfoEvent("cv_analysis_speech_generated", { analysisId: id });
      
      // Update analysis with results
      console.log("Updating analysis with results...");
      await storage.updateCvAnalysis(id, {
        analysis: aiAnalysis,
        audioUrl: finalAudioUrl,
        status: "completed"
      });
      logInfoEvent("cv_analysis_processing_completed", { analysisId: id });

    } catch {
      logErrorEvent("cv_analysis_processing_failed");
      await storage.updateCvAnalysis(id, {
        status: "failed"
      });
    }
  }

  const httpServer = createServer(app);

  // WebSocket Server for real-time voice chat
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws'
  });

  // Voice chat session storage
  const voiceSessions = new Map<string, {
    ws: WebSocket;
    sessionId: string;
    isProcessing: boolean;
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  }>();

  wss.on('connection', (ws: WebSocket, req) => {
    const sessionId = `session_${randomUUID()}`;
    
    logInfoEvent("voice_chat_session_started");
    
    // Initialize session
    voiceSessions.set(sessionId, {
      ws,
      sessionId,
      isProcessing: false,
      conversationHistory: []
    });

    // Send initial session info
    ws.send(JSON.stringify({
      type: 'session_started',
      sessionId,
      message: 'Voice chat session established. Start speaking!'
    }));

    ws.on('message', async (data) => {
      try {
        const session = voiceSessions.get(sessionId);
        if (!session || session.isProcessing) {
          return;
        }

        const message = JSON.parse(data.toString());
        
        if (message.type === 'voice_data') {
          // Mark as processing
          session.isProcessing = true;
          
          const encodedAudioLength =
            typeof message.audioData === "string" ? message.audioData.length : 0;
          logInfoEvent("voice_data_received", {
            encodedCharacterCount: encodedAudioLength,
          });
          
          ws.send(JSON.stringify({
            type: 'processing',
            message: 'Processing your voice using chained architecture...',
            step: 'starting'
          }));

          try {
            // Convert base64 audio to buffer
            const audioBuffer = Buffer.from(message.audioData, 'base64');
            logInfoEvent("voice_audio_buffer_created", {
              byteCount: audioBuffer.length,
            });
            
            // Send step-by-step updates to user
            ws.send(JSON.stringify({
              type: 'processing_step',
              step: 'transcription',
              message: 'Converting speech to text with OpenAI Whisper...'
            }));
            
            // Process voice input with conversation context using chained architecture
            const result = await processVoiceWithContext(audioBuffer, session.conversationHistory);
            logInfoEvent("voice_processing_completed", {
              transcriptionCharacterCount: result.text.length,
              responseCharacterCount: result.response.length,
            });
            
            // Send transcription immediately for faster feedback
            ws.send(JSON.stringify({
              type: 'transcription_complete',
              transcription: result.text,
              step: 'text_processing'
            }));
            
            // Update conversation history
            session.conversationHistory.push(
              { role: 'user', content: result.text },
              { role: 'assistant', content: result.response }
            );

            // Keep conversation history manageable (last 10 exchanges)
            if (session.conversationHistory.length > 20) {
              session.conversationHistory = session.conversationHistory.slice(-20);
            }

            // Save to database
            await storage.createChatMessage({
              message: result.text,
              response: result.response,
              type: "voice"
            });

            // Send final complete response
            ws.send(JSON.stringify({
              type: 'voice_response',
              userText: result.text,
              response: result.response,
              audioUrl: result.audioUrl,
              sessionId,
              chainedProcessing: true
            }));

            session.isProcessing = false;
          } catch {
            logErrorEvent("websocket_voice_processing_failed");
            session.isProcessing = false;
            
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Voice processing failed'
            }));
          }
        }
        
        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }

      } catch {
        logErrorEvent("websocket_message_failed");
        const session = voiceSessions.get(sessionId);
        if (session) {
          session.isProcessing = false;
        }
        
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process voice input'
        }));
      }
    });

    ws.on('close', () => {
      logInfoEvent("voice_chat_session_ended");
      voiceSessions.delete(sessionId);
    });

    ws.on('error', () => {
      logErrorEvent("websocket_connection_failed");
      voiceSessions.delete(sessionId);
    });
  });

  // Enhanced voice processing with conversation context
  async function processVoiceWithContext(
    audioData: Buffer, 
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<{ text: string; response: string; audioUrl: string }> {
    try {
      console.log('🎤 CHAINED ARCHITECTURE - Step 1: OpenAI Whisper (Speech-to-Text)');
      logInfoEvent("voice_audio_processing_started", {
        byteCount: audioData.length,
      });
      
      // STEP 1: OpenAI Whisper - Convert speech to text
      const transcription = await openaiService.transcribeAudio(audioData);
      const userText = transcription.text;
      logInfoEvent("voice_transcription_completed", {
        characterCount: userText.length,
      });
      
      console.log('🤖 CHAINED ARCHITECTURE - Step 2: OpenAI GPT (Text Processing)');
      logInfoEvent("voice_context_loaded", {
        messageCount: conversationHistory.length,
      });
      
      // STEP 2: OpenAI GPT - Process text and generate response  
      const aiResponse = await openaiService.chatWithContext(userText, conversationHistory);
      logInfoEvent("voice_ai_response_generated", {
        characterCount: aiResponse.length,
      });
      
      console.log('🎵 CHAINED ARCHITECTURE - Step 3: ElevenLabs (Text-to-Speech)');
      
      // STEP 3: ElevenLabs - Convert text response to speech
      const audioUrl = await elevenLabsService.generateSpeech(aiResponse);
      logInfoEvent("voice_audio_synthesis_completed");
      
      console.log('🎯 CHAINED PROCESSING COMPLETE - All 3 steps successful!');
      
      return {
        text: userText,
        response: aiResponse,
        audioUrl
      };
    } catch (error) {
      logErrorEvent("voice_processing_pipeline_failed");
      throw error;
    }
  }

  return httpServer;
}
