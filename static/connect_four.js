/** State and behavior for a game of connect-four. */
class ConnectFour {
    /**
     * Expects JSON with properties
     * width > 0
     * height > 0
     * cells: a number array with size width*height and contents of 0-2
     *        with 0=empty,1=player1,2=player2
     */ 
    constructor(json) {
        this.width = json.width;
        this.height = json.height;
        this.cells = json.cells;
        this.player = json.player;
        if (this.width <= 0) throw new Error("width must be positive");
        if (this.height <= 0) throw new Error("height must be positive");
        if (this.cells.length != this.width * this.height) throw new Error("Illegal cell size");
    }

    /** Fills the given HTML table cells (TD elements) adding the contents matching
      * the game state. */
    fillHtml(grid, winner) {
        var board = grid.getElementsByTagName("button");
        if (board.length != this.cells.length) throw new Error("Size mismatch");
        for (let i = 0; i < board.length; i++) {
            var state = this.cells[i];
            var boardCell = board[i];
            boardCell.setAttribute("data-state", state.toString());
            boardCell.innerHTML = state.toString();
        }
        if (this.winner) {
            winner.classList.add("won");
            winner.getElementsByClassName("name").item(0).innerHTML = this.winner == 1 ? "Gelb" : "Rot";
        }

    }

    installHandlers(grid, winner) {
        let index = 0;
        for (let button of grid.getElementsByTagName("button")) {
            // Use a constant value that will be captured in the 
            // event listener.
            const buttonIndex = index;
            button.addEventListener("click", () => {
                this.updateGameState(buttonIndex);
                this.fillHtml(grid, winner);
            });
            index++;
        }        
    }

    /** Handles the click / press on a button on the grid. */
    updateGameState(index) {
        if (this.winner) {
            return;
        }
        let column = index % this.width;
        let cell = undefined;
        for (let row = this.height - 1; row >= 0; row--) {
            let lowestEmptyCellIndex = this.width * row + column;
            cell = this.cells[lowestEmptyCellIndex];
            if (cell == 0) {
                this.cells[lowestEmptyCellIndex] = this.player;
                this.player = this.player == 1 ? 2 : 1;
                this.checkWinner(index);
                return;
            }
        }
        // Otherwise: column is already full - ignore.
    }

    /** Check if there is a winner after filling the cell at index.
      * Sets ConnectFour.winner to the player winning. */
    checkWinner(index) {
        const column = index % this.width;
        const row = (index - column) / this.width;
        const player = this.cells[index];

        let countFunction = (colIncrement, rowIncrement) => {
            return this.countSameDirection(player, column, row, colIncrement, rowIncrement);
        }

        const increment = i => i+1;
        const decrement = i => i-1;
        const identity = i => i;

        // Count the number of equal slots in all 7 directions.
        // Above the current cell must be empty.
        let upperLeft = countFunction(decrement, decrement);
        let upperRight = countFunction(increment, decrement);
        let left = countFunction(decrement, identity);
        let right = countFunction(increment, identity);
        let lowerLeft = countFunction(decrement, increment);
        let down = countFunction(identity, increment);
        let lowerRight = countFunction(increment, increment);

        // We have a winner if the total is 3 or more in any of the four
        // directions (the 4th is the current cell).
        if (upperLeft + lowerRight >= 3
                || down >= 3
                || upperRight + lowerLeft >= 3
                || left + right >= 3) {
            this.winner = player;
        }
    }

    /** Counts the winning streak in one direction defined by the
      * increment. */
    countSameDirection(player, col, row, colIncrement, rowIncrement) {
        // Count the number of equal slots in one direction.
        let count = 0;
        while (count < 3) {
            // Move in the given direction.
            col = colIncrement(col);
            row = rowIncrement(row);
            // Check if we are still on the board.
            if (col < 0 || col >= this.width || row < 0 || row >= this.height) {
                break;
            }
            // Look at the current cell and bail out if it's not our color.
            if (this.cells[row * this.width + col] != player) {
                break;
            }
            // Otherwise: continue
            count++;
        }
        return count;
    }
}

/** A connection to the ConnectFour server. */
class ConnectFourConnection {
    async newGame() {
        var json = await fetch("/newgame");
        return json.json();
    }
}

var connection = new ConnectFourConnection();
var gameRequest = connection.newGame();

var grid = document.getElementById("grid")
var winner = document.getElementById("winner")

gameRequest.then(response => {
    var game = new ConnectFour(response);
    game.fillHtml(grid, winner);
    game.installHandlers(grid, winner);
});

