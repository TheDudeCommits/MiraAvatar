#!/usr/bin/env python3
"""
AI Detection Daemon - Keeps the Desklib model loaded in memory for fast responses
"""
import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoConfig, AutoModel, PreTrainedModel
import sys
import json
import os
import signal
import time

# Global model variables
_model = None
_tokenizer = None
_device = None
_model_loaded = False

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

def load_model():
    global _model, _tokenizer, _device, _model_loaded
    
    if _model_loaded:
        return _model, _tokenizer, _device
    
    print("Loading Desklib AI Detection Model...", file=sys.stderr)
    model_directory = "desklib/ai-text-detector-v1.01"
    
    try:
        _tokenizer = AutoTokenizer.from_pretrained(model_directory)
        _model = DesklibAIDetectionModel.from_pretrained(model_directory)
        _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        _model.to(_device)
        _model.eval()
        _model_loaded = True
        print("Model loaded successfully!", file=sys.stderr)
        return _model, _tokenizer, _device
    except Exception as e:
        print(f"Failed to load model: {str(e)}", file=sys.stderr)
        raise e

def predict_text(text, max_len=768):
    model, tokenizer, device = load_model()
    
    encoded = tokenizer(
        text,
        padding='max_length',
        truncation=True,
        max_length=max_len,
        return_tensors='pt'
    )
    
    input_ids = encoded['input_ids'].to(device)
    attention_mask = encoded['attention_mask'].to(device)
    
    with torch.no_grad():
        outputs = model(input_ids=input_ids, attention_mask=attention_mask)
        logits = outputs["logits"]
        probability = torch.sigmoid(logits).item()
    
    label = "AI Generated" if probability >= 0.5 else "Human Written"
    confidence = abs(probability - 0.5) * 2
    
    return {
        "probability": float(probability),
        "label": label,
        "confidence": float(confidence)
    }

def main():
    # Pre-load the model on startup
    try:
        load_model()
        print("Daemon ready for predictions", file=sys.stderr)
    except Exception as e:
        print(json.dumps({"error": f"Model initialization failed: {str(e)}"}), file=sys.stderr)
        sys.exit(1)
    
    # Process stdin input
    try:
        input_text = sys.stdin.read().strip()
        
        if not input_text:
            print(json.dumps({"error": "No input text provided"}))
            sys.exit(1)
        
        result = predict_text(input_text)
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": f"Prediction failed: {str(e)}"}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()