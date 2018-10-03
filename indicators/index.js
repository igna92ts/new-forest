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

const tradingFee = 0.001 * 2; // buy and sell
const marginFee = 0.01 * 2; // buy and sell earnings
const fastSellingMargin = 0.001 * 2; // 0.5% to buy and sell fast
const accumulatedFees = price => price + (price * tradingFee + price * marginFee + price * fastSellingMargin);
const expectedAction = trades => {
  return trades.reduce((res, t, index) => {
    if (t.action) return [...res, t];
    const newTrades = trades.slice(index + 1); // trades after this one
    if (newTrades.length === 0) return [...res, { ...t, action: 'NOTHING' }];
    if (newTrades[0].close >= t.close) {
      let under55 = true;
      let accumulated = 0;
      let average = 0;
      for (let i = 0; i < newTrades.length; i++) {
        accumulated += newTrades[i].close;
        average = accumulated / (i + 1);
        if (newTrades[i].close > accumulatedFees(t.close)) {
          return [
            ...res,
            {
              ...t,
              action: 'BUY'
            }
          ];
        }
        if (!under55 && newTrades[i].EMA8 < newTrades[i].EMA55) return [...res, { ...t, action: 'NOTHING' }];
        if (newTrades[i].EMA8 < newTrades[i].EMA55) under55 = false;
      }
      return [...res, { ...t, action: 'NOTHING' }];
    } else if (newTrades[0].close < t.close) {
      const ahead = 5;
      const nextTrades = newTrades.slice(0, ahead);
      if (nextTrades.length === ahead) {
        const avgNext = nextTrades.reduce((sum, e) => sum + e.close, 0) / ahead;
        if (avgNext < t.close && nextTrades.some(n => n.EMA8 < n.EMA55)) {
          return [...res, { ...t, action: 'SELL' }];
        }
      }
      if (t.EMA8 < t.EMA55) return [...res, { ...t, action: 'SELL' }];
      else return [...res, { ...t, action: 'NOTHING' }];
    } else {
      return [...res, { ...t, action: 'NOTHING' }];
    }
  }, []);
};

const exclude = (excludeProps, features) => {
  return features.filter(f => !excludeProps.some(e => e === f));
};

const advancedFeatures = historic => {
  let tempHistoric = [...historic];
  tempHistoric = basicIndicators(tempHistoric);
  tempHistoric = derivedIndicators(tempHistoric);
  tempHistoric = detectPatterns(tempHistoric);
  tempHistoric = expectedAction(tempHistoric);

  const features = exclude(
    ['LOWERBB21', 'UPPERBB21', 'MIDDLEBB21', 'EMA8', 'EMA13', 'EMA21', 'EMA55', 'VWAP', 'OBV', 'close'],
    Object.keys(tempHistoric[0]).filter(e => isUpperCase(e))
  );
  return {
    advancedHistoric: tempHistoric,
    features
  };
};

module.exports = { advancedFeatures, combineIndicators };
