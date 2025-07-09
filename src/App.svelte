<script lang="ts">
  import cx from 'clsx'

  import {
    checkMines,
    openAdjacent,
    generateRows,
    generateMines,
    countMinesAmount,
    countAdjacentMines,
    checkAllowOpenAdjacent,
  } from './helpers/mine'

  import { ItemType } from './types/mine'

  let difficulty = $state<1 | 2 | 3>(3)
  let playRows = $state(generateRows(3))
  let mines = $state<number[][]>([])
  let playState = $state<'idle' | 'play' | 'fail' | 'complete'>('idle')

  const remaining = $derived(countMinesAmount(playRows, mines))

  const { Blank, Flag, Open } = ItemType

  const changeDifficulty = (target: 1 | 2 | 3) => {
    difficulty = target
    restart()
  }

  const clickItem = (row: number, col: number) => {
    if (playState === 'idle') {
      playState = 'play'
      mines = generateMines(difficulty, { row, col })
      playRows = openAdjacent(playRows, row, col)
    }

    if (playState !== 'play') return

    const itemStatus = playRows[row][col]

    if (itemStatus === Open) {
      const isAllowOpenAdjacent = checkAllowOpenAdjacent(
        playRows,
        mines,
        row,
        col,
      )

      if (!isAllowOpenAdjacent) return

      playRows = openAdjacent(playRows, row, col)
    } else if (itemStatus === Flag) {
      //
    } else {
      playRows[row][col] = Open
    }

    checkPlayRowsAndMines()
  }

  const flagItem = (row: number, col: number) => {
    if (playState !== 'play') return

    const itemStatus = playRows[row][col]

    if (itemStatus === Open) return

    if (itemStatus === Flag) {
      playRows[row][col] = Blank
    } else {
      playRows[row][col] = Flag
    }
  }

  const checkPlayRowsAndMines = () => {
    const isFoundMine = checkMines(playRows, mines)

    if (isFoundMine) {
      playState = 'fail'
    }
  }

  const restart = () => {
    playState = 'idle'
    mines = []
    playRows = generateRows(difficulty)
  }

  $effect(() => {
    const isAllOpen = playRows
      .flatMap((row) => row)
      .every((col) => col === Open || col === Flag)

    if (isAllOpen) playState = 'complete'
  })
</script>

<main>
  <div class="navigation">
    <div>
      <button onclick={() => changeDifficulty(1)}>Easy</button>
      <button onclick={() => changeDifficulty(2)}>Medium</button>
      <button onclick={() => changeDifficulty(3)}>Hard</button>
    </div>

    {#if playState === 'fail'}
      <button onclick={restart}>Restart</button>
    {:else if playState === 'idle'}
      <div>Click block to Start</div>
    {:else if playState === 'complete'}
      <div style="display: flex; gap: 8px; align-items: center;">
        <div>You Win !</div>
        <button onclick={restart}>Restart</button>
      </div>
    {:else}
      <div>Remaining: {remaining}</div>
    {/if}
  </div>

  <br />

  <div
    role="grid"
    tabindex="0"
    class={cx('container', `level_${difficulty}`)}
    oncontextmenu={(e) => e.preventDefault()}
  >
    {#each playRows as row, rowIndex}
      {#each row as col, colIndex}
        {@const isOpen = col === 1}
        {@const isFlag = col === 2}
        {@const isMine = mines?.[rowIndex]?.[colIndex] || false}
        {@const amount = countAdjacentMines(mines, rowIndex, colIndex)}

        <div
          aria-hidden={false}
          class={cx('item', {
            open: isOpen,
            mine: isMine && (isOpen || playState === 'fail'),
          })}
          onclick={() => clickItem(rowIndex, colIndex)}
          oncontextmenu={() => flagItem(rowIndex, colIndex)}
        >
          {#if isOpen && amount && !isMine}
            {amount}
          {:else if isFlag}
            F
          {:else if isMine && (isOpen || playState === 'fail')}
            *
          {/if}
        </div>
      {/each}
    {/each}
  </div>
</main>

<style>
  main {
    display: flex;
    min-width: 800px;
    min-height: 800px;
    align-items: center;
    flex-direction: column;
    justify-content: flex-start;
  }

  .navigation {
    gap: 8px;
    width: 80%;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .container {
    display: grid;
    user-select: none;
    width: fit-content;
    border-top: 1px solid black;
    border-left: 1px solid black;

    &.level_1 {
      grid-template-columns: repeat(9, 1fr);
    }

    &.level_2 {
      grid-template-columns: repeat(16, 1fr);
    }

    &.level_3 {
      grid-template-columns: repeat(24, 1fr);
    }

    .item {
      width: 27px;
      height: 27px;
      display: grid;
      place-items: center;
      box-sizing: border-box;
      background-color: lightgray;
      border-right: 1px solid black;
      border-bottom: 1px solid black;

      &:hover {
        cursor: pointer;
      }

      &.open {
        background-color: transparent;
      }

      &.mine {
        background-color: red;
      }
    }
  }
</style>
