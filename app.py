import os
from flask import Flask
from flask import abort, url_for, redirect, render_template, session, request
from connect_four import ConnectFour


app = Flask(__name__)
app.secret_key = b'\x9c,\x9fHp\x045\xe9\xb9_\xd3s\xed\x03\xdb\x8d'

# Global dictionary of all running games, indexed by session_id.
games = {}
# Games with only one player, waiting for another to join.
lonely_games = []

@app.route("/")
def index():
    return render_template('connect_four.html')

def getCurrentGame():
    if not 'session_id' in session:
        abort(503)
    session_id = session['session_id']
    if not session_id in games:
        abort(404) # game not found
    
    return games[session_id]


@app.route("/currentgame")
def currentgame():
    game = getCurrentGame()
    json = game.toJson()
    return json

@app.route("/newgame")
def newgame():
    if 'session_id' in session:
        session_id = session['session_id']
        try:
            games.pop(session_id)
        except KeyError:
            pass
    else:
        session_id = print(os.urandom(16))
        session['session_id'] = session_id

    try:
        game = lonely_games.pop()
        game.setPlayer2(session_id)
        games[session_id] = game
    except IndexError:
        game = ConnectFour(7,6)
        games[session_id] = game
        lonely_games.append(game)
        game.setPlayer1(session_id)

    json = game.toJson(session_id)
    return json

@app.route("/move")
def move():
    if not 'session_id' in session:
        abort(503)
    session_id = session['session_id']
    if not session_id in games:
        abort(404) # game not found
    game = games[session_id]
    player = game.getPlayer(session_id)

    try:
        column = request.args.get('column', '-1')
        game.move(player, column)
    except Exception:
        abort(503)
