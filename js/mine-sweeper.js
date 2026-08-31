'use strict'

const BOMB = '<img class="cell-img bomb-img" src="img/bomb.svg">'
const FLAG = '<img class="cell-img flag-img" src="img/flag.svg">'
const EMPTY = ''

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

var gHintBtn = {
    isHintBtnActive: false,
    hintCount: 3
}

var gSafeBtn = {
    isSafeBtnActive: false,
    safeClickCount: 3,
}

var gMegaHint = {
    isMegaHintActive: false,
    megaHintSelectedCells: []
}

var gCustomMinesMode = {
    isCustomActive: false,
    selectedMinesCells: []
}


var gMineCells = []
var gRevealedCells = []
var gisLastMoveRecursion = false

var gIsFirstClick = true
var gCurrLevel = 'beginner'
var gRemainingLives = 3
var gUnrevealedTimeOut

var gStartTime
var gTimeInterval

var gIsDarkMode = true  




function onInit() {
    gBoard = buildBoard()
    renderBoard(gBoard)
    displayFlagsMinesCount()
    showBestTime()
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
            var hintModeClr = gHintBtn.isHintBtnActive ? 'hint-mode' : EMPTY
            var megaHintModeClr = gMegaHint.isMegaHintActive ? 'megahint-mode' : EMPTY

            const className = `cell cell-${i}-${j} ${cellRevealedClr} ${cellMarkedClr} ${MineCell} ${hintModeClr} ${megaHintModeClr}`
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
    const cell = gBoard[i][j]
    // console.log('elCell:', elCell)
    if (gCustomMinesMode.isCustomActive) {
        if (cell.isMine) {
            cell.isMine = false
            gCustomMinesMode.selectedMinesCells.pop()
            console.log('gCustomMinesMode.selectedMinesCells:', gCustomMinesMode.selectedMinesCells)
            elCell.classList.remove('mine-cell')
            elCell.innerHTML = EMPTY
            return
        
        } else {
            cell.isMine = true
            gCustomMinesMode.selectedMinesCells.push({i, j})
            console.log('gCustomMinesMode.selectedMinesCells:', gCustomMinesMode.selectedMinesCells)
            elCell.classList.add('mine-cell')
            elCell.innerHTML = BOMB            
        } 
        

        if (gCustomMinesMode.selectedMinesCells.length === gLevel.MINES) {
            document.querySelector('.custom-btn').disabled = true
            gCustomMinesMode.isCustomActive = false
            gIsFirstClick = false
            gGame.isOn = true
            startTimer()

            toggleCustomMode()
            return
        } 
    }

    if (cell.isRevealed) return
    document.querySelector('.kaboom-btn').disabled = false

    gRevealedCells = []

    if (gIsFirstClick) {
        gGame.isOn = true
        startTimer()
    }
    if (!gGame.isOn) return

    if (gIsFirstClick) {
        setRandomMines(i, j)
        renderBoard(gBoard)
        gIsFirstClick = false
    } 
    console.log('gMineCells:', gMineCells)
    if (gHintBtn.isHintBtnActive && !cell.isRevealed && !cell.isMarked) {

        gHintBtn.isHintBtnActive = false
        document.querySelector('.hint-btn').disabled = true
        displayAndHideHintCellNegs(i, j, gBoard)
        renderBoard(gBoard)
        return
    }

    if (gMegaHint.isMegaHintActive) {
        gMegaHint.megaHintSelectedCells.push({i, j})
        megaHintSelectedCells()
        if (gMegaHint.megaHintSelectedCells.length === 2) {
            document.querySelector('.megahint-btn').disabled = true
            displaySelectedArea()

            return
        }

        console.log('gMegaHint.megaHintSelectedCells:', gMegaHint.megaHintSelectedCells)
        return
    }

    if (!cell.isMarked) {
        if (!cell.isMine && !cell.minesAroundCount) {
            expandReveal(gBoard, elCell, i, j)
            checkGameOver(i, j)
            renderBoard(gBoard)
            return
        }

        cell.isRevealed = true
        gisLastMoveRecursion = false
        if (!cell.isMine) gRevealedCells.push(cell)
        console.log('gRevealedCells:', gRevealedCells)
        gGame.revealedCount++
        checkGameOver(i, j)
    }
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

        if (gMineCells.length) {
            for (var i = 0; i < gMineCells.length; i++) {
                var mineCell = gMineCells[i]
                mineCell.isRevealed = true
            }
        }

        if (gCustomMinesMode.selectedMinesCells.length) {
            for (var i = 0; i < gCustomMinesMode.selectedMinesCells.length; i++) {

                var customMineCell = gCustomMinesMode.selectedMinesCells[i]
                console.log('customMineCell:', customMineCell)
                var mineCell = gBoard[customMineCell.i][customMineCell.j]
                mineCell.isRevealed = true
            }
        }

        gGame.isOn = false
        clearInterval(gTimeInterval)
        document.querySelector('.smiley-btn img').src = 'img/angry-smiley.png'
        console.log('YOU FAILED!')
        return
    }

    if (gGame.revealedCount === (gLevel.SIZE ** 2) - gLevel.MINES && gGame.markedCount === 0) {
        gGame.isOn = false
        clearInterval(gTimeInterval)
        saveBestTime()

        document.querySelector('.smiley-btn img').src = 'img/happy-open-mouth-smiley.png'

        console.log('YOU WON!')

        return
    }
}


