/** State and behavior for a game of connect-four. */
class ConnectFour {
    connectToDom(grid, winner) {
        this.grid = grid;
        this.winnerSpan = winner;
    }

    /**
     * Expects JSON with properties
     * width > 0
     * height > 0
     * cells: a number array with size width*height and contents of 0-2
     *        with 0=empty,1=player1,2=player2
     */ 
    update(json) {
        this.width = json.width;
        this.height = json.height;
        this.cells = json.cells;
        this.player = json.player;
        if (this.width <= 0) throw new Error("width must be positive");
        if (this.height <= 0) throw new Error("height must be positive");
        if (this.cells.length != this.width * this.height) throw new Error("Illegal cell size");
        this.winner = json.winner;
        this.fillHtml(this.grid, this.winnerSpan)
    }

    /** Fills the given HTML grid (buttons) adding the contents matching
      * the game state. */
    fillHtml() {
        var board = this.grid.getElementsByTagName("button");
        if (board.length != this.cells.length) throw new Error("Size mismatch");
        for (let i = 0; i < board.length; i++) {
            var state = this.cells[i];
            var boardCell = board[i];
            boardCell.setAttribute("data-state", state.toString());
        }
        if (this.winner) {
            this.winnerSpan.classList.add("won");
            this.winnerSpan.getElementsByClassName("name").item(0).innerHTML = this.winner == 1 ? "Gelb" : "Rot";
        }

    }
}

/** A connection to the ConnectFour server. */
class ConnectFourConnection {
    constructor(game, stateArea) {
        this.game = game;
        this.stateArea = stateArea;
        this.state = "initial";
        this.stateArea.innerHTML = this.state;
    }

    updateStateFromJson(json) {
        var newState;
        if (json.winner == json.player) {
            newState = "won"
        } else if (json.winner) {
            newState = "lost"
        } else if (json.state == "waiting") {
            newState = "waiting";
        } else if (json.next == json.player) {
            newState = "myturn";
        } else {
            newState = "theirturn";
        }
        if (newState != this.state) {
            this.state = newState;
            this.stateArea.innerHTML = this.state;
            game.update(json);
        }
    }
    async newGame() {
        var response = await fetch("/newgame");
        var json = await response.json();
        this.updateStateFromJson(json);
        this.pollState();
    }

    async currentGame() {
        this.fetchCurrentGame();
        this.pollState();
    }

    async fetchCurrentGame() {
        var response = await fetch("/currentgame");
        var json = await response.json();
        this.updateStateFromJson(json);
    }

    // wait ms milliseconds
    wait(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
    
    /** Poll the current game while it's their turn. */
    async pollState() {
        while (this.state == "theirturn" || this.state == "waiting") {
            await this.wait(1000);
            await this.fetchCurrentGame();
        }
    }
    
    async move(column) {
        if (this.state != "myturn") {
            throw new Error("not my turn");
        }
        var response = await fetch("/move?column="+column);
        var json = await response.json();
        this.updateStateFromJson(json);
        this.pollState();
    }

    installHandlers(grid) {
        let index = 0;
        for (let button of grid.getElementsByTagName("button")) {
            // Use a constant value that will be captured in the 
            // event listener.
            const buttonIndex = index;
            button.addEventListener("click", () => {
                this.move(buttonIndex % game.width);
            });
            index++;
        }        
    }
}

var game = new ConnectFour();
var grid = document.getElementById("grid")
var winner = document.getElementById("winner")
var stateArea = document.getElementById("state");

game.connectToDom(grid, winner);

var connection = new ConnectFourConnection(game, stateArea);
connection.installHandlers(grid);

var newGameButton = document.getElementById("newgame");
newGameButton.addEventListener("click", () => {connection.newGame();});
