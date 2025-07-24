import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";

// Environment validation
function validateEnvironment() {
  const requiredEnvVars = {
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
    'DATABASE_URL': process.env.DATABASE_URL
  };

  const optionalEnvVars = {
    'ELEVENLABS_API_KEY': process.env.ELEVENLABS_API_KEY
  };

  const missing = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please set these environment variables before starting the application');
    process.exit(1);
  }

  console.log('✅ All required environment variables are set');
  
  // Check optional variables
  const missingOptional = Object.entries(optionalEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);
    
  if (missingOptional.length > 0) {
    console.log('⚠️  Optional environment variables missing (will use fallbacks):', missingOptional.join(', '));
    console.log('📝 Note: ElevenLabs functionality will use mock audio until API key is properly loaded');
  } else {
    console.log('✅ ElevenLabs API key is available for voice generation');
  }
}

// Set NODE_ENV to production if not already set in production environment
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

console.log(`🚀 Starting application in ${process.env.NODE_ENV} mode`);

// Validate environment before proceeding
validateEnvironment();

const app = express();

// AI Detection endpoint (before all middleware)
import { mlAiDetectorService } from "./services/mlAiDetector";
app.post("/api/ai-detect", express.json(), async (req, res) => {
  try {
    console.log('=== AI Detection API Called (No Middleware) ===');
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: "Text is required for AI detection" });
    }

    if (text.length < 10) {
      return res.status(400).json({ message: "Text too short for reliable detection (minimum 10 characters)" });
    }

    console.log(`Processing text (${text.length} chars):`, text.substring(0, 100) + '...');

    const result = await mlAiDetectorService.detectAIText(text);
    console.log('ML AI Detection result:', result);

    res.json({
      probability: result.probability,
      label: result.label,
      confidence: result.confidence,
      analysis: result.miraAnalysis,
      textLength: text.length
    });

  } catch (error) {
    console.error("AI Detection error (no middleware):", error);
    res.status(500).json({ message: "Failed to analyze text for AI detection" });
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve audio files
app.use('/audio', express.static(path.join(process.cwd(), 'dist', 'public', 'audio')));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log('🔧 Registering routes...');
    const server = await registerRoutes(app);

    // Enhanced error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error(`❌ Server error [${status}]:`, message);
      console.error('Error stack:', err.stack);

      res.status(status).json({ message });
    });

    // Environment-based setup with explicit checks
    const isProduction = process.env.NODE_ENV === 'production';
    console.log(`🏗️  Setting up ${isProduction ? 'production' : 'development'} environment...`);

    if (!isProduction) {
      console.log('🔧 Setting up Vite development server...');
      await setupVite(app, server);
    } else {
      console.log('📁 Serving static files for production...');
      serveStatic(app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    
    console.log(`🌐 Starting server on port ${port}...`);
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      console.log(`✅ Server successfully started!`);
      console.log(`🚀 Application running on http://0.0.0.0:${port}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://0.0.0.0:${port}/api/health`);
    });

    // Handle server startup errors
    server.on('error', (error: any) => {
      console.error('❌ Server startup error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please check if another instance is running.`);
      }
      process.exit(1);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('📤 Received SIGTERM, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('📤 Received SIGINT, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Critical startup error:', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);
    process.exit(1);
  }
})();
