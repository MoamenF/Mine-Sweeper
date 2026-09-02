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
    markedCount: 0,
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
    isFirstClick: false,
    selectedMinesCells: []

}

var gIsKaboomBtnActive = false


var gMineCells = []
var gRevealedCells = []

var gIsFirstClick = true
var gCurrLevel = 'beginner'
var gRemainingLives = 3
var gUnrevealedTimeOut

var gStartTime
var gTimeInterval = null
var gTimeIsPaused = false

var gIsDarkMode = true  

var gIsPlayerWon = null



function onInit() {
    gBoard = buildBoard()
    renderBoard(gBoard)
    showBestTime()
}


function buildBoard() {
    const board = []

    for (var i = 0; i < gLevel.SIZE; i++) {
        board.push([])

        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j] = { minesAroundCount: 0, isRevealed: false, isMine: false, isMarked: false }

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

            var cellNumClr = 'num1-blue'
            // add class to var name
            if (cell.minesAroundCount === 2) {
                cellNumClr = 'num2-green'
            
            } else if (cell.minesAroundCount === 3) {
                cellNumClr = 'num3-red'

            } else if (cell.minesAroundCount === 4) {
                cellNumClr = 'num4-pink'

            } else if (cell.minesAroundCount === 5) {
                cellNumClr = 'num5-brown'

            } else if (cell.minesAroundCount === 6) {
                cellNumClr = 'num6-purple'
                
            } else if (cell.minesAroundCount === 7) {
                cellNumClr = 'num7-gray'
                
            } else if (cell.minesAroundCount === 8) {
                cellNumClr = 'num8-yellow'

            }

            var cellRevealedClr = cell.isRevealed ? 'cell-revealed' : 'cell-unrevealed'
            var cellMarkedClr = cell.isMarked ? 'cell-marked' : EMPTY
            var MineCell = cell.isMine ? 'mine-cell' : EMPTY
            var hintModeClr = gHintBtn.isHintBtnActive ? 'hint-mode' : EMPTY
            var megaHintModeClr = gMegaHint.isMegaHintActive ? 'megahint-mode' : EMPTY

            const className = `cell cell-${i}-${j} ${cellNumClr} ${cellRevealedClr} ${cellMarkedClr} ${MineCell} ${hintModeClr} ${megaHintModeClr}`
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

    if (gTimeIsPaused) {
        resumeTimer()
        gTimeIsPaused = false
    }
    //* Custom mode //
    if (gCustomMinesMode.isCustomActive) {
        if (cell.isMine) {
            cell.isMine = false
            gCustomMinesMode.selectedMinesCells.pop()
            elCell.classList.remove('mine-cell')
            elCell.innerHTML = EMPTY
            return
        
        } else {
            cell.isMine = true
            gCustomMinesMode.selectedMinesCells.push(cell)
            elCell.classList.add('mine-cell')
            elCell.innerHTML = BOMB            
        } 
        

        if (gCustomMinesMode.selectedMinesCells.length === gLevel.MINES) {
            document.querySelector('.custom-btn').disabled = true
            gCustomMinesMode.isCustomActive = false
            gIsFirstClick = false
            gCustomMinesMode.isFirstClick = true
            customMineDisableButtons()
            toggleCustomMode()
            return
        } 

    } 
    document.querySelector('.custom-btn').disabled = true
    
    if (cell.isRevealed) return
    
    if (gCustomMinesMode.isFirstClick) {
        gGame.isOn = true
        startTimer()
        document.querySelector('.kaboom-btn').disabled = false
        gCustomMinesMode.isFirstClick = false
    }

    gRevealedCells = []

    if (gIsFirstClick) {
        gGame.isOn = true
        startTimer()
        setRandomMines(i, j)
        displayFlagsMinesCount()
        renderBoard(gBoard)
        document.querySelector('.kaboom-btn').disabled = false
        gIsFirstClick = false

    }
    if (!gGame.isOn) return

     //* Hint Button  //
    if (gHintBtn.isHintBtnActive && !cell.isRevealed && !cell.isMarked) {
        gHintBtn.isHintBtnActive = false
        document.querySelector('.hint-btn').disabled = true
        displayAndHideHintCellNegs(i, j, gBoard)
        renderBoard(gBoard)
        return
    }

     //* Mega-Hint Button //
    if (gMegaHint.isMegaHintActive) {
        gMegaHint.megaHintSelectedCells.push({i, j})
        megaHintSelectedCells()
        if (gMegaHint.megaHintSelectedCells.length === 2) {
            document.querySelector('.megahint-btn').disabled = true
            displaySelectedArea()
            return
        }
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
        if (cell.isMine) shakeAnimation()
        if (!cell.isMine) gRevealedCells.push(cell)
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
    const cell = gBoard[i][j]
    if (!cell.isRevealed) cell.isMarked = !cell.isMarked
    cell.isMarked ? gGame.markedCount++ : gGame.markedCount--
    elFlag.innerText = gGame.markedCount
    checkGameOver(i, j)
    console.log('gGame:', gGame)
    renderBoard(gBoard)
}


function checkGameOver(cellI, cellJ) {
    var cell = gBoard[cellI][cellJ]
    const elHearts = document.querySelectorAll('.hearts')

    if (cell.isMine && !cell.isMarked) {
        if (gRemainingLives !== 0) {
            elHearts[gRemainingLives - 1].classList.add('hidden') 
            gRemainingLives--
            
            // clearTimeout(gUnrevealedTimeOut)
            gUnrevealedTimeOut = setTimeout(() => {
                cell.isRevealed = false
                renderBoard(gBoard)
            }, 500);
            
            gGame.revealedCount--
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
                customMineCell.isRevealed = true
            }
        }

        gGame.isOn = false
        clearInterval(gTimeInterval)
        document.querySelector('.smiley-btn img').src = 'img/angry-smiley.png'
        console.log('YOU FAILED!')
        console.log('gGame:', gGame)
        gIsPlayerWon = false
        showResult(gIsPlayerWon)
        return
    }

    var customMines = gCustomMinesMode.selectedMinesCells
    var mineCells = customMines.length ? customMines : gMineCells

    if (gGame.revealedCount === (gLevel.SIZE ** 2) - mineCells.length && 
        gGame.markedCount === mineCells.length) {

        gGame.isOn = false
        clearInterval(gTimeInterval)
        saveBestTime()

        document.querySelector('.smiley-btn img').src = 'img/happy-open-mouth-smiley.png'
        console.log('YOU WON!')
        console.log('gGame:', gGame)
        gIsPlayerWon = true
        showResult(gIsPlayerWon)
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
            gGame.revealedCount++

            if (!cell.minesAroundCount) {
                expandReveal(board, elCell, i, j)
            }
        }
    }
}


