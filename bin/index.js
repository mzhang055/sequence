#!/usr/bin/env node

const yargs = require("yargs");
const path = require("path");
const TerminalUI = require("../src/ui");

const argv = yargs(process.argv.slice(2))
  .usage('Usage: $0 <file> [options]')
  .command('$0 <file>', 'Visualize Python code execution', (yargs) => {
    yargs.positional('file', {
      describe: 'Python file to visualize',
      type: 'string'
    });
  })
  .option('lines', {
    alias: 'l',
    describe: 'Line range to visualize (e.g., 1-10)',
    type: 'string'
  })
  .help()
  .alias('help', 'h')
  .example('$0 bubble_sort.py', 'Visualize bubble_sort.py execution')
  .example('$0 bubble_sort.py --lines 1-5', 'Visualize lines 1-5 of bubble_sort.py')
  .argv;

function main() {
  const filePath = path.resolve(argv.file);
  
  try {
    const ui = new TerminalUI(filePath);
    ui.start();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
