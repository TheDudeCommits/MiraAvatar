#!/usr/bin/env python3
import sys
import json
import re

def predict_single_text_fallback(text, threshold=0.5):
    """
    Fallback prediction using pattern analysis when ML model is unavailable.
    Uses sophisticated heuristics based on AI vs Human writing patterns.
    """
    text_length = len(text)
    word_count = len(text.split())
    if word_count == 0:
        return 0.5, 0
        
    avg_word_length = len(text.replace(' ', '')) / word_count
    sentences = [s.strip() for s in text.replace('!', '.').replace('?', '.').split('.') if s.strip()]
    avg_sentence_length = word_count / max(len(sentences), 1)
    
    # Start with neutral probability
    ai_probability = 0.5
    
    # Structural patterns that indicate AI
    if avg_sentence_length > 25: 
        ai_probability += 0.15
    if avg_word_length > 5.5: 
        ai_probability += 0.1
    if len(sentences) > 2 and all(len(s.split()) > 8 for s in sentences): 
        ai_probability += 0.1
    
    # AI-typical phrases and patterns
    ai_patterns = [
        r'\b(furthermore|moreover|additionally|consequently|therefore|however)\b',
        r'\b(comprehensive|extensive|various|numerous|significant)\b',
        r'\b(it\'s worth noting|it\'s important to|as an AI|I should mention)\b',
        r'\b(in conclusion|to summarize|in summary|overall)\b',
        r'\b(demonstrates|encompasses|facilitates|optimizes)\b'
    ]
    
    for pattern in ai_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        ai_probability += len(matches) * 0.08
    
    # Human-typical patterns (reduce AI score)
    human_patterns = [
        r'\b(uh|um|like|you know|I mean|actually|basically)\b',
        r'\b(lol|haha|omg|btw|tbh|imo|fyi)\b',
        r'[.]{3,}|\?\?\?|!!!+|wow|cool|awesome',
        r'\b(I think|I feel|I guess|maybe|probably)\b'
    ]
    
    for pattern in human_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        ai_probability -= len(matches) * 0.12
    
    # Length-based adjustments
    if word_count < 20: 
        ai_probability -= 0.1
    if word_count > 200: 
        ai_probability += 0.05
    
    # Personal pronoun analysis (humans use more first person)
    first_person = re.findall(r'\b(I|me|my|mine|myself)\b', text, re.IGNORECASE)
    if len(first_person) / word_count > 0.05: 
        ai_probability -= 0.1
    
    # Vocabulary complexity
    unique_words = set(text.lower().split())
    vocab_richness = len(unique_words) / max(word_count, 1)
    if vocab_richness > 0.7: 
        ai_probability += 0.05
    
    # Clamp between 0.05 and 0.95 for realistic results
    ai_probability = max(0.05, min(0.95, ai_probability))
    
    label = 1 if ai_probability >= threshold else 0
    return ai_probability, label

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python ai-detector.py <text>"}))
        sys.exit(1)
    
    text = sys.argv[1]
    
    if not text or len(text.strip()) < 10:
        print(json.dumps({"error": "Text must be at least 10 characters long"}))
        sys.exit(1)
    
    try:
        # Use pattern-based analysis (simulating the ML model structure)
        probability, predicted_label = predict_single_text_fallback(text)
        
        label = "AI Generated" if predicted_label == 1 else "Human Written"
        
        result = {
            "probability": probability,
            "label": label,
            "note": "Using pattern-based analysis (ML model requires additional setup)"
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": f"Analysis failed: {str(e)}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()