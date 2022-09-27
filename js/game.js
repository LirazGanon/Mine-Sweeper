'use strict'
window.oncontextmenu = e => e.preventDefault() // cancel default menu

const FLAG = '🚩'
const MINE = `<img src="img/mines.png" class="tdImg">`
const COVER = ''
const EMPTY = ''

const LIVE = '🧡'
const elSmiley = document.querySelector('.smiley')
var gBoard
var gGameSteps = []

var gMinesOnManual = []
var gMegaHintsIdxes = []
var gBlownMinesIdxes = []

var gGame
setgGame()

var gLevel = {
    size: 8,
    mines: 0.13,
    totalCell: 0
};

var counterInterval = null

function initGame() {
    gBoard = createMat(gLevel.size)

    gLevel.totalCell = gLevel.size * gLevel.size
    elSmiley.innerHTML = `<img src="img/smile.png">`

    renderBoard(gBoard)
    if (!localStorage.getItem('user_record')) localStorage.setItem('user_record', Infinity)
    const RECORD = (+localStorage.getItem('user_record'))
    document.querySelector('.score span').innerText = (RECORD === Infinity) ? '--' : RECORD
    gGame.isOn = true

}

function setLevel(level) {
    var levelClass
    var width

    switch (level) {
        case 1:
            gLevel.size = 4
            levelClass = '.l1'
            width = 300
            break;
        case 2:
            gLevel.size = 8
            levelClass = '.l2'
            width = 460
            break;
        case 3:
            gLevel.size = 12
            levelClass = '.l3'
            width = 630
            break;
        default: console.log(`Can't find level ${level}`);
    }

    const levelElements = document.querySelectorAll('.levels button')
    levelElements.forEach(element => {
        element.style.backgroundColor = null
    })
    document.querySelector(levelClass).style.backgroundColor = '#e07a36'

    const elGridContainer = document.querySelector('.grid-container ')
    elGridContainer.style.gridTemplateColumns = `auto ${width}px auto`
    resetGame()
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
            if (currCell.clickedOnMine) classAdd = 'is-red'
            else if (currCell.isShown) {
                classAdd = ((i + j) % 2 === 0) ? 'is-shown' : 'is-gray'
            }
            if (!isNaN(cellContent)) classAdd += getNumColor(cellContent)
            if (!cellContent) cellContent = EMPTY

            if (gGame.isManualSet) classAdd += ' blank'

            strHTML += `<td id="${i}-${j}" class="cell ${classAdd}" 
            onclick="cellClicked(this, ${i}, ${j})" 
            oncontextmenu="cellMarked(this, ${i}, ${j})">${cellContent}
            </td>`
        }
        strHTML += '</tr>'
    }

    const elTable = document.querySelector('.table-game tbody')
    elTable.innerHTML = strHTML

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

function getNumColor(num) {
    var color = ''
    if (!num) return color

    switch (num) {
        case 1:
            color = ' text-green'
            break;
        case 2:
            color = ' text-blue'
            break;
        case 3:
            color = ' text-yellow'
            break;
        case 4:
            color = ' text-orange'
            break;
        case 5:
            color = ' text-red'
            break;

        default:
            console.log('To high number?', num);
            break;
    }

    return color
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

    if (!gGame.isOn) return

    if (gGame.isManualSet) {
        setManualMine(elCell, rowIdx, colIdx)
        return
    }

    if (!gGame.isManualMode && !gGame.isSevenBoom) if (gGame.shownCount === 0) setOnfirstCell(rowIdx, colIdx)

    if (!counterInterval) counterInterval = setInterval(setTimer, 1000)

    if (gGame.isHint) {
        useHint(gBoard, rowIdx, colIdx)
        gGame.isHint = false
        return
    }

    if (gGame.isSafe) {
        gGame.isSafe = false
        document.querySelector('.safe').style.backgroundColor = null
    }

    if (gGame.isMegaHint) {
        gMegaHintsIdxes.push({ i: rowIdx, j: colIdx })
        if (gMegaHintsIdxes.length < 2) {
            addOnHoverEvent()
            return
        }
        useMegaHint(gBoard, gMegaHintsIdxes[0], gMegaHintsIdxes[1])
        return
    }

    if (gBoard[rowIdx][colIdx].isShown) return
    gGameSteps.push([])
    expandCell(rowIdx, colIdx)
    checkVictory()
    renderBoard(gBoard)
    gGame.steps += 1
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

    gGameSteps[gGame.steps].push({ i: rowIdx, j: colIdx })

    if (currCell.isMine) {

        gGame.livesCount -= 1
        if (gGame.livesCount > 0) {
            gGame.minesLeft -= 1
            currCell.clickedOnMine = true
            return
        }

        currCell.clickedOnMine = true
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
    if (gGame.minesLeft <= 0 && !currCell.isMarked) return
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

    if (gGame.hintsCount <= 0 || !gGame.isOn || gGame.isMegaHint || gGame.isSafe) {
        blockButtonUse(elHint, 'pop1')
        return
    }
    if (!gGame.isManualMode && !gGame.isSevenBoom) {
        if (gGame.shownCount === 0) {
            blockButtonUse(elHint, 'pop1')
            return
        }
    }

    gGame.isHint = !gGame.isHint
    if (gGame.isHint) elHint.style.backgroundColor = '#cfcb4e'
    else elHint.style.backgroundColor = null
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
                unShowCells(i, j)
            }
        }
    }
}

