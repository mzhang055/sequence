#!/usr/bin/env node

const yargs = require("yargs");
const path = require("path");
const fs = require("fs");
const TerminalUI = require("../src/ui");
const RecursiveTerminalUI = require("../src/recursiveUI");

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

function detectRecursiveFunction(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Look for function definitions
    const functionDefs = [];
    for (let line of lines) {
      const match = line.trim().match(/^def\s+(\w+)\s*\(/);
      if (match) {
        functionDefs.push(match[1]);
      }
    }
    
    // Check if any function calls itself (recursive)
    for (let funcName of functionDefs) {
      for (let line of lines) {
        if (line.includes(`${funcName}(`) && !line.trim().startsWith('def ')) {
          // Check if this function call is inside the function definition
          const funcDefRegex = new RegExp(`def\\s+${funcName}\\s*\\(`);
          let inFunction = false;
          for (let checkLine of lines) {
            if (funcDefRegex.test(checkLine.trim())) {
              inFunction = true;
            } else if (inFunction && checkLine.trim().startsWith('def ')) {
              inFunction = false;
            } else if (inFunction && checkLine.includes(`${funcName}(`)) {
              return true; // Found recursive call
            }
          }
        }
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

function main() {
  const filePath = path.resolve(argv.file);
  
  try {
    const isRecursive = detectRecursiveFunction(filePath);
    
    if (isRecursive) {
      console.log('🔄 Detected recursive function - using recursive visualizer');
      const ui = new RecursiveTerminalUI(filePath);
      ui.start();
    } else {
      console.log('📊 Using standard array/loop visualizer');
      const ui = new TerminalUI(filePath);
      ui.start();
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
