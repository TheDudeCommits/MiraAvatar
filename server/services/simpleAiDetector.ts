import { spawn } from 'child_process';
import { openaiService } from './openai';

interface AiDetectionResult {
  probability: number;
  label: string;
  confidence: number;
  miraAnalysis: string;
}

class SimpleAiDetectorService {
  async detectAIText(text: string): Promise<AiDetectionResult> {
    // ALWAYS use the user's Python script - NO FALLBACKS ALLOWED
    const pythonResult = await this.runPythonDetector(text);
    
    if (pythonResult.error) {
      throw new Error(`DeefakeTextDetection script failed: ${pythonResult.error}`);
    }

    // Get Mira's analysis of the result
    const miraAnalysis = await this.getMiraAnalysis(pythonResult.probability, pythonResult.label, text);

    return {
      probability: pythonResult.probability,
      label: pythonResult.label,
      confidence: Math.abs(pythonResult.probability - 0.5) * 2, // Convert to 0-1 confidence
      miraAnalysis
    };
  }

  private async runPythonDetector(text: string): Promise<{ probability: number; label: string; error?: string }> {
    return new Promise((resolve) => {
      const python = spawn('python3', ['server/services/ai-detector.py', text]);
      
      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          console.error('DeefakeTextDetection script error:', errorOutput);
          resolve({ probability: 0.5, label: 'Error', error: errorOutput });
          return;
        }

        try {
          const result = JSON.parse(output.trim());
          console.log(`DeefakeTextDetection result: ${(result.probability * 100).toFixed(1)}% AI probability (${result.label})`);
          resolve(result);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          resolve({ probability: 0.5, label: 'Parse Error', error: 'Failed to parse result' });
        }
      });
    });
  }

  private async getMiraAnalysis(probability: number, label: string, originalText: string): Promise<string> {
    try {
      const prompt = `You are Mira, a cyberpunk AI assistant. Analyze this AI detection result with your snarky, enthusiastic personality:

Detection Result: ${(probability * 100).toFixed(1)}% probability - ${label}

Original text (first 200 chars): "${originalText.substring(0, 200)}${originalText.length > 200 ? '...' : ''}"

Provide a brief, personality-driven analysis in your cyberpunk style. Keep it under 150 words. Use your trademark enthusiasm and slight snark. Don't use the "—" character, use normal human language.`;

      const response = await openaiService.chatWithAI(prompt, false);
      return response.text;
    } catch (error) {
      console.error('Failed to get Mira analysis:', error);
      return `Detection complete! Got a ${(probability * 100).toFixed(1)}% AI probability here. ${label === 'AI Generated' ? 'This text screams synthetic to me' : 'Looks pretty human to my neural networks'}. The patterns are telling a story, and I'm reading it loud and clear.`;
    }
  }
}

export const simpleAiDetectorService = new SimpleAiDetectorService();