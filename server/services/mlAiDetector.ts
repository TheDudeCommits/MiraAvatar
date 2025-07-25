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
  }

  private async callPythonMLModel(text: string): Promise<{probability: number, label: 'AI Generated' | 'Human Written', confidence: number}> {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(__dirname, 'ai-detector.py');
      console.log('Calling Python script:', pythonScript);
      
      // First check if Python dependencies are available
      const checkProcess = spawn('python3', ['-c', 'import torch, transformers; print("Dependencies OK")'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      checkProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python ML dependencies not available, installing...');
          // Try to install packages and retry
          this.tryInstallDependencies().then(() => {
            this.runPythonScript(pythonScript, text).then(resolve).catch(reject);
          }).catch(() => {
            console.error('Failed to install Python dependencies - ML model unavailable');
            reject(new Error('Python ML dependencies not available'));
          });
        } else {
          // Dependencies are available, run the script
          this.runPythonScript(pythonScript, text).then(resolve).catch(reject);
        }
      });
    });
  }

  private async tryInstallDependencies(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Attempting to install Python dependencies...');
      const installProcess = spawn('python3', ['-m', 'pip', 'install', 'torch', 'transformers', 'numpy', 'scikit-learn', '--user', '--no-cache-dir'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      installProcess.on('close', (code) => {
        if (code === 0) {
          console.log('Python dependencies installed successfully');
          resolve();
        } else {
          console.error('Failed to install Python dependencies');
          reject(new Error('Dependency installation failed'));
        }
      });
    });
  }

  private async runPythonScript(pythonScript: string, text: string): Promise<{probability: number, label: 'AI Generated' | 'Human Written', confidence: number}> {
    // First try the full ML model, then fallback to lightweight version
    try {
      return await this.runFullMLModel(pythonScript, text);
    } catch (error) {
      console.log('Full ML model failed, using lightweight AI detector...');
      return await this.runLightweightDetector(text);
    }
  }

  private async runFullMLModel(pythonScript: string, text: string): Promise<{probability: number, label: 'AI Generated' | 'Human Written', confidence: number}> {
    // Try the adapted version of your model first
    const adaptedScript = path.join(__dirname, 'ai-detector-adapted.py');
    try {
      return await this.executeScript(adaptedScript, text, true);
    } catch (error) {
      console.log('Adapted model failed, trying original model...');
      return await this.executeScript(pythonScript, text, false);
    }
  }

  private async executeScript(scriptPath: string, text: string, isAdapted: boolean): Promise<{probability: number, label: 'AI Generated' | 'Human Written', confidence: number}> {
    return new Promise((resolve, reject) => {
      console.log(`Using ${isAdapted ? 'adapted' : 'original'} Python script:`, scriptPath);
      const pythonProcess = spawn('python3', [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.dirname(scriptPath)
      });

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
        
        if (code === 0) {
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
            reject(new Error('Failed to parse Python output'));
          }
        } else {
          console.error('Python script failed:', errorOutput);
          reject(new Error('Python script execution failed'));
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

  private async runLightweightDetector(text: string): Promise<{probability: number, label: 'AI Generated' | 'Human Written', confidence: number}> {
    return new Promise((resolve, reject) => {
      const lightweightScript = path.join(__dirname, 'ai-detector-lite.py');
      console.log('Using lightweight AI detector:', lightweightScript);
      
      const pythonProcess = spawn('python3', [lightweightScript], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.dirname(lightweightScript)
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdin.write(text);
      pythonProcess.stdin.end();

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        console.log('Lightweight detector closed with code:', code);
        
        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            if (result.error) {
              reject(new Error(result.error));
              return;
            }
            console.log('Lightweight detector result:', result);
            resolve({
              probability: result.probability,
              label: result.label as 'AI Generated' | 'Human Written',
              confidence: result.confidence
            });
          } catch (parseError) {
            console.error('Lightweight detector JSON parse error:', parseError);
            reject(new Error('Failed to parse lightweight detector output'));
          }
        } else {
          console.error('Lightweight detector failed:', errorOutput);
          reject(new Error('Lightweight detector execution failed'));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Lightweight detector process error:', error);
        reject(error);
      });
    });
  }
}

export const mlAiDetectorService = new MLAIDetectorService();