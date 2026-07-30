import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { logErrorEvent, logInfoEvent } from '../security';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AIDetectionResult {
  probability: number;
  label: 'AI Generated' | 'Human Written';
  confidence: number;
  miraAnalysis: string;
}

export class MLAIDetectorService {
  async detectAIText(inputText: string): Promise<AIDetectionResult> {
    logInfoEvent('ml_ai_detection_started', {
      characterCount: inputText.length,
    });
    
    // Call Python ML model
    const mlResult = await this.callPythonMLModel(inputText);
    logInfoEvent('ml_ai_detection_completed');
    
    // Generate Mira's cyberpunk analysis
    const miraAnalysis = this.generateMiraAnalysis(inputText, mlResult.probability, mlResult.label);
    
    return {
      probability: mlResult.probability,
      label: mlResult.label,
      confidence: mlResult.confidence,
      miraAnalysis
    };
  }

  private async callPythonMLModel(text: string): Promise<{probability: number, label: 'AI Generated' | 'Human Written', confidence: number}> {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(__dirname, 'ai-detector.py');
      logInfoEvent('ml_model_process_starting');
      
      const pythonProcess = spawn('python3', [pythonScript], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.dirname(pythonScript),
        env: {
          ...process.env,
          LD_LIBRARY_PATH: '/nix/store/*/lib:/usr/lib:/lib:' + (process.env.LD_LIBRARY_PATH || ''),
          PYTHONPATH: process.env.PYTHONPATH || ''
        }
      });

      let output = '';

      // Send text to Python
      pythonProcess.stdin.write(text);
      pythonProcess.stdin.end();

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.resume();

      pythonProcess.on('close', (code) => {
        logInfoEvent('ml_model_process_closed', { exitCode: code });
        
        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            resolve({
              probability: result.probability,
              label: result.label as 'AI Generated' | 'Human Written',
              confidence: result.confidence
            });
          } catch (parseError) {
            logErrorEvent('ml_model_output_parse_failed');
            reject(new Error('Failed to parse ML model output'));
          }
        } else {
          logErrorEvent('ml_model_process_failed');
          reject(new Error('ML model execution failed'));
        }
      });

      pythonProcess.on('error', () => {
        logErrorEvent('ml_model_process_error');
        reject(new Error('ML model process could not start'));
      });
    });
  }

  private generateMiraAnalysis(text: string, probability: number, label: string): string {
    const probPercent = (probability * 100).toFixed(1);
    const textPreview = text.length > 50 ? text.substring(0, 50) + "..." : text;
    
    const responses = [
      `Yo! Just ran "${textPreview}" through my neural detection matrix. Getting ${probPercent}% confidence this is ${label.toLowerCase()}. The ML patterns don't lie!`,
      `Scanned your text with my cybernetic AI detection protocols. Results: ${probPercent}% probability of ${label.toLowerCase()}. The algorithmic fingerprints are crystal clear.`,
      `Processed "${textPreview}" through my advanced detection systems. My neural networks show ${probPercent}% likelihood it's ${label.toLowerCase()}. The data patterns tell the whole story!`,
      `Just analyzed your text sample with my ML detection engine. Getting ${probPercent}% confidence reading for ${label.toLowerCase()}. The linguistic markers are quite distinctive!`,
      `Ran "${textPreview}" through my AI detection algorithms. The probability matrix shows ${probPercent}% chance of ${label.toLowerCase()}. My systems know these patterns well!`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

export const mlAiDetectorService = new MLAIDetectorService();
