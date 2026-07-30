const MAX_AUDIO_RESPONSE_BYTES = 5 * 1024 * 1024;
const MPEG_CONTENT_TYPE = "audio/mpeg";

async function readBoundedAudio(response: Response): Promise<Buffer> {
  if (!response.body) {
    throw new Error("ElevenLabs audio response has no body");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      totalLength += value.byteLength;
      if (totalLength > MAX_AUDIO_RESPONSE_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // The size validation remains authoritative if cancellation fails.
        }
        throw new Error("ElevenLabs audio response is too large");
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  if (totalLength === 0) {
    throw new Error("ElevenLabs audio response is empty");
  }

  return Buffer.concat(chunks, totalLength);
}

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

      const contentType = response.headers
        .get("content-type")
        ?.split(";", 1)[0]
        .trim()
        .toLowerCase();
      if (contentType !== MPEG_CONTENT_TYPE) {
        throw new Error("ElevenLabs returned an unexpected content type");
      }

      const declaredLength = Number(response.headers.get("content-length"));
      if (
        Number.isFinite(declaredLength) &&
        declaredLength > MAX_AUDIO_RESPONSE_BYTES
      ) {
        throw new Error("ElevenLabs audio response is too large");
      }

      const audioBuffer = await readBoundedAudio(response);

      // Keep provider-controlled bytes out of the local file system. Browsers can
      // play this bounded, explicitly typed data URL anywhere an audio URL is used.
      const audioUrl = `data:${MPEG_CONTENT_TYPE};base64,${audioBuffer.toString("base64")}`;
      console.log("Speech generated successfully");
      return audioUrl;
      
    } catch (error) {
      if (error instanceof ElevenLabsConfigurationError) {
        console.error("ElevenLabs API key is not configured");
        throw error;
      }

      console.error("ElevenLabs TTS request failed");
      throw new Error("ElevenLabs speech generation failed");
    }
  }
}

export const elevenLabsService = new ElevenLabsService();
