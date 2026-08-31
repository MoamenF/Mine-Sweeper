'use strict'



function findEmptyPos(cellI, cellJ) {
    var emptyPoss = []
    
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var test = {i, j}
            var cell = gBoard[i][j].isMine
            
            if (i === cellI && j === cellJ) continue
            if (!cell) {
                var pos = { i, j }
                emptyPoss.push(pos)
            }
        }
    }
    
    var randIdx = getRandomInt(0, emptyPoss.length)
    var emptyPos = emptyPoss[randIdx]
    // console.log('emptyPos:', emptyPos)
    
    return emptyPos
}


function isNegsMines(board, cellI, cellJ) {

    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++){
            if (i === cellI && j === cellJ) continue
            if (j < 0 || j >= board.length) continue

            var cell = board[i][j]
            if (cell.isMine) return true
        }
    }
    return false
}



function renderSelectedCell(className, newClass) {
    
    const elCell = document.querySelector(className)
    
    elCell.classList.add(newClass)
}


function getClassName(location) { // {i:2,j:5}
    const cellClass = `.cell-${location.i}-${location.j}` // 'cell-2-5'
    return cellClass
}


function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}


// location such as: {i: 2, j: 7}
function renderCell(location, value) {
    // Select the elCell and set the value
    const elCell = document.querySelector(`.cell-${location.i}-${location.j}`)

    elCell.innerHTML = value

}
