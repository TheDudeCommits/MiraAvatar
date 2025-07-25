import { spawn, execSync } from 'child_process';
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
      // Use optimized daemon version for faster loading
      const pythonScript = path.join(__dirname, 'ai-detector-daemon.py');
      console.log('Calling Python script:', pythonScript);
      
      // Enhanced Python path detection for production
      const possiblePythonPaths = [
        process.env.HOME + '/.local/bin/python3',
        '/home/runner/.local/bin/python3',
        '/usr/bin/python3',
        '/usr/local/bin/python3',
        'python3'
      ];
      
      let pythonPath = 'python3'; // Default fallback
      
      // Check which python path exists and has required packages
      for (const testPath of possiblePythonPaths) {
        try {
          execSync(`${testPath} -c "import torch, transformers; print('OK')"`, { 
            timeout: 10000, 
            stdio: 'ignore' 
          });
          pythonPath = testPath;
          console.log('✅ Found working Python with required packages:', pythonPath);
          break;
        } catch (error) {
          console.log('❌ Python path failed:', testPath);
          // Continue to next path
        }
      }
      
      console.log('Using Python path:', pythonPath);
      
      // Enhanced environment variables for Python to find packages
      const env = {
        ...process.env,
        PYTHONPATH: [
          process.env.HOME + '/.local/lib/python3.12/site-packages',
          '/home/runner/.local/lib/python3.12/site-packages',
          '/usr/local/lib/python3.12/site-packages'
        ].join(':'),
        PATH: [
          process.env.HOME + '/.local/bin',
          '/home/runner/.local/bin',
          process.env.PATH
        ].join(':'),
        TOKENIZERS_PARALLELISM: 'false',
        TRANSFORMERS_CACHE: process.env.HOME + '/.cache/huggingface/transformers',
        HF_HOME: process.env.HOME + '/.cache/huggingface'
      };
      
      const pythonProcess = spawn(pythonPath, [pythonScript], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.dirname(pythonScript),
        timeout: 30000, // 30 second timeout for authentic ML model
        env: env
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
        clearTimeout(timeoutId);
        console.log('Python process closed with code:', code);
        console.log('Raw output:', output);
        console.log('Error output:', errorOutput);
        
        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            console.log('Parsed result:', result);
            resolve({
              probability: result.probability,
              label: result.label as 'AI Generated' | 'Human Written',
              confidence: result.confidence
            });
          } catch (parseError: any) {
            console.error('JSON parse error:', parseError);
            console.error('Raw output:', output);
            reject(new Error(`Failed to parse Python output: ${parseError.message}`));
          }
        } else {
          console.error('Python script failed with exit code:', code);
          console.error('Error output:', errorOutput);
          reject(new Error(`Python script execution failed with code ${code}: ${errorOutput}`));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Python process error:', error);
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });

      // Add timeout handling
      const timeoutId = setTimeout(() => {
        pythonProcess.kill('SIGKILL');
        reject(new Error('Python script execution timeout (30s)'));
      }, 30000);
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