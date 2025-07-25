#!/usr/bin/env python3
import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoConfig, AutoModel, PreTrainedModel
import sys
import json
import os

# Set environment to avoid warnings and optimize performance
os.environ['TOKENIZERS_PARALLELISM'] = 'false'
torch.set_num_threads(1)  # Optimize for single prediction

class DesklibAIDetectionModel(PreTrainedModel):
    config_class = AutoConfig

    def __init__(self, config):
        super().__init__(config)
        self.model = AutoModel.from_config(config)
        self.classifier = nn.Linear(config.hidden_size, 1)
        self.init_weights()

    def forward(self, input_ids, attention_mask=None, labels=None):
        outputs = self.model(input_ids, attention_mask=attention_mask)
        last_hidden_state = outputs[0]
        input_mask_expanded = attention_mask.unsqueeze(-1).expand(last_hidden_state.size()).float()
        sum_embeddings = torch.sum(last_hidden_state * input_mask_expanded, dim=1)
        sum_mask = torch.clamp(input_mask_expanded.sum(dim=1), min=1e-9)
        pooled_output = sum_embeddings / sum_mask
        logits = self.classifier(pooled_output)
        return {"logits": logits}

def predict_single_text(text, model, tokenizer, device, max_len=512, threshold=0.5):
    # Reduced max_len for faster processing
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

# Global model and tokenizer to avoid reloading
_model = None
_tokenizer = None
_device = None

def initialize_model():
    global _model, _tokenizer, _device
    if _model is None:
        model_directory = "desklib/ai-text-detector-v1.01"
        _tokenizer = AutoTokenizer.from_pretrained(model_directory)
        _model = DesklibAIDetectionModel.from_pretrained(model_directory)
        _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        _model.to(_device)
        _model.eval()  # Set to eval mode permanently
    return _model, _tokenizer, _device

def main():
    try:
        # Read input text from stdin
        input_text = sys.stdin.read().strip()
        
        if not input_text:
            print(json.dumps({"error": "No input text provided"}))
            sys.exit(1)

        # Initialize model only once
        model, tokenizer, device = initialize_model()
        
        # Run prediction
        probability, predicted_label = predict_single_text(input_text, model, tokenizer, device)
        
        # Return results as JSON
        result = {
            "probability": float(probability),
            "label": "AI Generated" if predicted_label == 1 else "Human Written",
            "confidence": abs(probability - 0.5) * 2
        }
        
        print(json.dumps(result))
        
    except Exception as model_error:
        # NO FALLBACK - User explicitly requested only the ML model
        print(json.dumps({
            "error": f"Desklib AI Detection Model failed: {str(model_error)}",
            "model_directory": "desklib/ai-text-detector-v1.01",
            "device": str(_device) if _device else "unknown"
        }), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()