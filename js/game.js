'use strict'
window.oncontextmenu = e => e.preventDefault() // cancel default menu

const FLAG = '🚩'
const MINE = '💣'
const COVER = '🔲'
const EMPTY = ''
var gBoard

var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0
}

var gLevel = {
    size: 10,
    mines: 0.1
};

var counterInterval

function initGame() {
    gBoard = createMat(gLevel.size)

    gBoard = buildBoard(gBoard, 'isMine', gLevel.mines)
    console.table(gBoard)

    setMinesNegsCount(gBoard)
    renderBoard(gBoard)
    counterInterval = setInterval(setTimer,1000)
}

function renderBoard(board) {
    var strHTML = ''

    for (var i = 0; i < board.length; i++) {
        const currRow = board[i]
        strHTML += '<tr>'
        for (var j = 0; j < board[0].length; j++) {
            const currCell = currRow[j]
            var cellContent = setCellContent(currCell)
            if (!cellContent) cellContent = EMPTY
            strHTML += `<td data-cell-location="${i}-${j}" 
            onclick="cellClicked(this, ${i}, ${j})" 
            oncontextmenu="cellMarked(this, ${i}, ${j})">${cellContent}
            </td>`
        }
        strHTML += '</tr>'
    }
    const elTable = document.querySelector('.table-game tbody')
    elTable.innerHTML = strHTML
}

function setCellContent(cell) {
    var cellContent

    if (cell.isShown) {
        cellContent = (cell.isMine) ? MINE : cell.minesAroundCount
    } else {
        cellContent = (cell.isMarked) ? FLAG : COVER
    }

    return cellContent
}


function setMinesNegsCount(board) {

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            board[i][j].minesAroundCount = countContentNegs(board, i, j, 'isMine')
        }
    }
    return board
}

function cellClicked(elCell, i, j) {

    const currCell = gBoard[i][j]

    if (currCell.isShown || currCell.isMarked) return

    currCell.isShown = true
    if (currCell.isMine) {
        gameOver()
        return
    } else {
        if (!currCell.minesAroundCount) {
            expandShown(gBoard, i, j)
        }
    }

    renderBoard(gBoard)
}

function cellMarked(elCell, i, j) {
    const currCell = gBoard[i][j]

    currCell.isMarked = !currCell.isMarked

    renderBoard(gBoard)
}

function setTimer(){
    gGame.secsPassed += 1
    const elTimer = document.querySelector('.timer')
    elTimer.innerText = gGame.secsPassed
}

function gameOver(){
    gGame.isOn = false
    clearInterval(counterInterval)
    document.querySelector('.end-modal').classList.remove('hide')
}

function resetGame(){
    document.querySelector('.end-modal').classList.add('hide')
    gGame = {
        isOn: true,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0
    }
    const elTimer = document.querySelector('.timer')
    elTimer.innerText = gGame.secsPassed
    initGame()
}

function expandShown(board, rowIdx, colIdx) {

    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue

        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= board[0].length) continue
            if (i === rowIdx && j === colIdx) continue

            cellClicked(board, i, j)

        }
    }
}

