class RecursiveVisualizer {
  constructor() {
    this.maxCallStackDisplay = 8;
  }

  renderCode(lines, currentLine = -1, highlightChar = '►') {
    return lines.map((line, index) => {
      const isHighlighted = index === currentLine;
      const prefix = isHighlighted ? highlightChar + ' ' : '  ';
      return prefix + line;
    }).join('\n');
  }

  renderCallStack(callStack, maxDepth = 8) {
    if (!callStack || callStack.length === 0) {
      return 'Call Stack:\n(empty)';
    }

    const stackLines = ['Call Stack:'];
    const displayStack = callStack.slice(-maxDepth); // Show most recent calls
    
    for (let i = displayStack.length - 1; i >= 0; i--) { // Bottom to top
      const frame = displayStack[i];
      const params = Object.entries(frame.params)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');
      
      const indent = '  '.repeat(frame.depth);
      const arrow = i === displayStack.length - 1 ? '👉 ' : '   ';
      stackLines.push(`${arrow}${indent}${frame.functionName}(${params})`);
    }

    if (callStack.length > maxDepth) {
      stackLines.push(`   ... and ${callStack.length - maxDepth} more`);
    }

    return stackLines.join('\n');
  }

  renderThinking(currentTrace) {
    if (!currentTrace) {
      return 'Thinking:\n(waiting...)';
    }

    const lines = ['💭 Current Thinking:'];
    lines.push('');
    
    // Show the current message
    lines.push(`${currentTrace.message}`);
    lines.push('');

    // Show current parameters if available
    if (currentTrace.stackFrame) {
      const params = Object.entries(currentTrace.stackFrame.params);
      if (params.length > 0) {
        lines.push('📋 Current Parameters:');
        params.forEach(([name, value]) => {
          lines.push(`   ${name} = ${value}`);
        });
        lines.push('');
      }

      const locals = Object.entries(currentTrace.stackFrame.localVars);
      if (locals.length > 0) {
        lines.push('🔧 Local Variables:');
        locals.forEach(([name, value]) => {
          lines.push(`   ${name} = ${value}`);
        });
        lines.push('');
      }
    }

    // Show step information
    lines.push(`📍 Step ${currentTrace.step + 1}`);
    lines.push(`🏔️  Depth: ${currentTrace.depth}`);
    
    if (currentTrace.type === 'condition') {
      lines.push('🔍 Evaluating condition...');
    } else if (currentTrace.type === 'base_case') {
      lines.push('🎯 Base case reached!');
    } else if (currentTrace.type === 'recursive_case') {
      lines.push('🔄 Making recursive call...');
    } else if (currentTrace.type === 'return') {
      lines.push(`📤 Returning: ${currentTrace.returnValue}`);
    }

    return lines.join('\n');
  }

  renderProgress(currentStep, totalSteps) {
    const progress = Math.floor((currentStep / Math.max(totalSteps - 1, 1)) * 20);
    const bar = '█'.repeat(progress) + '░'.repeat(20 - progress);
    return `Progress: [${bar}] ${currentStep + 1}/${totalSteps}`;
  }

  renderControls() {
    return '[SPACE] Play/Pause  [→] Step Forward  [←] Step Back  [R] Reset  [Q] Quit';
  }

  createLayout(codeContent, callStackContent, thinkingContent, controlsContent, width = 120, height = 30) {
    const codeWidth = Math.floor(width * 0.4);
    const stackWidth = Math.floor(width * 0.3);
    const thinkingWidth = width - codeWidth - stackWidth - 4;

    // Top border
    const topBorder = '┌─ Code ' + '─'.repeat(codeWidth - 8) + 
                     '┬─ Call Stack ' + '─'.repeat(stackWidth - 13) + 
                     '┬─ Thinking ' + '─'.repeat(thinkingWidth - 11) + '┐';

    // Content lines
    const codeLines = codeContent.split('\n');
    const stackLines = callStackContent.split('\n');
    const thinkingLines = thinkingContent.split('\n');
    
    const maxContentLines = Math.max(codeLines.length, stackLines.length, thinkingLines.length);
    const contentLines = [];

    for (let i = 0; i < maxContentLines; i++) {
      const codeLine = (codeLines[i] || '').padEnd(codeWidth).substring(0, codeWidth);
      const stackLine = (stackLines[i] || '').padEnd(stackWidth).substring(0, stackWidth);
      const thinkingLine = (thinkingLines[i] || '').padEnd(thinkingWidth).substring(0, thinkingWidth);
      contentLines.push(`│${codeLine}│${stackLine}│${thinkingLine}│`);
    }

    // Bottom border
    const bottomBorder = '└' + '─'.repeat(codeWidth) + 
                        '┴' + '─'.repeat(stackWidth) + 
                        '┴' + '─'.repeat(thinkingWidth) + '┘';

    // Controls
    const controlsBorder = '│ ' + controlsContent.padEnd(width - 4) + ' │';
    const finalBorder = '└' + '─'.repeat(width - 2) + '┘';

    return [
      topBorder,
      ...contentLines,
      bottomBorder,
      controlsBorder,
      finalBorder
    ].join('\n');
  }

  renderRecursiveTree(trace, currentStep) {
    // Build a tree showing the recursive calls
    const lines = ['🌳 Recursion Tree:'];
    
    const calls = trace.filter(t => t.type === 'call');
    const returns = trace.filter(t => t.type === 'return');
    
    if (calls.length === 0) {
      lines.push('(no calls yet)');
      return lines.join('\n');
    }

    // Show active calls in tree format
    const activeCalls = [];
    let callIndex = 0;
    let returnIndex = 0;
    
    for (let i = 0; i <= currentStep && i < trace.length; i++) {
      const step = trace[i];
      if (step.type === 'call') {
        activeCalls.push(step);
      } else if (step.type === 'return') {
        activeCalls.pop();
      }
    }

    activeCalls.forEach((call, index) => {
      const indent = '  '.repeat(call.depth);
      const connector = call.depth > 0 ? '└─ ' : '';
      const params = Object.values(call.stackFrame.params).join(', ');
      const isActive = index === activeCalls.length - 1;
      const marker = isActive ? '🔴 ' : '⚪ ';
      
      lines.push(`${indent}${connector}${marker}${call.stackFrame.functionName}(${params})`);
    });

    return lines.join('\n');
  }
}

module.exports = RecursiveVisualizer;