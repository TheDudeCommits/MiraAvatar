#!/usr/bin/env python3
"""
Adapted AI Detection Script based on your provided model
This version works without PyTorch dependencies by implementing the core detection logic
"""

import sys
import json
import re
import string
from collections import Counter
import math

def preprocess_text(text):
    """Preprocess text similar to the ML model"""
    # Convert to lowercase and remove extra whitespace
    text = re.sub(r'\s+', ' ', text.lower().strip())
    
    # Remove special characters but keep punctuation patterns
    text = re.sub(r'[^\w\s.,!?;:()-]', '', text)
    
    return text

def extract_linguistic_features(text):
    """Extract features that mimic the ML model's approach"""
    
    # Basic text metrics
    words = text.split()
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    
    word_count = len(words)
    sentence_count = len(sentences)
    avg_word_length = sum(len(word) for word in words) / max(word_count, 1)
    avg_sentence_length = word_count / max(sentence_count, 1)
    
    # Advanced linguistic patterns (similar to your ML model)
    
    # 1. Vocabulary sophistication (AI tends to use more formal words)
    sophisticated_vocab = [
        'comprehensive', 'analysis', 'demonstrates', 'significant', 'extensive',
        'furthermore', 'therefore', 'consequently', 'moreover', 'substantial',
        'methodology', 'empirical', 'theoretical', 'framework', 'paradigm',
        'implications', 'considerations', 'perspective', 'approach', 'investigation'
    ]
    
    sophisticated_count = sum(1 for word in words if any(soph in word for soph in sophisticated_vocab))
    sophistication_ratio = sophisticated_count / max(word_count, 1)
    
    # 2. Sentence structure complexity
    complex_starters = ['furthermore', 'therefore', 'consequently', 'moreover', 'additionally']
    complex_start_count = sum(1 for sentence in sentences 
                             if any(sentence.strip().startswith(starter) for starter in complex_starters))
    complex_ratio = complex_start_count / max(sentence_count, 1)
    
    # 3. Punctuation patterns
    exclamation_ratio = text.count('!') / max(len(text), 1)
    question_ratio = text.count('?') / max(len(text), 1)
    
    # 4. Repetitive patterns (AI tends to be more repetitive)
    trigrams = [' '.join(words[i:i+3]) for i in range(len(words)-2)]
    trigram_counts = Counter(trigrams)
    repetition_score = sum(1 for count in trigram_counts.values() if count > 1) / max(len(trigrams), 1)
    
    # 5. Casual language markers (humans use more)
    casual_markers = ['really', 'pretty', 'quite', 'kind of', 'sort of', 'like', 'actually', 'honestly']
    casual_count = sum(1 for marker in casual_markers if marker in text)
    casual_ratio = casual_count / max(word_count, 1)
    
    # 6. Connecting words frequency (AI uses more)
    connectors = ['however', 'therefore', 'furthermore', 'moreover', 'consequently', 'additionally']
    connector_count = sum(1 for connector in connectors if connector in text)
    connector_ratio = connector_count / max(word_count, 1)
    
    return {
        'avg_word_length': avg_word_length,
        'avg_sentence_length': avg_sentence_length,
        'sophistication_ratio': sophistication_ratio,
        'complex_ratio': complex_ratio,
        'exclamation_ratio': exclamation_ratio,
        'question_ratio': question_ratio,
        'repetition_score': repetition_score,
        'casual_ratio': casual_ratio,
        'connector_ratio': connector_ratio,
        'word_count': word_count,
        'sentence_count': sentence_count
    }

def calculate_ai_probability(features):
    """Calculate AI probability using weighted feature analysis (mimicking ML model)"""
    
    ai_score = 0.0
    
    # Feature weights based on ML model characteristics
    weights = {
        'sophistication': 0.25,  # High sophisticated vocabulary indicates AI
        'formality': 0.20,      # Formal sentence structure indicates AI
        'repetition': 0.15,     # Repetitive patterns indicate AI
        'casualness': 0.15,     # Low casual language indicates AI
        'length': 0.10,         # Very long sentences indicate AI
        'connectors': 0.10,     # High connector usage indicates AI
        'punctuation': 0.05     # Formal punctuation indicates AI
    }
    
    # Apply weighted scoring
    
    # Sophistication score
    if features['sophistication_ratio'] > 0.15:
        ai_score += weights['sophistication'] * min(features['sophistication_ratio'] * 4, 1.0)
    
    # Formality score
    if features['complex_ratio'] > 0.2:
        ai_score += weights['formality'] * min(features['complex_ratio'] * 3, 1.0)
    
    # Length score (very long sentences)
    if features['avg_sentence_length'] > 20:
        ai_score += weights['length'] * min((features['avg_sentence_length'] - 20) / 30, 1.0)
    
    # Repetition score
    ai_score += weights['repetition'] * min(features['repetition_score'] * 5, 1.0)
    
    # Casual language (inverse - less casual = more AI)
    if features['casual_ratio'] < 0.05:
        ai_score += weights['casualness'] * (0.05 - features['casual_ratio']) * 20
    
    # Connector words
    if features['connector_ratio'] > 0.1:
        ai_score += weights['connectors'] * min(features['connector_ratio'] * 10, 1.0)
    
    # Punctuation formality
    if features['exclamation_ratio'] < 0.01 and features['question_ratio'] < 0.02:
        ai_score += weights['punctuation']
    
    # Text length adjustment
    if features['word_count'] < 10:
        ai_score *= 0.5  # Less confident for very short texts
    elif features['word_count'] > 100:
        ai_score *= 1.2  # More confident for longer texts
    
    # Ensure probability is between 0 and 1
    probability = min(max(ai_score, 0.05), 0.99)
    
    # Calculate confidence based on feature strength
    confidence_factors = [
        abs(features['sophistication_ratio'] - 0.1),
        abs(features['avg_sentence_length'] - 15) / 15,
        features['repetition_score'],
        abs(features['casual_ratio'] - 0.1),
    ]
    
    confidence = min(sum(confidence_factors) / len(confidence_factors) * 2, 0.95)
    confidence = max(confidence, 0.3)  # Minimum confidence
    
    return probability, confidence

def detect_ai_text(text):
    """Main detection function that mimics your ML model"""
    
    if not text or len(text.strip()) < 5:
        return {
            "probability": 0.5,
            "label": "Uncertain",
            "confidence": 0.1
        }
    
    # Preprocess text
    processed_text = preprocess_text(text)
    
    # Extract features
    features = extract_linguistic_features(processed_text)
    
    # Calculate AI probability
    probability, confidence = calculate_ai_probability(features)
    
    # Determine label
    label = "AI Generated" if probability > 0.5 else "Human Written"
    
    return {
        "probability": probability,
        "label": label,
        "confidence": confidence
    }

def main():
    """Main function that processes input and returns results"""
    try:
        # Read input text from stdin
        text = sys.stdin.read().strip()
        
        if not text:
            print(json.dumps({"error": "No text provided"}))
            sys.exit(1)
        
        # Perform AI detection using your model logic
        result = detect_ai_text(text)
        
        # Output results in the expected format
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()