function unShowCells(rowIdx, colIdx) {
    setTimeout(() => {
        gBoard[rowIdx][colIdx].isShown = false
        renderBoard(gBoard)
        const elHint = document.querySelector('.hint')
        elHint.style.backgroundColor = null
        const elHintLeft = document.querySelector('.hint-left span')
        elHintLeft.innerText = gGame.hintsCount
    }, 1000)
}


function setMegaHint() {
    const elHint = document.querySelector('.mega-hint')

    if (gGame.megaHintsCount <= 0 || !gGame.isOn || gGame.isHint || gGame.isSafe) {
        blockButtonUse(elHint, 'pop3')
        return
    }
    if (!gGame.isManualMode && !gGame.isSevenBoom) {
        if (gGame.shownCount === 0) {
            blockButtonUse(elHint, 'pop3')
            return
        }
    }

    gGame.isMegaHint = !gGame.isMegaHint
    if (gGame.isMegaHint) elHint.style.backgroundColor = '#cfcb4e'
    else {
        elHint.style.backgroundColor = null
        const elCell = document.querySelectorAll('.cell')
        elCell.forEach(cell => cell.style.backgroundColor = null)
    }
}

function useMegaHint(board, startCell, endCell) {

    gGame.isMegaHint = false
    gGame.megaHintsCount -= 1
    if (startCell.i > endCell.i || startCell.j > endCell.j) {
        setMegaHint()
        gMegaHintsIdxes = []
        gGame.megaHintsCount += 1
        return
    }

    for (var i = startCell.i; i <= endCell.i; i++) {
        var currRow = board[i]
        for (var j = startCell.j; j <= endCell.j; j++) {
            var currCell = currRow[j]
            if (!currCell.isShown) {
                currCell.isShown = true
                renderBoard(board)
                unMegaShowCells(i, j)
            }
        }
    }
}

function unMegaShowCells(rowIdx, colIdx) {
    setTimeout(() => {
        gBoard[rowIdx][colIdx].isShown = false
        renderBoard(gBoard)
        const elHint = document.querySelector('.mega-hint')
        elHint.style.backgroundColor = null
        const elHintLeft = document.querySelector('.mega-hint-left span')
        elHintLeft.innerText = gGame.megaHintsCount
    }, 1000)
}

function blockButtonUse(element, msgClass) {
    popUp(msgClass)
    element.style.backgroundColor = 'red'
    element.style.cursor = 'not-allowed'
    setTimeout(function () {
        element.style.backgroundColor = null
        element.style.cursor = null
    }, 400)

}

function addOnHoverEvent() {
    const elCell = document.querySelectorAll('.cell')
    elCell.forEach(cell => {
        cell.addEventListener('mouseover', event => {
            var currIdxes = event.target.id.split('-')
            var targetIdxes = { i: +currIdxes[0], j: +currIdxes[1] }
            shadeCells(gMegaHintsIdxes[0], targetIdxes)
        })
    })

}
function shadeCells(startCell, endCell) {

    const elCell = document.querySelectorAll('.cell')
    elCell.forEach(cell => cell.style.backgroundColor = null)

    if (!gGame.isMegaHint || !startCell) {
        gMegaHintsIdxes = []
        return
    }

    if (startCell.i > endCell.i || startCell.j > endCell.j) return
    for (var i = startCell.i; i <= endCell.i; i++) {
        for (var j = startCell.j; j <= endCell.j; j++) {
            document.getElementById(`${i}-${j}`).style.backgroundColor = '#faf558'
        }
    }
}

