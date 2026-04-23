import logging
from flask import Flask
from flask_cors import CORS
from config.settings import DEBUG, HOST, PORT
from controllers.prediction_controller import health_check, initialize_model, predict


app = Flask(__name__)
CORS(app)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("accident-risk-api")


@app.route("/health", methods=["GET"])
def health_check_route():
    return health_check()


@app.route("/predict", methods=["POST"])
def predict_route():
    return predict()


initialize_model()


if __name__ == "__main__":
    app.run(host=HOST, port=PORT, debug=DEBUG)
