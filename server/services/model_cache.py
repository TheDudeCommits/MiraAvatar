
#!/usr/bin/env python3
"""
Model caching script to ensure Desklib AI Detection Model is available in production
"""
import os
import sys
import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoConfig, AutoModel, PreTrainedModel

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

def cache_model():
    """Pre-cache the Desklib AI Detection Model for production deployment"""
    model_directory = "desklib/ai-text-detector-v1.01"
    
    print(f"Caching Desklib AI Detection Model: {model_directory}")
    
    try:
        # Set environment to avoid potential issues
        os.environ['TOKENIZERS_PARALLELISM'] = 'false'
        
        # Download and cache tokenizer
        print("Downloading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(model_directory)
        print(f"✅ Tokenizer cached: {len(tokenizer)} tokens")
        
        # Download and cache model
        print("Downloading model...")
        model = DesklibAIDetectionModel.from_pretrained(model_directory)
        print("✅ Model architecture loaded")
        
        # Test the model works
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Using device: {device}")
        model.to(device)
        
        # Test inference
        test_text = "This is a test to ensure the model works correctly in production."
        encoded = tokenizer(
            test_text,
            padding='max_length',
            truncation=True,
            max_length=768,
            return_tensors='pt'
        )
        
        model.eval()
        with torch.no_grad():
            outputs = model(input_ids=encoded['input_ids'].to(device), 
                           attention_mask=encoded['attention_mask'].to(device))
            probability = torch.sigmoid(outputs["logits"]).item()
        
        print(f"✅ Model cached successfully! Test probability: {probability:.4f}")
        print(f"✅ Model evaluation: {'AI Generated' if probability >= 0.5 else 'Human Written'}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to cache model: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        if hasattr(e, '__cause__') and e.__cause__:
            print(f"Caused by: {e.__cause__}")
        return False

if __name__ == "__main__":
    success = cache_model()
    sys.exit(0 if success else 1)
