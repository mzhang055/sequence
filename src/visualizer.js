class ArrayVisualizer {
  constructor() {
    this.padding = 2;
  }

  renderArray(array, currentIndex = -1, highlightColor = 'yellow') {
    if (!array || array.length === 0) {
      return 'Array is empty';
    }

    const boxes = array.map((value, index) => {
      const valueStr = value.toString();
      const isHighlighted = index === currentIndex;
      
      return {
        value: valueStr,
        width: Math.max(valueStr.length + 2, 4),
        highlighted: isHighlighted
      };
    });

    const topLine = boxes.map(box => '┌' + '─'.repeat(box.width - 2) + '┐').join('');
    const valueLine = boxes.map(box => 
      `│${box.value.padStart(Math.floor((box.width - 2 + box.value.length) / 2)).padEnd(box.width - 2)}│`
    ).join('');
    const bottomLine = boxes.map(box => '└' + '─'.repeat(box.width - 2) + '┘').join('');

    let pointer = '';
    if (currentIndex >= 0 && currentIndex < array.length) {
      let pointerPos = 0;
      for (let i = 0; i < currentIndex; i++) {
        pointerPos += boxes[i].width;
      }
      pointerPos += Math.floor(boxes[currentIndex].width / 2);
      pointer = ' '.repeat(pointerPos) + '↑\n' + ' '.repeat(pointerPos - 1) + `i=${currentIndex}`;
    }

    return [topLine, valueLine, bottomLine, pointer].filter(line => line).join('\n');
  }

  renderCode(lines, currentLine = -1, highlightChar = '►') {
    return lines.map((line, index) => {
      const isHighlighted = index === currentLine;
      const prefix = isHighlighted ? highlightChar + ' ' : '  ';
      return prefix + line;
    }).join('\n');
  }

  renderControls() {
    return '[SPACE] Play/Pause  [→] Step Forward  [←] Step Back  [R] Reset  [Q] Quit';
  }

  createLayout(codeContent, arrayContent, controlsContent, width = 80, height = 20) {
    const codeWidth = Math.floor(width * 0.6);
    const arrayWidth = width - codeWidth - 3;

    const topBorder = '┌─ Code ' + '─'.repeat(codeWidth - 8) + '┬─ Array Visualization ' + '─'.repeat(arrayWidth - 22) + '┐';
    const separator = '│' + ' '.repeat(codeWidth) + '│' + ' '.repeat(arrayWidth) + '│';
    const bottomBorder = '└' + '─'.repeat(codeWidth) + '┴' + '─'.repeat(arrayWidth) + '┘';
    const controlsBorder = '│ ' + controlsContent.padEnd(width - 4) + ' │';
    const finalBorder = '└' + '─'.repeat(width - 2) + '┘';

    const codeLines = codeContent.split('\n');
    const arrayLines = arrayContent.split('\n');
    
    const maxContentLines = Math.max(codeLines.length, arrayLines.length);
    const contentLines = [];

    for (let i = 0; i < maxContentLines; i++) {
      const codeLine = (codeLines[i] || '').padEnd(codeWidth).substring(0, codeWidth);
      const arrayLine = (arrayLines[i] || '').padEnd(arrayWidth).substring(0, arrayWidth);
      contentLines.push(`│${codeLine}│${arrayLine}│`);
    }

    return [
      topBorder,
      ...contentLines,
      bottomBorder,
      controlsBorder,
      finalBorder
    ].join('\n');
  }
}

module.exports = ArrayVisualizer;