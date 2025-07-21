import fs from "fs";
import path from "path";

export class ElevenLabsService {
  private baseUrl = "https://api.elevenlabs.io/v1";

  constructor() {
    // Constructor is now empty - we'll get the API key dynamically
  }

  private getApiKey(): string {
    // Dynamically get the API key each time to ensure it's current
    const key = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_KEY || "";
    console.log(`ElevenLabs API key check: ${key ? `Found key starting with ${key.substring(0, 8)}` : 'No key found'}`);
    return key;
  }

  async generateSpeech(text: string, voiceId: string = "aEO01A4wXwd1O8GPgGlF"): Promise<string> {
    try {
      const apiKey = this.getApiKey();
      if (!apiKey) {
        console.log("No ElevenLabs API key provided, using mock audio");
        console.log("📝 To enable real voice generation, ensure ELEVENLABS_API_KEY is properly set in Account Secrets");
        return "https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav";
      }

      console.log(`Generating speech with ElevenLabs using voice ID: ${voiceId} and API key: ${apiKey.substring(0, 8)}...`);
      
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey
        },
        body: JSON.stringify({
          text: text.length > 800 ? text.substring(0, 800) + "..." : text, // Limit for speed
          model_id: "eleven_turbo_v2_5", // Faster model
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.4,
            style: 0.0,
            use_speaker_boost: false // Disable for speed
          },
          output_format: "mp3_22050_32" // Lower quality for faster generation
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ElevenLabs API error: ${response.status} - ${errorText}`);
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
      console.error("ElevenLabs TTS error:", error);
      // Return mock audio URL on error
      return "https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav";
    }
  }
}

export const elevenLabsService = new ElevenLabsService();
