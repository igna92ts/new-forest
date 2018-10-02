const errors = require('../errors');

exports.percentageMovement = historic => {
  return historic.map((h, index) => {
    if (h.close === undefined) throw errors.missingRequiredProperty('close');
    if (index === 0) return { ...h, PERCENTCHANGE: 0 };
    const percent = ((h.close - historic[index - 1].close) * 100) / historic[index - 1].close;
    return { ...h, PERCENTCHANGE: percent };
  });
};

exports.percentageBollinger = (historic, period) => {
  return historic.map(h => {
    if (!period) throw errors.missingRequiredProperty('period');
    if (h.close === undefined) throw errors.missingRequiredProperty('close');
    if (h[`LOWERBB${period}`] === undefined) throw errors.missingRequiredProperty(`LOWERBB${period}`);
    if (h[`MIDDLEBB${period}`] === undefined) throw errors.missingRequiredProperty(`MIDDLEBB${period}`);
    if (h[`UPPERBB${period}`] === undefined) throw errors.missingRequiredProperty(`UPPERBB${period}`);
    return {
      ...h,
      [`PERCENTLOWERBB${period}`]: ((h[`LOWERBB${period}`] - h.close) * 100) / h.close,
      [`PERCENTMIDDLEBB${period}`]: ((h[`MIDDLEBB${period}`] - h.close) * 100) / h.close,
      [`PERCENTUPPERBB${period}`]: ((h[`UPPERBB${period}`] - h.close) * 100) / h.close
    };
  });
};

const checkSort = arr => {
  const sorted = [...arr].sort((a, b) => a - b);
  return JSON.stringify(arr) === JSON.stringify(sorted);
};

exports.percentEmaAndOrder = (historic, periodArr) => {
  if (!periodArr || periodArr.length === 0) throw errors.defaultError('No periods in array');
  if (!checkSort(periodArr)) throw errors.defaultError('Periods need to be in asc order');
  return historic.map(h => {
    const ordered = periodArr.reduce((res, p, index) => {
      if (h[`EMA${p}`] === undefined) throw errors.missingRequiredProperty(`EMA${p}`);
      if (periodArr[index + 1] !== undefined) return [...res, h[`EMA${p}`] > h[`EMA${periodArr[index + 1]}`]];
      else return res;
    }, []);
    return {
      ...h,
      ORDEREDEMA: !ordered.some(o => o === false),
      ...periodArr.reduce((res, p) => {
        return { ...res, [`PERCENTEMA${p}`]: ((h[`EMA${p}`] - h.close) * 100) / h.close };
      }, {})
    };
  });
};

exports.percentVwap = historic => {
  return historic.map(h => {
    if (h.VWAP === undefined) throw errors.missingRequiredProperty('VWAP');
    return {
      ...h,
      PERCENTVWAP: ((h.VWAP - h.close) * 100) / h.close
    };
  });
};
