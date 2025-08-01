class RecursiveExecutionEngine {
  constructor(parseResult) {
    this.parseResult = parseResult;
    this.callStack = [];
    this.executionTrace = [];
    this.currentStep = 0;
    this.maxDepth = 10; // Prevent infinite recursion
  }

  reset() {
    this.callStack = [];
    this.executionTrace = [];
    this.currentStep = 0;
  }

  executeFunction(functionName, args, depth = 0) {
    if (depth > this.maxDepth) {
      this.addTrace(`Maximum recursion depth reached`, 'error', depth);
      return null;
    }

    const funcDef = this.parseResult.functionDef;
    if (!funcDef || funcDef.name !== functionName) {
      this.addTrace(`Function ${functionName} not found`, 'error', depth);
      return null;
    }

    // Create new stack frame
    const stackFrame = {
      functionName: functionName,
      params: {},
      localVars: {},
      depth: depth,
      id: this.executionTrace.length
    };

    // Bind parameters
    for (let i = 0; i < funcDef.params.length; i++) {
      const paramName = funcDef.params[i];
      const argValue = this.evaluateExpression(args[i] || '0');
      stackFrame.params[paramName] = argValue;
    }

    this.callStack.push(stackFrame);
    this.addTrace(`Calling ${functionName}(${Object.values(stackFrame.params).join(', ')})`, 'call', depth, stackFrame);

    // Execute function body step by step
    let returnValue = null;
    for (let bodyLine of funcDef.body) {
      const result = this.executeLine(bodyLine, stackFrame, depth);
      if (result !== null) {
        returnValue = result;
        break;
      }
    }

    // Pop stack frame
    this.callStack.pop();
    this.addTrace(`Returning ${returnValue} from ${functionName}`, 'return', depth, stackFrame, returnValue);

    return returnValue;
  }

  executeLine(bodyLine, stackFrame, depth) {
    const line = bodyLine.code.trim();
    const thinking = this.generateThinking(line, stackFrame, depth);
    
    this.addTrace(thinking, 'thinking', depth, stackFrame);

    // Handle different types of statements
    if (line.includes('if ')) {
      return this.handleCondition(line, stackFrame, depth);
    } else if (line.includes('return ')) {
      return this.handleReturn(line, stackFrame, depth);
    } else if (line.includes('=') && !line.includes('==')) {
      this.handleAssignment(line, stackFrame);
    }

    return null;
  }

  handleCondition(line, stackFrame, depth) {
    // Parse condition (e.g., "if n <= 1:")
    const conditionMatch = line.match(/if\s+(.+):/);
    if (conditionMatch) {
      const condition = conditionMatch[1];
      const result = this.evaluateCondition(condition, stackFrame);
      
      this.addTrace(`Evaluating condition: ${condition} = ${result}`, 'condition', depth, stackFrame);
      
      if (result) {
        this.addTrace(`Condition is TRUE - this is the base case!`, 'base_case', depth, stackFrame);
        // Find the return statement in the if block
        const funcDef = this.parseResult.functionDef;
        const currentLineIndex = funcDef.body.findIndex(b => b.code.trim() === line);
        if (currentLineIndex !== -1 && currentLineIndex + 1 < funcDef.body.length) {
          const nextLine = funcDef.body[currentLineIndex + 1];
          if (nextLine.code.trim().includes('return')) {
            return this.handleReturn(nextLine.code.trim(), stackFrame, depth);
          }
        }
      } else {
        this.addTrace(`Condition is FALSE - need to make recursive call`, 'recursive_case', depth, stackFrame);
      }
    }
    return null;
  }

  handleReturn(line, stackFrame, depth) {
    const returnMatch = line.match(/return\s+(.+)/);
    if (returnMatch) {
      const expression = returnMatch[1];
      
      if (expression.includes(stackFrame.functionName + '(')) {
        // This is a recursive call
        this.addTrace(`About to make recursive call: ${expression}`, 'pre_recursive', depth, stackFrame);
        const value = this.evaluateExpression(expression, stackFrame, depth);
        this.addTrace(`Recursive call completed, got result: ${value}`, 'post_recursive', depth, stackFrame);
        return value;
      } else {
        // Simple return
        const value = this.evaluateExpression(expression, stackFrame);
        this.addTrace(`Returning simple value: ${value}`, 'simple_return', depth, stackFrame);
        return value;
      }
    }
    return null;
  }

  handleAssignment(line, stackFrame) {
    const match = line.match(/(\w+)\s*=\s*(.+)/);
    if (match) {
      const varName = match[1];
      const expression = match[2];
      const value = this.evaluateExpression(expression, stackFrame);
      stackFrame.localVars[varName] = value;
    }
  }

  evaluateExpression(expr, stackFrame = null, depth = 0) {
    expr = expr.trim();
    
    // Handle recursive function calls
    if (stackFrame && expr.includes(stackFrame.functionName + '(')) {
      const funcName = stackFrame.functionName;
      const pattern = new RegExp(`${funcName}\\s*\\(([^)]*)\\)`);
      const match = expr.match(pattern);
      
      if (match) {
        const argExpr = match[1];
        const args = [argExpr]; // Simplified for single argument
        
        this.addTrace(`Making recursive call with: ${argExpr}`, 'recursive_call', depth + 1, stackFrame);
        const result = this.executeFunction(funcName, args, depth + 1);
        
        // Replace the function call with its result
        expr = expr.replace(match[0], result.toString());
      }
    }
    
    // Simple expression evaluation
    if (stackFrame) {
      // Replace variables with their values
      for (let [name, value] of Object.entries(stackFrame.params)) {
        expr = expr.replace(new RegExp(`\\b${name}\\b`, 'g'), value.toString());
      }
      for (let [name, value] of Object.entries(stackFrame.localVars)) {
        expr = expr.replace(new RegExp(`\\b${name}\\b`, 'g'), value.toString());
      }
    }
    
    // Evaluate basic arithmetic
    try {
      return eval(expr);
    } catch (e) {
      return parseInt(expr) || 0;
    }
  }

  evaluateCondition(condition, stackFrame) {
    // Replace variables in condition
    let evaluatedCondition = condition;
    for (let [name, value] of Object.entries(stackFrame.params)) {
      evaluatedCondition = evaluatedCondition.replace(new RegExp(`\\b${name}\\b`, 'g'), value.toString());
    }
    for (let [name, value] of Object.entries(stackFrame.localVars)) {
      evaluatedCondition = evaluatedCondition.replace(new RegExp(`\\b${name}\\b`, 'g'), value.toString());
    }
    
    try {
      return eval(evaluatedCondition);
    } catch (e) {
      return false;
    }
  }

  generateThinking(line, stackFrame, depth) {
    const params = Object.entries(stackFrame.params).map(([k, v]) => `${k}=${v}`).join(', ');
    
    if (line.includes('if ')) {
      return `🤔 Checking if we've reached the base case...`;
    } else if (line.includes('return ') && line.includes(stackFrame.functionName)) {
      return `🔄 Need to solve a smaller subproblem first`;
    } else if (line.includes('return ')) {
      return `✅ Found the answer! Returning result`;
    } else {
      return `📝 Executing: ${line} (with ${params})`;
    }
  }

  addTrace(message, type, depth, stackFrame = null, returnValue = null) {
    this.executionTrace.push({
      step: this.executionTrace.length,
      message: message,
      type: type,
      depth: depth,
      stackFrame: stackFrame ? {...stackFrame} : null,
      callStack: this.callStack.map(frame => ({...frame})),
      returnValue: returnValue
    });
  }

  run() {
    this.reset();
    
    if (!this.parseResult.mainCall) {
      this.addTrace('No main function call found', 'error', 0);
      return;
    }

    const mainCall = this.parseResult.mainCall;
    this.addTrace(`Starting execution of ${mainCall.functionName}(${mainCall.args.join(', ')})`, 'start', 0);
    
    try {
      const result = this.executeFunction(mainCall.functionName, mainCall.args, 0);
      this.addTrace(`Final result: ${result}`, 'final', 0, null, result);
    } catch (error) {
      this.addTrace(`Error: ${error.message}`, 'error', 0);
    }
  }

  getExecutionTrace() {
    return this.executionTrace;
  }

  getCurrentState(step) {
    if (step < 0 || step >= this.executionTrace.length) {
      return null;
    }
    return this.executionTrace[step];
  }
}

module.exports = RecursiveExecutionEngine;