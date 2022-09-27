'use strict'

function createMat(boardSize) {
    const mat = []

    for (var i = 0; i < boardSize; i++) {
        mat[i] = []
        for (var j = 0; j < boardSize; j++) {
            mat[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }
    }
    return mat
}

/// Changing cell value according to given percentage
function buildBoard(mat, key, amountPercentage) {
    var contentCount = 0
    for (var i = 0; i < mat.length; i++) {
        var currRow = mat[i]
        for (var j = 0; j < mat[0].length; j++) {
            var random = Math.random()
            if (random < amountPercentage) {
                contentCount++
                currRow[j][key] = true
            } else {
                currRow[j][key] = false
            }
        }
    }
    return [mat, contentCount]
}

function findSafeCells(mat) {
    var contents = []
    for (var i = 0; i < mat.length; i++) {
        var currRow = mat[i]
        for (var j = 0; j < mat[0].length; j++) {
            var currCell = currRow[j]
            if (!currCell.isMine && !currCell.isShown && !currCell.isMarked)
                contents.push({ i: i, j: j })
        }
    }
    return contents
}

function findMines(mat) {
    var minesIdxes = []

    for (var i = 0; i < mat.length; i++) {
        var currRow = mat[i]
        for (var j = 0; j < mat[0].length; j++) {
            var currCell = currRow[j]
            if (currCell.isMine && !currCell.isShown && !currCell.isMarked)
            minesIdxes.push({ i: i, j: j })
        }
    }
    return minesIdxes
}

function getNumBoom(mat, num) {
    var cellCounter = 1
    var mineCount = 0

    for (var i = 0; i < mat.length; i++) {
        var currRow = mat[i]
        for (var j = 0; j < mat[0].length; j++) {
            var currCell = currRow[j]
            var cellCounterStr = cellCounter + ''
            console.log(cellCounter);
            if (cellCounter % num === 0 || cellCounterStr.includes((num + ''))) {
                currCell.isMine = true
                mineCount++
            }
            cellCounter++
        }
    }
    console.log(mat);
    return [mat, mineCount]
}


//Amount of neighbours with <boolean key> set to true?
function countContentNegs(board, rowIdx, colIdx, booleanKey) {

    var contentCount = 0
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue

        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= board[0].length) continue
            if (i === rowIdx && j === colIdx) continue

            var currCell = board[i][j]
            if (currCell[booleanKey]) contentCount++
        }
    }
    return contentCount
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}