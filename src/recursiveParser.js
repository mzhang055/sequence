const fs = require('fs');

class RecursiveParser {
  constructor(filePath) {
    this.filePath = filePath;
    this.lines = [];
    this.functionDef = null;
    this.mainCall = null;
  }

  parse() {
    const content = fs.readFileSync(this.filePath, 'utf8');
    this.lines = content.split('\n').map(line => line.replace(/\t/g, '    '));
    
    const result = {
      lines: this.lines,
      functionDef: null,
      mainCall: null,
      steps: []
    };

    // First pass: find function definition
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].trim();
      if (this.isFunctionDef(line)) {
        result.functionDef = this.parseFunctionDef(line, i);
        this.functionDef = result.functionDef;
        break;
      }
    }

    // Second pass: find main function call
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].trim();
      if (this.isFunctionCall(line) && !line.includes('print') && !line.includes('return')) {
        result.mainCall = this.parseFunctionCall(line, i);
        break;
      }
    }

    return result;
  }

  isFunctionDef(line) {
    return line.startsWith('def ') && line.includes('(') && line.endsWith(':');
  }

  parseFunctionDef(line, lineNum) {
    const match = line.match(/def\s+(\w+)\s*\(([^)]*)\)\s*:/);
    if (match) {
      const funcName = match[1];
      const paramStr = match[2].trim();
      const params = paramStr ? paramStr.split(',').map(p => p.trim()) : [];
      
      // Find function body
      const body = [];
      let i = lineNum + 1;
      while (i < this.lines.length && (this.lines[i].startsWith('    ') || this.lines[i].trim() === '')) {
        if (this.lines[i].trim()) {
          body.push({
            code: this.lines[i],
            lineNum: i,
            indentLevel: this.getIndentLevel(this.lines[i])
          });
        }
        i++;
      }

      return {
        name: funcName,
        params: params,
        body: body,
        lineNum: lineNum
      };
    }
    return null;
  }

  isFunctionCall(line) {
    if (!this.functionDef) return false;
    const funcName = this.functionDef.name;
    // Match both direct calls and assignment calls
    const pattern = new RegExp(`\\b${funcName}\\s*\\(`);
    return pattern.test(line) && !line.trim().startsWith('def ');
  }

  parseFunctionCall(line, lineNum) {
    if (!this.functionDef) return null;
    
    const funcName = this.functionDef.name;
    const pattern = new RegExp(`${funcName}\\s*\\(([^)]*)\\)`);
    const match = line.match(pattern);
    
    if (match) {
      const argStr = match[1].trim();
      const args = argStr ? argStr.split(',').map(a => a.trim()) : [];
      
      return {
        functionName: funcName,
        args: args,
        lineNum: lineNum
      };
    }
    return null;
  }

  getIndentLevel(line) {
    let count = 0;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === ' ') {
        count++;
      } else {
        break;
      }
    }
    return Math.floor(count / 4); // Assuming 4 spaces per indent
  }
}

module.exports = RecursiveParser;