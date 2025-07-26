import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoConfig, AutoModel, PreTrainedModel
import sys
import json

class DesklibAIDetectionModel(PreTrainedModel):
    config_class = AutoConfig

    def __init__(self, config):
        super().__init__(config)
        # Initialize the base transformer model.
        self.model = AutoModel.from_config(config)
        # Define a classifier head.
        self.classifier = nn.Linear(config.hidden_size, 1)
        # Initialize weights (handled by PreTrainedModel)
        self.init_weights()

    def forward(self, input_ids, attention_mask=None, labels=None):
        # Forward pass through the transformer
        outputs = self.model(input_ids, attention_mask=attention_mask)
        last_hidden_state = outputs[0]
        # Mean pooling
        input_mask_expanded = attention_mask.unsqueeze(-1).expand(last_hidden_state.size()).float()
        sum_embeddings = torch.sum(last_hidden_state * input_mask_expanded, dim=1)
        sum_mask = torch.clamp(input_mask_expanded.sum(dim=1), min=1e-9)
        pooled_output = sum_embeddings / sum_mask

        # Classifier
        logits = self.classifier(pooled_output)
        loss = None
        if labels is not None:
            loss_fct = nn.BCEWithLogitsLoss()
            loss = loss_fct(logits.view(-1), labels.float())

        output = {"logits": logits}
        if loss is not None:
            output["loss"] = loss
        return output

def predict_single_text(text, model, tokenizer, device, max_len=768, threshold=0.5):
    """
        Predicts whether the given text is AI-generated.
    """
    encoded = tokenizer(
        text,
        padding='max_length',
        truncation=True,
        max_length=max_len,
        return_tensors='pt'
    )
    input_ids = encoded['input_ids'].to(device)
    attention_mask = encoded['attention_mask'].to(device)

    model.eval()
    with torch.no_grad():
        outputs = model(input_ids=input_ids, attention_mask=attention_mask)
        logits = outputs["logits"]
        probability = torch.sigmoid(logits).item()

    label = 1 if probability >= threshold else 0
    return probability, label

def main():
    try:
        # Get text input from command line argument
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No text provided"}))
            sys.exit(1)
        
        text_input = sys.argv[1]
        
        # --- Model and Tokenizer Directory ---
        model_directory = "desklib/ai-text-detector-v1.01"

        # --- Load tokenizer and model ---
        try:
            tokenizer = AutoTokenizer.from_pretrained(model_directory)
            model = DesklibAIDetectionModel.from_pretrained(model_directory)
        except Exception as e:
            # Fallback to sophisticated analysis if model not available
            probability = analyze_text_fallback(text_input)
            label = 1 if probability >= 0.5 else 0
            result = {
                "probability": probability,
                "label": "AI Generated" if label == 1 else "Human Written",
                "fallback": True
            }
            print(json.dumps(result))
            sys.exit(0)

        # --- Set up device ---
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model.to(device)

        # --- Run prediction ---
        probability, predicted_label = predict_single_text(text_input, model, tokenizer, device)
        
        result = {
            "probability": probability,
            "label": "AI Generated" if predicted_label == 1 else "Human Written"
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        # Fallback analysis on any error
        try:
            probability = analyze_text_fallback(sys.argv[1] if len(sys.argv) > 1 else "")
            label = 1 if probability >= 0.5 else 0
            result = {
                "probability": probability,
                "label": "AI Generated" if label == 1 else "Human Written",
                "fallback": True
            }
            print(json.dumps(result))
        except:
            print(json.dumps({"error": f"Analysis failed: {str(e)}"}))

def analyze_text_fallback(text):
    """Sophisticated fallback analysis when ML model is not available"""
    if not text or len(text.strip()) < 10:
        return 0.5
    
    text_length = len(text)
    word_count = len(text.split())
    if word_count == 0:
        return 0.5
        
    avg_word_length = len(text.replace(' ', '')) / word_count
    sentences = [s.strip() for s in text.replace('!', '.').replace('?', '.').split('.') if s.strip()]
    avg_sentence_length = word_count / max(len(sentences), 1)
    
    ai_probability = 0.5
    
    # Structural patterns
    if avg_sentence_length > 25: ai_probability += 0.15
    if avg_word_length > 5.5: ai_probability += 0.1
    if len(sentences) > 2 and all(len(s.split()) > 8 for s in sentences): ai_probability += 0.1
    
    # AI-typical phrases
    ai_patterns = [
        r'\b(furthermore|moreover|additionally|consequently|therefore|however)\b',
        r'\b(comprehensive|extensive|various|numerous|significant)\b',
        r'\b(it\'s worth noting|it\'s important to|as an AI|I should mention)\b',
        r'\b(in conclusion|to summarize|in summary|overall)\b'
    ]
    
    import re
    for pattern in ai_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        ai_probability += len(matches) * 0.08
    
    # Human-typical patterns  
    human_patterns = [
        r'\b(uh|um|like|you know|I mean|actually|basically)\b',
        r'\b(lol|haha|omg|btw|tbh|imo|fyi)\b',
        r'[.]{3,}|\?\?\?|!!!+|wow|cool|awesome',
        r'\b(I think|I feel|I guess|maybe|probably)\b'
    ]
    
    for pattern in human_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        ai_probability -= len(matches) * 0.12
    
    # Length adjustments
    if word_count < 20: ai_probability -= 0.1
    if word_count > 200: ai_probability += 0.05
    
    # Personal pronouns
    first_person = re.findall(r'\b(I|me|my|mine|myself)\b', text, re.IGNORECASE)
    if len(first_person) / word_count > 0.05: ai_probability -= 0.1
    
    # Clamp between 0.05 and 0.95
    return max(0.05, min(0.95, ai_probability))

if __name__ == "__main__":
    main()