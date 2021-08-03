import os
import uuid
from flask import Flask
from flask import abort, url_for, redirect, render_template, session, request, Response
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

@app.route("/currentgame")
def currentgame():
    if not 'session_id' in session:
        abort(404) # no session, no game
    session_id = session['session_id']
    if not session_id in games:
        abort(404) # game not found
    
    game = games[session_id]
    app.logger.info(f"found current game for {session_id}, is player {game.getPlayer(session_id)}")
    return game.toJson(session_id)

@app.route("/newgame")
def newgame():
    if 'session_id' in session:
        session_id = session['session_id']
        try:
            app.logger.info(f"forgetting old games for {session_id}")
            oldgame = games.pop(session_id)
            lonely_games.remove(oldgame)
        except (KeyError, ValueError):
            pass
    else:
        session_id = uuid.uuid4()
        session['session_id'] = session_id

    try:
        game = lonely_games.pop()
        game.setPlayer2(session_id)
        games[session_id] = game
        app.logger.info(f"connecting {session_id} to waiting game by {game.player1}")
    except IndexError:
        game = ConnectFour(7,6)
        game.setPlayer1(session_id)
        games[session_id] = game
        app.logger.info(f"created new game for {session_id}")
        lonely_games.append(game)

    return game.toJson(session_id)

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
        game.move(player, int(column))
        return game.toJson(session_id)
    except Exception as err:
        app.logger.warning(err, exc_info=True)
        abort(Response(err.args, 404))
