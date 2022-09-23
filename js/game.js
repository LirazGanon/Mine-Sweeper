'use strict'
window.oncontextmenu = e => e.preventDefault() // cancel default menu

const FLAG = '🚩'
const MINE = `<img src="img/mines.png" class="tdImg">`
const COVER = ''
const EMPTY = ''

const LIVE = '🧡'
const elSmiley = document.querySelector('.smiley')
var gBoard
var gClassAdd

var gGame = {
    isOn: false,
    isWin: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    minesHits: 0,
    minesLeft: 0,
    livesCount: 3,
    hintsCount: 3,
    isHint: false
}

var gLevel = {
    size: 8,
    mines: 0.2,
    totalCell: 0
};

var counterInterval = null

function initGame() {
    gBoard = createMat(gLevel.size)

    gLevel.totalCell = gLevel.size * gLevel.size
    elSmiley.innerText = '🙂'

    renderBoard(gBoard)
    const RECORD = (+localStorage.getItem('user_record')) ? localStorage.getItem('user_record') :
        localStorage.setItem('user_record', Infinity)
    document.querySelector('.score span').innerText = RECORD
    gGame.isOn = true

}

function setLevel(level) {
    var levelClass

    switch (level) {
        case 1:
            gLevel.size = 4
            levelClass = '.l1'
            break;
        case 2:
            gLevel.size = 8
            levelClass = '.l2'
            break;
        case 3:
            gLevel.size = 12
            levelClass = '.l3'
            break;
        default: console.log(`Can't find level ${level}`);
    }
    var levelElements = document.querySelectorAll('.levels button')
    levelElements.forEach(element => {
        element.style.backgroundColor = null
    });
    document.querySelector(levelClass).style.backgroundColor = '#e07a36'

    resetGame();
    initGame()
}

function renderBoard(board) {
    var strHTML = ''

    for (var i = 0; i < board.length; i++) {
        const currRow = board[i]
        strHTML += '<tr>'
        for (var j = 0; j < board[0].length; j++) {
            const currCell = currRow[j]
            var cellContent = setCellContent(currCell)

            var classAdd = ''
            if (currCell.isShown) {
                classAdd = ((i + j) % 2 === 0) ? 'is-shown' : 'is-gray'
            }

            if (!cellContent) cellContent = EMPTY

            strHTML += `<td id="${i}-${j}" class="cell ${classAdd}" 
            onclick="cellClicked(this, ${i}, ${j})" 
            oncontextmenu="cellMarked(this, ${i}, ${j})">${cellContent}
            </td>`
        }
        strHTML += '</tr>'
    }

    const elTable = document.querySelector('.table-game tbody')
    elTable.innerHTML = strHTML

    gClassAdd = ''

    renderMinesLeft()
    renderLives()
}

function renderMinesLeft() {
    const elMinesInfo = document.querySelector('.mines span')
    elMinesInfo.innerText = gGame.minesLeft
}

function renderLives() {

    const livesIcons = LIVE.repeat(gGame.livesCount)
    const elMinesInfo = document.querySelector('.lives span')
    elMinesInfo.innerText = livesIcons

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

function cellClicked(elCell, rowIdx, colIdx) {

    if (gGame.shownCount === 0) setOnfirstCell(rowIdx, colIdx)

    if (!gGame.isOn) return
    if (!counterInterval) counterInterval = setInterval(setTimer, 1000)
    if (gGame.isHint) {
        useHint(gBoard, rowIdx, colIdx)
        setHint()
        gGame.isHint = false
        return
    }

    expandCell(rowIdx, colIdx)
    checkVictory()
    renderBoard(gBoard)
}

function setOnfirstCell(rowIdx, colIdx) {
    const buildRes = buildBoard(gBoard, 'isMine', gLevel.mines)
    gBoard = buildRes[0]
    gGame.minesLeft = buildRes[1]
    if (gBoard[rowIdx][colIdx].isMine) setOnfirstCell(rowIdx, colIdx)

    setMinesNegsCount(gBoard)
}

function expandCell(rowIdx, colIdx) {

    const currCell = gBoard[rowIdx][colIdx]
    if (currCell.isShown || currCell.isMarked) return

    currCell.isShown = true
    gGame.shownCount += 1

    if (currCell.isMine) {
        if (gGame.livesCount > 1) {
            gGame.livesCount -= 1
            gGame.minesLeft -= 1
            return
        }

        gGame.livesCount -= 1
        gameOver()
        return
    }

    if (!currCell.minesAroundCount) {
        expandShown(gBoard, rowIdx, colIdx)
    }
}

function expandShown(board, rowIdx, colIdx) {

    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue

        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= board[0].length) continue
            if (i === rowIdx && j === colIdx) continue
            expandCell(i, j)
        }
    }
}

