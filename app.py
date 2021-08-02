from flask import Flask
from flask import url_for, redirect, render_template


app = Flask(__name__)

@app.route("/")
def index():
    return render_template('connect_four.html')

@app.route("/newgame")
def newgame():
    return {
        "width": 7,
        "height": 6,
        "cells": [0] * 42,
        "player": 1,
    }
