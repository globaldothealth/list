from flask import Flask, jsonify

app = Flask(__name__)


@app.route("/health")
def index() -> str:
    return jsonify({"status": "Healthy"})
        
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)