function expandReveal(board, elCell, cellI, cellJ) {
    
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++){
            // if (i === cellI && j === cellJ) continue
            if (j < 0 || j >= board.length) continue

            const cell = board[i][j]

            if (cell.isRevealed || cell.isMarked) continue
            cell.isRevealed = true
            gRevealedCells.push(cell)
            console.log('gRevealedCells:', gRevealedCells)
            gGame.revealedCount++

            if (!cell.minesAroundCount) {
                gisLastMoveRecursion = true
                expandReveal(board, elCell, i, j)
            }
        }
    }
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
    const elTimer = document.querySelector('.timer')
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
    clearInterval(gTimeInterval)
    elTimer.innerText = '00:00'
    onInit()
}

//* Timer //

function startTimer() {
    gStartTime = Date.now()

    gTimeInterval = setInterval(() => {
        var elapsedTime = Date.now() - gStartTime

        gGame.secsPassed = Math.floor(elapsedTime / 1000)

        var minutes = Math.floor( gGame.secsPassed / 60)
        var seconds =  gGame.secsPassed % 60

        var elTime = document.querySelector('.timer')
        elTime.innerHTML = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }, 30)
}

function saveBestTime() {
    var storageKey = `bestTime-${gCurrLevel}`
    var savedTime = localStorage.getItem(storageKey)

    if (savedTime === null ||  gGame.secsPassed < +savedTime) {
        localStorage.setItem(storageKey,  gGame.secsPassed)
    }
    showBestTime()
}

function showBestTime() {
    var elBestTime = document.querySelector('.best-time span')
    var storageKey = `bestTime-${gCurrLevel}`
    var savedTime = localStorage.getItem(storageKey)

    if (savedTime === null) {
        elBestTime.innerText = '--:--'
        return
    }

    var totalSeconds = +savedTime
    var minutes = Math.floor(totalSeconds / 60)
    var seconds = totalSeconds % 60

    elBestTime.innerText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

//* Hint Mode Button //

function hintMode(elBtn) {
    // if (gHintBtn.hintCount === 0) {
    //     gHintBtn.isHintBtnActive = false
    //     return
    // }

    gHintBtn.isHintBtnActive = !gHintBtn.isHintBtnActive
    renderBoard(gBoard)

    var elHintIcons = document.querySelectorAll('.hints img')
    var elHintIcon = elHintIcons[gHintBtn.hintCount - 1]
    elHintIcon.src = 'img/hint-active.svg'
}

function displayAndHideHintCellNegs(cellI, cellJ, board) {
    var cellNegs = []
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++){
            if(j < 0 || j >= board.length) continue

            var cell = board[i][j]
            if (cell.isRevealed || cell.isMarked) continue
            cell.isRevealed = true
            cellNegs.push(cell)
        }
    }

    setTimeout(() => {
        hideCellNegs(cellNegs)
        renderBoard(gBoard)
        var elHintIcons = document.querySelectorAll('.hints')
        elHintIcons[gHintBtn.hintCount - 1].classList.add('hidden')
        gHintBtn.hintCount--
        document.querySelector('.hint-btn').disabled = false

        if (gHintBtn.hintCount === 0) {
            document.querySelector('.hint-btn').disabled = true
            // var elBtnIcon = document.querySelector('.hint-btn img')
            // elBtnIcon.src = 'img/hint-btn-off.svg'
        }
    }, 1500);
}

function hideCellNegs(cellNegs) {
    for (var i = 0; i < cellNegs.length; i++) {

        var cell = cellNegs[i]
        cell.isRevealed = false        
    }
}

//* Safe Click Button //

function safeClick(elBtn) {
    var elSafeIcons = document.querySelectorAll('.safe-click')

    if (gSafeBtn.isSafeBtnActive) return 
    if (gSafeBtn.safeClickCount !== 0) {
        gSafeBtn.isSafeBtnActive = true

        elSafeIcons[gSafeBtn.safeClickCount - 1].classList.add('hidden')
        gSafeBtn.safeClickCount--   
        displaySafeCell(gBoard)
    }
}

