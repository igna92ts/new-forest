const { detectPatterns } = require('./patterns'),
  { EMA, RSI, ADX, MFI, BB, STOCH, VWAP, VO } = require('./indicators'),
  { percentageMovement, percentageBollinger, percentEmaAndOrder, percentVwap } = require('./derived'),
  errors = require('../errors');

const isUpperCase = str => {
  return str === str.toUpperCase();
};

const periods = {
  EMA: [8, 13, 21, 55],
  RSI: 14,
  ADX: 14,
  MFI: 14,
  BB: 21,
  STOCH: 14
};

const combineIndicators = indicatorsObj => {
  const { length } = indicatorsObj[0];
  indicatorsObj.forEach(ind => {
    if (ind.length !== length) throw errors.defaultError('indicator lengths should be equal');
  });
  return indicatorsObj.reduce((res, indicator, index) => {
    if (index === 0) return indicator;
    indicator.forEach((e, i) => {
      res[i] = { ...res[i], ...e };
    });
    return res;
  }, []);
};

const basicIndicators = historic => {
  return combineIndicators([
    historic,
    EMA(historic, periods.EMA[0]),
    EMA(historic, periods.EMA[1]),
    EMA(historic, periods.EMA[2]),
    EMA(historic, periods.EMA[3]),
    RSI(historic, periods.RSI),
    ADX(historic, periods.ADX),
    MFI(historic, periods.MFI),
    BB(historic, periods.BB),
    STOCH(historic, periods.STOCH),
    VWAP(historic),
    VO(historic)
  ]);
};

const derivedIndicators = historic => {
  return combineIndicators([
    percentageMovement(historic),
    percentageBollinger(historic, periods.BB),
    percentEmaAndOrder(historic, periods.EMA),
    percentVwap(historic)
  ]);
};

const advancedFeatures = historic => {
  let tempHistoric = [...historic];
  tempHistoric = basicIndicators(tempHistoric);
  tempHistoric = derivedIndicators(tempHistoric);
  tempHistoric = detectPatterns(tempHistoric);

  return {
    advancedHistoric: tempHistoric,
    features: Object.keys(tempHistoric[0]).filter(e => isUpperCase(e))
  };
};

module.exports = { advancedFeatures, combineIndicators };
