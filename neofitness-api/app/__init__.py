from flask import Flask, jsonify
from app.core.config import engine
from app.models.base import Base
from app.routes.auth import auth_bp

def create_app():
    app = Flask(__name__)

    with engine.begin() as conn:
        Base.metadata.create_all(bind=conn)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"})

    app.register_blueprint(auth_bp)
    return app
