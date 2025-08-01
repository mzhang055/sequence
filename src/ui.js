const blessed = require('blessed');
const PythonParser = require('./parser');
const ExecutionEngine = require('./executor');
const ArrayVisualizer = require('./visualizer');

class TerminalUI {
  constructor(filePath) {
    this.filePath = filePath;
    this.parser = new PythonParser(filePath);
    this.parseResult = this.parser.parse();
    this.executor = new ExecutionEngine(this.parseResult);
    this.visualizer = new ArrayVisualizer();
    
    this.isPlaying = false;
    this.playInterval = null;
    this.currentTraceIndex = 0;
    
    this.setupUI();
    this.setupKeyBindings();
    this.render();
  }

  setupUI() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Code Visualizer'
    });

    this.codeBox = blessed.box({
      top: 0,
      left: 0,
      width: '60%',
      height: '80%',
      content: '',
      border: {
        type: 'line'
      },
      label: ' Code ',
      scrollable: true,
      style: {
        border: {
          fg: 'cyan'
        }
      }
    });

    this.visualBox = blessed.box({
      top: 0,
      left: '60%',
      width: '40%',
      height: '80%',
      content: '',
      border: {
        type: 'line'
      },
      label: ' Array Visualization ',
      scrollable: true,
      style: {
        border: {
          fg: 'cyan'
        }
      }
    });

    this.controlsBox = blessed.box({
      top: '80%',
      left: 0,
      width: '100%',
      height: '20%',
      content: '',
      border: {
        type: 'line'
      },
      label: ' Controls ',
      style: {
        border: {
          fg: 'cyan'
        }
      }
    });

    this.screen.append(this.codeBox);
    this.screen.append(this.visualBox);
    this.screen.append(this.controlsBox);
  }

  setupKeyBindings() {
    this.screen.key(['escape', 'q', 'C-c'], () => {
      return process.exit(0);
    });

    this.screen.key('space', () => {
      this.togglePlay();
    });

    this.screen.key('right', () => {
      this.stepForward();
    });

    this.screen.key('left', () => {
      this.stepBackward();
    });

    this.screen.key('r', () => {
      this.reset();
    });
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.isPlaying = true;
    this.playInterval = setInterval(() => {
      if (!this.stepForward()) {
        this.pause();
      }
    }, 1000);
    this.render();
  }

  pause() {
    this.isPlaying = false;
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
    this.render();
  }

  stepForward() {
    const trace = this.executor.getExecutionTrace();
    if (this.currentTraceIndex < trace.length) {
      this.currentTraceIndex++;
      this.render();
      return true;
    }
    return false;
  }

  stepBackward() {
    if (this.currentTraceIndex > 0) {
      this.currentTraceIndex--;
      this.render();
      return true;
    }
    return false;
  }

  reset() {
    this.pause();
    this.executor.reset();
    this.currentTraceIndex = 0;
    this.render();
  }

  render() {
    this.executor.stepForward();
    const trace = this.executor.getExecutionTrace();
    
    let currentArray = [...this.executor.initialArray];
    let currentIndex = -1;
    
    if (trace.length > 0 && this.currentTraceIndex < trace.length) {
      const currentTrace = trace[this.currentTraceIndex];
      currentArray = currentTrace.array;
      currentIndex = currentTrace.loopIndex;
    }

    const codeContent = this.visualizer.renderCode(this.parseResult.lines, -1);
    const arrayContent = this.visualizer.renderArray(currentArray, currentIndex);
    
    let controlsContent = this.visualizer.renderControls();
    if (this.isPlaying) {
      controlsContent = '[PLAYING] ' + controlsContent;
    } else {
      controlsContent = '[PAUSED] ' + controlsContent;
    }
    controlsContent += `\nStep: ${this.currentTraceIndex}/${trace.length}`;

    this.codeBox.setContent(codeContent);
    this.visualBox.setContent(arrayContent);
    this.controlsBox.setContent(controlsContent);

    this.screen.render();
  }

  start() {
    this.screen.render();
  }
}

module.exports = TerminalUI;