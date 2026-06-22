<script lang="ts">
  import { langOutput } from "../helper/store";
  import type { QCM, Question } from "../helper/question";

  interface Props {
    QCMs?: QCM[];
    hideAnswer: boolean;
  }

  let { QCMs = [], hideAnswer }: Props = $props();
</script>

<div class="questions">
  {#each QCMs as QCM, n}
    <div
      class="question"
      style=" page-break-inside: avoid !important;
    break-inside: avoid-page !important;"
    >
      <div class="title">
        {@html QCM.id}
      </div>
      <div class="prompt">
        <br />
        {@html QCM.prompt}
        <br />
        <br />
      </div>
      <ul class="answers">
        {#each QCM.answers as answer}
          <li
            class={`answer ${
              answer.correct && hideAnswer !== true ? "correct" : ""
            }`}
          >
            <div class="text">
              {@html answer.prompt}
            </div>
            {#if hideAnswer !== true}
              <div class="points">{answer.correct ? 3 : -1}</div>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  {/each}
</div>

<style>
  .question {
    font-family: var(--font-family);
    display: flex;
    flex-direction: column;
    border: 3px solid var(--primary);
    margin: 30px 10px;
    margin-top: 0;
    min-width: 700px;
    line-height: 1.4;
    font-size: 13px;
    page-break-inside: avoid !important;
    break-inside: avoid-page !important;
  }

  .title {
    padding: 1px 0px 3px 5px;
    background-color: var(--primary);
    color: var(--primary-foreground);
    font-size: 16px;
    font-weight: bold;
    height: fit-content;
  }

  .prompt {
    padding: 0 0 0 5px;
    font-weight: bold;
  }

  .answers {
    margin: 0;
    display: flex;
    flex-direction: column;
    border: 6px solid var(--surface);
    padding: 5px;
    padding-left: 20px;
    list-style: circle;
  }

  .answer {
    position: relative;
    padding: 10px;
    font-weight: bold;
  }

  .answer.correct {
    list-style-type: disc;
  }

  .answer .points {
    position: absolute;
    font-weight: bold;
    right: -22px;
    top: 0;
    border: 2px solid var(--primary);
    padding: 2px 3px;
    background-color: var(--surface-elevated);
    color: var(--text);
    width: 12px;
    text-align: center;
  }
</style>