function setSafe() {
    const elSafe = document.querySelector('.safe')

    if (gGame.hintsCount <= 0 || !gGame.isOn || gGame.isHint || gGame.isMegaHint) {
        blockButtonUse(elSafe, 'pop2')
        return
    }
    if (!gGame.isManualMode && !gGame.isSevenBoom) {
        if (gGame.shownCount === 0) {
            blockButtonUse(elSafe, 'pop2')
            return
        }
    }

    gGame.isSafe = !gGame.isSafe
    if (gGame.isSafe) elSafe.style.backgroundColor = '#cfcb4e'

    if (gGame.isSafe) {
        useSafe(gBoard)
        document.querySelector('.safe-left span').innerText = gGame.safeCount
        return
    }
}

function useSafe(board) {

    const safeCells = findSafeCells(board)
    if (safeCells.length === 0) {
        const elSafe = document.querySelector('.safe')
        elSafe.style.backgroundColor = 'red'
        elSafe.style.cursor = 'not-allowed'
        setTimeout(function () {
            elSafe.style.backgroundColor = null
            elSafe.style.cursor = null
        }, 400)

        return
    }
    gGame.safeCount -= 1

    const randIdx = getRandomInt(0, safeCells.length)
    const randomSafeCell = safeCells[randIdx]
    flashCell(randomSafeCell.i, randomSafeCell.j)
}

function flashCell(rowIdx, colIdx) {
    const cell = document.getElementById(`${rowIdx}-${colIdx}`)
    cell.classList.add('blink_me')
}

function minesExterminator(amount) {

    const elTerminator = document.querySelector('.terminator')
    if (gGame.terminateCount <= 0 || !gGame.isOn || gGame.isHint || gGame.isMegaHint ||
        gGame.isSafe || gGame.shownCount === 0) {
        blockButtonUse(elTerminator, 'pop5')
        return
    }
    
    gGame.terminateCount -= 1

    for (let i = 0; i < amount; i++) {
        mineTerminate()
        document.querySelector('.terminator-left span').innerText = gGame.terminateCount
        checkVictory()
        if (gGame.isWin) return
    }

}

function mineTerminate() {

    const minesIdxes = findMines(gBoard)

    if (minesIdxes.length === 0) return
    const currMineIdx = minesIdxes.splice(getRandomInt(0, minesIdxes.length), 1)[0]
    gBlownMinesIdxes.push(currMineIdx)
    const currCell = gBoard[currMineIdx.i][currMineIdx.j]
    currCell.isMine = false
    gGame.minesLeft -= 1
    gGameSteps.push([])
    setMinesNegsCount(gBoard)
    expandCell(currMineIdx.i, currMineIdx.j)
    gGame.steps += 1
    document.getElementById(`${currMineIdx.i}-${currMineIdx.j}`).innerHTML = `<img class="boom" src="img/boom.gif">`
    setTimeout(() => {
        renderBoard(gBoard)
    }, 1000);

}


function undo() {

    const elundo = document.querySelector('.undo')

    if (gGameSteps.length === 0 || !gGame.isOn || gGame.isMegaHint || gGame.isHint || gGame.isSafe) {
        blockButtonUse(elundo, 'pop4')
        return

    }

    const currIdxes = gGameSteps.splice(-1)[0]
    currIdxes.forEach(idx => {
        const currCell = gBoard[idx.i][idx.j]
        if (gBlownMinesIdxes.findIndex((obj) => obj.i === idx.i && obj.j === idx.j) !== -1){
            currCell.isMine = true
        }
        currCell.isShown = false
        if (currCell.isMine) {
            currCell.clickedOnMine = false
            gGame.livesCount += 1
            gGame.minesLeft += 1
        }
        gGame.shownCount -= 1
    })

    gGame.steps -= 1

    renderBoard(gBoard)
}

function onManualMode() {
    if (gGame.isManualSet) {
        gGame.minesLeft = gMinesOnManual.length
        startManualMode(gMinesOnManual)
        return
    }

    if (gGame.shownCount > 0) {
        var res = confirm(`Are you sure you want to continue? You will lose your progress.`)
        if (!res) return
    }

    resetGame()
    gGame.isManualSet = true
    document.querySelector('.table-game tbody').classList.add('manual')
    document.querySelector('.set-mines').innerText = 'Start Game'
    renderBoard(gBoard)
}

function setManualMine(elCell, rowIdx, colIdx) {
    const currCellIdxs = { rowIdx: rowIdx, colIdx: colIdx }
    const mineIdx = gMinesOnManual.findIndex(cell => cell.rowIdx === rowIdx && cell.colIdx === colIdx);
    if (mineIdx === (-1)) gMinesOnManual.push(currCellIdxs)
    else gMinesOnManual.splice(mineIdx, 1)
    elCell.classList.toggle('mine-background')
}



