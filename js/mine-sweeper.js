'use strict'


const BOMB = '<img class="cell-img bomb-img" src="img/bomb.svg">'
const FLAG = '<img class="cell-img flag-img" src="img/flag.svg">'
const EMPTY = ' '

var gBoard

var gLevel = {
    SIZE: 4,
    MINES: 2
}

var gGame = {
    isOn: false,
    revealedCount: 0,
    markedCount: gLevel.MINES,
    secsPassed: 0
}

var gMineCells = []

var gIsFirstClick = true

var gCurrLevel = 'beginner'

var gRemainingLives = 3

var gUnrevealedTimeOut



function onInit() {
    gBoard = buildBoard()
    renderBoard(gBoard)
    displayFlagsMinesCount()
}


function buildBoard() {
    const board = []

    for (var i = 0; i < gLevel.SIZE; i++) {
        board.push([])

        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j] = { minesAroundCount: 0, isRevealed: false, isMine: false, isMarked: false }

            // if (i === 1 && j === 0 || i === 3 && j === 3) board[i][j].isMine = true
        }
    }
    console.table(board)
    return board
}


function renderBoard(board) {

    var strHTML = '<table><tbody>'
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board.length; j++) {
            const cell = board[i][j]
            var minesNegsCount = setMinesNegsCount(i, j, board)
            cell.minesAroundCount = minesNegsCount ? minesNegsCount : EMPTY

            var cellRevealedClr = cell.isRevealed ? 'cell-revealed' : 'cell-unrevealed'
            var cellMarkedClr = cell.isMarked ? 'cell-marked' : EMPTY
            var MineCell = cell.isMine ? 'mine-cell' : EMPTY

            const className = `cell cell-${i}-${j} ${cellRevealedClr} ${cellMarkedClr} ${MineCell}`
            strHTML += `<td onclick="onCellClicked(this, ${i}, ${j})" oncontextmenu="onCellMarked(this, ${i}, ${j}, event)" class="${className}">`
              
            if (cell.isRevealed) {
                    if (cell.isMine) strHTML += BOMB
                    else strHTML += `${cell.minesAroundCount}`

                } else if (cell.isMarked & !cell.isRevealed) strHTML += FLAG

            strHTML += '</td>'
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>'

    document.querySelector('.board-container').innerHTML = strHTML
}


function setMinesNegsCount(cellI, cellJ, board) {
    var minesNegsCount = 0
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++){
            if(i === cellI && j === cellJ) continue
            if(j < 0 || j >= board.length) continue

            if (board[i][j].isMine) minesNegsCount++
        }
    }
    return minesNegsCount
}


function onCellClicked(elCell, i, j) {
    // console.log('gIsFirstClick:', gIsFirstClick)
    // console.log('gMineCells:', gMineCells)
    // console.log('elCell:', elCell)
    
    if (gIsFirstClick) gGame.isOn = true
    if (!gGame.isOn) return

    if (gIsFirstClick) {
        setRandomMines(i, j)
        gIsFirstClick = false
    } 
    // console.log('gIsFirstClick:', gIsFirstClick)
    // console.log('gMineCells:', gMineCells)
    const cell = gBoard[i][j]
    if (!cell.isMarked) {
        cell.isRevealed = true
        gGame.revealedCount++
        checkGameOver(i, j)


    }
    console.log('gGame:', gGame)
    renderBoard(gBoard)
}


function onCellMarked(elCell, i, j, ev) {
    ev.preventDefault()
    if (!gGame.isOn) return
    var elFlag = document.querySelector('.flag-count-icon span')
    // console.log('elFlag:', elFlag)
    const cell = gBoard[i][j]
    if (!cell.isRevealed) cell.isMarked = !cell.isMarked
    cell.isMarked ? gGame.markedCount-- : gGame.markedCount++
    // console.log('gGame:', gGame)
    elFlag.innerText = gGame.markedCount
    checkGameOver(i, j)

    renderBoard(gBoard)
}


function checkGameOver(cellI, cellJ) {
    var cell = gBoard[cellI][cellJ]
    const elHearts = document.querySelectorAll('.hearts')
    // console.log('elHearts:', elHearts)

    if (cell.isMine && !cell.isMarked) {
        if (gRemainingLives !== 0) {
            elHearts[gRemainingLives - 1].classList.add('hidden') 
            gRemainingLives--

            clearTimeout(gUnrevealedTimeOut)

            gUnrevealedTimeOut = setTimeout(() => {
                cell.isRevealed = false
                renderBoard(gBoard)
                
            }, 500);
            
            gGame.revealedCount--
            console.log('elHearts:', elHearts)
            return
        }

        for (var i = 0; i < gMineCells.length; i++) {
            var mineCell = gMineCells[i]
            mineCell.isRevealed = true
        }
        gGame.isOn = false
        console.log('YOU FAILED!')
        return
    }

    if (gGame.revealedCount === (gLevel.SIZE ** 2) - gLevel.MINES && gGame.markedCount === 0) {
        gGame.isOn = false
        console.log('YOU WON!')
        return
    }

}


function expandReveal(board, elCell, i, j) {

}


function setRandomMines(cellI, cellJ) {
    // var minesCount = 0
    for (var i = 0; i < gLevel.MINES; i++) {
        
        var pos = findEmptyPos(cellI, cellJ)
        if(!pos) return
        gBoard[pos.i][pos.j].isMine = true
        gMineCells.push(gBoard[pos.i][pos.j])
        // minesCount++ 
    }
    // renderBoard(gBoard)
}

function setGameLevel(elBtn) {
    console.log('hi')
    console.log('elBtn:', elBtn)
    if (elBtn.classList.contains("beginner-btn")) {
        gCurrLevel = 'beginner'
    }
    else if (elBtn.classList.contains("inter-btn")) {
        gCurrLevel = 'intermediate'
    }
    else if (elBtn.classList.contains("expert-btn")) {
        gCurrLevel = 'expert'
    }
    resetGame()
}

function resetGame() {
    const elHearts = document.querySelectorAll('.hearts')
    console.log('gGame:', gGame)

    console.log('gCurrLevel:', gCurrLevel)
    if (gCurrLevel === 'beginner') {
        gLevel.SIZE = 4
        gLevel.MINES = 2
        gGame.markedCount = gLevel.MINES

    } else if (gCurrLevel === 'intermediate') {
        gLevel.SIZE = 8
        gLevel.MINES = 14
        gGame.markedCount = gLevel.MINES

    } else if (gCurrLevel === 'expert') {
        gLevel.SIZE = 12
        gLevel.MINES = 32
        gGame.markedCount = gLevel.MINES
    }

    for (var idx = 0; idx < elHearts.length; idx++) {
        var elHeart = elHearts[idx]
        elHeart.classList.remove('hidden')
    }
    gRemainingLives = 3
    gGame.revealedCount = 0
    gIsFirstClick = true
    gGame.isOn = false
    gMineCells = []
    onInit()
}

function displayFlagsMinesCount () {
    document.querySelector('.bomb-count-icon span').innerText = gLevel.MINES
    document.querySelector('.flag-count-icon span').innerText = gLevel.MINES
}