function cellMarked(elCell, i, j) {
    if (!gGame.isOn) return
    if (!counterInterval) counterInterval = setInterval(setTimer, 1000)

    const currCell = gBoard[i][j]

    currCell.isMarked = !currCell.isMarked
    if (currCell.isMarked) {
        gLevel.markedCount += 1
        gGame.minesLeft -= 1
        if (currCell.isMine) gGame.minesHits += 1
    } else {
        gLevel.markedCount -= 1
        gGame.minesLeft += 1
        if (currCell.isMine) gGame.minesHits -= 1
    }
    checkVictory()
    renderBoard(gBoard)
}

function setTimer() {
    if (counterInterval) gGame.secsPassed += 1

    const elTimer = document.querySelector('.timer span')
    var secStr = gGame.secsPassed + ''
    if (secStr.length === 1) secStr = '00' + secStr
    else if (secStr.length === 2) secStr = '0' + secStr

    elTimer.innerText = secStr
}

function checkVictory() {
    if (gLevel.totalCell === (gGame.shownCount + gGame.minesHits)) {
        gGame.isWin = true
        gameOver()
    }
}

function setHint() {
    const elHint = document.querySelector('.hint')
    if (gGame.hintsCount <= 0 || gGame.shownCount === 0) {
        elHint.style.backgroundColor = 'red'
        elHint.style.cursor = 'not-allowed'
        setTimeout(function () {
            elHint.style.backgroundColor = null
            elHint.style.cursor = null
        },400)

        return
    }
    gGame.isHint = !gGame.isHint
    if (gGame.isHint) elHint.style.backgroundColor = '#cfcb4e'
}

function useHint(board, rowIdx, colIdx) {

    gGame.hintsCount -= 1

    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue

        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= board[0].length) continue
            if (!board[i][j].isShown) {
                board[i][j].isShown = true
                renderBoard(board)
                unShowCells(board, i, j)

            }
        }
    }
}

function unShowCells(board, rowIdx, colIdx) {
    setTimeout(() => {
        gBoard[rowIdx][colIdx].isShown = false
        renderBoard(gBoard)
        const elHint = document.querySelector('.hint')
        elHint.style.backgroundColor = null
    }, 1000)
}


function gameOver() {
    gGame.isOn = false
    clearInterval(counterInterval)

    if (gGame.isWin) {
        elSmiley.innerText = '😎'
        var record = +localStorage.getItem('user_record');
        console.log(record);
        if (gGame.secsPassed < record) localStorage.setItem('user_record', gGame.secsPassed);

    } else {
        elSmiley.innerText = '🤯'
        buildBoard(gBoard, 'isShown', 1)
    }

}

function resetGame() {

    if (counterInterval) clearInterval(counterInterval)

    gGame = gGame = {
        isOn: false,
        isWin: false,
        isHint: false,
        hintsCount: 3,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
        minesHits: 0,
        minesLeft: 0,
        livesCount: 3
    }

    counterInterval = null
    setTimer()
    initGame()
}




