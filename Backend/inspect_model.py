"""
Script to inspect the traffic risk model
"""

import joblib
from pathlib import Path

MODEL_PATH = Path("model/traffic_risk_model.pkl")

model = joblib.load(MODEL_PATH)

print("Model Type:", type(model))
print("\nModel Object:", model)
print("\n" + "="*60)

if hasattr(model, "feature_names_in_"):
    print("\nExpected Features:")
    for i, feature in enumerate(model.feature_names_in_, 1):
        print(f"  {i}. {feature}")
else:
    print("\nNo feature_names_in_ attribute found")

print("\n" + "="*60)

if hasattr(model, "named_steps"):
    print("\nModel Pipeline Steps:")
    for step_name, step_obj in model.named_steps.items():
        print(f"\n  {step_name}: {type(step_obj).__name__}")
        if hasattr(step_obj, "get_feature_names_out"):
            try:
                features = step_obj.get_feature_names_out()
                print(f"    Output features: {features[:5]}..." if len(features) > 5 else f"    Output features: {features}")
            except:
                pass
        if hasattr(step_obj, "categories_"):
            print(f"    Has categories for {len(step_obj.categories_)} features")
            for i, cats in enumerate(step_obj.categories_):
                if len(cats) <= 10:
                    print(f"      Feature {i}: {list(cats)}")
                else:
                    print(f"      Feature {i}: {list(cats[:5])}... ({len(cats)} total)")

print("\n" + "="*60)
if hasattr(model, "classes_"):
    print(f"\nModel Classes: {model.classes_}")

print("\nDone!")
