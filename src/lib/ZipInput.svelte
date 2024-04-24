<script lang="ts">
  import { ZipReader } from '@zip.js/zip.js';

  import { entryToObj, readAndParseXml, xmlToObj, type zipObj } from './helper';
  import { questions, resetSettings } from '../store';
  // import logger from './log';

  let files: FileList;
  let assets: zipObj[];
  let title = 'Tao-PDF exporter';

  $: if (files) {
    const init = async () => {
      const file = files[0];
      if (file.name.split('.').pop() !== 'zip')
        throw new Error('Please select a zip file');

      try {
        const zipReader = new ZipReader(file.stream());
        const entries = await zipReader.getEntries();
        const newTitle = files[0].name
          .split('.')[0]
          .split('_')[0]
          .toUpperCase();

        if (title == newTitle) return;

        title = newTitle;

        // Parse asset
        assets = entries
          .filter(
            (entry) =>
              !entry.filename.endsWith('.css') &&
              !entry.filename.endsWith('.xml'),
          )
          .map(entryToObj); // format obj

        // Parse questions
        const xmls = await Promise.all(
          entries
            .filter(
              (entry) =>
                entry.filename.endsWith('.xml') &&
                entry.filename !== 'imsmanifest.xml',
            )
            .map(entryToObj) // format obj
            .map((obj) => readAndParseXml(obj, assets)), // parse xml
        );

        questions.update(() => xmls.map(xmlToObj).filter((q) => q));
        logger.log('Questions parsed');
      } catch (e) {
        throw new Error('Invalid zip file');
      }
    };
    init() // Work around to use async/await
    // .catch((err) => logger.catch(err)); 
    resetSettings();
  }
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<input type="file" name="zip" id="zip" accept=".zip" bind:files />
<button class="hide-print" on:click|preventDefault={() => window.print()}>
  Get PDF
</button>

<style>
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    border-radius: 0.25rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    background-color: var(--active);
    border: 1px solid var(--active);
    color: var(--bg);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button:hover:not(:disabled),
  button:focus,
  button:active {
    background-color: var(--bg-accent);
    border-color: var(--border);
    color: var(--txt);
  }
</style>
