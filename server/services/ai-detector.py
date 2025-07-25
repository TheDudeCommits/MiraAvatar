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
        # Read input text from stdin
        input_text = sys.stdin.read().strip()
        
        if not input_text:
            print(json.dumps({"error": "No input text provided"}))
            sys.exit(1)

        # --- Model and Tokenizer Directory ---
        model_directory = "desklib/ai-text-detector-v1.01"

        try:
            # --- Load tokenizer and model ---
            tokenizer = AutoTokenizer.from_pretrained(model_directory)
            model = DesklibAIDetectionModel.from_pretrained(model_directory)

            # --- Set up device ---
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            model.to(device)

            # --- Run prediction ---
            probability, predicted_label = predict_single_text(input_text, model, tokenizer, device)
            
            # Return results as JSON
            result = {
                "probability": float(probability),
                "label": "AI Generated" if predicted_label == 1 else "Human Written",
                "confidence": abs(probability - 0.5) * 2  # Distance from 0.5 scaled to 0-1
            }
            
            print(json.dumps(result))
            
        except Exception as model_error:
            # Fallback to simple heuristics if model loading fails
            print(json.dumps({
                "error": f"Model loading failed: {str(model_error)}",
                "fallback": True,
                "probability": 0.5,
                "label": "Human Written",
                "confidence": 0.6
            }), file=sys.stderr)
            
            # Simple fallback analysis
            word_count = len(input_text.split())
            ai_indicators = ["furthermore", "moreover", "consequently", "comprehensive", "extensive"]
            ai_score = sum(1 for indicator in ai_indicators if indicator in input_text.lower())
            
            probability = min(0.9, 0.3 + (ai_score * 0.15) + (word_count > 100) * 0.1)
            label = "AI Generated" if probability > 0.5 else "Human Written"
            
            result = {
                "probability": probability,
                "label": label,
                "confidence": abs(probability - 0.5) * 2
            }
            print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()