/* A game state of connect-four. */
class ConnectFour {
    /* Expects JSON with properties
       width > 0
       height > 0
       cells: a number array with size width*height and contents of 0-2
              with 0=empty,1=player1,2=player2
    */ 
    constructor(json) {
        this.width = json.width;
        this.height = json.height;
        this.cells = json.cells;
        this.player = 1;
        if (this.width <= 0) throw new Error("width must be positive");
        if (this.height <= 0) throw new Error("height must be positive");
        if (this.cells.length != this.width * this.height) throw new Error("Illegal cell size");
    }

    /* Fills the given HTML table cells (TD elements) adding the contents matching
       the game state. */
    fillHtml(grid) {
        var board = grid.getElementsByTagName("button");
        if (board.length != this.cells.length) throw new Error("Size mismatch");
        for (let i = 0; i < board.length; i++) {
            var state = this.cells[i];
            var boardCell = board[i];
            boardCell.setAttribute("data-state", state.toString());
            boardCell.innerHTML = state.toString();
        }
    }

    installHandlers(grid) {
        let index = 0;
        for (let button of grid.getElementsByTagName("button")) {
            const buttonIndex = index;
            button.addEventListener("click", () => {
                this.handleButtonPress(buttonIndex);
                this.fillHtml(grid);
            });
            index++;
        }        
    }

    /* Handles the click / press on a button on the grid. */
    handleButtonPress(index) {
        let column = index % this.width;
        let cell = undefined;
        for (let row = this.height - 1; row >= 0; row--) {
            let lowestIndex = this.width * row + column;
            cell = this.cells[lowestIndex];
            if (cell == 0) {
                this.cells[lowestIndex] = this.player;
                this.player = this.player == 1 ? 2 : 1;
                return;
            }
        }
        throw new Error("cannot put a coin in full column");
    }
}

var gameJson = {
    width: 7,
    height: 6,
    cells: new Array(42).fill(0),
}
var game = new ConnectFour(gameJson);
var grid = document.getElementById("grid")
game.fillHtml(grid);
game.installHandlers(grid);
