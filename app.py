from flask import Flask
from flask import url_for, redirect


app = Flask(__name__)

@app.route("/")
def index():
    return redirect(url_for('static', filename='connect_four.html'))
