const formatTokens = (tokens: Token[]): string => {
  let formatted = tokens.map((token) => token.value.toString()).join(' ')
  formatted = formatted.split('neg (').join('-(')
  return formatted
}

export type TokenType = 'operator' | 'number';
export type TokenValue = string | number;
export type Token = {
  type: TokenType,
  value: TokenValue
};

const tokenizeLiteral = (literal: string): Token => {
  if (!isNaN(Number(literal)) && literal !== '') {
    if (literal.split('.').length === 2) {
      return {type: 'number', value: parseFloat(literal)};
    } else {
      return {type: 'number', value: parseInt(literal)};
    }
  } else {
    throw new Error('User Error: Literal not recognized.');
  }
};

const tokenize = (text: string): Token[] => {
  let tokens: Token[] = [];
  for (let i=0; i < text.length; i++) {
    // Char at i is a number or ".".
    if (!isNaN(parseInt(text.charAt(i))) || text.charAt(i) === '.') {
      let j = i;
      while (j < text.length && (!isNaN(parseInt(text.charAt(j))) || text.charAt(j) === '.')) {
        j += 1;
      }
      const literal = text.slice(i, j);
      const token = tokenizeLiteral(literal);
      tokens.push(token);
      i = j-1;
    // Char at i is an operator.
    } else if ('()^*/+-'.includes(text.charAt(i))) {
      const token: Token = {type: 'operator', value: text.charAt(i)}
      tokens.push(token);
    } else if (text.charAt(i) !== ' ') {
      throw new Error('User Error: "' + text[i] + '" is not a valid character.');
    }
  }
  return tokens;
};

// NOT intended to handle errors.
const establishNegatives = (tokens: Token[]): Token[] => {
  let newTokens: Token[] = [];
  for (let i=0; i < tokens.length; i++) {
    // Is a candidate for conversion to "neg".
    if (tokens[i].value === '-') {
      let isNegative = true;
      // Minus is at the end.
      if (i+1 === tokens.length) {
        isNegative = false;
      // Minus is followed by an operator other than "(".
      } else if (tokens[i+1].type === 'operator' && tokens[i+1].value !== '(') {
        isNegative = false;
      // Minus follows a number.
      } else if (i > 0 && tokens[i-1].type === 'number') {
        isNegative = false;
      // Minus is followed by a number followed by an exponent sign (which operates before negative conversion).
      } else if (i+2 < tokens.length && tokens[i+2].value === '^') {
        isNegative = false
      }

      if (isNegative) {
        newTokens.push({type: 'operator', value: 'neg'})
      } else {
        newTokens.push({type: 'operator', value: '-'})
      }
    // Not a candidate for conversion to "neg".
    } else {
      newTokens.push({type: tokens[i].type, value: tokens[i].value})
    }
  }
  return newTokens;
};

// Only handles errors related to bad "neg"s.
const resolveNegatives = (tokens: Token[]): Token[] => {
  let newTokens: Token[] = [];
  for (let i=0; i<tokens.length; i++) {
    if (tokens[i].value === 'neg') {
      // Is at the end of expression (internal because it shouldn't have been converted if at end).
      if (i+1 >= tokens.length) {
        throw new Error('Internal Error: Expression cannot end with a "neg" operator.');
      } else {
        const nextToken = tokens[i+1];
        // Is followed by "(".
        if (nextToken.value === '(') {
          newTokens.push({type: 'operator', value: 'neg'});
        // Is followed by a number.
        } else if (typeof nextToken.value == 'number') {
          let newValue = -1 * nextToken.value;
          // DO NOT resolve "neg 0" to "-0".
          if (nextToken.value === 0) {
            newValue = 0;
          }
          newTokens.push({type: 'number', value: newValue});
          i += 1;
        // Is followed by something other than "(" or a number (internal because shouldn't have been converted if so).
        } else {
          throw new Error('Internal Error: "neg"s must be followed by "(" or a number.');
        }
      }
    } else {
      newTokens.push({type: tokens[i].type, value: tokens[i].value});
    }
  }
  return newTokens;
};

