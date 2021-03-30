import React from 'react';
import { colors } from '../constants';
// import { formatTokens } from '../solve';
import type { Token, Step as StepType } from '../solve';
import '../styles/Step.css';
// import { tokenToString } from 'typescript';

type StepProps = {
  initial?: boolean,
  step: StepType,
  index: number
}

type IndexedToken = {
  token: Token,
  index: number
}

const Step = ({ initial = false, step, index }: StepProps) => {
  let computeNextInterval = step.computeNext || { start: 0, end: 0 };
  const indexedTokens = step.tokens.map((token, i) => ({ token: token, index: i }));
  const computedColor = step.computed ? colors[(index-1) % colors.length] : 'white';
  const computeNextColor = step.computeNext ? colors[index % colors.length] : 'white';
  console.log(index, computedColor, computeNextColor);

  const mapTokens = ({ token, index }: IndexedToken): React.ReactNode => {
    let adjustedValue = token.value.toString();
    if (index > 0 && step.tokens[index-1].value !== 'neg') {
      adjustedValue = ' ' + adjustedValue;
    }
    if (adjustedValue === ' neg') {
      adjustedValue = ' -';
    }
    if (step.computed !== null && index === step.computed.start) {
      return (<span key={index} className='computed' style={{color: computedColor, fontWeight: 'bold'}}>{adjustedValue}</span>);
    } else {
      return (<span key={index}>{adjustedValue}</span>);
    }
  };
  const preComputeNext = indexedTokens.slice(0, computeNextInterval.start).map(mapTokens);
  const postComputeNext = indexedTokens.slice(computeNextInterval.end).map(mapTokens);
  const computeNextInner = indexedTokens.slice(computeNextInterval.start, computeNextInterval.end).map(mapTokens);
  let computeNext = (<></>)
  if (computeNextInner.length > 0) {
    computeNext = (<span className='compute-next' style={{border: '2px solid ' + computeNextColor}}>{computeNextInner}</span>)
  }
  return (
    <div className={initial ? 'step step-initial' : 'step step-next'}>
    <span className='expression'>
      {preComputeNext}
      {computeNext}
      {postComputeNext}
    </span>
    </div>
  );
};

export default Step;
