from flask_cors import CORS
from app import create_app

app = create_app()
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})  # Cho phép origin của frontend

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)