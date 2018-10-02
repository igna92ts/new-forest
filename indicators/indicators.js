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
  errors = require('../errors');

exports.fill = (historic, values, label) => {
  const difference = historic.length - values.length;
  return historic.reduce((res, t, index) => {
    if (index < difference) return [...res, { [label]: t[label] || 0 }];
    else return [...res, { [label]: values[index - difference] }];
  }, []);
};

exports.EMA = (historic, period) => {
  if (!period) throw errors.missingRequiredProperty('period');
  const values = historic.map(h => {
    if (h.close === undefined) throw errors.missingRequiredProperty('close');
    return h.close;
  });
  const ema = EMA.calculate({ period, values });
  return exports.fill(historic, ema, `EMA${period}`);
};

exports.RSI = (historic, period) => {
  if (!period) throw errors.missingRequiredProperty('period');
  const values = historic.map(h => {
    if (h.close === undefined) throw errors.missingRequiredProperty('close');
    return h.close;
  });
  const rsi = RSI.calculate({ period, values });
  return exports.fill(historic, rsi, `RSI${period}`);
};

exports.ADX = (historic, period) => {
  if (!period) throw errors.missingRequiredProperty('period');
  const close = historic.map(h => {
    if (h.close === undefined) throw errors.missingRequiredProperty('close');
    return h.close;
  });
  const high = historic.map(h => {
    if (h.high === undefined) throw errors.missingRequiredProperty('high');
    return h.high;
  });
  const low = historic.map(h => {
    if (h.low === undefined) throw errors.missingRequiredProperty('low');
    return h.low;
  });
  const adxArr = ADX.calculate({ period, close, high, low });
  const adx = exports.fill(historic, adxArr.map(e => e.adx), `ADX${period}`);
  const mdi = exports.fill(historic, adxArr.map(e => e.mdi), `MDI${period}`);
  const pdi = exports.fill(historic, adxArr.map(e => e.pdi), `PDI${period}`);
  return historic.map((e, index) => ({ ...adx[index], ...mdi[index], ...pdi[index] }));
};

exports.MFI = (historic, period) => {
  if (!period) throw errors.missingRequiredProperty('period');
  const close = historic.map(h => {
    if (h.close === undefined) throw errors.missingRequiredProperty('close');
    return h.close;
  });
  const high = historic.map(h => {
    if (h.high === undefined) throw errors.missingRequiredProperty('high');
    return h.high;
  });
  const low = historic.map(h => {
    if (h.low === undefined) throw errors.missingRequiredProperty('low');
    return h.low;
  });
  const volume = historic.map(h => {
    if (h.volume === undefined) throw errors.missingRequiredProperty('volume');
    return h.volume;
  });
  const mfi = MFI.calculate({ period, volume, high, low, close });
  return exports.fill(historic, mfi, `MFI${period}`);
};

exports.BB = (historic, period) => {
  if (!period) throw errors.missingRequiredProperty('period');
  const values = historic.map(h => {
    if (h.close === undefined) throw errors.missingRequiredProperty('close');
    return h.close;
  });
  const bb = BB.calculate({ period, values, stdDev: 2 });
  const lower = exports.fill(historic, bb.map(b => b.lower), `LOWERBB${period}`);
  const middle = exports.fill(historic, bb.map(b => b.middle), `MIDDLEBB${period}`);
  const upper = exports.fill(historic, bb.map(b => b.upper), `UPPERBB${period}`);
  const pb = exports.fill(historic, bb.map(b => b.pb), `PERCENTB${period}`);
  return historic.map((e, index) => ({ ...lower[index], ...middle[index], ...upper[index], ...pb[index] }));
};

exports.STOCH = (historic, period) => {
  if (!period) throw errors.missingRequiredProperty('period');
  const close = historic.map(h => {
    if (h.close === undefined) throw errors.missingRequiredProperty('close');
    return h.close;
  });
  const high = historic.map(h => {
    if (h.high === undefined) throw errors.missingRequiredProperty('high');
    return h.high;
  });
  const low = historic.map(h => {
    if (h.low === undefined) throw errors.missingRequiredProperty('low');
    return h.low;
  });
  const stoch = STOCH.calculate({ high, low, close, period, signalPeriod: 3 });
  const pk = exports.fill(historic, stoch.map(s => s.k), `STOCHK${period}`);
  const pd = exports.fill(historic, stoch.map(s => s.d || 0), `STOCHD${period}`);
  return historic.map((e, index) => ({ ...pk[index], ...pd[index] }));
};

exports.VWAP = historic => {
  const close = historic.map(h => {
    if (h.close === undefined) throw errors.missingRequiredProperty('close');
    return h.close;
  });
  const high = historic.map(h => {
    if (h.high === undefined) throw errors.missingRequiredProperty('high');
    return h.high;
  });
  const low = historic.map(h => {
    if (h.low === undefined) throw errors.missingRequiredProperty('low');
    return h.low;
  });
  const volume = historic.map(h => {
    if (h.volume === undefined) throw errors.missingRequiredProperty('volume');
    return h.volume;
  });
  const vwap = VWAP.calculate({ high, low, volume, close });
  return exports.fill(historic, vwap, 'VWAP');
};

exports.VO = historic => {
  const volume = historic.map(h => {
    if (h.volume === undefined) throw errors.missingRequiredProperty('volume');
    return h.volume;
  });
  const shortSma = exports.fill([...historic], EMA.calculate({ values: volume, period: 5 }), 'SHORTSMA');
  const longSma = exports.fill([...historic], EMA.calculate({ values: volume, period: 10 }), 'LONGSMA');
  return historic.map((h, index) => {
    if (shortSma[index].SHORTSMA === 0 || longSma[index].LONGSMA === 0) {
      return { VO: 0 };
    } else {
      return {
        VO: ((shortSma[index].SHORTSMA - longSma[index].LONGSMA) / longSma[index].LONGSMA) * 100
      };
    }
  });
};