function setRandomMines(cellI, cellJ) {

    for (var i = 0; i < gLevel.MINES; i++) {
        
        var pos = findEmptyPos(cellI, cellJ)
        if(!pos) return
        gBoard[pos.i][pos.j].isMine = true
        gMineCells.push(gBoard[pos.i][pos.j])
    }
}

function setGameLevel(elBtn) {

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

    if (gCurrLevel === 'beginner') {
        gLevel.SIZE = 4
        gLevel.MINES = 2

    } else if (gCurrLevel === 'intermediate') {
        gLevel.SIZE = 8
        gLevel.MINES = 14

    } else if (gCurrLevel === 'expert') {
        gLevel.SIZE = 12
        gLevel.MINES = 32
    }

    for (var idx = 0; idx < elHearts.length; idx++) {
        var elHeart = elHearts[idx]
        elHeart.classList.remove('hidden')
    }

    document.querySelector('.smiley-btn img').src = 'img/happy-closed-mouth-smiley.png'
    gRemainingLives = 3
    gGame.revealedCount = 0
    gGame.markedCount = 0
    gIsFirstClick = true
    gGame.isOn = false
    gMineCells = []
    // gIsPlayerWon = null 
    clearTimeout(gUnrevealedTimeOut)
    clearInterval(gTimeInterval)
    gTimeInterval = null
    gGame.secsPassed = 0
    gTimeIsPaused = false
    elTimer.innerText = '00:00'
    resetButtons()
    onInit()
}

//* Timer //

