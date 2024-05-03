/** Everything necessary to capture the state of the game. */
let gameState = {
    width: 7,
    height: 6,
    // The cells from top-left to bottom-right.
    cells: new Array(42).fill(0),
    player: 1,
    winner: 0,
}

/** Checks if there is a winner after filling the cell at row / column.
 *  Sets state.winner to the player winning. */
function checkWinner(state, row, column) {
    const player = state.cells[row * state.width + column]

    let countFunction = (colIncrement, rowIncrement) => {
        return countSameDirection(state, player, row, column, rowIncrement, colIncrement)
    }

    const increment = i => i+1
    const decrement = i => i-1
    const identity = i => i

    // Count the number of equal slots in all 8 directions.
    let upperLeft = countFunction(decrement, decrement)
    let up = countFunction(identity, decrement)
    let upperRight = countFunction(increment, decrement)
    let left = countFunction(decrement, identity)
    let right = countFunction(increment, identity)
    let lowerLeft = countFunction(decrement, increment)
    let down = countFunction(identity, increment)
    let lowerRight = countFunction(increment, increment)

    // We have a winner if the total is 3 or more in any of the four
    // directions (the 4th is the current cell).
    if (upperLeft + lowerRight >= 3
            || up + down >= 3
            || upperRight + lowerLeft >= 3
            || left + right >= 3) {
        state.winner = player
    }
}

/** Counts the winning streak in one direction defined by the increment. */
function countSameDirection(state, player, row, col, rowIncrement, colIncrement) {
    // Count the number of equal slots in one direction.
    let count = 0
    while (count < 3) {
        // Move in the given direction.
        col = colIncrement(col)
        row = rowIncrement(row)
        // Check if we are still on the board.
        if (col < 0 || col >= state.width || row < 0 || row >= state.height) {
            break
        }
        // Look at the current cell and bail out if it's not our color.
        if (state.cells[row * state.width + col] != player) {
            break
        }
        // Otherwise: continue
        count++
    }
    return count
}

/** Update the HTML (cell content and data-state attribute) to match the
 *  game state. */
function updateUi(state, grid, winner) {
    let board = grid.getElementsByTagName("button")
    if (board.length != state.cells.length) throw new Error("Size mismatch")
    for (let i = 0; i < board.length; i++) {
        let stateCell = state.cells[i]
        let boardCell = board[i]
        boardCell.setAttribute("data-state", stateCell.toString())
        boardCell.innerHTML = stateCell.toString()
    }
    if (state.winner) {
        winner.classList.add("won")
        winner.getElementsByClassName("name").item(0).innerHTML = state.winner == 1 ? "Gelb" : "Rot"
    }
}

/** Called whenever the game buttons (cells) are clicked. */
function handleButtonClick(state, column, grid, winner) {
    if (state.winner != 0) {
        return
    }
    // Search for the lowest empty row in column.
    for (let row = state.height - 1; row >= 0; row--) {
        let lowestEmptyCellIndex = state.width * row + column
        let cell = state.cells[lowestEmptyCellIndex]
        if (cell == 0) {
            // We found an empty cell:
            // 1) Change the state of the cell.
            state.cells[lowestEmptyCellIndex] = state.player
            // 2) Toggle the next player.
            state.player = state.player == 1 ? 2 : 1
            // 3) TODO check winner
            checkWinner(state, row, column)
            // 4) TODO update user interface
            updateUi(state, grid, winner)
            return
        }
    }
    // Otherwise: column is already full.
    throw new Error(`illegal column ${column}`)
}

/** Adds a click handler to each cell / button of the game. */
function attachListeners(state, grid, winner) {
    let index = 0
    for (let button of grid.getElementsByTagName("button")) {
        // Use a constant value that will be captured in the 
        // event listener. Use modul operator to compute the column
        // from the button index.
        const column = index % state.width
        button.addEventListener("click", () => {
            handleButtonClick(state, column, grid, winner)
        })
        index++
    }        
}

// Find the game grid and winner message elements.
let grid = document.getElementById("grid")
let winner = document.getElementById("winner")

// Make the UI match the initial game state.
updateUi(gameState, grid, winner)
// Attach click handlers.
attachListeners(gameState, grid, winner)
