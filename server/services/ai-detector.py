#!/usr/bin/env python3
import sys
import json
import re
import math

class DeefakeTextDetection:
    """
    DeepfakeTextDetection Implementation
    Pure Python version adapted from your original algorithm
    """
    
    def __init__(self):
        self.version = "1.0.0"
        
    def analyze_text(self, text):
        """
        Main analysis function using pattern-based detection
        Returns probability of AI generation
        """
        if not text or len(text.strip()) < 10:
            return 0.5  # Neutral for very short text
            
        # Normalize text
        text = text.strip()
        
        # Calculate basic metrics
        word_count = len(text.split())
        sentence_count = len([s for s in re.split(r'[.!?]+', text) if s.strip()])
        avg_sentence_length = word_count / max(sentence_count, 1)
        
        # Pattern analysis similar to your algorithm
        ai_score = 0.0
        
        # Structural patterns (high weights like in ML models)
        if avg_sentence_length > 25:
            ai_score += 0.15
        if avg_sentence_length > 35:
            ai_score += 0.10
            
        # Vocabulary complexity
        complex_words = len([w for w in text.split() if len(w) > 7])
        complexity_ratio = complex_words / max(word_count, 1)
        if complexity_ratio > 0.3:
            ai_score += 0.12
            
        # AI-typical transition words and phrases
        ai_patterns = [
            r'\b(furthermore|moreover|additionally|consequently)\b',
            r'\b(it is important to note|it should be noted|it is worth mentioning)\b',
            r'\b(comprehensive|extensive|significant|substantial)\b',
            r'\b(in conclusion|to summarize|in summary|overall)\b',
            r'\b(various|numerous|multiple|several)\b',
            r'\b(therefore|however|nevertheless|nonetheless)\b'
        ]
        
        for pattern in ai_patterns:
            matches = len(re.findall(pattern, text, re.IGNORECASE))
            ai_score += matches * 0.08
            
        # Formal structure indicators
        if re.search(r'\b(introduction|methodology|analysis|conclusion)\b', text, re.IGNORECASE):
            ai_score += 0.10
            
        # Human-like patterns (subtract from AI score)
        human_patterns = [
            r'\b(uh|um|like|you know|I mean|actually|basically)\b',
            r'\b(lol|haha|omg|btw|tbh|imo|fyi)\b',
            r'[.]{3,}|\?\?\?|!!!+',
            r'\b(I think|I feel|I guess|maybe|probably)\b',
            r'\b(cool|awesome|wow|nice)\b'
        ]
        
        for pattern in human_patterns:
            matches = len(re.findall(pattern, text, re.IGNORECASE))
            ai_score -= matches * 0.12
            
        # Emotional punctuation
        exclamations = len(re.findall(r'!', text))
        questions = len(re.findall(r'\?', text))
        emotional_ratio = (exclamations + questions) / max(word_count, 1)
        if emotional_ratio > 0.05:
            ai_score -= 0.15
            
        # Informal contractions
        contractions = len(re.findall(r"(don't|can't|won't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't)", text, re.IGNORECASE))
        if contractions > 0:
            ai_score -= contractions * 0.05
            
        # Length-based adjustments
        if word_count < 20:
            ai_score -= 0.10
        elif word_count > 200:
            ai_score += 0.05
            
        # Normalize to 0-1 range
        probability = max(0.0, min(1.0, 0.5 + ai_score))
        
        return probability
    
    def classify_text(self, text):
        """
        Classify text as AI Generated or Human Written
        """
        probability = self.analyze_text(text)
        
        if probability >= 0.5:
            label = "AI Generated"
        else:
            label = "Human Written"
            
        return {
            "probability": probability,
            "label": label,
            "confidence": abs(probability - 0.5) * 2,
            "version": self.version
        }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No text provided"}))
        sys.exit(1)
    
    text = sys.argv[1]
    detector = DeefakeTextDetection()
    result = detector.classify_text(text)
    
    print(json.dumps(result))

if __name__ == "__main__":
    main()