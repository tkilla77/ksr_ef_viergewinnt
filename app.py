import os
import uuid
import json

from flask import Flask
from flask import abort, url_for, redirect, render_template, session, request, Response, jsonify
from connect_four import ConnectFour

app = Flask(__name__)
app.secret_key = b'\x9c,\x9fHp\x045\xe9\xb9_\xd3s\xed\x03\xdb\x8d'

# Global dictionary of all running games, indexed by game_id.
games = {}
# Global multi-map from session to game id
games_by_session = {}
# Fresh games with only one player, waiting for another to join.
lonely_games = []

@app.route("/")
def index():
    return render_template('connect_four.html')

@app.route("/listgames/")
def listgames():
    if not 'session_id' in session:
        abort(404) # no session, no game
    session_id = session['session_id']
    
    if session_id in games_by_session:
        games = games_by_session[session_id]
    else:
        games = []
    response = jsonify(
        games = [url_for("game", game_id = str(game_id)) for game_id in games],
        newgame = url_for("newgame")
    )
    return response

@app.route("/newgame", methods=['POST'])
def newgame():
    if 'session_id' in session:
        session_id = session['session_id']
        try:
            app.logger.info(f"forgetting old games for {session_id}")
            oldgames = games_by_session.pop(session_id)
            if oldgames:
                for oldgame in oldgames:
                    game = games[oldgame]
                    game.dropPlayer(session_id)
                    lonely_games.remove(oldgame)
        except (KeyError, ValueError):
            pass
    else:
        session_id = uuid.uuid4()
        session['session_id'] = session_id

    # Clients really deserves a new game. Attempt to find a lonely game
    # waiting for a second player, otherwise create a new one.
    try:
        game = lonely_games.pop()
        game.setPlayer2(session_id)
        app.logger.info(f"connecting {session_id} to waiting game {game.id} by player {game.player1}")
    except IndexError:
        game = ConnectFour(7,6)
        game.setPlayer1(session_id)
        games[game.id] = game
        app.logger.info(f"created new game {game.id} for {session_id}")
        lonely_games.append(game)

    # Record the game to belong to the session.
    if session_id in games_by_session:
        games_by_session[session_id].append(game.id)
    else:
        games_by_session[session_id] = [game.id]

    return jsonify(game.toDict(session_id))

@app.route("/game/<uuid:game_id>")
def game(game_id):
    if not 'session_id' in session:
        app.logger.warning(f"Attempted to access game/{game_id}, but has no session.")
        abort(404) # no session, no game
    session_id = session['session_id']
    if not game_id in games:
        app.logger.warning(f"Attempted to access game/{game_id}, but game does not exist. session/{session_id}.")
        abort(404) # game not found
    
    game = games[game_id]
    try:
        json = game.toDict(session_id)
        app.logger.info(f"found current game for {session_id}, is player {game.getPlayer(session_id)}")
        return jsonify(json)
    except Exception as err:
        # Attempted to access a game that's not theirs...
        app.logger.warning(err, exc_info=True)
        abort(Response(err.args, 503))

@app.route("/move/<uuid:game_id>/<int:column>", methods=['POST'])
def move(game_id, column):
    if not 'session_id' in session:
        abort(503)
    session_id = session['session_id']
    if not session_id in games_by_session:
        abort(404) # game not found
    if not game_id in games:
        abort(404) # game not found
    game = games[game_id]
    try:
        player = game.getPlayer(session_id)
    except Exception as err:
        # Attempted to access a game that's not theirs...
        app.logger.warning(err, exc_info=True)
        abort(Response(err.args, 503)) # not your game

    try:
        game.move(player, column)
        return jsonify(game.toDict(session_id))
    except Exception as err:
        app.logger.warning(err, exc_info=True)
        abort(Response(err.args, 503))
