import { ItemType, MineType } from '../types/mine'

const { Blank, Flag, Open } = ItemType
const { Empty, Mine } = MineType

export const CONFIG = {
  1: {
    rows: 9,
    percent: 0.1,
  },
  2: {
    rows: 16,
    percent: 0.15,
  },
  3: {
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

export const generateRows = (difficulty: 1 | 2 | 3) => {
  let emptyRows: number[][] = []

  const { rows } = CONFIG[difficulty]

  for (let i = 0; i < rows; i++) {
    emptyRows.push(new Array(rows).fill(0))
  }

  return emptyRows
}

export const generateMines = (
  difficulty: 1 | 2 | 3,
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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export function longpress(node, threshold = 150) {
  const handle_mousedown = () => {
    let start = Date.now()

    const timeout = setTimeout(() => {
      node.dispatchEvent(new CustomEvent('longpress'))
    }, threshold)

    const cancel = () => {
      clearTimeout(timeout)
      node.removeEventListener('mousemove', cancel)
      node.removeEventListener('mouseup', cancel)
    }

    node.addEventListener('mousemove', cancel)
    node.addEventListener('mouseup', cancel)
  }

  node.addEventListener('mousedown', handle_mousedown)

  return {
    destroy() {
      node.removeEventListener('mousedown', handle_mousedown)
    },
  }
}