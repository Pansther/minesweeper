import { Difficulty, ItemType, MineType } from '../types'

const { Blank, Flag, Open } = ItemType
const { Empty, Mine } = MineType
const { Easy, Medium, Hard } = Difficulty

export const CONFIG = {
  [Easy]: {
    rows: 9,
    cols: 9,
    percent: 0.1,
  },
  [Medium]: {
    rows: 16,
    cols: 16,
    percent: 0.15,
  },
  [Hard]: {
    rows: 24,
    cols: 24,
    percent: 0.23,
  },
} as const

const DIRECTIONS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
] as const

export const DANGER_LEVEL_COLORS = [
  '#28A745',
  '#20C997',
  '#FFC107',
  '#FD7E14',
  '#DC3545',
  '#E01D2D',
  '#9F0000',
  '#d7005d',
] as const

const isValidCoordinate = (
  row: number,
  col: number,
  grid: number[][]
): boolean => {
  if (!grid || grid.length === 0 || grid[0].length === 0) {
    return false
  }
  const maxRows = grid.length
  const maxCols = grid[0].length
  return row >= 0 && row < maxRows && col >= 0 && col < maxCols
}

export const createEmptyGrid = (rows: number, cols: number): number[][] => {
  const grid: number[][] = []
  for (let i = 0; i < rows; i++) {
    grid.push(new Array(cols).fill(0))
  }
  return grid
}

export const generateMines = (
  difficulty: Difficulty,
  firstClicked: { row: number; col: number }
): number[][] => {
  const { rows, cols, percent } = CONFIG[difficulty]
  let minefield = createEmptyGrid(rows, cols)
  const numMines = Math.floor(rows * cols * percent)

  const safeCells = new Set<string>()

  for (const [dy, dx] of DIRECTIONS) {
    const safeRow = firstClicked.row + dy
    const safeCol = firstClicked.col + dx
    if (isValidCoordinate(safeRow, safeCol, minefield)) {
      safeCells.add(`${safeRow},${safeCol}`)
    }
  }
  safeCells.add(`${firstClicked.row},${firstClicked.col}`)

  let minesPlaced = 0
  while (minesPlaced < numMines) {
    const r = Math.floor(Math.random() * rows)
    const c = Math.floor(Math.random() * cols)
    const cellKey = `${r},${c}`

    if (!safeCells.has(cellKey) && minefield[r][c] === Empty) {
      minefield[r][c] = Mine
      minesPlaced++
    }
  }

  return minefield
}

export const countAdjacentMines = (
  minefield: number[][],
  row: number,
  col: number
): number => {
  if (!isValidCoordinate(row, col, minefield)) return 0

  let mineCount = 0
  for (const [dy, dx] of DIRECTIONS) {
    const newRow = row + dy
    const newCol = col + dx

    if (
      isValidCoordinate(newRow, newCol, minefield) &&
      minefield[newRow][newCol] === Mine
    ) {
      mineCount++
    }
  }
  return mineCount
}

export const countAdjacentBlocks = (
  playRows: number[][],
  row: number,
  col: number
): number => {
  if (!isValidCoordinate(row, col, playRows)) return 0

  let blockCount = 0
  for (const [dy, dx] of DIRECTIONS) {
    const newRow = row + dy
    const newCol = col + dx

    if (isValidCoordinate(newRow, newCol, playRows)) {
      const itemStatus = playRows[newRow][newCol]
      if (itemStatus === Blank || itemStatus === Flag) {
        blockCount++
      }
    }
  }
  return blockCount
}

export const openAdjacent = (
  playRows: number[][],
  row: number,
  col: number
): number[][] => {
  if (!isValidCoordinate(row, col, playRows)) return playRows

  for (const [dy, dx] of DIRECTIONS) {
    const newRow = row + dy
    const newCol = col + dx

    if (isValidCoordinate(newRow, newCol, playRows)) {
      const blockStatus = playRows[newRow][newCol]

      if (blockStatus === Flag) continue

      playRows[newRow][newCol] = Open
    }
  }
  return playRows
}