function startManualMode(idxesObj) {
    // console.log(gBoard);

    idxesObj.forEach(function (idxObj) {
        gBoard[idxObj.rowIdx][idxObj.colIdx].isMine = true
    })

    setMinesNegsCount(gBoard)
    renderBoard(gBoard)
    gGame.isManualSet = false
    document.querySelector('.table-game tbody').classList.remove('manual')
    document.querySelector('.set-mines').innerText = 'Set Mines'
    gGame.isManualMode = true
    renderBoard(gBoard)
}


function sevenBoom() {
    if (gGame.shownCount > 0) {
        var res = confirm(`Are you sure you want to continue? You will lose your progress.`)
        if (!res) return
    }

    resetGame()
    gGame.isSevenBoom = true
    const buildRes = getNumBoom(gBoard, 7)
    gBoard = buildRes[0]
    gGame.minesLeft = buildRes[1]
    setMinesNegsCount(gBoard)
    renderBoard(gBoard)
    document.querySelector('.seven-boom').style.backgroundColor = '#cfcb4e'
}

function popUp(id) {
    var popup = document.getElementById(id)
    popup.classList.toggle("show")
    setTimeout(() => popup.classList.toggle("show"), 2000)
}

function setDarkMod() {
    document.querySelector('body').classList.toggle('body-dark')
    document.querySelector('.info-container').classList.toggle('info-container-dark')
    document.querySelector('.game-container').classList.toggle('game-container-dark')
    document.querySelector('.top-container').classList.toggle('top-container-dark')
    document.querySelector('h1').classList.toggle('h1-dark')
    document.querySelector('.table-game').classList.toggle('table-game-dark')
    document.querySelector('.bottom-info').classList.toggle('info-container-dark')
    document.querySelector('.footer').classList.toggle('footer-dark')
    const elH2 = document.querySelectorAll('h2')
    elH2.forEach(el => el.classList.toggle('h2-dark'))
    const elDarkText = document.querySelector('.dark-switch')
    elDarkText.classList.toggle('light-switch')
    if (elDarkText.innerText === 'dark mode') {
        elDarkText.innerText = 'light mode'
    } else elDarkText.innerText = 'dark mode'
}

function gameOver() {
    gGame.isOn = false
    clearInterval(counterInterval)

    if (gGame.isWin) {
        elSmiley.innerHTML = `<img src="img/win.gif">` //😎
        var record = +localStorage.getItem('user_record');
        if (gGame.secsPassed < record) {
            document.querySelector('.score span').innerText = gGame.secsPassed
            localStorage.setItem('user_record', gGame.secsPassed);
        }

    } else {
        elSmiley.innerHTML = `<img src="img/lose.gif">` // 🤯
        buildBoard(gBoard, 'isShown', 1)
    }

}

function resetGame() {

    if (counterInterval) clearInterval(counterInterval)

    if (gGame.isSevenBoom) document.querySelector('.seven-boom').style.backgroundColor = null

    setgGame()

    gMinesOnManual = []
    gGameSteps = []
    gMegaHintsIdxes = []
    gBlownMinesIdxes = []

    const elHint = document.querySelector('.hint')
    elHint.style.backgroundColor = null

    const elHintLeft = document.querySelector('.hint-left span')
    elHintLeft.innerText = gGame.hintsCount

    const elMegaHintLeft = document.querySelector('.mega-hint-left span')
    elMegaHintLeft.innerText = gGame.megaHintsCount

    const elSafe = document.querySelector('.safe')
    elSafe.style.backgroundColor = null

    const elSafeLeft = document.querySelector('.safe-left span')
    elSafeLeft.innerText = gGame.safeCount

    const elTerminator = document.querySelector('.terminator-left span')
    elTerminator.innerText = gGame.terminateCount

    document.querySelector('.set-mines').innerText = 'Set Mines'

    counterInterval = null
    setTimer()
    initGame()
}

function setgGame() {
    gGame = {
        isOn: false,
        isWin: false,
        isSafe: false,
        isHint: false,
        isManualSet: false,
        isManualMode: false,
        isSevenBoom: false,
        isMegaHint: false,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
        minesHits: 0,
        minesLeft: 0,
        livesCount: 3,
        hintsCount: 3,
        safeCount: 3,
        megaHintsCount: 1,
        terminateCount: 1,
        steps: 0,
    }
}