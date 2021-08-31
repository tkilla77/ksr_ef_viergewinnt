/**
 * The UI of a game of connect-four.
 */
class ConnectFourView {
    /**
     * Creates a new view that will update the given button grid and winner area.
     *
     * @param {Element} grid 
     * @param {Element} winner 
     */
    constructor(grid, winner) {
        this.grid = grid;
        this.winner = winner;
    }

    /**
     * Updates the view (button elements) to match the game state.
     * 
     * @param {ConnectFourModel} game
     */
    update(game) {
        let board = this.grid.getElementsByTagName("button");
        if (board.length != game.cells.length) throw new Error("Size mismatch");
        for (let i = 0; i < board.length; i++) {
            let state = game.cells[i];
            let boardCell = board[i];
            boardCell.setAttribute("data-state", state.toString());
            // boardCell.innerHTML = state.toString();
        }
        if (game.winner) {
            this.winner.classList.add("won");
            this.winner.getElementsByClassName("name").item(0).innerHTML = game.winner == 1 ? "Gelb" : "Rot";
        } else {
            this.winner.classList = [];
            this.winner.getElementsByClassName("name").item(0).innerHTML = "Vier";
        }
    }
}

/** A connect-four controller that communicates with the game server. */
class ConnectFourRemoteController {
    /**
     * Creates a new remote controller.
     * 
     * @param {ConnectFourView} view 
     * @param {Element} stateArea
     */
    constructor() {
        this.views = [];
        this.stateAreas = [];
        this.state = "initial";
        this.postOptions = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
        }
    }

    updateStateFromJson(json) {
        this.json = json
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
            this.updateViews(json);
        }
    }

    /**
     * Notifies all views that the game has changed.
     */
    updateViews(json) {
        for (let view of this.views) {
            view.update(json);
        }
        for (let stateArea of this.stateAreas) {
            stateArea.innerHTML = this.state;
        }
    }

    async newGame() {
        var response = await fetch("/newgame", this.postOptions);
        var json = await response.json();
        this.updateStateFromJson(json);
        this.pollState();
    }

    async currentGame() {
        if (!this.json) {
            var response = await fetch("/listgames");
            var json = await response.json();
            if (json.games.length > 0) {
                this.json = {
                    "id": json.games[0].split("/")[2]
                };
            }
        }
        if (this.json) {
            this.fetchCurrentGame();
            this.pollState();
        }
    }

    async fetchCurrentGame() {
        var response = await fetch("/game/" + this.json.id);
        var json = await response.json();
        this.updateStateFromJson(json);
    }

    // wait ms milliseconds
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
        var response = await fetch("/move/" + this.json.id + "/" + column, this.postOptions);
        var json = await response.json();
        this.updateStateFromJson(json);
        this.pollState();
    }

    /**
     * Connects this controller to a new state area.
     * 
     * @param {Element} stateArea
     */
    connectToStateArea(stateArea) {
        this.stateAreas.push(stateArea);
        stateArea.innerHTML = this.state;
    }

    /**
     * Connects this controller to a button to start a new game.
     * 
     * @param {Element} newGameButton
     */
    connectToNewGameButton(newGameButton) {
        newGameButton.addEventListener("click", () => this.newGame());
    }

    /**
     * Connects this controller to a new view and listens for user interactions
     * in the view.
     * 
     * @param {ConnectFourView} view 
     */
    connectToView(view) {
        this.views.push(view);
        let index = 0;
        this.currentGame();
        for (let button of view.grid.getElementsByTagName("button")) {
            // Use a constant value that will be captured in the 
            // event listener. Use modul operator to compute the column
            // from the button index.
            const column = index % 7;
            button.addEventListener("click", () => this.move(column));
            index++;
        }
    }
}

let controller = new ConnectFourRemoteController();

let grid = document.getElementById("grid")
let winner = document.getElementById("winner")
let view = new ConnectFourView(grid, winner);
controller.connectToView(view);

let stateArea = document.getElementById("state");
controller.connectToStateArea(stateArea);

let newGameButton = document.getElementById("newgame");
controller.connectToNewGameButton(newGameButton);
