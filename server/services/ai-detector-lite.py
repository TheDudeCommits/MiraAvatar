#!/usr/bin/env python3
"""
Lightweight AI Detection Script
This is a simplified version that provides AI detection capabilities
when the full ML model dependencies are not available.
"""

import sys
import json
import re
import string
from collections import Counter
import math

def calculate_text_features(text):
    """Calculate linguistic features that indicate AI vs human writing"""
    
    # Basic text statistics
    word_count = len(text.split())
    sentence_count = len([s for s in re.split(r'[.!?]+', text) if s.strip()])
    avg_word_length = sum(len(word.strip(string.punctuation)) for word in text.split()) / max(word_count, 1)
    avg_sentence_length = word_count / max(sentence_count, 1)
    
    # Vocabulary sophistication
    sophisticated_words = [
        'comprehensive', 'analysis', 'demonstrates', 'significant', 'patterns',
        'extensive', 'insights', 'implications', 'furthermore', 'therefore',
        'consequently', 'moreover', 'additionally', 'substantial', 'considerable',
        'methodological', 'systematic', 'empirical', 'theoretical', 'paradigm',
        'framework', 'methodology', 'approach', 'perspective', 'investigation'
    ]
    
    sophisticated_count = sum(1 for word in text.lower().split() 
                            if any(soph in word for soph in sophisticated_words))
    sophistication_ratio = sophisticated_count / max(word_count, 1)
    
    # Sentence structure patterns (AI tends to use more formal structures)
    formal_patterns = [
        r'\bfurthermore\b', r'\btherefore\b', r'\bconsequently\b', r'\bmoreover\b',
        r'\bin conclusion\b', r'\bit is important to note\b', r'\bthis suggests\b',
        r'\bthe analysis shows\b', r'\bthe results indicate\b', r'\bthis demonstrates\b'
    ]
    
    formal_pattern_count = sum(1 for pattern in formal_patterns 
                              if re.search(pattern, text.lower()))
    formal_ratio = formal_pattern_count / max(sentence_count, 1)
    
    # Repetitive phrase detection
    words = text.lower().split()
    trigrams = [' '.join(words[i:i+3]) for i in range(len(words)-2)]
    trigram_counts = Counter(trigrams)
    repetition_score = sum(1 for count in trigram_counts.values() if count > 1) / max(len(trigrams), 1)
    
    # Punctuation and formatting patterns
    exclamation_ratio = text.count('!') / max(len(text), 1)
    question_ratio = text.count('?') / max(len(text), 1)
    casual_markers = ['lol', 'omg', 'btw', 'tbh', 'imo', 'like', 'really', 'super', 'kinda']
    casual_count = sum(1 for marker in casual_markers if marker in text.lower())
    casual_ratio = casual_count / max(word_count, 1)
    
    return {
        'avg_word_length': avg_word_length,
        'avg_sentence_length': avg_sentence_length,
        'sophistication_ratio': sophistication_ratio,
        'formal_ratio': formal_ratio,
        'repetition_score': repetition_score,
        'exclamation_ratio': exclamation_ratio,
        'question_ratio': question_ratio,
        'casual_ratio': casual_ratio
    }

def detect_ai_probability(text):
    """
    Detect AI-generated text probability using linguistic analysis.
    This mimics the behavior of the ML model but uses rule-based features.
    """
    
    features = calculate_text_features(text)
    
    # Scoring algorithm based on observed AI patterns
    ai_score = 0
    
    # Long, sophisticated words and sentences indicate AI
    if features['avg_word_length'] > 6:
        ai_score += 0.2
    if features['avg_sentence_length'] > 20:
        ai_score += 0.15
    
    # High sophistication vocabulary
    if features['sophistication_ratio'] > 0.15:
        ai_score += 0.25
    
    # Formal academic patterns
    if features['formal_ratio'] > 0.3:
        ai_score += 0.2
    
    # Low casual language usage
    if features['casual_ratio'] < 0.05:
        ai_score += 0.1
    
    # Low exclamation/question usage (AI is more formal)
    if features['exclamation_ratio'] < 0.01 and features['question_ratio'] < 0.02:
        ai_score += 0.1
    
    # Repetitive patterns
    ai_score += min(features['repetition_score'] * 0.3, 0.2)
    
    # Adjust for text length (very short texts are harder to classify)
    text_length = len(text.split())
    if text_length < 20:
        ai_score *= 0.7  # Reduce confidence for short texts
    
    # Ensure probability is between 0 and 1
    probability = min(max(ai_score, 0.1), 0.99)
    
    # Calculate confidence based on how certain the features are
    confidence = abs(probability - 0.5) * 2  # Higher when probability is closer to 0 or 1
    confidence = min(max(confidence, 0.3), 0.95)
    
    return probability, confidence

def main():
    """Main function to process input text and return AI detection results"""
    try:
        # Read text from stdin
        text = sys.stdin.read().strip()
        
        if not text:
            print(json.dumps({"error": "No text provided"}))
            sys.exit(1)
        
        # Perform AI detection
        probability, confidence = detect_ai_probability(text)
        
        # Determine label
        label = "AI Generated" if probability > 0.5 else "Human Written"
        
        # Return results in the same format as the ML model
        result = {
            "probability": probability,
            "label": label,
            "confidence": confidence
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()