import logging
from typing import Any

import joblib
import pandas as pd

from config.settings import MODEL_PATH


logger = logging.getLogger("accident-risk-api")

model: Any = None


RISK_LABELS = {"Low", "Medium", "High"}


def load_model() -> None:
    global model

    if not MODEL_PATH.exists():
        logger.warning(
            "Model file not found at %s. API is up but /predict will fail until model is provided.",
            MODEL_PATH,
        )
        model = None
        return

    model = joblib.load(MODEL_PATH)
    logger.info("Model loaded from %s", MODEL_PATH)


def _build_dataframe(payload: Any) -> pd.DataFrame:
    if payload is None:
        raise ValueError("Request body must be valid JSON")

    if isinstance(payload, dict):
        return pd.DataFrame([payload])

    if isinstance(payload, list):
        if not payload:
            raise ValueError("Input list cannot be empty")
        if not all(isinstance(item, dict) for item in payload):
            raise ValueError("Each item in the input list must be a JSON object")
        return pd.DataFrame(payload)

    raise ValueError("JSON must be an object or a list of objects")


def _align_features(df: pd.DataFrame) -> pd.DataFrame:
    expected_features = getattr(model, "feature_names_in_", None)
    if expected_features is None:
        return df

    expected = list(expected_features)
    missing = [col for col in expected if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required features: {missing}")

    return df[expected]


def _probability_map(probabilities: list[float], labels: list[str]) -> dict[str, float]:
    return {
        str(label): round(float(probability), 6)
        for label, probability in zip(labels, probabilities, strict=False)
    }


def _risk_percentage(probabilities: dict[str, float], predicted_label: Any) -> float:
    if "High" in probabilities:
        return round(probabilities["High"] * 100, 2)

    label = str(predicted_label)
    if label in RISK_LABELS:
        return {"Low": 20.0, "Medium": 55.0, "High": 90.0}[label]

    if probabilities:
        return round(max(probabilities.values()) * 100, 2)

    return 0.0


def predict(payload: Any) -> list[dict[str, Any]]:
    if model is None:
        raise RuntimeError("Model is not loaded")

    input_df = _build_dataframe(payload)
    input_df = _align_features(input_df)
    predictions = model.predict(input_df)

    if hasattr(model, "predict_proba"):
        raw_probabilities = model.predict_proba(input_df)
        class_labels = [str(label) for label in getattr(model, "classes_", [])]
    else:
        raw_probabilities = None
        class_labels = []

    response: list[dict[str, Any]] = []

    for index, predicted in enumerate(predictions):
        predicted_value = predicted.item() if hasattr(predicted, "item") else predicted
        probabilities = {}

        if raw_probabilities is not None:
            probabilities = _probability_map(raw_probabilities[index], class_labels)

        response.append(
            {
                "prediction": predicted_value,
                "risk_percentage": _risk_percentage(probabilities, predicted_value),
                "probabilities": probabilities,
            }
        )

    return response


def is_model_loaded() -> bool:
    return model is not None


def get_model_path() -> str:
    return str(MODEL_PATH)