function startTimer() {
    if (gTimeInterval !== null) return
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

    gHintBtn.isHintBtnActive = !gHintBtn.isHintBtnActive
    hintDisableButtons()
    renderBoard(gBoard)

    if (gHintBtn.isHintBtnActive) {
        var elHintIcons = document.querySelectorAll('.hints img')
        var elHintIcon = elHintIcons[gHintBtn.hintCount - 1]
        elHintIcon.src = 'img/hint-active.svg'
        
    } else {
        var elHintIcons = document.querySelectorAll('.hints img')
        var elHintIcon = elHintIcons[gHintBtn.hintCount - 1]
        elHintIcon.src = 'img/hint-inactive.svg'
    }
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

            var cell = gBoard[i][j]
            cell.location = {i, j}

            if (!cell.isRevealed && !cell.isMine && !cell.isMarked) {
                safeCells.push(cell)
            }
        }
    }

    if (safeCells.length === 0) {
        document.querySelector('.safe-btn').disabled = true
        return
    }

    var randIdx = getRandomInt(0, safeCells.length)
    var safeCell = safeCells[randIdx]
    var cellClassName = getClassName(safeCell.location)
    var elSafeCell = document.querySelector(cellClassName)
    elSafeCell.classList.add('safe-mode')

    setTimeout(() => {
        elSafeCell.classList.remove('safe-mode')
        gSafeBtn.isSafeBtnActive = false
    }, 1500);

    if (gSafeBtn.safeClickCount === 0) {
        document.querySelector('.safe-btn').disabled = true
    }
}

//* Undo Button //

function undoMove() {

    for (var i = 0; i < gRevealedCells.length; i++) {
        var cell = gRevealedCells[i]
        cell.isRevealed = false
        renderBoard(gBoard)
    }
}

//* KABOOM Button //

function randomMineEraser(board, elBtn) {
    
    if (gCurrLevel === 'beginner') {
        var count = 1
    } else count = 3

    var customMines = gCustomMinesMode.selectedMinesCells
    var mineCells = customMines.length ? customMines : gMineCells

    for (var i = 0; i < count; i++) {
        var randIdx = getRandomInt(0, mineCells.length)
        mineCells[randIdx].isMine = false
        mineCells.splice(randIdx, 1)
    }

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
     
            setMinesNegsCount(i, j, board)
            renderBoard(gBoard)
        }
    }
    displayFlagsMinesCount()
    elBtn.disabled = true
}


//* Mega Hint Mode //

function megaHintMode(elBtn) {
    gMegaHint.isMegaHintActive = !gMegaHint.isMegaHintActive
    megaHintDisableButtons()
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
    customMineDisableButtons()
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
            
            if (cell.isMine && gCustomMinesMode.selectedMinesCells.length && 
                gCustomMinesMode.selectedMinesCells.length < gLevel.MINES) {
                
                cell.isMine = false
            }

            cell.isRevealed = isActive
        }
    }
    
    renderBoard(gBoard)
}

//* Dark Mode Toggle //

function darkModeToggle(elBtn) {
    gIsDarkMode = !gIsDarkMode
    const elBtnIcon = elBtn.querySelector('img')
    elBtnIcon.src = gIsDarkMode ? 'img/dark-mode-v2.svg' : 'img/light-mode-v2.svg'
    
    const elThemeColor = document.querySelector('body')
    elThemeColor.classList.toggle('light-mode')
}   

//* Pause Button //

function pauseTimer() {
    gTimeIsPaused = true
    clearInterval(gTimeInterval)
    gTimeInterval = null
}

function resumeTimer() {

    if (gTimeInterval) clearInterval(gTimeInterval)
    gStartTime = Date.now()
    var milliSecs = gGame.secsPassed * 1000
    gTimeInterval = setInterval(() => {
        
        var elapsedTime = (Date.now() + milliSecs)  - gStartTime

        gGame.secsPassed = Math.floor(elapsedTime / 1000)

        var minutes = Math.floor( gGame.secsPassed / 60)
        var seconds =  gGame.secsPassed % 60

        var elTime = document.querySelector('.timer')
        elTime.innerHTML = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }, 30)

}


//*---------------------------------------------------------------------------------//

