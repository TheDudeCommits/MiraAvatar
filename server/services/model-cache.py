#!/usr/bin/env python3
"""
Model caching script to ensure Desklib AI Detection Model is available in production
"""
import os
import torch
from transformers import AutoTokenizer, AutoConfig
# Import the DesklibAIDetectionModel class directly
import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoConfig, AutoModel, PreTrainedModel

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

def cache_model():
    """Pre-cache the Desklib AI Detection Model for production deployment"""
    model_directory = "desklib/ai-text-detector-v1.01"
    
    print(f"Caching Desklib AI Detection Model: {model_directory}")
    
    try:
        # Download and cache tokenizer
        print("Downloading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(model_directory)
        
        # Download and cache model
        print("Downloading model...")
        model = DesklibAIDetectionModel.from_pretrained(model_directory)
        
        # Test the model works
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model.to(device)
        
        # Test inference
        test_text = "This is a test to ensure the model works correctly."
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
        
        print(f"Model cached successfully! Test probability: {probability:.4f}")
        return True
        
    except Exception as e:
        print(f"Failed to cache model: {str(e)}")
        return False

if __name__ == "__main__":
    success = cache_model()
    exit(0 if success else 1)