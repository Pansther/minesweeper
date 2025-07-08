<script lang="ts">
  import cx from 'clsx'

  import {
    generateMines,
    countMinesAmount,
    countAdjacentMines,
    CONFIG,
    generateRows,
    openAdjacent,
  } from './helpers/mine'

  let firstClicked = $state(true)
  let difficulty = $state<1 | 2 | 3>(3)
  let playRows = $state(generateRows(3))
  let mines = $state<number[][]>([])

  // const mines = $derived(generateMines(difficulty))
  const remaining = $derived(countMinesAmount(mines))

  // $effect(() => {
  //   playRows = generateRows(difficulty)
  //   console.log('playRows', playRows)
  // })

  const clickItem = (row: number, col: number) => {
    if (firstClicked) {
      firstClicked = false
      mines = generateMines(difficulty, { row, col })
      playRows = openAdjacent(playRows, row, col)
    }

    if (playRows[row][col] === 1) {
      //
    } else {
      playRows[row][col] = 1
    }
  }
</script>

<main>
  <div>Remaining: {remaining}</div>

  <br />

  <div class={cx('container', `level_${difficulty}`)}>
    {#each playRows as row, rowIndex}
      {#each row as col, colIndex}
        {@const isOpen = col}
        {@const isMine = mines?.[rowIndex]?.[colIndex] || false}
        {@const amount = countAdjacentMines(mines, rowIndex, colIndex)}

        <div
          aria-hidden={false}
          class={cx('item', { mine: isMine, open: isOpen })}
          onclick={() => clickItem(rowIndex, colIndex)}
        >
          {#if isOpen && amount && !isMine}
            {amount}
          {:else if isOpen && isMine}
            *
          {/if}
        </div>
      {/each}
    {/each}
  </div>
</main>

<style>
  .container {
    display: grid;
    user-select: none;
    border-top: 1px solid black;
    border-left: 1px solid black;

    &.level_1 {
      grid-template-columns: repeat(9, 1fr);
    }

    &.level_2 {
      grid-template-columns: repeat(16, 1fr);
    }

    &.level_3 {
      grid-template-columns: repeat(32, 1fr);
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
        /* background-color: red; */
      }
    }
  }
</style>
