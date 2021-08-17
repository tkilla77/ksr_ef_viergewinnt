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
     * Connects this view to the given game.
     * 
     * @param {ConnectFourModel} game 
     */
    connectToGame(game) {
        let index = 0;
        for (let button of this.grid.getElementsByTagName("button")) {
            // Use a constant value that will be captured in the 
            // event listener. Use modul operator to compute the column
            // from the button index.
            const column = index % game.width;
            button.addEventListener("click", () => {
                game.insertPiece(column);
                this.fillHtml(game);
            });
            index++;
        }        
    }

    /**
     * Updates the view (button elements) to match the game state.
     * 
     * @param {ConnectFourModel} game 
     */
     fillHtml(game) {
        let board = this.grid.getElementsByTagName("button");
        if (board.length != game.cells.length) throw new Error("Size mismatch");
        for (let i = 0; i < board.length; i++) {
            let state = game.cells[i];
            let boardCell = board[i];
            boardCell.setAttribute("data-state", state.toString());
            boardCell.innerHTML = state.toString();
        }
        if (game.winner) {
            this.winner.classList.add("won");
            this.winner.getElementsByClassName("name").item(0).innerHTML = game.winner == 1 ? "Gelb" : "Rot";
        }
    }
}

/**
 * State and behavior for a game of connect-four.
 */
class ConnectFourModel {
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

    /**
     * Insert a game piece in the given column.
     */
     insertPiece(column) {
        if (this.winner) {
            throw new Error(`Game has already ended`);
        }
        let cell = undefined;
        for (let row = this.height - 1; row >= 0; row--) {
            let lowestEmptyCellIndex = this.width * row + column;
            cell = this.cells[lowestEmptyCellIndex];
            if (cell == 0) {
                // We found an empty cell:
                // 1) Change the state of the cell.
                this.cells[lowestEmptyCellIndex] = this.player;
                // 2) Toggle the next player.
                this.player = this.player == 1 ? 2 : 1;
                // 3) Check if the game has ended.
                this.checkWinner(row, column);
                return;
            }
        }
        // Otherwise: column is already full.
        throw new Error(`illegal column ${column}`);
    }

    /* Check if there is a winner after filling the cell at row / column.
       Sets ConnectFour.winner to the player winning. */
    checkWinner(row, column) {
        const player = this.cells[row * this.width + column];

        let countFunction = (colIncrement, rowIncrement) => {
            return this.countSameDirection(player, column, row, colIncrement, rowIncrement);
        }

        const increment = i => i+1;
        const decrement = i => i-1;
        const identity = i => i;

        // Count the number of equal slots in all 8 directions.
        let upperLeft = countFunction(decrement, decrement);    
        let up = countFunction(identity, decrement);
        let upperRight = countFunction(increment, decrement);
        let left = countFunction(decrement, identity);
        let right = countFunction(increment, identity);
        let lowerLeft = countFunction(decrement, increment);
        let down = countFunction(identity, increment);
        let lowerRight = countFunction(increment, increment);

        // We have a winner if the total is 3 or more in any of the four
        // directions (the 4th is the current cell).
        if (upperLeft + lowerRight >= 3
                || up + down >= 3
                || upperRight + lowerLeft >= 3
                || left + right >= 3) {
            this.winner = player;
        }
    }

    /* Counts the winning streak in one direction defined by the
       increment. */
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

let gameJson = {
    width: 7,
    height: 6,
    cells: new Array(42).fill(0),
    player: 1,
}
let game = new ConnectFourModel(gameJson);
let grid = document.getElementById("grid")
let winner = document.getElementById("winner")
const view = new ConnectFourView(grid, winner);
view.connectToGame(game);
