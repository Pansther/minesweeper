<script lang="ts">
  import cx from 'clsx'

  import {
    CONFIG,
    longpress,
    checkMines,
    openAdjacent,
    flagAdjacent,
    generateMines,
    checkIsAdjacent,
    createEmptyGrid,
    countMinesAmount,
    countAdjacentMines,
    DANGER_LEVEL_COLORS,
    checkAllowOpenAdjacent,
  } from './helpers/mine'

  import { Difficulty, ItemType } from './types'

  const { Blank, Flag, Open } = ItemType
  const { Easy, Medium, Hard } = Difficulty

  let mines = $state<number[][]>([])
  let difficulty = $state<Difficulty>(Hard)
  let playRows = $state(createEmptyGrid(CONFIG[Hard].rows, CONFIG[Hard].cols))
  let playState = $state<'idle' | 'play' | 'fail' | 'complete'>('idle')
  let currentHoverIndex = $state<[number | undefined, number | undefined]>([
    undefined,
    undefined,
  ])

  const remaining = $derived(countMinesAmount(playRows, mines))

  const changeDifficulty = (target: Difficulty) => {
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

    if (itemStatus === Open) {
      flagAdjacent(playRows, mines, row, col)
    } else if (itemStatus === Flag) {
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
    playRows = createEmptyGrid(CONFIG[difficulty].rows, CONFIG[difficulty].cols)
  }

  const onMouseover = (row: number, col: number) => {
    if (playState !== 'play') {
      currentHoverIndex = [undefined, undefined]
      return
    }

    if (playRows?.[row][col] !== Open) {
      currentHoverIndex = [undefined, undefined]
    } else {
      currentHoverIndex = [row, col]
    }
  }

  $effect(() => {
    const isAllOpen = playRows
      .flatMap((row) => row)
      .every((col) => col === Open || col === Flag)

    if (isAllOpen) playState = 'complete'
  })
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;1,200;1,300;1,400;1,500;1,600;1,700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<main>
  <div class="navigation">
    <div>
      <button onclick={() => changeDifficulty(Easy)}>Easy</button>
      <button onclick={() => changeDifficulty(Medium)}>Medium</button>
      <button onclick={() => changeDifficulty(Hard)}>Hard</button>
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
        {@const isOpen = col === Open}
        {@const isFlag = col === Flag}
        {@const isMine = mines?.[rowIndex]?.[colIndex] || false}
        {@const isShowMine = isMine && (isOpen || playState === 'fail')}
        {@const amount = countAdjacentMines(mines, rowIndex, colIndex)}
        {@const isAdjacent = checkIsAdjacent(
          rowIndex,
          colIndex,
          currentHoverIndex,
          playRows,
        )}

        <div
          use:longpress
          aria-hidden={false}
          class={cx('item', {
            open: isOpen,
            flag: isFlag,
            mine: isShowMine,
            adjacent: isAdjacent,
            play: playState === 'idle' || playState === 'play',
          })}
          style:color={DANGER_LEVEL_COLORS[amount - 1]}
          onclick={() => clickItem(rowIndex, colIndex)}
          onlongpress={() => flagItem(rowIndex, colIndex)}
          onfocus={() => onMouseover(rowIndex, colIndex)}
          onmouseover={() => onMouseover(rowIndex, colIndex)}
          onmouseleave={() => (currentHoverIndex = [undefined, undefined])}
          oncontextmenu={() => flagItem(rowIndex, colIndex)}
        >
          {#if isOpen && amount && !isMine}
            {amount}
          {:else if isFlag}
            🚩
          {:else if isShowMine}
            💣
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
    font-family: 'Bai Jamjuree', sans-serif;
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
      border-right: 1px solid black;
      border-bottom: 1px solid black;
      transition: background-color 0.2s;
      background-color: rgb(226, 226, 226);

      @media only screen and (min-width: 768px) {
        &.play:hover {
          cursor: pointer;
          background-color: rgb(182, 237, 255);
        }
      }

      @media only screen and (min-width: 768px) {
        &.adjacent {
          background-color: rgb(245, 255, 198);
        }
      }

      &.open {
        font-weight: 700;
        background-color: transparent;

        @media only screen and (min-width: 768px) {
          &.play:hover {
            background-color: rgb(182, 237, 255);
          }
        }
      }

      &.flag {
        font-weight: 400;
        color: black !important;
        background-color: rgb(200, 255, 200);
      }

      &.mine {
        background-color: rgb(255, 160, 160) !important;
      }
    }
  }
</style>
