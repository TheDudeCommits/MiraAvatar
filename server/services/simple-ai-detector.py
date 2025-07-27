#!/usr/bin/env python3
import sys
import json
import re
import math

def analyze_text_patterns(text):
    """Advanced linguistic pattern analysis for AI detection"""
    
    # Calculate various linguistic features
    features = {}
    
    # Basic text statistics
    words = text.split()
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    features['word_count'] = len(words)
    features['sentence_count'] = len(sentences)
    features['avg_word_length'] = sum(len(word) for word in words) / max(len(words), 1)
    features['avg_sentence_length'] = len(words) / max(len(sentences), 1)
    
    # AI-generated text patterns
    ai_indicators = 0
    total_checks = 0
    
    # 1. Formal language patterns
    formal_phrases = [
        'furthermore', 'additionally', 'moreover', 'however', 'therefore',
        'comprehensive', 'extensive', 'significant', 'substantial', 'considerable',
        'analysis', 'findings', 'implications', 'methodological', 'demonstrates',
        'it is important to note', 'research suggests', 'studies indicate'
    ]
    
    formal_count = sum(1 for phrase in formal_phrases if phrase.lower() in text.lower())
    formal_density = formal_count / max(len(words), 1) * 100
    
    if formal_density > 5:  # High formal phrase density
        ai_indicators += 2
    elif formal_density > 2:
        ai_indicators += 1
    total_checks += 2
    
    # 2. Sentence structure consistency (AI tends to be very consistent)
    sentence_lengths = [len(s.split()) for s in sentences if s.strip()]
    if len(sentence_lengths) > 1:
        length_variance = sum((x - features['avg_sentence_length'])**2 for x in sentence_lengths) / len(sentence_lengths)
        if length_variance < 10:  # Very consistent sentence lengths
            ai_indicators += 1
        total_checks += 1
    
    # 3. Lack of contractions (AI often avoids contractions)
    contractions = ["don't", "won't", "can't", "shouldn't", "wouldn't", "couldn't", "isn't", "aren't", "wasn't", "weren't", "i'm", "you're", "we're", "they're", "i've", "you've", "we've", "they've", "i'll", "you'll", "we'll", "they'll"]
    contraction_count = sum(1 for contraction in contractions if contraction.lower() in text.lower())
    contraction_density = contraction_count / max(len(words), 1) * 100
    
    if contraction_density < 0.5:  # Very few contractions
        ai_indicators += 1
    total_checks += 1
    
    # 4. Redundant phrasing patterns
    redundant_patterns = [
        r'it is (important|crucial|essential|vital) to (note|understand|recognize|consider)',
        r'(furthermore|additionally|moreover), it (should be|is) (noted|mentioned|emphasized)',
        r'(extensive|comprehensive|significant|substantial) (research|analysis|study|investigation)'
    ]
    
    redundant_matches = 0
    for pattern in redundant_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            redundant_matches += 1
    
    if redundant_matches >= 2:
        ai_indicators += 2
    elif redundant_matches >= 1:
        ai_indicators += 1
    total_checks += 2
    
    # 5. Perfect grammar with complex vocabulary (unusual for casual text)
    complex_words = sum(1 for word in words if len(word) > 8)
    complex_word_ratio = complex_words / max(len(words), 1)
    
    # Check for grammar errors (simple heuristics)
    grammar_errors = 0
    if not re.search(r'[.!?]$', text.strip()):  # No ending punctuation
        grammar_errors += 1
    if re.search(r'\s+[.!?]', text):  # Space before punctuation
        grammar_errors += 1
    if re.search(r'[a-z][A-Z]', text):  # Inconsistent capitalization
        grammar_errors += 1
    
    if complex_word_ratio > 0.15 and grammar_errors == 0:  # Complex words + perfect grammar
        ai_indicators += 1
    total_checks += 1
    
    # 6. Casual language detection (more human-like)
    casual_indicators = [
        'lol', 'omg', 'wow', 'cool', 'awesome', 'pretty', 'really', 'super',
        'like', 'kinda', 'sorta', 'gonna', 'wanna', 'yeah', 'nah', 'btw'
    ]
    
    casual_count = sum(1 for indicator in casual_indicators if indicator.lower() in text.lower())
    casual_density = casual_count / max(len(words), 1) * 100
    
    if casual_density > 2:  # High casual language
        ai_indicators -= 1  # Reduces AI probability
    total_checks += 1
    
    # Calculate final probability
    if total_checks > 0:
        ai_probability = min(0.95, max(0.05, ai_indicators / total_checks))
    else:
        ai_probability = 0.5  # Default if no analysis possible
    
    # Adjust based on text length (very short texts are harder to classify)
    if len(words) < 20:
        ai_probability = ai_probability * 0.8 + 0.1  # Less confident for short texts
    
    # Determine label and confidence
    if ai_probability > 0.7:
        label = "AI Generated"
        confidence = ai_probability
    elif ai_probability < 0.3:
        label = "Human Written"
        confidence = 1 - ai_probability
    else:
        label = "AI Generated" if ai_probability >= 0.5 else "Human Written"
        confidence = max(ai_probability, 1 - ai_probability) * 0.7  # Lower confidence for borderline cases
    
    return {
        "probability": ai_probability,
        "label": label,
        "confidence": confidence,
        "features": {
            "formal_density": formal_density,
            "avg_sentence_length": features['avg_sentence_length'],
            "contraction_density": contraction_density,
            "complex_word_ratio": complex_word_ratio,
            "casual_density": casual_density
        }
    }

def main():
    try:
        # Read input text from stdin
        input_text = sys.stdin.read().strip()
        
        if not input_text:
            print(json.dumps({"error": "No input text provided"}))
            sys.exit(1)
        
        # Analyze the text
        result = analyze_text_patterns(input_text)
        
        # Output JSON result
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()