// Assumes no "neg"s or parentheses; handles most other input logic errors.
const performMathOperation = (tokens: Token[]): Token[] => {
  if (tokens.length === 1) {
    if (tokens[0].type === 'operator') {
      throw new Error('User Error: Expression cannot consist only of an operator.');
    } else {
      return [{type: 'number', value: tokens[0].value}]; 
    }
  }

  const tokenValues: TokenValue[] = tokens.map((token) => token.value);
  const operators = ['^', '*', '/', '+', '-'];
  let operatorIndex: number | undefined = -1;
  for (let i=0; i<operators.length; i++) {
    if (tokenValues.includes(operators[i])) {
      operatorIndex = tokenValues.indexOf(operators[i]);
      break;
    };
  };

  if (operatorIndex === undefined) {
    throw new Error('User Error: Multiple tokens in expression with no operator.');
  } else if (operatorIndex === 0) {
    throw new Error('User Error: Expression cannot start with an operator.');
 } else if (operatorIndex === tokens.length-1) {
   throw new Error('User Error: Expression cannot end with an operator.');
  }

  let newToken: Token | undefined = undefined;

  const leftOperand: Token = tokens[operatorIndex-1];
  const rightOperand: Token = tokens[operatorIndex+1];
  const operator: Token = tokens[operatorIndex];
  if (typeof leftOperand.value === 'number' && typeof rightOperand.value === 'number') {
    let newValue: number | undefined = undefined;
    if (operator.value === '^') {
      newValue = Math.pow(leftOperand.value, rightOperand.value);
    } else if (operator.value === '*') {
      newValue = leftOperand.value*rightOperand.value;
    } else if (operator.value === '/') {
      newValue = leftOperand.value/rightOperand.value;
    } else if (operator.value === '+') {
      newValue = leftOperand.value+rightOperand.value;
    } else if (operator.value === '-') {
      newValue = leftOperand.value-rightOperand.value;
    }
    if (newValue === undefined) {
      throw new Error('Internal Error: "' + operator.value + '" operator not recognized.');
    } else {
      newToken = {type: 'number', value: newValue};
    }
  } else {
    throw new Error('User Error: "' + operator.value + '" operator requires numeric operands.');
  }
  
  if (newToken === undefined) {
    throw new Error('Internal error: performSimpleOperation function failed.');
  } else {
    const leftTokens = tokens.slice(0, operatorIndex-1).map((token) => ({type: token.type, value: token.value}));
    const rightTokens = tokens.slice(operatorIndex+2).map((token) => ({type: token.type, value: token.value}));
    const newTokens = leftTokens.concat([newToken]).concat(rightTokens);      
    return newTokens;
  }
};

// Only handles errors to do with parentheses
const performOperation = (tokens: Token[]): Token[] => {
  let parenStart: number | undefined = undefined;
  let parenEnd: number | undefined = undefined;
  for (let i=0; i<tokens.length; i++) {
    if (tokens[i].value === '(') {
      parenStart = i;
    } else if (tokens[i].value === ')') {
      parenEnd = i;
      break;
    }
  }

  if ((parenStart === undefined) !== (parenEnd === undefined)) {
    throw new Error('User Error: Mismatched parentheses.');
  }

  let newTokens: Token[] | undefined = undefined;

  // We'll be working within parentheses.
  if (parenStart !== undefined && parenEnd !== undefined) {
    const contents: Token[] = tokens.slice(parenStart+1, parenEnd);
    if (contents.length === 0) {
      throw new Error('User Error: Parentheses cannot be empty.');
    }
    const contentsOperated = performMathOperation(contents);
    // Contents operated contains single number.
    if (contentsOperated.length === 1 && contentsOperated[0].type === 'number') {
      // Remove parentheses when concatenating.
      const leftTokens = tokens.slice(0, parenStart).map((token) => ({type: token.type, value: token.value}));
      const rightTokens = tokens.slice(parenEnd+1).map((token) => ({type: token.type, value: token.value}));
      newTokens = leftTokens.concat(contentsOperated).concat(rightTokens);
    // Contents operated contains multiple numbers (error cases handled within perform math operation).
    } else {
      const leftTokens = tokens.slice(0, parenStart+1).map((token) => ({type: token.type, value: token.value}));
      const rightTokens = tokens.slice(parenEnd).map((token) => ({type: token.type, value: token.value}));
      newTokens = leftTokens.concat(contentsOperated).concat(rightTokens);
    }
  // There are no parentheses remaining.
  } else {
    newTokens = performMathOperation(tokens);
  }

  if (newTokens !== undefined) {
    newTokens = resolveNegatives(newTokens);
    return newTokens;
  } else {
    throw new Error('Internal Error: "performOperation" function failed.');
  }
};

const evaluate = (text: string): Token[][] | Error => {
  try {
    let tokens = tokenize(text);
    tokens = establishNegatives(tokens);
    tokens = resolveNegatives(tokens);
    if (tokens.length === 0) {
      return [];
    } else if (tokens.length === 1 && tokens[0].type === 'operator') {
      throw new Error('User Error: Expression cannot consist of a single operator.');
    }
    let steps = [tokens];
    while (steps[steps.length-1].length > 1) {
      tokens = steps[steps.length-1];
      tokens = performOperation(tokens);
      steps.push(tokens);
    }
    return steps;
  } catch (error) {
    return error;
  }
};

export {
  tokenizeLiteral,
  tokenize,
  establishNegatives,
  resolveNegatives,
  performMathOperation,
  performOperation,
  evaluate,
  formatTokens
};

// NOTE
  // Preference is to trust token.type, with typeof used when necessary for type narrowing.

// TODO
  // Returns and conditionals and exceptions all over the place are leaving things a mess (especially performMathOperation).
    // In theory having early returns makes it so there are guarantees down the line, but that gets messy fast.....
  // Ya, checks and exceptions are all over the place. resolve that.
  // Consider un-refactoring the '"number"' back to '"float" | "integer"', since apparently JS/TS is terrible at discerning floats/ints from numbers