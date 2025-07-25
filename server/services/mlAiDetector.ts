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
    console.log('Using ONLY user\'s Python script - NO fallbacks');
    
    // Call ONLY user's Python ML model - NO fallbacks allowed
    const mlResult = await this.executeUserPythonScript(inputText);
    console.log('User\'s ML Model result:', mlResult);
    
    // Generate Mira's cyberpunk analysis
    const miraAnalysis = this.generateMiraAnalysis(inputText, mlResult.probability, mlResult.label);
    
    return {
      probability: mlResult.probability,
      label: mlResult.label,
      confidence: mlResult.confidence,
      miraAnalysis
    };
  }

  private async executeUserPythonScript(text: string): Promise<{probability: number, label: 'AI Generated' | 'Human Written', confidence: number}> {
    // Use ONLY the user's adapted Python script - NO fallbacks, NO dependency checks
    const userScript = path.join(__dirname, 'ai-detector-adapted.py');
    console.log('Executing user\'s Python script:', userScript);
    
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [userScript], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.dirname(userScript)
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
        console.log('User Python script closed with code:', code);
        console.log('User Python script output:', output);
        
        if (code !== 0) {
          console.error('User Python script failed:', errorOutput);
          reject(new Error(`User's Python script failed: ${errorOutput}`));
          return;
        }

        try {
          const result = JSON.parse(output.trim());
          if (result.error) {
            reject(new Error(result.error));
            return;
          }
          
          console.log('User Python script result:', result);
          resolve({
            probability: result.probability,
            label: result.label as 'AI Generated' | 'Human Written',
            confidence: result.confidence
          });
        } catch (parseError) {
          console.error('Failed to parse user Python script output:', parseError);
          reject(new Error('Failed to parse user Python script output'));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Failed to execute user Python script:', error);
        reject(new Error(`Failed to execute user's Python script: ${error.message}`));
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