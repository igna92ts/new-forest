const {
    BollingerBands: BB,
    Stochastic: STOCH,
    VWAP,
    OBV,
    RSI,
    EMA,
    ADX,
    MFI,
    SMA
  } = require('technicalindicators'),
  { detectPatterns } = require('./patterns');

const assignIndicator = (tracker, indicatorValues, label) => {
  const difference = tracker.length - indicatorValues.length;
  return tracker.reduce((res, t, index) => {
    if (index < difference) return [...res, { ...t, [label]: t[label] || 0 }];
    else return [...res, { ...t, [label]: indicatorValues[index - difference] }];
  }, []);
};

const isUpperCase = str => {
  return str === str.toUpperCase();
};

const percentageMovement = historic => {
  return historic.map((h, index) => {
    if (index === 0) return { ...h, PERCENTCHANGE: 0 };
    const percent = ((h.price - historic[index - 1].price) * 100) / h.price;
    return { ...h, PERCENTCHANGE: percent };
  });
};

const percentageBollinger = historic => {
  return historic.map(h => {
    return {
      ...h,
      LOWERBB21: ((h.LOWERBB21 - h.price) * 100) / h.price,
      MIDDLEBB21: ((h.MIDDLEBB21 - h.price) * 100) / h.price,
      UPPERBB21: ((h.UPPERBB21 - h.price) * 100) / h.price
    };
  });
};

const percentEmaAndOrder = historic => {
  return historic.map(h => {
    return {
      ...h,
      ORDEREDEMA: h.EMA8 > h.EMA13 && h.EMA13 > h.EMA21 && h.EMA21 > h.EMA55,
      PERCENTEMA8: ((h.EMA8 - h.price) * 100) / h.price,
      PERCENTEMA13: ((h.EMA13 - h.price) * 100) / h.price,
      PERCENTEMA21: ((h.EMA21 - h.price) * 100) / h.price,
      PERCENTEMA55: ((h.EMA55 - h.price) * 100) / h.price
    };
  });
};

const percentVwap = historic => {
  return historic.map(h => {
    return {
      ...h,
      PERCENTVWAP: ((h.VWAP - h.price) * 100) / h.price
    };
  });
};

const volumeOscillator = historic => {
  const volume = historic.map(t => t.volume);
  let data = assignIndicator([...historic], EMA.calculate({ values: volume, period: 5 }), 'SHORTSMA');
  data = assignIndicator(data, EMA.calculate({ values: volume, period: 10 }), 'LONGSMA');
  return historic.map((h, index) => {
    return {
      ...h,
      VOLUMEOSCILLATOR: ((data[index].SHORTSMA - data[index].LONGSMA) / data[index].LONGSMA) * 100
    };
  });
};

const advancedFeatures = historic => {
  let tempHistoric = [...historic];
  const prices = tempHistoric.map(t => t.price);
  const open = tempHistoric.map(t => t.openPrice);
  const high = tempHistoric.map(t => t.highPrice);
  const low = tempHistoric.map(t => t.lowPrice);
  const volume = tempHistoric.map(t => t.volume);
  tempHistoric = assignIndicator(tempHistoric, EMA.calculate({ period: 8, values: prices }), 'EMA8');
  tempHistoric = assignIndicator(tempHistoric, EMA.calculate({ period: 13, values: prices }), 'EMA13');
  tempHistoric = assignIndicator(tempHistoric, EMA.calculate({ period: 21, values: prices }), 'EMA21');
  tempHistoric = assignIndicator(tempHistoric, EMA.calculate({ period: 55, values: prices }), 'EMA55');
  tempHistoric = assignIndicator(tempHistoric, RSI.calculate({ period: 14, values: prices }), 'RSI14');
  tempHistoric = assignIndicator(
    tempHistoric,
    ADX.calculate({ period: 14, close: prices, high, low }).map(e => e.adx),
    'ADX14'
  );
  tempHistoric = assignIndicator(
    tempHistoric,
    MFI.calculate({ period: 14, volume, high, low, close: prices }),
    'MFI14'
  );
  const bb = BB.calculate({ period: 21, values: prices, stdDev: 2 });
  tempHistoric = assignIndicator(tempHistoric, bb.map(b => b.lower), 'LOWERBB21');
  tempHistoric = assignIndicator(tempHistoric, bb.map(b => b.middle), 'MIDDLEBB21');
  tempHistoric = assignIndicator(tempHistoric, bb.map(b => b.upper), 'UPPERBB21');

  tempHistoric = assignIndicator(tempHistoric, OBV.calculate({ close: prices, volume }), 'OBV');
  const stoch = STOCH.calculate({ high, low, close: prices, period: 14, signalPeriod: 3 });
  tempHistoric = assignIndicator(tempHistoric, stoch.map(s => s.k), 'STOCHK14');
  tempHistoric = assignIndicator(tempHistoric, stoch.map(s => s.d), 'STOCHD14');
  tempHistoric = assignIndicator(
    tempHistoric,
    VWAP.calculate({ open, high, low, volume, close: prices }),
    'VWAP'
  );

  tempHistoric = percentageMovement(tempHistoric);
  tempHistoric = percentageBollinger(tempHistoric);
  tempHistoric = percentEmaAndOrder(tempHistoric);
  tempHistoric = volumeOscillator(tempHistoric);
  tempHistoric = detectPatterns(tempHistoric);

  return {
    advancedHistoric: tempHistoric,
    features: Object.keys(tempHistoric[0]).filter(e => isUpperCase(e) || e === 'price')
  };
};

module.exports = { advancedFeatures };
