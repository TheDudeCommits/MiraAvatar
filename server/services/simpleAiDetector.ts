export interface AIDetectionResult {
  probability: number;
  label: 'AI Generated' | 'Human Written';
  confidence: number;
  miraAnalysis: string;
}

export class SimpleAIDetectorService {
  async detectAIText(inputText: string): Promise<AIDetectionResult> {
    console.log('Running DeefakeTextDetection Python script (user provided algorithm)...');
    
    // ALWAYS use the user's Python script - NO FALLBACKS
    const pythonResult = await this.runPythonDetector(inputText);
    
    if (pythonResult.error) {
      throw new Error(`DeefakeTextDetection script failed: ${pythonResult.error}`);
    }

    const miraAnalysis = this.generateSimpleMiraAnalysis(inputText, pythonResult.probability, pythonResult.label);
    
    return {
      probability: pythonResult.probability,
      label: pythonResult.label,
      confidence: this.calculateConfidence(pythonResult.probability),
      miraAnalysis
    };
  }

  private async runPythonDetector(text: string): Promise<{ probability: number; label: 'AI Generated' | 'Human Written'; error?: string }> {
    return new Promise((resolve) => {
      const { spawn } = require('child_process');
      const python = spawn('python3', ['server/services/ai-detector.py', text]);
      
      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data: any) => {
        output += data.toString();
      });

      python.stderr.on('data', (data: any) => {
        errorOutput += data.toString();
      });

      python.on('close', (code: number) => {
        if (code !== 0) {
          console.error('DeefakeTextDetection script error:', errorOutput);
          resolve({ probability: 0.5, label: 'AI Generated', error: errorOutput });
          return;
        }

        try {
          const result = JSON.parse(output.trim());
          console.log(`DeefakeTextDetection result: ${(result.probability * 100).toFixed(1)}% AI probability (${result.label})`);
          resolve({
            probability: result.probability,
            label: result.label as 'AI Generated' | 'Human Written'
          });
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          resolve({ probability: 0.5, label: 'AI Generated', error: 'Failed to parse result' });
        }
      });
    });
  }

  private analyzeTextCharacteristics(text: string): {probability: number, label: 'AI Generated' | 'Human Written'} {
    const textLength = text.length;
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const avgWordLength = text.replace(/[^a-zA-Z]/g, '').length / Math.max(wordCount, 1);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = wordCount / Math.max(sentences.length, 1);
    
    let aiProbability = 0.5; // Start neutral
    
    // Structural analysis
    if (avgSentenceLength > 25) aiProbability += 0.15; // Very long sentences
    if (avgWordLength > 5.5) aiProbability += 0.1; // Complex vocabulary
    if (sentences.length > 2 && sentences.every(s => s.trim().length > 10)) aiProbability += 0.1; // Consistent length
    
    // AI-typical patterns
    const aiPatterns = [
      /\b(furthermore|moreover|additionally|consequently|therefore|however)\b/gi,
      /\b(it's worth noting|it's important to|as an AI|I should mention)\b/gi,
      /\b(in conclusion|to summarize|in summary|overall)\b/gi,
      /\b(comprehensive|extensive|various|numerous|significant)\b/gi
    ];
    
    aiPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        aiProbability += matches.length * 0.08;
      }
    });
    
    // Human-typical patterns
    const humanPatterns = [
      /\b(uh|um|like|you know|I mean|actually|basically)\b/gi,
      /\b(lol|haha|omg|btw|tbh|imo|fyi)\b/gi,
      /[.]{3,}|\?\?\?|!!!+|wow|cool|awesome/gi,
      /\b(I think|I feel|I guess|maybe|probably)\b/gi
    ];
    
    humanPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        aiProbability -= matches.length * 0.12;
      }
    });
    
    // Length-based adjustments
    if (wordCount < 20) aiProbability -= 0.1; // Short texts often human
    if (wordCount > 200) aiProbability += 0.05; // Long formal texts often AI
    
    // Punctuation analysis
    const exclamations = (text.match(/!/g) || []).length;
    const questions = (text.match(/\?/g) || []).length;
    if (exclamations + questions > wordCount * 0.05) aiProbability -= 0.1; // Emotional punctuation
    
    // Vocabulary complexity
    const uniqueWords = new Set(text.toLowerCase().match(/\b\w+\b/g) || []);
    const vocabularyRichness = uniqueWords.size / Math.max(wordCount, 1);
    if (vocabularyRichness > 0.7) aiProbability += 0.1; // Very diverse vocabulary
    
    // Personal pronouns (humans use more first person)
    const firstPersonCount = (text.match(/\b(I|me|my|mine|myself)\b/gi) || []).length;
    const firstPersonRatio = firstPersonCount / Math.max(wordCount, 1);
    if (firstPersonRatio > 0.05) aiProbability -= 0.1;
    
    // Add controlled randomness for realism
    const randomFactor = (Math.random() - 0.5) * 0.1;
    aiProbability += randomFactor;
    
    // Clamp probability between 0.05 and 0.95 for realism
    aiProbability = Math.max(0.05, Math.min(0.95, aiProbability));
    
    const label: 'AI Generated' | 'Human Written' = aiProbability > 0.5 ? 'AI Generated' : 'Human Written';
    
    console.log(`Text analysis complete: ${(aiProbability * 100).toFixed(1)}% AI probability (${label})`);
    
    return {
      probability: aiProbability,
      label
    };
  }

  private calculateConfidence(probability: number): number {
    // Calculate confidence based on how far the probability is from 0.5 (uncertain)
    const distance = Math.abs(probability - 0.5);
    return Math.min(distance * 2, 1); // Scale to 0-1 range
  }

  private generateSimpleMiraAnalysis(text: string, probability: number, label: string): string {
    const textPreview = text.length > 50 ? text.substring(0, 50) + "..." : text;
    const probPercent = (probability * 100).toFixed(1);
    
    const responses = [
      `Yo! I've scanned "${textPreview}" and my cybernetic neural nets are saying ${probPercent}% chance this is ${label.toLowerCase()}. The writing patterns are pretty telling!`,
      `Analyzed your text snippet there. My detection algorithms show ${probPercent}% probability of being ${label.toLowerCase()}. The structure and word choices give it away.`,
      `Just ran my AI detection protocols on that text. Getting ${probPercent}% confidence it's ${label.toLowerCase()}. The linguistic fingerprints are quite clear.`,
      `Processed that text sample through my detection matrix. Results: ${probPercent}% likelihood of ${label.toLowerCase()}. The patterns are distinctive!`,
      `My analysis engine churned through your text and found ${probPercent}% probability it's ${label.toLowerCase()}. The stylistic markers tell the story.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

export const simpleAiDetectorService = new SimpleAIDetectorService();