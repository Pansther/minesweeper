import { Difficulty, ItemType, MineType } from '../types'

const { Blank, Flag, Open } = ItemType
const { Empty, Mine } = MineType
const { Easy, Medium, Hard } = Difficulty

export const CONFIG = {
  [Easy]: {
    rows: 9,
    percent: 0.1,
  },
  [Medium]: {
    rows: 16,
    percent: 0.15,
  },
  [Hard]: {
    rows: 24,
    percent: 0.25,
  },
} as const

const directions = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
]

export const generateRows = (difficulty: Difficulty) => {
  let emptyRows: number[][] = []

  const { rows } = CONFIG[difficulty]

  for (let i = 0; i < rows; i++) {
    emptyRows.push(new Array(rows).fill(0))
  }

  return emptyRows
}

export const generateMines = (
  difficulty: Difficulty,
  firstClicked: { row: number; col: number }
) => {
  const { rows, percent } = CONFIG[difficulty]

  const minefield = generateRows(difficulty)
  const numMines = Math.floor(rows * rows * percent)

  let minesPlaced = 0

  while (minesPlaced < numMines) {
    let r = Math.floor(Math.random() * rows)
    let c = Math.floor(Math.random() * rows)

    if (minefield[r][c] === Empty) {
      minefield[r][c] = Mine
      minesPlaced++
    }
  }

  const safeMinefield = removeAdjacentMines(
    minefield,
    firstClicked.row,
    firstClicked.col
  )

  return safeMinefield
}

export const countAdjacentMines = (
  minefield: number[][],
  row: number,
  col: number
) => {
  if (!minefield?.length) return 0

  const rows = minefield?.length
  const cols = minefield[0]?.length
  let mineCount = 0

  for (const [dy, dx] of directions) {
    const newRow = row + dy
    const newCol = col + dx

    if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
      if (minefield?.[newRow][newCol] === Mine) {
        mineCount++
      }
    }
  }

  return mineCount
}

export const removeAdjacentMines = (
  minefield: number[][],
  row: number,
  col: number
) => {
  const rows = minefield?.length
  const cols = minefield[0]?.length

  minefield[row][col] = Blank

  for (const [dy, dx] of directions) {
    const newRow = row + dy
    const newCol = col + dx

    if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
      minefield[newRow][newCol] = Blank
    }
  }

  return minefield
}

export const openAdjacent = (
  playRows: number[][],
  row: number,
  col: number
) => {
  const rows = playRows?.length
  const cols = playRows[0]?.length

  for (const [dy, dx] of directions) {
    const newRow = row + dy
    const newCol = col + dx

    if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
      if (playRows[newRow][newCol] === Flag) continue

      playRows[newRow][newCol] = Open
    }
  }

  return playRows
}

export const checkAllowOpenAdjacent = (
  playRows: number[][],
  minefields: number[][],
  row: number,
  col: number
) => {
  const adjacentMinesAmount = countAdjacentMines(minefields, row, col)

  const rows = playRows?.length
  const cols = playRows[0]?.length

  let flagAmount = 0

  for (const [dy, dx] of directions) {
    const newRow = row + dy
    const newCol = col + dx

    if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
      if (playRows[newRow][newCol] === Flag) flagAmount += 1
    }
  }

  return flagAmount >= adjacentMinesAmount
}

export const countMinesAmount = (playRows: number[][], mines: number[][]) => {
  const flagAmount = playRows
    .flatMap((row) => row)
    .reduce((prev, current) => {
      if (current === Flag) return prev + 1
      return prev
    }, 0)

  return (
    mines.flatMap((row) => row).reduce((prev, current) => prev + current, 0) -
    flagAmount
  )
}

export const checkMines = (playRows: number[][], minefields: number[][]) => {
  return playRows.some((rows, rowIndex) =>
    rows.some((col, colIndex) => {
      if (col === Open) return minefields[rowIndex][colIndex] === Mine
      return false
    })
  )
}

export const longpress = (node: HTMLElement, threshold = 150) => {
  let timeout: ReturnType<typeof setTimeout>
  let isLongPress = false

  const handle_touchstart = (event: TouchEvent) => {
    isLongPress = false

    timeout = setTimeout(() => {
      isLongPress = true
      const customEvent = new CustomEvent('longpress')
      node.dispatchEvent(customEvent)
    }, threshold)

    node.addEventListener('touchend', handle_touchend_cancel, { once: true })
    node.addEventListener('touchmove', handle_touchend_cancel, { once: true })
    node.addEventListener('touchcancel', handle_touchend_cancel, { once: true })
  }

  const handle_touchend_cancel = (event: TouchEvent) => {
    clearTimeout(timeout)

    if (isLongPress) {
      event.preventDefault()
      event.stopImmediatePropagation()
    }

    node.removeEventListener('touchend', handle_touchend_cancel)
    node.removeEventListener('touchmove', handle_touchend_cancel)
    node.removeEventListener('touchcancel', handle_touchend_cancel)
  }

  const handle_click = (event: MouseEvent) => {
    if (isLongPress) {
      event.preventDefault()
      event.stopImmediatePropagation()
      isLongPress = false
    }
  }

  node.addEventListener('touchstart', handle_touchstart)

  node.addEventListener('click', handle_click, true)

  return {
    destroy() {
      node.removeEventListener('touchstart', handle_touchstart)
      node.removeEventListener('touchend', handle_touchend_cancel)
      node.removeEventListener('touchmove', handle_touchend_cancel)
      node.removeEventListener('touchcancel', handle_touchend_cancel)
      node.removeEventListener('click', handle_click, true)
      clearTimeout(timeout)
    },
  }
}
