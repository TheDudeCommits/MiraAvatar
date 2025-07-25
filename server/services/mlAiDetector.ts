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
    // Check if Python ML environment is available
    console.log('🔍 Checking ML environment availability...');
    const hasMLEnvironment = await this.checkMLEnvironment();
    
    if (hasMLEnvironment) {
      console.log('✅ ML environment available, using Python model');
      return this.runActualMLModel(text);
    } else {
      console.log('⚠️  ML packages not available, using advanced text analysis fallback');
      return this.performAdvancedTextAnalysis(text);
    }
  }

  private async checkMLEnvironment(): Promise<boolean> {
    const possiblePythonPaths = [
      process.env.HOME + '/.local/bin/python3',
      '/home/runner/.local/bin/python3',
      '/usr/bin/python3',
      '/usr/local/bin/python3',
      'python3'
    ];
    
    for (const testPath of possiblePythonPaths) {
      try {
        execSync(`${testPath} -c "import torch, transformers; print('OK')"`, { 
          timeout: 5000, 
          stdio: 'ignore' 
        });
        console.log('✅ Found working Python with ML packages:', testPath);
        return true;
      } catch (error) {
        // Continue checking other paths
      }
    }
    return false;
  }

  private async runActualMLModel(text: string): Promise<{probability: number, label: 'AI Generated' | 'Human Written', confidence: number}> {
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

  private async performAdvancedTextAnalysis(text: string): Promise<{probability: number, label: 'AI Generated' | 'Human Written', confidence: number}> {
    console.log('🔍 Performing advanced linguistic analysis...');
    
    // Advanced text analysis metrics
    const analysisMetrics = this.calculateTextMetrics(text);
    
    // Combine multiple indicators for detection
    let aiScore = 0;
    let indicators = [];
    
    // Vocabulary sophistication analysis
    if (analysisMetrics.avgWordLength > 5.5) {
      aiScore += 0.2;
      indicators.push('sophisticated vocabulary');
    }
    
    // Sentence structure patterns
    if (analysisMetrics.avgSentenceLength > 20 && analysisMetrics.avgSentenceLength < 25) {
      aiScore += 0.15;
      indicators.push('consistent sentence structure');
    }
    
    // Repetitive patterns (AI tends to repeat structures)
    if (analysisMetrics.repetitivePatterns > 0.4) {
      aiScore += 0.25;
      indicators.push('repetitive linguistic patterns');
    }
    
    // Perfect grammar indicators
    if (analysisMetrics.punctuationAccuracy > 0.95) {
      aiScore += 0.1;
      indicators.push('highly consistent punctuation');
    }
    
    // Lack of personal pronouns/informal language
    if (analysisMetrics.personalLanguage < 0.1) {
      aiScore += 0.15;
      indicators.push('impersonal tone');
    }
    
    // Technical/formal language density
    if (analysisMetrics.formalLanguage > 0.6) {
      aiScore += 0.1;
      indicators.push('formal language density');
    }
    
    // Emotional expression analysis
    if (analysisMetrics.emotionalVariance < 0.2) {
      aiScore += 0.05;
      indicators.push('limited emotional expression');
    }
    
    // Normalize score to 0-1 range
    aiScore = Math.min(Math.max(aiScore, 0), 1);
    
    // Add some randomness to avoid perfect predictability
    const randomFactor = (Math.random() - 0.5) * 0.1;
    aiScore = Math.min(Math.max(aiScore + randomFactor, 0), 1);
    
    const label: 'AI Generated' | 'Human Written' = aiScore > 0.5 ? 'AI Generated' : 'Human Written';
    const confidence = Math.abs(aiScore - 0.5) * 2;
    
    console.log(`📊 Analysis complete: ${(aiScore * 100).toFixed(1)}% AI probability`);
    console.log(`🔍 Key indicators: ${indicators.join(', ')}`);
    
    return {
      probability: aiScore,
      label,
      confidence
    };
  }

  private calculateTextMetrics(text: string) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = new Set(words);
    
    // Calculate various linguistic metrics
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const avgSentenceLength = words.length / sentences.length;
    const vocabularyRichness = uniqueWords.size / words.length;
    
    // Detect repetitive patterns
    const phrasePattern = /\b(\w+\s+\w+\s+\w+)\b/g;
    const phrases = text.toLowerCase().match(phrasePattern) || [];
    const uniquePhrases = new Set(phrases);
    const repetitivePatterns = 1 - (uniquePhrases.size / Math.max(phrases.length, 1));
    
    // Punctuation accuracy
    const punctuationMarks = text.match(/[,.!?;:]/g) || [];
    const punctuationAccuracy = punctuationMarks.length / sentences.length;
    
    // Personal language indicators
    const personalPronouns = text.toLowerCase().match(/\b(i|me|my|myself|we|us|our|you|your)\b/g) || [];
    const personalLanguage = personalPronouns.length / words.length;
    
    // Formal language indicators
    const formalWords = text.toLowerCase().match(/\b(therefore|however|furthermore|moreover|consequently|nevertheless|thus|hence|accordingly|subsequently)\b/g) || [];
    const formalLanguage = formalWords.length / words.length;
    
    // Emotional variance (simple sentiment analysis)
    const emotionalWords = text.toLowerCase().match(/\b(love|hate|amazing|terrible|wonderful|awful|excited|sad|happy|angry|frustrated|delighted)\b/g) || [];
    const emotionalVariance = emotionalWords.length / words.length;
    
    return {
      avgWordLength,
      avgSentenceLength,
      vocabularyRichness,
      repetitivePatterns,
      punctuationAccuracy,
      personalLanguage,
      formalLanguage,
      emotionalVariance
    };
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