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
    rows: 32,
    percent: 0.2,
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

  const { rows, percent } = CONFIG[difficulty]

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

    if (minefield[r][c] === 0) {
      minefield[r][c] = 1
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
      if (minefield?.[newRow][newCol] === 1) {
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

  minefield[row][col] = 0

  for (const [dy, dx] of directions) {
    const newRow = row + dy
    const newCol = col + dx

    if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
      minefield[newRow][newCol] = 0
    }
  }

  return minefield
}

export const openAdjacent = (
  minefield: number[][],
  row: number,
  col: number
) => {
  const rows = minefield?.length
  const cols = minefield[0]?.length

  for (const [dy, dx] of directions) {
    const newRow = row + dy
    const newCol = col + dx

    if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
      minefield[newRow][newCol] = 1
    }
  }

  return minefield
}

export const countMinesAmount = (mines: number[][]) => {
  return mines
    .flatMap((row) => row)
    .reduce((prev, current) => prev + current, 0)
}
