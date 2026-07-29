import fs from "fs";
import path from "path";

export class ElevenLabsConfigurationError extends Error {
  constructor() {
    super("ELEVENLABS_API_KEY is required for speech generation");
    this.name = "ElevenLabsConfigurationError";
  }
}

export class ElevenLabsService {
  private baseUrl = "https://api.elevenlabs.io/v1";

  private getApiKey(): string {
    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
    if (!apiKey) {
      throw new ElevenLabsConfigurationError();
    }
    return apiKey;
  }

  async generateSpeech(text: string, voiceId: string = "aEO01A4wXwd1O8GPgGlF"): Promise<string> {
    try {
      const apiKey = this.getApiKey();

      console.log("Generating speech with ElevenLabs");
      
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey
        },
        body: JSON.stringify({
          text: text, // No character limit as requested
          model_id: "eleven_turbo_v2_5", // Fast model
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.4,
            style: 0.0,
            use_speaker_boost: false
          },
          output_format: "mp3_22050_32",
          optimize_streaming_latency: 4
        })
      });

      if (!response.ok) {
        console.error(`ElevenLabs API request failed with status ${response.status}`);
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      // Get the audio data as a buffer
      const audioBuffer = await response.arrayBuffer();
      
      // Create a unique filename
      const timestamp = Date.now();
      const filename = `speech_${timestamp}.mp3`;
      const filepath = path.join(process.cwd(), 'dist', 'public', 'audio', filename);
      
      // Ensure the audio directory exists
      const audioDir = path.dirname(filepath);
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }
      
      // Save the audio file
      fs.writeFileSync(filepath, Buffer.from(audioBuffer));
      
      // Return the public URL
      const audioUrl = `/audio/${filename}`;
      console.log(`Speech generated successfully: ${audioUrl}`);
      return audioUrl;
      
    } catch (error) {
      if (error instanceof ElevenLabsConfigurationError) {
        console.error(error.message);
        throw error;
      }

      console.error("ElevenLabs TTS request failed");
      throw new Error("ElevenLabs speech generation failed");
    }
  }
}

export const elevenLabsService = new ElevenLabsService();
