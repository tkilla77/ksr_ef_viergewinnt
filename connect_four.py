import json
import io
import uuid

class ConnectFour:
    def __init__(self, width, height):
        self.cells = [0] * (width * height)
        self.width = width
        self.height = height
        self.next = 1
        self.winner = None
        self.player1 = None
        self.player2 = None
        self.id = uuid.uuid4()
    
    def toDict(self, session_id):
        return {
            "width": self.width,
            "height": self.height,
            "cells": self.cells,
            "next": self.next,
            "player": self.getPlayer(session_id),
            "winner": self.winner,
            "state": self.getState(),
            "id": str(self.id),
        }
    
    def getState(self):
        if self.winner:
            return "ended"
        if self.player1 and self.player2:
            return "running"
        return "waiting"
    
    def dropPlayer(self, session_id):
        if self.player1 == session_id:
            self.player1 = None
        if self.player2 == session_id:
            self.player2 = None
    
    def setPlayer1(self, session_id):
        self.player1 = session_id

    def setPlayer2(self, session_id):
        self.player2 = session_id

    def getPlayer(self, session_id):
        if self.player1 == session_id:
            return 1
        if self.player2 == session_id:
            return 2
        raise Exception("Not your game!")

    """ Attempts a move by player in the given column (zero-based). Returns the player
        whose turn it is after the move. Throws an exception if the move is illegal."""
    def move(self, player, column):
        if player != self.next:
            raise Exception("not your turn")

        if column < 0 or column >= self.width:
            raise Exception(f"illegal column {column}")

        if self.winner:
            raise Exception(f"game over, player {self.winner} has already won")

        for row in reversed(range(self.height)):
            index = row * self.width + column
            if self.cells[index] == 0:
                self.cells[index] = self.next
                self.next = self.next == 1 and 2 or 1
                self.winner = self.determineWinner(index)
                return
        raise Exception(f"No empty slots in column {column}")

    def determineWinner(self, index):
        column = index % self.width
        row = (index - column) // self.width
        player = self.cells[index]

        def increment(i):
            return i+1
        def decrement(i):
            return i-1
        def identity(i):
            return i

        # Count the number of equal slots in all 7 directions.
        # Above the current cell must be empty.
        upperLeft = self.countSameDirection(player, column, row, decrement, decrement)
        upperRight = self.countSameDirection(player, column, row, increment, decrement)
        left = self.countSameDirection(player, column, row, decrement, identity)
        right = self.countSameDirection(player, column, row, increment, identity)
        lowerLeft = self.countSameDirection(player, column, row, decrement, increment)
        down = self.countSameDirection(player, column, row, identity, increment)
        lowerRight = self.countSameDirection(player, column, row, increment, increment)

        # We have a winner if the total is 3 or more in any of the four
        # directions (the 4th is the current cell).
        if upperLeft + lowerRight >= 3 or down >= 3 or upperRight + lowerLeft >= 3 or left + right >= 3:
            return player
        return None
            
    """ Counts the winning streak in one direction defined by the
       increment. """
    def countSameDirection(self, player, col, row, colIncrement, rowIncrement):
        # Count the number of equal slots in one direction.
        count = 0
        while count < 3:
            # Move in the given direction.
            col = colIncrement(col)
            row = rowIncrement(row)
            # Check if we are still on the board.
            if col < 0 or col >= self.width or row < 0 or row >= self.height:
                break
            # Look at the current cell and bail out if it's not our color.
            if self.cells[row * self.width + col] != player:
                break
            # Otherwise: continue
            count += 1
        return count

