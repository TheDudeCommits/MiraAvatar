import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

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
    console.log('=== ML AI Detection Starting ===');
    console.log('Input text preview:', inputText.substring(0, 100) + '...');
    
    try {
      // Call Python ML model
      const mlResult = await this.callPythonMLModel(inputText);
      console.log('ML Model result:', mlResult);
      
      // Generate Mira's cyberpunk analysis
      const miraAnalysis = this.generateMiraAnalysis(inputText, mlResult.probability, mlResult.label);
      
      return {
        probability: mlResult.probability,
        label: mlResult.label,
        confidence: mlResult.confidence,
        miraAnalysis
      };
    } catch (error) {
      console.error('ML Model failed, using fallback algorithm:', error);
      // Fallback to rule-based detection
      return this.fallbackDetection(inputText);
    }
  }

  private fallbackDetection(text: string): AIDetectionResult {
    // Simple rule-based detection when ML model is unavailable
    const aiIndicators = [
      'comprehensive analysis', 'furthermore', 'it is important to note',
      'extensive research', 'considerable implications', 'significant patterns',
      'various aspects', 'in conclusion', 'substantial evidence'
    ];
    
    const matches = aiIndicators.filter(indicator => 
      text.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    
    const probability = Math.min(0.9, 0.3 + (matches * 0.15));
    const confidence = Math.min(0.85, 0.4 + (matches * 0.1));
    
    const miraAnalysis = `Yo! My ML model is offline right now, but I ran your text through my backup detection algorithms. Getting ${(probability * 100).toFixed(1)}% probability this is AI-generated based on linguistic pattern analysis. Not as precise as my neural networks, but still pretty solid!`;
    
    return {
      probability,
      label: probability > 0.5 ? 'AI Generated' : 'Human Written',
      confidence,
      miraAnalysis
    };
  }

  private async callPythonMLModel(text: string): Promise<{probability: number, label: 'AI Generated' | 'Human Written', confidence: number}> {
    return new Promise((resolve, reject) => {
      // Check multiple possible locations for the Python script
      const possiblePaths = [
        path.join(__dirname, 'ai-detector.py'),
        path.join(process.cwd(), 'server', 'services', 'ai-detector.py'),
        path.join(process.cwd(), 'dist', 'server', 'services', 'ai-detector.py'),
        path.join(process.cwd(), 'dist', 'ai-detector.py'),
        './server/services/ai-detector.py',
        './ai-detector.py'
      ];
      
      let pythonScript = '';
      for (const testPath of possiblePaths) {
        try {
          const fs = require('fs');
          if (fs.existsSync(testPath)) {
            pythonScript = testPath;
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }
      
      if (!pythonScript) {
        console.error('Python script not found in any of these locations:', possiblePaths);
        console.log('Environment:', {
          NODE_ENV: process.env.NODE_ENV,
          cwd: process.cwd(),
          __dirname,
          __filename
        });
        reject(new Error('Python AI detection script not found in production deployment'));
        return;
      }
      
      console.log('Found Python script at:', pythonScript);
      
      // Try different Python executables
      const pythonExecutables = ['python3', 'python', '/usr/bin/python3', '/usr/bin/python'];
      let pythonProcess;
      
      for (const pythonExe of pythonExecutables) {
        try {
          pythonProcess = spawn(pythonExe, [pythonScript], {
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: path.dirname(pythonScript)
          });
          console.log(`Successfully spawned Python process with: ${pythonExe}`);
          break;
        } catch (error) {
          console.log(`Failed to spawn with ${pythonExe}:`, error instanceof Error ? error.message : String(error));
          continue;
        }
      }
      
      if (!pythonProcess) {
        reject(new Error('Failed to start Python process with any available executable'));
        return;
      }

      let output = '';
      let errorOutput = '';

      // Send text to Python
      pythonProcess.stdin.write(text);
      pythonProcess.stdin.end();

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        console.log('Python process closed with code:', code);
        if (errorOutput) {
          console.log('Python stderr:', errorOutput);
        }
        
        if (code === 0 && output.trim()) {
          try {
            const result = JSON.parse(output.trim());
            console.log('Parsed result:', result);
            resolve({
              probability: result.probability,
              label: result.label as 'AI Generated' | 'Human Written',
              confidence: result.confidence
            });
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Raw output:', output);
            reject(new Error('Failed to parse Python output: ' + parseError));
          }
        } else {
          console.error('Python script failed with code:', code);
          console.error('Error output:', errorOutput);
          console.error('Standard output:', output);
          reject(new Error(`Python script execution failed with code ${code}: ${errorOutput}`));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Python process error:', error);
        reject(error);
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