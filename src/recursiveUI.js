const blessed = require('blessed');
const RecursiveParser = require('./recursiveParser');
const RecursiveExecutionEngine = require('./recursiveExecutor');
const RecursiveVisualizer = require('./recursiveVisualizer');

class RecursiveTerminalUI {
  constructor(filePath) {
    this.filePath = filePath;
    this.parser = new RecursiveParser(filePath);
    this.parseResult = this.parser.parse();
    this.executor = new RecursiveExecutionEngine(this.parseResult);
    this.visualizer = new RecursiveVisualizer();
    
    this.isPlaying = false;
    this.playInterval = null;
    this.currentStep = 0;
    this.executionTrace = [];
    
    // Initialize execution
    this.executor.run();
    this.executionTrace = this.executor.getExecutionTrace();
    
    this.setupUI();
    this.setupKeyBindings();
    this.render();
  }

  setupUI() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Recursive Function Visualizer'
    });

    // Code panel (left)
    this.codeBox = blessed.box({
      top: 0,
      left: 0,
      width: '40%',
      height: '70%',
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

    // Call stack panel (middle)
    this.stackBox = blessed.box({
      top: 0,
      left: '40%',
      width: '30%',
      height: '70%',
      content: '',
      border: {
        type: 'line'
      },
      label: ' Call Stack ',
      scrollable: true,
      style: {
        border: {
          fg: 'green'
        }
      }
    });

    // Thinking panel (right)
    this.thinkingBox = blessed.box({
      top: 0,
      left: '70%',
      width: '30%',
      height: '70%',
      content: '',
      border: {
        type: 'line'
      },
      label: ' Thinking Process ',
      scrollable: true,
      style: {
        border: {
          fg: 'yellow'
        }
      }
    });

    // Controls panel (bottom)
    this.controlsBox = blessed.box({
      top: '70%',
      left: 0,
      width: '100%',
      height: '30%',
      content: '',
      border: {
        type: 'line'
      },
      label: ' Controls & Info ',
      scrollable: true,
      style: {
        border: {
          fg: 'cyan'
        }
      }
    });

    this.screen.append(this.codeBox);
    this.screen.append(this.stackBox);
    this.screen.append(this.thinkingBox);
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

    // Add speed controls
    this.screen.key(['up'], () => {
      this.changeSpeed(-200); // Faster
    });

    this.screen.key(['down'], () => {
      this.changeSpeed(200); // Slower
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
    this.playSpeed = this.playSpeed || 1500; // Default 1.5 seconds
    this.playInterval = setInterval(() => {
      if (!this.stepForward()) {
        this.pause();
      }
    }, this.playSpeed);
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

  changeSpeed(delta) {
    this.playSpeed = Math.max(500, Math.min(5000, (this.playSpeed || 1500) + delta));
    if (this.isPlaying) {
      this.pause();
      this.play();
    }
    this.render();
  }

  stepForward() {
    if (this.currentStep < this.executionTrace.length - 1) {
      this.currentStep++;
      this.render();
      return true;
    }
    return false;
  }

  stepBackward() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.render();
      return true;
    }
    return false;
  }

  reset() {
    this.pause();
    this.currentStep = 0;
    this.render();
  }

  getCurrentTrace() {
    if (this.executionTrace.length === 0) {
      return {
        message: 'Initializing...',
        type: 'init',
        depth: 0,
        stackFrame: null,
        callStack: []
      };
    }
    if (this.currentStep >= 0 && this.currentStep < this.executionTrace.length) {
      return this.executionTrace[this.currentStep];
    }
    return null;
  }

  render() {
    const currentTrace = this.getCurrentTrace();
    
    // Render code with current line highlighted
    let currentLine = -1;
    if (currentTrace && currentTrace.stackFrame) {
      // This is simplified - in a real implementation, you'd track which line is executing
      currentLine = -1; // Would need more sophisticated line tracking
    }
    const codeContent = this.visualizer.renderCode(this.parseResult.lines, currentLine);
    
    // Render call stack
    const callStack = currentTrace ? currentTrace.callStack : [];
    const stackContent = this.visualizer.renderCallStack(callStack);
    
    // Render thinking process
    const thinkingContent = this.visualizer.renderThinking(currentTrace);
    
    // Render controls and info
    let controlsContent = this.visualizer.renderControls();
    controlsContent += '\n[↑] Faster  [↓] Slower\n';
    
    if (this.isPlaying) {
      controlsContent = '[PLAYING] ' + controlsContent;
    } else {
      controlsContent = '[PAUSED] ' + controlsContent;
    }
    
    controlsContent += '\n' + this.visualizer.renderProgress(this.currentStep, this.executionTrace.length);
    controlsContent += `\nSpeed: ${this.playSpeed || 1500}ms`;
    
    if (currentTrace) {
      controlsContent += `\nCurrent: ${currentTrace.type}`;
      if (currentTrace.type === 'return' && currentTrace.returnValue !== null) {
        controlsContent += ` (value: ${currentTrace.returnValue})`;
      }
    }

    // Add recursion tree
    controlsContent += '\n\n' + this.visualizer.renderRecursiveTree(this.executionTrace, this.currentStep);

    this.codeBox.setContent(codeContent);
    this.stackBox.setContent(stackContent);
    this.thinkingBox.setContent(thinkingContent);
    this.controlsBox.setContent(controlsContent);

    this.screen.render();
  }

  start() {
    // Initial render
    this.render();
    
    console.log('\n🎮 Controls:');
    console.log('  SPACE: Play/Pause');
    console.log('  →: Step Forward');  
    console.log('  ←: Step Back');
    console.log('  R: Reset');
    console.log('  Q: Quit\n');
  }
}

module.exports = RecursiveTerminalUI;