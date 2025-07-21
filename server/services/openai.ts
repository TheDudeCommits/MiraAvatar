import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || ""
});

export interface CVAnalysisResult {
  strengths: string[];
  improvements: string[];
  score: number;
  feedback: string;
}

export class OpenAIService {
  async analyzeCv(extractedText: string): Promise<CVAnalysisResult> {
    try {
      // Optimize input length and use faster model for speed
      const optimizedText = extractedText.length > 2000 ? extractedText.substring(0, 2000) + "..." : extractedText;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Optimized for speed
        messages: [
          {
            role: "system",
            content: `CV analyzer. Provide concise feedback in JSON format:
{
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "score": number,
  "feedback": "brief 2-3 sentence summary for voice delivery"
}`
          },
          {
            role: "user",
            content: `Analyze CV:\n\n${optimizedText}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2, // Optimized for speed and consistency
        max_tokens: 400 // Reduced for faster processing
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        strengths: result.strengths || [],
        improvements: result.improvements || [],
        score: Math.max(0, Math.min(100, result.score || 0)),
        feedback: result.feedback || "Unable to generate feedback at this time."
      };
    } catch (error) {
      console.error("OpenAI analysis error:", error);
      throw new Error(`Failed to analyze CV: ${error}`);
    }
  }

  // Direct chat with AI
  async chatWithAI(message: string, includeVoice: boolean = false): Promise<{ text: string; audioUrl?: string }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Faster model for chat responses
        messages: [
          {
            role: "system",
            content: "You are a helpful AI career coach and assistant. Provide friendly, professional, and informative responses to user questions. Keep responses conversational and engaging."
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.3, // Optimized for speed
        max_tokens: 150 // Reduced for faster chat responses
      });

      const text = response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
      
      const result: { text: string; audioUrl?: string } = { text };
      
      if (includeVoice) {
        // Generate audio for the response if requested
        const { elevenLabsService } = await import("./elevenlabs");
        result.audioUrl = await elevenLabsService.generateSpeech(text);
      }
      
      return result;
    } catch (error) {
      console.error("OpenAI chat error:", error);
      throw new Error(`Failed to chat with AI: ${error}`);
    }
  }

  // OPTIMIZED Live voice chat processing
  async processVoiceInput(audioData: Buffer): Promise<{ text: string; response: string; audioUrl: string }> {
    try {
      // Create file-like object for OpenAI
      const audioFile = this.createAudioFile(audioData, "audio.wav");
      
      // First, transcribe the audio input using OpenAI Whisper (optimized)
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        response_format: "text",
        temperature: 0.0 // Optimized for speed
      });

      // Handle the transcription result properly for voice input
      const userText = typeof transcription === 'string' ? transcription : transcription.text || '';
      
      if (!userText || userText.trim() === '') {
        throw new Error('Voice transcription returned empty result - please try speaking again');
      }
      
      // Generate FASTER AI response
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Faster model
        messages: [
          {
            role: "system",
            content: "You are Mira, a career coach. Be helpful and concise. Keep responses under 80 words for voice interactions."
          },
          {
            role: "user",
            content: userText
          }
        ],
        temperature: 0.3, // Optimized for speed
        max_tokens: 80 // Reduced for faster processing
      });
      
      const responseText = response.choices[0].message.content || "I understand.";
      
      // Generate voice response (optimized)
      const { elevenLabsService } = await import("./elevenlabs");
      const audioUrl = await elevenLabsService.generateSpeech(responseText);
      
      return {
        text: userText,
        response: responseText,
        audioUrl
      };
    } catch (error) {
      console.error("Voice processing error:", error);
      throw new Error(`Failed to process voice input: ${error}`);
    }
  }

  // Transcribe audio for real-time chat (OPTIMIZED)
  async transcribeAudio(audioData: Buffer): Promise<{ text: string }> {
    try {
      const audioFile = this.createAudioFile(audioData, "audio.wav");
      
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        response_format: "text",
        temperature: 0.0 // Optimized for speed
      });

      // Handle the transcription result properly
      const transcriptionText = typeof transcription === 'string' ? transcription : transcription.text || '';
      
      if (!transcriptionText || transcriptionText.trim() === '') {
        throw new Error('Transcription returned empty or invalid result');
      }

      return {
        text: transcriptionText
      };
    } catch (error) {
      console.error("Audio transcription error:", error);
      throw new Error(`Failed to transcribe audio: ${error}`);
    }
  }

  // FIXED Chat with conversation context
  async chatWithContext(message: string, conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<string> {
    try {
      // Validate input message
      if (!message || typeof message !== 'string' || message.trim() === '') {
        throw new Error('Invalid message: message cannot be empty or null');
      }

      // Build context-aware messages with proper validation
      const recentHistory = conversationHistory.slice(-4).filter(msg => 
        msg.content && typeof msg.content === 'string' && msg.content.trim() !== ''
      );
      
      const messages = [
        {
          role: "system" as const,
          content: "You are Mira, a career coach. Be helpful and concise. Keep responses under 100 words for voice interactions."
        },
        ...recentHistory,
        {
          role: "user" as const,
          content: message.trim()
        }
      ];

      console.log('OpenAI context chat messages:', messages.map(m => ({ role: m.role, content: m.content?.substring(0, 50) + '...' })));

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.3,
        max_tokens: 150
      });

      const result = response.choices[0].message.content;
      if (!result || typeof result !== 'string') {
        throw new Error('OpenAI returned invalid response');
      }

      return result;
    } catch (error) {
      console.error("OpenAI context chat error:", error);
      throw new Error(`Failed to chat with context: ${error}`);
    }
  }

  // Helper method to create File-like object for Node.js
  private createAudioFile(audioData: Buffer, filename: string): any {
    try {
      // Create a temporary file path
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFilePath = path.join(tempDir, `${Date.now()}_${filename}`);
      fs.writeFileSync(tempFilePath, audioData);
      
      // Create a readable stream for the file
      const fileStream = fs.createReadStream(tempFilePath);
      
      // Add cleanup after stream ends
      fileStream.on('end', () => {
        setTimeout(() => {
          try {
            fs.unlinkSync(tempFilePath);
          } catch (err) {
            console.log('Error cleaning up temp file:', err);
          }
        }, 1000);
      });
      
      return fileStream;
    } catch (error) {
      console.error('Error creating audio file:', error);
      // Fallback: create a stream directly from buffer
      const stream = new Readable();
      stream.push(audioData);
      stream.push(null);
      return stream;
    }
  }

  // Chat with conversation context for real-time conversations
  async chatWithContext(
    message: string, 
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    try {
      // Build messages array with conversation history
      const messages = [
        {
          role: "system" as const,
          content: "You are a helpful AI career coach and assistant engaged in a live voice conversation. Provide natural, conversational responses that flow well when spoken aloud. Keep responses concise but engaging, as this is real-time voice chat."
        },
        // Add conversation history
        ...conversationHistory.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        })),
        // Add current message
        {
          role: "user" as const,
          content: message
        }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Faster model for real-time conversation
        messages,
        temperature: 0.5, // Balanced for speed and quality
        max_tokens: 150, // Shorter for faster responses
      });

      return response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error("OpenAI context chat error:", error);
      throw new Error(`Failed to chat with context: ${error}`);
    }
  }
}

export const openaiService = new OpenAIService();