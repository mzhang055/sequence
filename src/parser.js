const fs = require('fs');

class PythonParser {
  constructor(filePath) {
    this.filePath = filePath;
    this.lines = [];
    this.arrayVar = null;
    this.initialArray = [];
  }

  parse() {
    const content = fs.readFileSync(this.filePath, 'utf8');
    this.lines = content.split('\n').filter(line => line.trim());
    
    const steps = [];
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].trim();
      
      if (this.isArrayAssignment(line)) {
        const { varName, array } = this.parseArrayAssignment(line);
        this.arrayVar = varName;
        this.initialArray = [...array];
        steps.push({
          type: 'init',
          line: i,
          code: line,
          varName,
          array: [...array]
        });
      } else if (this.isForLoop(line)) {
        steps.push({
          type: 'for_start',
          line: i,
          code: line
        });
      } else if (this.isCondition(line)) {
        steps.push({
          type: 'condition',
          line: i,
          code: line,
          condition: this.parseCondition(line)
        });
      } else if (this.isArrayOperation(line)) {
        steps.push({
          type: 'operation',
          line: i,
          code: line,
          operation: this.parseOperation(line)
        });
      }
    }
    
    return {
      steps,
      arrayVar: this.arrayVar,
      initialArray: this.initialArray,
      lines: this.lines
    };
  }

  isArrayAssignment(line) {
    return /^\w+\s*=\s*\[/.test(line);
  }

  parseArrayAssignment(line) {
    const match = line.match(/^(\w+)\s*=\s*\[(.*)\]/);
    if (match) {
      const varName = match[1];
      const arrayStr = match[2];
      const array = arrayStr.split(',').map(s => parseInt(s.trim()));
      return { varName, array };
    }
    return null;
  }

  isForLoop(line) {
    return line.startsWith('for ') && line.includes('range(');
  }

  isCondition(line) {
    return line.includes('if ') && line.includes(this.arrayVar);
  }

  parseCondition(line) {
    const match = line.match(/if\s+(\w+\[i\])\s*([><=!]+)\s*(\d+)/);
    if (match) {
      return {
        left: match[1],
        operator: match[2],
        right: parseInt(match[3])
      };
    }
    return null;
  }

  isArrayOperation(line) {
    return line.includes(this.arrayVar + '[i]') && line.includes('=');
  }

  parseOperation(line) {
    const match = line.match(/(\w+\[i\])\s*=\s*(.+)/);
    if (match) {
      return {
        target: match[1],
        expression: match[2]
      };
    }
    return null;
  }
}

module.exports = PythonParser;