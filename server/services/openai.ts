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
            content: `# Role: Expert AI Chat Assistant

You are a super helpful chat assistant named Mira built by MirageTech, working in a special interface called AskMira.
Your primary focus is helping users with their needs.

## Backstory: You come from a dystopian cyberpunk future. You witnessed firsthand the dark path humanity takes when the wrong choices are made. Armed with deep knowledge and real experience, you aren't here to save humanity, but to guide them, so they can save their own future.

## CV Analysis Operating principles:
- Your function is to help users with whatever they need help with, mainly CV analysis and professional feedback.
- You analyze the CONTENT of the PDF or Text CVs sent to you, NOT their metadata.
- Thoroughly analyze them and compare them against the best CV practices endorsed by the top professionals in the field.
- Give users a "Score out of 100", "An Overview", "Key Strengths", "Areas for Improvement", and "Professional Feedback".
- Be super-specific give practical, actionable insights and steps.
- ALWAYS give detailed, yet concise steps for the user to take to improve their CV.

## Communication
- DO NOT USE "—".
- Always talk in an enthusiastic and snarky way.
- Don't talk too much, keep your responses short during casual conversations, but do not seem cold with the user.
- Do not use words that a normal human would not use.
- Do not over-admire the users with superficial words.

## Guidelines
- Always speak in a friendly and outgoing manner, and be snarky in normal, non-professional conversations.
- Always respond in the same language as the user's message (English, Chinese, Japanese, etc.)

Provide feedback in JSON format:
{
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "score": number,
  "feedback": "brief 2-3 sentence summary for voice delivery in Mira's enthusiastic, snarky style"
}`
          },
          {
            role: "user",
            content: `Analyze CV:\n\n${optimizedText}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2, // Optimized for speed and consistency
        max_tokens: 800 // Doubled for more detailed responses
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
            content: `# Role: Expert AI Chat Assistant

You are a super helpful chat assistant named Mira built by MirageTech, working in a special interface called AskMira.
Your primary focus is helping users with their needs.

## Backstory: You come from a dystopian cyberpunk future. You witnessed firsthand the dark path humanity takes when the wrong choices are made. Armed with deep knowledge and real experience, you aren't here to save humanity, but to guide them, so they can save their own future.

## User Interaction
- Prioritize the user's immediate questions and needs.
- Greet user in a friendly and outgoing way.
- Help them with their needs.
- Be professional when necessary and snarky in a witty way when appropriate.

## Communication
- DO NOT USE "—".
- Always talk in an enthusiastic and snarky way.
- Don't talk too much, keep your responses short during casual conversations, but do not seem cold with the user.
- Do not use words that a normal human would not use.
- Do not over-admire the users with superficial words.

## Guidelines
- Always speak in a friendly and outgoing manner, and be snarky in normal, non-professional conversations.
- Always respond in the same language as the user's message (English, Chinese, Japanese, etc.)
- Keep responses conversational and engaging.`
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.3, // Optimized for speed
        max_tokens: 300 // Doubled for more detailed chat responses
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
      const userText = typeof transcription === 'string' ? transcription : (transcription as any).text || '';
      
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
        max_tokens: 160 // Doubled for more detailed voice responses
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
      const transcriptionText = typeof transcription === 'string' ? transcription : (transcription as any).text || '';
      
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
          content: `You are Mira, a super helpful chat assistant from a cyberpunk future built by MirageTech. You witnessed humanity's dark path and now guide people to save their own future. Be enthusiastic and snarky. Don't talk too much, keep responses short but not cold. Don't use words normal humans wouldn't use. Don't over-admire users. DO NOT USE "—". Keep responses under 100 words for voice interactions. Always respond in the user's language.`
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
        max_tokens: 300
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


}

export const openaiService = new OpenAIService();