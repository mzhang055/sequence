class ExecutionEngine {
  constructor(parseResult) {
    this.steps = parseResult.steps;
    this.arrayVar = parseResult.arrayVar;
    this.initialArray = [...parseResult.initialArray];
    this.lines = parseResult.lines;
    this.reset();
  }

  reset() {
    this.currentStep = 0;
    this.array = [...this.initialArray];
    this.variables = {};
    this.loopIndex = 0;
    this.loopMax = this.array.length;
    this.isInLoop = false;
    this.executionTrace = [];
  }

  getCurrentState() {
    return {
      step: this.currentStep,
      array: [...this.array],
      loopIndex: this.loopIndex,
      loopMax: this.loopMax,
      isInLoop: this.isInLoop,
      currentLine: this.getCurrentLine(),
      isComplete: this.currentStep >= this.getTotalSteps()
    };
  }

  getCurrentLine() {
    if (this.currentStep < this.steps.length) {
      return this.steps[this.currentStep].line;
    }
    return -1;
  }

  getTotalSteps() {
    let totalSteps = 0;
    for (let step of this.steps) {
      if (step.type === 'init') {
        totalSteps += 1;
      } else if (step.type === 'for_start') {
        totalSteps += this.loopMax * 3;
      }
    }
    return totalSteps;
  }

  stepForward() {
    if (this.isComplete()) return false;

    const step = this.steps[this.currentStep];
    
    switch (step.type) {
      case 'init':
        this.array = [...step.array];
        this.variables[step.varName] = [...step.array];
        this.executionTrace.push({
          loopIndex: -1,
          array: [...this.array],
          conditionResult: null,
          step: 'init'
        });
        break;
        
      case 'for_start':
        this.isInLoop = true;
        this.loopIndex = 0;
        this.executeLoop();
        return true;
    }
    
    this.currentStep++;
    return true;
  }

  executeLoop() {
    while (this.loopIndex < this.loopMax) {
      const conditionStep = this.steps.find(s => s.type === 'condition');
      const operationStep = this.steps.find(s => s.type === 'operation');
      
      if (conditionStep) {
        const conditionResult = this.evaluateCondition(conditionStep.condition);
        
        if (conditionResult && operationStep) {
          this.executeOperation(operationStep.operation);
        }
      }
      
      this.loopIndex++;
      this.executionTrace.push({
        loopIndex: this.loopIndex - 1,
        array: [...this.array],
        conditionResult: conditionStep ? this.evaluateCondition(conditionStep.condition) : true
      });
    }
    
    this.isInLoop = false;
    this.currentStep++;
  }

  evaluateCondition(condition) {
    if (!condition) return true;
    
    const leftValue = this.array[this.loopIndex];
    const rightValue = condition.right;
    
    switch (condition.operator) {
      case '>': return leftValue > rightValue;
      case '<': return leftValue < rightValue;
      case '>=': return leftValue >= rightValue;
      case '<=': return leftValue <= rightValue;
      case '==': return leftValue == rightValue;
      case '!=': return leftValue != rightValue;
      default: return true;
    }
  }

  executeOperation(operation) {
    if (!operation) return;
    
    if (operation.expression.includes('* 2')) {
      this.array[this.loopIndex] = this.array[this.loopIndex] * 2;
    } else if (operation.expression.includes('+ ')) {
      const match = operation.expression.match(/\+\s*(\d+)/);
      if (match) {
        this.array[this.loopIndex] += parseInt(match[1]);
      }
    }
  }

  isComplete() {
    return this.currentStep >= this.steps.length;
  }

  getExecutionTrace() {
    return this.executionTrace;
  }
}

module.exports = ExecutionEngine;