function displaySafeCell(gBoard) {

    var safeCells = []
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var cell = {i, j}

            if (!cell.isRevealed && !cell.isMine && !cell.isMarked) {
                safeCells.push(cell)
            }
        }
    }
    var randIdx = getRandomInt(0, safeCells.length)
    var safeCell = safeCells[randIdx]
    var cellClassName = getClassName(safeCell)
    var elSafeCell = document.querySelector(cellClassName)
    elSafeCell.classList.add('safe-mode')

    setTimeout(() => {
        elSafeCell.classList.remove('safe-mode')
        gSafeBtn.isSafeBtnActive = false
    }, 1500);

    if (gSafeBtn.safeClickCount === 0) {
        document.querySelector('.safe-btn').disabled = true
        // var elSafeBtn = document.querySelector('.safe-btn img')
        // elSafeBtn.src = 'img/safe-btn-off.svg'
    }
}

//* Undo Button //

function undoMove() {
    console.log('HI')
    for (var i = 0; i < gRevealedCells.length; i++) {
        var cell = gRevealedCells[i]
        cell.isRevealed = false
        renderBoard(gBoard)
    }
}

//* KABOOM Button //

function randomMineEraser(board, elBtn) {
    // if (!gIsMineEraserActive) return

    if (gCurrLevel === 'beginner') {
        var count = 1
    } else count = 3

    for (var i = 0; i < `${count}`; i++) {
        var randIdx = getRandomInt(0, gMineCells.length)
        gMineCells[randIdx].isMine = false
    }

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
     
            setMinesNegsCount(i, j, board)
            renderBoard(gBoard)
        }
    }
    elBtn.disabled = true
    // test(gBoard)
    // console.log('gTestAllCells:', gTestAllCells)
}


//* Mega Hint Mode //

function megaHintMode(elBtn) {
    gMegaHint.isMegaHintActive = !gMegaHint.isMegaHintActive
    renderBoard(gBoard)
}


function megaHintSelectedCells() {
    for (var i = 0; i < gMegaHint.megaHintSelectedCells.length; i++) {
        var selectedCell = gMegaHint.megaHintSelectedCells[i]
        var selectedCellClassName = getClassName(selectedCell)
        renderSelectedCell(selectedCellClassName, 'megahint-selected-cell')
    }
}


function displaySelectedArea() {
    var selectedCells = []

    var firstSelectedCell =  gMegaHint.megaHintSelectedCells[0]
    var secondSelectedCell = gMegaHint.megaHintSelectedCells[1]

    var firstI = Math.min(firstSelectedCell.i, secondSelectedCell.i)
    var secondI = Math.max(firstSelectedCell.i, secondSelectedCell.i)

    var firstJ = Math.min(firstSelectedCell.j, secondSelectedCell.j)
    var secondJ = Math.max(firstSelectedCell.j, secondSelectedCell.j)

    for (var i = firstI; i <= secondI; i++) {
        for ( var j = firstJ; j <= secondJ; j++) {
            var cell = gBoard[i][j]
            if (cell.isRevealed) continue
            cell.isRevealed = true
            selectedCells.push(cell)
            renderBoard(gBoard)
        }
    }
    setTimeout(() => {
        for (var i = 0; i < selectedCells.length; i++) {
            var cell = selectedCells[i]
            cell.isRevealed = false
            gMegaHint.isMegaHintActive = false
            renderBoard(gBoard)
        }
    }, 2000);
}


//* Custom Mines Mode //

function customMinesMode(elBtn) {
    gCustomMinesMode.isCustomActive = !gCustomMinesMode.isCustomActive
    toggleCustomMode()
}

function toggleCustomMode() {
    var isActive = gCustomMinesMode.isCustomActive ? true : false

    if (isActive) {
        document.querySelector('.board-container').classList.add('custom-mode')
    } else document.querySelector('.board-container').classList.remove('custom-mode')

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var cell = gBoard[i][j]
            cell.isRevealed = isActive
            renderBoard(gBoard)
        }
    }
}

//* Dark Mode Toggle //

function darkModeToggle(elBtn) {
    gIsDarkMode = !gIsDarkMode
    const elBtnIcon = elBtn.querySelector('img')
    elBtnIcon.src = gIsDarkMode ? 'img/dark-mode.svg' : 'img/light-mode.svg'
    
    const elThemeColor = document.querySelector('body')
    elThemeColor.classList.toggle('light-mode')
}   


function pauseTimer() {
    
}


//*------------------------//

function displayFlagsMinesCount () {
    document.querySelector('.bomb-count-icon span').innerText = gLevel.MINES
    document.querySelector('.flag-count-icon span').innerText = gLevel.MINES
}
