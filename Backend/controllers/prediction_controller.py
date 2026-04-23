import logging

from flask import jsonify, request

from services.prediction_service import (
    get_model_path,
    is_model_loaded,
    load_model,
    predict as predict_from_model,
)


logger = logging.getLogger("accident-risk-api")


def initialize_model() -> None:
    load_model()


def health_check():
    return jsonify(
        {
            "status": "ok",
            "model_loaded": is_model_loaded(),
            "model_path": get_model_path(),
        }
    ), 200


def predict():
    if not is_model_loaded():
        return jsonify({"error": "Model is not loaded. Place the .pkl file and restart the server."}), 503

    try:
        payload = request.get_json(silent=False)
        predictions = predict_from_model(payload)

        return jsonify(
            {
                "predictions": predictions,
                "count": len(predictions),
            }
        ), 200

    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception:
        logger.exception("Prediction failed")
        return jsonify({"error": "Internal server error during prediction"}), 500