export const flagAdjacent = (
  playRows: number[][],
  minefields: number[][],
  row: number,
  col: number
): number[][] | undefined => {
  if (
    !isValidCoordinate(row, col, playRows) ||
    !isValidCoordinate(row, col, minefields)
  )
    return undefined

  const adjacentMines = countAdjacentMines(minefields, row, col)
  const adjacentUnknownBlocks = countAdjacentBlocks(playRows, row, col)

  if (adjacentUnknownBlocks !== adjacentMines) {
    return undefined
  }

  for (const [dy, dx] of DIRECTIONS) {
    const newRow = row + dy
    const newCol = col + dx

    if (isValidCoordinate(newRow, newCol, playRows)) {
      const itemStatus = playRows[newRow][newCol]
      if (itemStatus === Open) continue

      playRows[newRow][newCol] = Flag
    }
  }
  return playRows
}

export const checkAllowOpenAdjacent = (
  playRows: number[][],
  minefields: number[][],
  row: number,
  col: number
): boolean => {
  if (
    !isValidCoordinate(row, col, playRows) ||
    !isValidCoordinate(row, col, minefields)
  )
    return false

  const adjacentMinesAmount = countAdjacentMines(minefields, row, col)
  let flagAmount = 0

  for (const [dy, dx] of DIRECTIONS) {
    const newRow = row + dy
    const newCol = col + dx

    if (isValidCoordinate(newRow, newCol, playRows)) {
      if (playRows[newRow][newCol] === Flag) {
        flagAmount++
      }
    }
  }

  return flagAmount === adjacentMinesAmount
}

export const checkIsAdjacent = (
  sourceRow: number,
  sourceCol: number,
  target: [number | undefined, number | undefined],
  grid?: number[][]
): boolean => {
  if (target[0] === undefined || target[1] === undefined) return false

  for (const [dy, dx] of DIRECTIONS) {
    const newRow = sourceRow + dy
    const newCol = sourceCol + dx

    if (grid && !isValidCoordinate(newRow, newCol, grid)) {
      continue
    }

    if (newRow === target[0] && newCol === target[1]) {
      return true
    }
  }
  return false
}

export const countMinesAmount = (
  playRows: number[][],
  minefields: number[][]
): number => {
  const flaggedCells = playRows.flat().filter((item) => item === Flag).length
  const totalMines = minefields.flat().filter((item) => item === Mine).length
  return totalMines - flaggedCells
}

export const checkMines = (
  playRows: number[][],
  minefields: number[][]
): boolean => {
  for (let r = 0; r < playRows.length; r++) {
    for (let c = 0; c < playRows[r].length; c++) {
      if (playRows[r][c] === Open && minefields[r][c] === Mine) {
        return true
      }
    }
  }
  return false
}

export const revealEmptyCells = (
  playRows: number[][],
  minefields: number[][],
  startRow: number,
  startCol: number
): number[][] => {
  if (!isValidCoordinate(startRow, startCol, playRows)) {
    return playRows
  }

  if (
    minefields[startRow][startCol] === Mine ||
    playRows[startRow][startCol] === Flag
  ) {
    return playRows
  }

  const queue: [number, number][] = [[startRow, startCol]]
  const visited = new Set<string>()

  visited.add(`${startRow},${startCol}`)

  playRows[startRow][startCol] = Open

  let head = 0
  while (head < queue.length) {
    const [currentRow, currentCol] = queue[head++]

    for (const [dy, dx] of DIRECTIONS) {
      const newRow = currentRow + dy
      const newCol = currentCol + dx
      const cellKey = `${newRow},${newCol}`

      if (
        isValidCoordinate(newRow, newCol, playRows) &&
        !visited.has(cellKey) &&
        playRows[newRow][newCol] !== Flag
      ) {
        visited.add(cellKey)

        const neighborMines = countAdjacentMines(minefields, newRow, newCol)

        if (minefields[newRow][newCol] === Mine) {
          continue
        } else if (neighborMines === 0) {
          playRows[newRow][newCol] = Open
          queue.push([newRow, newCol])
        } else {
          playRows[newRow][newCol] = Open
        }
      }
    }
  }

  return playRows
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
