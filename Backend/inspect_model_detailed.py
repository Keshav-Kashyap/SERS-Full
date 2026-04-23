"""
Detailed model inspection
"""

import joblib
from pathlib import Path
import numpy as np

MODEL_PATH = Path("model/traffic_risk_model.pkl")

model = joblib.load(MODEL_PATH)

print("="*60)
print("CATEGORICAL FEATURES")
print("="*60)

preprocessor = model.named_steps['preprocessor']
cat_transformer = None

for item in preprocessor.transformers_:
    if len(item) >= 2 and item[0] == 'cat':
        cat_transformer = item[1]
        break

if cat_transformer:
    # Get feature names from the ColumnTransformer
    col_transform = model.named_steps['preprocessor']
    cat_features = col_transform.transformers_[0][2]  # Get the feature list
    
    print(f"\nCategorical columns: {cat_features}")
    print(f"\nCategories for each feature:")
    for i, cats in enumerate(cat_transformer.categories_):
        feature_name = cat_features[i]
        print(f"\n{feature_name}:")
        print(f"  Valid values: {list(cats)}")

print("\n" + "="*60)
print("EXPECTED INPUT FORMAT")
print("="*60)
print(f"\nAll expected features:")
for i, f in enumerate(model.feature_names_in_, 1):
    print(f"  {i:2}. {f}")

print("\n" + "="*60)
print("SAMPLE PREDICTION")
print("="*60)

# Try a simple prediction with dummy data
sample_data = {
    'location': 'Lucknow',
    'speed': 50,
    'speed_limit': 50,
    'rain': 0,
    'fog': 0,
    'visibility': 100,
    'traffic_density': 50,
    'time_of_day': 14,
    'day_type': 0,
    'is_rush_hour': 0,
    'road_condition': 1,
    'area_previous_accidents': 5,
    'vehicle_condition': 1,
    'bad_weather': 0,
    'is_weekend': 0
}

try:
    import pandas as pd
    df = pd.DataFrame([sample_data])
    
    print(f"\nInput DataFrame:")
    print(df)
    print(f"\nInput dtypes:")
    print(df.dtypes)
    
    # Try prediction
    pred = model.predict(df)
    proba = model.predict_proba(df)
    
    print(f"\nPrediction successful!")
    print(f"Prediction: {pred}")
    print(f"Probabilities: {proba}")
    print(f"Classes: {model.classes_}")
    
except Exception as e:
    print(f"\nPrediction failed:")
    print(f"Error: {str(e)}")
    import traceback
    traceback.print_exc()
