import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import { storage } from "./storage";
import { setupAuthRoutes, requireAuth, optionalAuth } from "./auth";
import { pdfParser } from "./services/pdf-parser";
import { openaiService } from "./services/openai";
import { elevenLabsService } from "./services/elevenlabs";
import { simpleAiDetectorService } from "./services/simpleAiDetector";
import { insertCvAnalysisSchema, insertChatSessionSchema, insertSessionMessageSchema } from "@shared/schema";
import { z } from "zod";

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
      } catch (error) {
        console.error('Database health check failed:', error);
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
    } catch (error) {
      console.error('Health check error:', error);
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

    } catch (error) {
      console.error("Upload error:", error);
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

      console.log(`Returning analysis ${id} with status: ${analysis.status}`);
      
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
      
      console.log('Sending response with status:', response.status);
      res.json(response);
    } catch (error) {
      console.error("Get analysis error:", error);
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

    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Get chat history
  app.get("/api/chat/history", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const messages = await storage.getChatMessages(limit);
      res.json(messages.reverse()); // Return in chronological order
    } catch (error) {
      console.error("Chat history error:", error);
      res.status(500).json({ message: "Failed to get chat history" });
    }
  });

  // AI Text Detection endpoint
  app.post("/api/ai-detect", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ message: "Text is required for AI detection" });
      }

      if (text.length < 10) {
        return res.status(400).json({ message: "Text too short for reliable detection (minimum 10 characters)" });
      }

      console.log(`AI Detection request for text (${text.length} chars):`, text.substring(0, 100) + '...');

      // Run AI detection
      const result = await simpleAiDetectorService.detectAIText(text);
      
      console.log('AI Detection result:', result);

      res.json({
        probability: result.probability,
        label: result.label,
        confidence: result.confidence,
        analysis: result.miraAnalysis,
        textLength: text.length
      });

    } catch (error) {
      console.error("AI Detection error:", error);
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

    } catch (error) {
      console.error("Voice chat error:", error);
      res.status(500).json({ message: "Failed to process voice input" });
    }
  });

  // Voice session management
  app.post("/api/voice/session", async (req, res) => {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const session = await storage.createVoiceSession({
        sessionId,
        status: "active"
      });

      res.json({
        sessionId: session.sessionId,
        status: session.status
      });

    } catch (error) {
      console.error("Voice session error:", error);
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

    } catch (error) {
      console.error("Voice session update error:", error);
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
    } catch (error) {
      console.error("Create session error:", error);
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
    } catch (error) {
      console.error("Get sessions error:", error);
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
    } catch (error) {
      console.error("Get session error:", error);
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
    } catch (error) {
      console.error("Update session error:", error);
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
    } catch (error) {
      console.error("Delete session error:", error);
      res.status(500).json({ message: "Failed to delete chat session" });
    }
  });

  // Set active session
  app.put("/api/sessions/:id/activate", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      await storage.setActiveSession(sessionId);
      res.json({ message: "Session activated successfully" });
    } catch (error) {
      console.error("Activate session error:", error);
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
    } catch (error) {
      console.error("Get session messages error:", error);
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
    } catch (error) {
      console.error("Create session message error:", error);
      res.status(500).json({ message: "Failed to create session message" });
    }
  });

  // Background processing function
  async function processAnalysis(id: number) {
    try {
      console.log(`Starting background processing for analysis ${id}`);
      const analysis = await storage.getCvAnalysis(id);
      if (!analysis) {
        console.error(`Analysis ${id} not found`);
        return;
      }

      console.log(`Processing CV with ${analysis.extractedText.length} characters`);

      // Optimize processing: just do OpenAI analysis first, then speech
      console.log("Starting optimized CV analysis...");
      
      const aiAnalysis = await openaiService.analyzeCv(analysis.extractedText);
      console.log("OpenAI analysis completed:", aiAnalysis);
      
      // Generate speech with the feedback (faster single step)
      const finalAudioUrl = await elevenLabsService.generateSpeech(aiAnalysis.feedback);
      console.log(`Speech generated: ${finalAudioUrl}`);
      
      // Update analysis with results
      console.log("Updating analysis with results...");
      await storage.updateCvAnalysis(id, {
        analysis: aiAnalysis,
        audioUrl: finalAudioUrl,
        status: "completed"
      });
      console.log(`Analysis ${id} completed successfully`);

    } catch (error) {
      console.error("Analysis processing error:", error);
      console.error("Error details:", (error as Error).message);
      console.error("Stack trace:", (error as Error).stack);
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
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`Voice chat session started: ${sessionId}`);
    
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
          
          console.log('🎤 Received voice data for chained processing, size:', message.audioData?.length || 0);
          
          ws.send(JSON.stringify({
            type: 'processing',
            message: 'Processing your voice using chained architecture...',
            step: 'starting'
          }));

          try {
            // Convert base64 audio to buffer
            const audioBuffer = Buffer.from(message.audioData, 'base64');
            console.log('Created audio buffer:', audioBuffer.length, 'bytes');
            
            // Send step-by-step updates to user
            ws.send(JSON.stringify({
              type: 'processing_step',
              step: 'transcription',
              message: 'Converting speech to text with OpenAI Whisper...'
            }));
            
            // Process voice input with conversation context using chained architecture
            const result = await processVoiceWithContext(audioBuffer, session.conversationHistory);
            console.log('Chained processing result:', { text: result.text, responseLength: result.response.length });
            
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
          } catch (error) {
            console.error('Voice processing error in WebSocket:', error);
            session.isProcessing = false;
            
            ws.send(JSON.stringify({
              type: 'error',
              message: `Voice processing failed: ${error.message}`
            }));
          }
        }
        
        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }

      } catch (error) {
        console.error('WebSocket message error:', error);
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
      console.log(`Voice chat session ended: ${sessionId}`);
      voiceSessions.delete(sessionId);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
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
      console.log('Audio buffer size:', audioData.length, 'bytes');
      
      // STEP 1: OpenAI Whisper - Convert speech to text
      const transcription = await openaiService.transcribeAudio(audioData);
      const userText = transcription.text;
      console.log('✅ Transcription complete:', userText);
      
      console.log('🤖 CHAINED ARCHITECTURE - Step 2: OpenAI GPT (Text Processing)');
      console.log('Conversation history length:', conversationHistory.length, 'messages');
      
      // STEP 2: OpenAI GPT - Process text and generate response  
      const aiResponse = await openaiService.chatWithContext(userText, conversationHistory);
      console.log('✅ AI response generated:', aiResponse.substring(0, 100) + '...');
      
      console.log('🎵 CHAINED ARCHITECTURE - Step 3: ElevenLabs (Text-to-Speech)');
      
      // STEP 3: ElevenLabs - Convert text response to speech
      const audioUrl = await elevenLabsService.generateSpeech(aiResponse);
      console.log('✅ Audio synthesis complete:', audioUrl);
      
      console.log('🎯 CHAINED PROCESSING COMPLETE - All 3 steps successful!');
      
      return {
        text: userText,
        response: aiResponse,
        audioUrl
      };
    } catch (error) {
      console.error('❌ Voice processing failed in chained architecture:', error);
      error.step = error.message.includes('transcribe') ? 'whisper' : 
                   error.message.includes('chat') ? 'gpt' : 
                   error.message.includes('speech') ? 'elevenlabs' : 'unknown';
      throw error;
    }
  }

  return httpServer;
}