function showResult(isPlayerWon) {
    const title = document.querySelector('.modal-title')
    const message = document.querySelector('.modal-message')

    if (isPlayerWon) {
        title.innerText = 'You Won!'
        message.innerText = 'Congratulations, you completed this level!'
    
    } else {
        title.innerText = 'You Lost!'
        message.innerText = 'Good try! Play again and try to win.'
    }
    modal.showModal()
}

const modal = document.querySelector('.modal')

const playAgainBtn = document.querySelector('.play-again-btn')
playAgainBtn.addEventListener("click", () => {
    modal.close()
    resetGame()
})

const closeModalBtn = document.querySelector('.close-modal')
closeModalBtn.addEventListener("click", () => {
    modal.close()
})

function resetButtons() {
    //? Safe Button //
    var elSafeIcons = document.querySelectorAll('.safe-click')
    gSafeBtn.isSafeBtnActive = false
    gSafeBtn.safeClickCount = 3

    for (var i = 0; i < elSafeIcons.length; i++) {
        elSafeIcons[i].classList.remove('hidden')
    }
    document.querySelector('.safe-btn').disabled = false


    //? Hint Button //
    var elHintImgs = document.querySelectorAll('.hints img')
    var elHintIcons = document.querySelectorAll('.hints')
    gHintBtn.isHintBtnActive = false
    gHintBtn.hintCount = 3

    for (var i = 0; i < elHintIcons.length; i++) {
        elHintIcons[i].classList.remove('hidden')
        elHintImgs[i].src = 'img/hint-inactive.svg'
    }
    document.querySelector('.hint-btn').disabled = false

    //? KABOOM Button //
    document.querySelector('.kaboom-btn').disabled = true

    //? Custom Mode Button //
    document.querySelector('.board-container').classList.remove('custom-mode')
    gCustomMinesMode.isCustomActive = false
    // gCustomMinesMode.isFirstClick = true
    gCustomMinesMode.selectedMinesCells = []
    document.querySelector('.custom-btn').disabled = false  

    //? Mega-Hint Mode Button //
    gMegaHint.isMegaHintActive = false
    gMegaHint.megaHintSelectedCells = []
    document.querySelector('.megahint-btn').disabled = false
}

function megaHintDisableButtons() {
        if (gMegaHint.isMegaHintActive){
        document.querySelector('.safe-btn').disabled = true
        document.querySelector('.hint-btn').disabled = true
        document.querySelector('.custom-btn').disabled = true
        document.querySelector('.undo-btn').disabled = true
    }else {
        document.querySelector('.safe-btn').disabled = false
        document.querySelector('.hint-btn').disabled = false
        document.querySelector('.custom-btn').disabled = false
        document.querySelector('.undo-btn').disabled = false
    }
}

function hintDisableButtons() {
        if (gHintBtn.isHintBtnActive){
        document.querySelector('.safe-btn').disabled = true
        document.querySelector('.megahint-btn').disabled = true
        document.querySelector('.custom-btn').disabled = true
        document.querySelector('.undo-btn').disabled = true
    }else {
        document.querySelector('.safe-btn').disabled = false
        document.querySelector('.megahint-btn').disabled = false
        document.querySelector('.custom-btn').disabled = false
        document.querySelector('.undo-btn').disabled = false
    }
}

function customMineDisableButtons() {
        if (gCustomMinesMode.isCustomActive){
        document.querySelector('.safe-btn').disabled = true
        document.querySelector('.megahint-btn').disabled = true
        document.querySelector('.hint-btn').disabled = true
        document.querySelector('.undo-btn').disabled = true
    }else {
        document.querySelector('.safe-btn').disabled = false
        document.querySelector('.megahint-btn').disabled = false
        document.querySelector('.hint-btn').disabled = false
        document.querySelector('.undo-btn').disabled = false
    }
}

function shakeAnimation(){
    const gameContainer = document.querySelector('.game-container')

    gameContainer.classList.remove('shake')
    void gameContainer.offsetWidth
    gameContainer.classList.add('shake')
}

function displayFlagsMinesCount () {
    document.querySelector('.bomb-count-icon span').innerText = gMineCells.length ? gMineCells.length : gCustomMinesMode.selectedMinesCells.length
    document.querySelector('.flag-count-icon span').innerText = gGame.markedCount
}
