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

  import { Difficulty, GameState, ItemType } from './types'

  const { Blank, Flag, Open } = ItemType
  const { Easy, Medium, Hard } = Difficulty
  const { Idle, Play, Fail, Complete } = GameState

  let mines = $state<number[][]>([])
  let difficulty = $state<Difficulty>(Hard)
  let playState = $state<GameState>(Idle)
  let playRows = $state(createEmptyGrid(CONFIG[Hard].rows, CONFIG[Hard].cols))
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
    if (playState === Idle) {
      playState = Play
      mines = generateMines(difficulty, { row, col })
      playRows = openAdjacent(playRows, row, col)
    }

    if (playState !== Play) return

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
    if (playState !== Play) return

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
      playState = Fail
    }
  }

  const restart = () => {
    playState = Idle
    mines = []
    playRows = createEmptyGrid(CONFIG[difficulty].rows, CONFIG[difficulty].cols)
  }

  const onMouseover = (row: number, col: number) => {
    if (playState !== Play) {
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

    if (isAllOpen) playState = Complete
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
  <br />

  <div class="remaining">
    {#if playState === Fail}
      <button onclick={restart}>Restart</button>
    {:else if playState === Idle}
      <div>Click block to Start</div>
    {:else if playState === Complete}
      <div style="display: flex; gap: 8px; align-items: center;">
        <div>You Win !</div>
        <button onclick={restart}>Restart</button>
      </div>
    {:else}
      <div>Remaining: {remaining}</div>
    {/if}
  </div>

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
        {@const isShowMine = isMine && (isOpen || playState === Fail)}
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
            play: playState === Idle || playState === Play,
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

  <div class="navigation">
    <div class="difficulty">
      <button onclick={() => changeDifficulty(Easy)}>Easy</button>
      <button onclick={() => changeDifficulty(Medium)}>Medium</button>
      <button onclick={() => changeDifficulty(Hard)}>Hard</button>
    </div>
  </div>
</main>

<div class="copy">Copyright © {new Date().getFullYear()} wwDev</div>
<div class="footer">
  <a target="_blank" href="https://github.com/Pansther/minesweeper-svelte">
    GitHub
  </a>
  |
  <a
    target="_blank"
    href="https://github.com/Pansther/minesweeper-svelte?tab=readme-ov-file#how-to-play"
  >
    How to Play
  </a>
  |
  <a
    target="_blank"
    href="https://github.com/Pansther/minesweeper-svelte?tab=readme-ov-file#%E0%B8%A7%E0%B8%B4%E0%B8%98%E0%B8%B5%E0%B9%80%E0%B8%A5%E0%B9%88%E0%B8%99"
  >
    วิธีเล่น
  </a>
</div>

<style>
  main {
    display: flex;
    margin-top: 48px;
    align-items: center;
    flex-direction: column;
    justify-content: flex-start;
    font-family: 'Bai Jamjuree', sans-serif;
  }

  .remaining {
    top: 0;
    left: 50%;
    width: 100%;
    height: 64px;
    display: flex;
    position: fixed;
    font-size: 20px;
    padding: 8px 16px;
    align-items: center;
    justify-content: center;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.5);
  }

  .navigation {
    gap: 8px;
    height: 40px;
    display: flex;
    padding: 32px 16px;
    align-items: center;
    justify-content: space-between;

    .difficulty {
      gap: 8px;
      display: flex;
      flex-direction: row;
      margin: 40px auto 0;

      button:nth-child(1) {
        background-color: #1d9d3d;
      }

      button:nth-child(2) {
        background-color: #2d7eac;
      }

      button:nth-child(3) {
        background-color: #a82e2e;
      }
    }

    @media only screen and (min-width: 768px) {
      left: 0;
      bottom: 0;
      position: fixed;

      .difficulty {
        margin: 0;
      }
    }
  }

  .container {
    display: grid;
    overflow: auto;
    user-select: none;
    /* width: fit-content; */
    max-width: 100vw;
    touch-action: manipulation;
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
      width: 45px;
      height: 45px;
      display: grid;
      font-size: 26px;
      place-items: center;
      box-sizing: border-box;
      border-right: 1px solid black;
      border-bottom: 1px solid black;
      transition: background-color 0.2s;
      background-color: rgb(213, 213, 213);

      @media only screen and (min-width: 768px) {
        width: 30px;
        height: 30px;
        font-size: 20px;

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

  .copy {
    margin-top: 32px;
    color: lightgray;
  }
  
  .footer {
    color: lightgray;
    margin: 8px 0 32px;
  }
</style>
