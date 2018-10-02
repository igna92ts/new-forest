const { EMA, RSI, ADX, MFI, BB, STOCH, VWAP, VO, fill } = require('../indicators/indicators'),
  { functions, getPeriodInput } = require('../indicators/patterns'),
  {
    percentageMovement,
    percentageBollinger,
    percentEmaAndOrder,
    percentVwap
  } = require('../indicators/derived'),
  { combineIndicators, advancedFeatures } = require('../indicators'),
  testData = require('./test_data.json'),
  errors = require('../errors');

describe('INDICATORS', () => {
  describe('fill function', () => {
    test('it creates an array filling the difference between 2 arrays lengths with empty values on a given label', () => {
      const arr1 = [{}, {}];
      const arr2 = [1];
      const filledArr = fill(arr1, arr2, 'example');
      expect(filledArr.length).toBe(2);
      expect(filledArr[0].example).toBe(0);
      expect(filledArr[1].example).toBe(1);
    });
  });

  describe('Exponential Moving Average - EMA', () => {
    const period = 8;
    const data = [
      { close: 1 },
      { close: 3 },
      { close: 4 },
      { close: 5 },
      { close: 6 },
      { close: 7 },
      { close: 8 },
      { close: 9 },
      { close: 10 },
      { close: 11 }
    ];
    const ema = EMA(data, period);
    test(`ema object array elements should contain a property called EMA followed by the period ${period}`, () => {
      ema.forEach(e => {
        expect(e).toHaveProperty(`EMA${period}`);
        expect(e[`EMA${period}`]).not.toBeUndefined();
      });
    });

    test(`indexes before ${period} should have a 0 and ema length be the same as original data`, () => {
      expect(ema.length).toBe(data.length);
      ema.forEach((e, index) => {
        if (index < period - 1) expect(e[`EMA${period}`]).toBe(0);
        else expect(e[`EMA${period}`]).not.toBe(0);
      });
    });

    test('it should calculate exp moving average for a certain period', () => {
      expect(ema[period - 1][`EMA${period}`]).toBe(5.375);
    });

    test('it should throw and error if the objects in arr dont all contain the `close` propety', () => {
      const wrongData = [{ close: 1 }, {}];
      expect(() => EMA(wrongData, period)).toThrow(errors.missingRequiredProperty('close'));
    });

    test('it should throw an error if period is missing', () => {
      expect(() => EMA(data)).toThrow(errors.missingRequiredProperty('period'));
    });
  });

  describe('Relative Strength Index - RSI', () => {
    const data = [
      127.75,
      129.02,
      132.75,
      145.4,
      148.98,
      137.52,
      147.38,
      139.05,
      137.23,
      149.3,
      162.45,
      178.95,
      200.35,
      221.9,
      243.23,
      243.52,
      286.42,
      280.27,
      277.35,
      269.02,
      263.23,
      214.9
    ].map(p => ({ close: p }));
    const period = 14;
    const rsi = RSI(data, period);

    test(`rsi object array elements should contain a property called RSI followed by the period ${period}`, () => {
      rsi.forEach(e => {
        expect(e).toHaveProperty(`RSI${period}`);
        expect(e[`RSI${period}`]).not.toBeUndefined();
      });
    });

    test(`indexes before ${period} should have a 0 and rsi length be the same as original data`, () => {
      expect(rsi.length).toBe(data.length);
      rsi.forEach((e, index) => {
        if (index < period) expect(e[`RSI${period}`]).toBe(0);
        else expect(e[`RSI${period}`]).not.toBe(0);
      });
    });

    test('it should calculate rel strength index for a certain period', () => {
      expect(rsi[period][`RSI${period}`]).toBe(86.38);
    });

    test('it should throw and error if the objects in arr dont all contain the `close` propety', () => {
      const wrongData = [{ close: 1 }, {}];
      expect(() => RSI(wrongData, period)).toThrow(errors.missingRequiredProperty('close'));
    });

    test('it should throw an error if period is missing', () => {
      expect(() => RSI(data)).toThrow(errors.missingRequiredProperty('period'));
    });
  });

  describe('Average Directional Index - ADX', () => {
    /* eslint-disable */
    const input = {
      close: [29.87,30.24,30.10,28.90,28.92,28.48,28.56,27.56,28.47,28.28,27.49,27.23,26.35,26.33,27.03,26.22,26.01,25.46,27.03,27.45,28.36,28.43,27.95,29.01,29.38,29.36,28.91,30.61,30.05,30.19,31.12,30.54,29.78,30.04,30.49,31.47,32.05,31.97,31.13,31.66,32.64,32.59,32.19,32.10,32.93,33.00,31.94],
      high: [30.20,30.28,30.45,29.35,29.35,29.29,28.83,28.73,28.67,28.85,28.64,27.68,27.21,26.87,27.41,26.94,26.52,26.52,27.09,27.69,28.45,28.53,28.67,29.01,29.87,29.80,29.75,30.65,30.60,30.76,31.17,30.89,30.04,30.66,30.60,31.97,32.10,32.03,31.63,31.85,32.71,32.76,32.58,32.13,33.12,33.19,32.52],
      low: [29.41,29.32,29.96,28.74,28.56,28.41,28.08,27.43,27.66,27.83,27.40,27.09,26.18,26.13,26.63,26.13,25.43,25.35,25.88,26.96,27.14,28.01,27.88,27.99,28.76,29.14,28.71,28.93,30.03,29.39,30.14,30.43,29.35,29.99,29.52,30.94,31.54,31.36,30.92,31.20,32.13,32.23,31.97,31.56,32.21,32.63,31.76],
    };
    /* eslint-enable */
    const data = input.close.map((e, index) => {
      return { close: input.close[index], high: input.high[index], low: input.low[index] };
    });
    const period = 14;
    const adx = ADX(data, period);

    test(`adx object array elements should contain properties called ADX, PDI and MDI followed by the period ${period}`, () => {
      adx.forEach(e => {
        expect(e).toHaveProperty(`ADX${period}`);
        expect(e).toHaveProperty(`MDI${period}`);
        expect(e).toHaveProperty(`PDI${period}`);
        expect(e[`ADX${period}`]).not.toBeUndefined();
        expect(e[`MDI${period}`]).not.toBeUndefined();
        expect(e[`PDI${period}`]).not.toBeUndefined();
      });
    });

    test(`indexes before ${period} should have a 0 and adx length be the same as original data`, () => {
      expect(adx.length).toBe(data.length);
      adx.forEach((e, index) => {
        // it takes twice the period to get a result and its an index so the -1
        if (index < period * 2 - 1) {
          expect(e[`ADX${period}`]).toBe(0);
          expect(e[`PDI${period}`]).toBe(0);
          expect(e[`MDI${period}`]).toBe(0);
        } else {
          expect(e[`ADX${period}`]).not.toBe(0);
          expect(e[`PDI${period}`]).not.toBe(0);
          expect(e[`MDI${period}`]).not.toBe(0);
        }
      });
    });

    test('it should calculate adx, mdi and pdi for a certain period', () => {
      expect(adx[period * 2 - 1][`ADX${period}`]).toBe(33.70788849599704);
      expect(adx[period * 2 - 1][`MDI${period}`]).toBe(18.116192555042613);
      expect(adx[period * 2 - 1][`PDI${period}`]).toBe(23.718186893672044);
    });

    test('it should throw and error if the objects in arr dont all contain the `close` propety', () => {
      const wrongData = [{ close: 1, high: 1, low: 1 }, { low: 1, high: 1 }];
      expect(() => ADX(wrongData, period)).toThrow(errors.missingRequiredProperty('close'));
    });

    test('it should throw and error if the objects in arr dont all contain the `high` propety', () => {
      const wrongData = [{ close: 1, high: 1, low: 1 }, { low: 1, close: 1 }];
      expect(() => ADX(wrongData, period)).toThrow(errors.missingRequiredProperty('high'));
    });

    test('it should throw and error if the objects in arr dont all contain the `low` propety', () => {
      const wrongData = [{ close: 1, high: 1, low: 1 }, { close: 1, high: 1 }];
      expect(() => ADX(wrongData, period)).toThrow(errors.missingRequiredProperty('low'));
    });

    test('it should throw an error if period is missing', () => {
      expect(() => ADX(data)).toThrow(errors.missingRequiredProperty('period'));
    });
  });

  describe('Money Flow Index - MFI', () => {
    /* eslint-disable */
    const input = {
      high: [24.61,24.69,24.99,25.36,25.19,25.17,25.00,24.97,25.08,25.26,25.21,25.37,25.61,25.58,25.46,25.33,25.09,25.03,24.91,24.89,25.13],
      low: [24.64,24.69,24.99,25.36,25.19,25.17,25.01,24.96,25.08,25.25,25.21,25.37,25.61,25.58,25.46,25.33,25.09,25.03,24.91,24.89,25.13],
      close: [24.63,24.69,24.99,25.36,25.19,25.17,25.02,24.95,25.08,25.24,25.21,25.37,25.61,25.58,25.46,25.33,25.09,25.03,24.91,24.89,25.13],
      volume: [18730,12272,24691,18358,22964,15919,16067,16568,16019,9774,22573,12987,10907,5799,7395,5818,7165,5673,5625,5023,7457]
    };
    /* eslint-enable */
    const data = input.close.map((e, index) => {
      return {
        close: input.close[index],
        high: input.high[index],
        low: input.low[index],
        volume: input.volume[index]
      };
    });
    const period = 14;
    const mfi = MFI(data, period);

    test(`mfi object array elements should contain property called MFI followed by the period ${period}`, () => {
      mfi.forEach(e => {
        expect(e).toHaveProperty(`MFI${period}`);
        expect(e[`MFI${period}`]).not.toBeUndefined();
      });
    });

    test(`indexes before ${period} should have a 0 and mfi length be the same as original data`, () => {
      expect(mfi.length).toBe(data.length);
      mfi.forEach((e, index) => {
        // it takes twice the period to get a result and its an index so the -1
        if (index <= period) expect(e[`MFI${period}`]).toBe(0);
        else expect(e[`MFI${period}`]).not.toBe(0);
      });
    });

    test('it should calculate mfi for a certain period', () => {
      expect(mfi[period + 1][`MFI${period}`]).toBe(45.11);
    });

    test('it should throw and error if the objects in arr dont all contain the `close` propety', () => {
      const wrongData = [{ close: 1, high: 1, low: 1, volume: 1 }, { low: 1, high: 1, volume: 1 }];
      expect(() => MFI(wrongData, period)).toThrow(errors.missingRequiredProperty('close'));
    });

    test('it should throw and error if the objects in arr dont all contain the `high` propety', () => {
      const wrongData = [{ close: 1, high: 1, low: 1, volume: 1 }, { low: 1, close: 1, volume: 1 }];
      expect(() => MFI(wrongData, period)).toThrow(errors.missingRequiredProperty('high'));
    });

    test('it should throw and error if the objects in arr dont all contain the `low` propety', () => {
      const wrongData = [{ close: 1, high: 1, low: 1, volume: 1 }, { close: 1, high: 1, volume: 1 }];
      expect(() => MFI(wrongData, period)).toThrow(errors.missingRequiredProperty('low'));
    });

    test('it should throw and error if the objects in arr dont all contain the `volume` propety', () => {
      const wrongData = [{ close: 1, high: 1, low: 1, volume: 1 }, { low: 1, high: 1, close: 1 }];
      expect(() => MFI(wrongData, period)).toThrow(errors.missingRequiredProperty('volume'));
    });

    test('it should throw an error if period is missing', () => {
      expect(() => MFI(data)).toThrow(errors.missingRequiredProperty('period'));
    });
  });

  describe('Bollinger Bands - BB', () => {
    const data = [
      127.75,
      129.02,
      132.75,
      145.4,
      148.98,
      137.52,
      147.38,
      139.05,
      137.23,
      149.3,
      162.45,
      178.95,
      200.35,
      221.9,
      243.23,
      243.52,
      286.42,
      280.27
    ].map(e => ({ close: e }));
    const period = 10;
    const bb = BB(data, period);

    test(`bb object array elements should contain property called LOWERBB, MIDDLEBB, and PERCENTB followed by the period ${period}`, () => {
      bb.forEach(e => {
        expect(e).toHaveProperty(`LOWERBB${period}`);
        expect(e).toHaveProperty(`UPPERBB${period}`);
        expect(e).toHaveProperty(`MIDDLEBB${period}`);
        expect(e).toHaveProperty(`PERCENTB${period}`);
        expect(e[`LOWERBB${period}`]).not.toBeUndefined();
        expect(e[`UPPERBB${period}`]).not.toBeUndefined();
        expect(e[`MIDDLEBB${period}`]).not.toBeUndefined();
        expect(e[`PERCENTB${period}`]).not.toBeUndefined();
      });
    });

    test(`indexes before ${period} should have a 0 and bb length be the same as original data`, () => {
      expect(bb.length).toBe(data.length);
      bb.forEach((e, index) => {
        // its an index so the -1
        if (index < period - 1) {
          expect(e[`LOWERBB${period}`]).toBe(0);
          expect(e[`MIDDLEBB${period}`]).toBe(0);
          expect(e[`UPPERBB${period}`]).toBe(0);
          expect(e[`PERCENTB${period}`]).toBe(0);
        } else {
          expect(e[`LOWERBB${period}`]).not.toBe(0);
          expect(e[`MIDDLEBB${period}`]).not.toBe(0);
          expect(e[`PERCENTB${period}`]).not.toBe(0);
        }
      });
    });

    test('it should calculate bb for a certain period', () => {
      expect(bb[period - 1][`LOWERBB${period}`]).toBe(124.13430685095913);
      expect(bb[period - 1][`MIDDLEBB${period}`]).toBe(139.438);
      expect(bb[period - 1][`UPPERBB${period}`]).toBe(154.74169314904083);
      expect(bb[period - 1][`PERCENTB${period}`]).toBe(0.8222098059584437);
    });

    test('it should throw and error if the objects in arr dont all contain the `close` propety', () => {
      const wrongData = [{ close: 1 }, {}];
      expect(() => BB(wrongData, period)).toThrow(errors.missingRequiredProperty('close'));
    });

    test('it should throw an error if period is missing', () => {
      expect(() => BB(data)).toThrow(errors.missingRequiredProperty('period'));
    });
  });

  describe('Stochastic Oscillator - STOCH', () => {
    /* eslint-disable */
    const input = {
      high: [127.009,127.616,126.591,127.347,128.173,128.432,127.367,126.422,126.900,126.850,125.646,125.716,127.158,127.715,127.686,128.223,128.273,128.093,128.273,127.735,128.770,129.287,130.063,129.118,129.287,128.472,128.093,128.651,129.138,128.641],
      low: [125.357,126.163,124.930,126.094,126.820,126.482,126.034,124.830,126.392,125.716,124.562,124.572,125.069,126.860,126.631,126.800,126.711,126.800,126.134,125.925,126.989,127.815,128.472,128.064,127.606,127.596,126.999,126.900,127.487,127.397],
      close: [125.357,126.163,124.930,126.094,126.820,126.482,126.034,124.830,126.392,125.716,124.562,124.572,125.069,127.288,127.178,128.014,127.109,127.725,127.059,127.327,128.710,127.875,128.581,128.601,127.934,128.113,127.596,127.596,128.690,128.273]
    };
    /* eslint-enable */
    const data = input.close.map((e, index) => {
      return {
        close: input.close[index],
        high: input.high[index],
        low: input.low[index]
      };
    });
    const period = 14;
    const stoch = STOCH(data, period);

    test(`stoch object array elements should contain property called STOCHK and STOCHD followed by the period ${period}`, () => {
      stoch.forEach(e => {
        expect(e).toHaveProperty(`STOCHD${period}`);
        expect(e).toHaveProperty(`STOCHK${period}`);
        expect(e[`STOCHD${period}`]).not.toBeUndefined();
        expect(e[`STOCHK${period}`]).not.toBeUndefined();
      });
    });

    test(`indexes before ${period} should have a 0 and stoch length be the same as original data`, () => {
      expect(stoch.length).toBe(data.length);
      stoch.forEach((e, index) => {
        // its an index so the -1
        if (index < period - 1) {
          expect(e[`STOCHD${period}`]).toBe(0);
          expect(e[`STOCHK${period}`]).toBe(0);
        } else {
          if (index < period + 1) expect(e[`STOCHD${period}`]).toBe(0);
          else expect(e[`STOCHD${period}`]).not.toBe(0);
          expect(e[`STOCHK${period}`]).not.toBe(0);
        }
      });
    });

    test('it should calculate stoch k and d for a certain period', () => {
      expect(stoch[period + 1][`STOCHK${period}`]).toBe(89.19896640826927);
      expect(stoch[period + 1][`STOCHD${period}`]).toBe(75.74504737295463);
    });

    test('it should throw and error if the objects in arr dont all contain the `close` propety', () => {
      const wrongData = [{ close: 1, high: 1, low: 1, volume: 1 }, { low: 1, high: 1, volume: 1 }];
      expect(() => STOCH(wrongData, period)).toThrow(errors.missingRequiredProperty('close'));
    });

    test('it should throw and error if the objects in arr dont all contain the `high` propety', () => {
      const wrongData = [{ close: 1, high: 1, low: 1, volume: 1 }, { low: 1, close: 1, volume: 1 }];
      expect(() => STOCH(wrongData, period)).toThrow(errors.missingRequiredProperty('high'));
    });

    test('it should throw and error if the objects in arr dont all contain the `low` propety', () => {
      const wrongData = [{ close: 1, high: 1, low: 1, volume: 1 }, { close: 1, high: 1, volume: 1 }];
      expect(() => STOCH(wrongData, period)).toThrow(errors.missingRequiredProperty('low'));
    });

    test('it should throw an error if period is missing', () => {
      expect(() => STOCH(data)).toThrow(errors.missingRequiredProperty('period'));
    });
  });

  describe('Volume Weighted Average Price', () => {
    /* eslint-disable */
    const input = {
      high : [
        127.36,127.31,127.21,127.15,127.08,127.19,127.09,127.08,127.18,127.16,127.31,127.35,127.34,127.29,127.36
      ],
      low : [
        126.99,127.10,127.11,126.93,126.98,126.99,126.82,126.95,127.05,127.05,127.08,127.20,127.25,127.17,127.25
      ],
      close : [
        127.28,127.11,127.15,127.04,126.98,127.07,126.93,127.05,127.11,127.15,127.30,127.28,127.28,127.29,127.25
      ],
      volume : [
        89329,16137,23945,20679,27252,20915,17372,17600,13896,6700,13848,9925,5540,10803,19400
      ]
    };
    /* eslint-enable */
    const data = input.close.map((e, index) => {
      return {
        close: input.close[index],
        high: input.high[index],
        low: input.low[index],
        volume: input.volume[index]
      };
    });
    const vwap = VWAP(data);

    test(`vwap object array elements should contain property called VWAP`, () => {
      vwap.forEach(e => {
        expect(e).toHaveProperty('VWAP');
        expect(e.VWAP).not.toBeUndefined();
      });
    });

    test('vwap length should be the same as original data', () => {
      expect(vwap.length).toBe(data.length);
      vwap.forEach((e, index) => {
        expect(e.VWAP).not.toBe(0);
      });
    });

    test('it should calculate vwap for a certain period', () => {
      expect(vwap[0].VWAP).toBe(127.21);
    });

    test('it should throw and error if the objects in arr dont all contain the `close` propety', () => {
      const wrongData = [{ close: 1, high: 1, low: 1, volume: 1 }, { low: 1, high: 1, volume: 1 }];
      expect(() => VWAP(wrongData)).toThrow(errors.missingRequiredProperty('close'));
    });

    test('it should throw and error if the objects in arr dont all contain the `high` propety', () => {
      const wrongData = [{ close: 1, high: 1, low: 1, volume: 1 }, { low: 1, close: 1, volume: 1 }];
      expect(() => VWAP(wrongData)).toThrow(errors.missingRequiredProperty('high'));
    });

    test('it should throw and error if the objects in arr dont all contain the `low` propety', () => {
      const wrongData = [{ close: 1, high: 1, low: 1, volume: 1 }, { close: 1, high: 1, volume: 1 }];
      expect(() => VWAP(wrongData)).toThrow(errors.missingRequiredProperty('low'));
    });

    test('it should throw and error if the objects in arr dont all contain the `volume` propety', () => {
      const wrongData = [{ close: 1, high: 1, low: 1, volume: 1 }, { low: 1, high: 1, close: 1 }];
      expect(() => VWAP(wrongData)).toThrow(errors.missingRequiredProperty('volume'));
    });
  });

  describe('Volume Oscillator - VO', () => {
    const data = [
      89329,
      16137,
      23945,
      20679,
      27252,
      20915,
      17372,
      17600,
      13896,
      6700,
      13848,
      9925,
      5540,
      10803,
      19400
    ].map(e => ({ volume: e }));
    const vo = VO(data);
    const defaultPeriod = 10;
    test(`vo object array elements should contain property called VO`, () => {
      vo.forEach(e => {
        expect(e).toHaveProperty('VO');
        expect(e.VO).not.toBeUndefined();
      });
    });

    test('vo length should be the same as original data', () => {
      expect(vo.length).toBe(data.length);
      vo.forEach((e, index) => {
        if (index < defaultPeriod - 1) expect(e.VO).toBe(0);
        else expect(e.VO).not.toBe(0);
      });
    });

    test('it should calculate vo for a certain period', () => {
      expect(vo[9].VO).toBe(-38.17650360999343);
    });

    test('it should throw and error if the objects in arr dont all contain the `volume` propety', () => {
      const wrongData = [{ volume: 1 }, {}];
      expect(() => VO(wrongData)).toThrow(errors.missingRequiredProperty('volume'));
    });
  });
});

describe('PATTERNS', () => {
  describe('getPeriodInput', () => {
    const input = [
      { close: 28.1, high: 31.8, low: 27.5, open: 31.1 },
      { close: 26.18, high: 26.91, low: 25.4, open: 26.18 },
      { close: 30.62, high: 30.94, low: 27.03, open: 27.47 }
    ];
    const expectedResult = {
      open: [31.1, 26.18, 27.47],
      high: [31.8, 26.91, 30.94],
      close: [28.1, 26.18, 30.62],
      low: [27.5, 25.4, 27.03]
    };

    test('it should turn a kline array into pattern suitable input', () => {
      const data = getPeriodInput(2, input, 3);
      expect(data).toMatchObject(expectedResult);
      Object.keys(data).forEach(k => {
        data[k].forEach(e => expect(e).not.toBeUndefined());
      });
    });

    test('given a period it should return an object inluding the current indexed timeframe', () => {
      const data = getPeriodInput(2, input, 2);
      Object.keys(data).forEach(k => {
        expect(data[k].length).toBe(2);
        expect(data[k][data[k].length - 1]).toBe(input[2][k]);
      });
      const data2 = getPeriodInput(1, input, 2);
      Object.keys(data2).forEach(k => {
        expect(data2[k].length).toBe(2);
        expect(data2[k][data2[k].length - 1]).toBe(input[1][k]);
      });
    });

    test('if not enough data for the requested period is present it should return null instead', () => {
      const data = getPeriodInput(2, input, 4);
      expect(data).toBe(null);
    });
  });

  describe('ABANDONEDBABY', () => {
    const input = {
      open: [31.1, 26.18, 27.47],
      high: [31.8, 26.91, 30.94],
      close: [28.1, 26.18, 30.62],
      low: [27.5, 25.4, 27.03]
    };
    const data = input.close.map((e, index) => {
      return {
        close: input.close[index],
        high: input.high[index],
        low: input.low[index],
        open: input.open[index]
      };
    });

    test('it should return true if its presented with an appropriate pattern', () => {
      const pattern = functions.ABANDONEDBABY(data, 2);
      expect(pattern).toBe(true);
    });
  });
});

describe('DERIVED', () => {
  describe('percentageMovement - PERCENTCHANGE', () => {
    test('it should calculate percentage change between timeframes', () => {
      const input = [{ close: 10 }, { close: 20 }, { close: 10 }];
      const pc = percentageMovement(input);
      expect(pc[0].PERCENTCHANGE).toBe(0);
      expect(pc[1].PERCENTCHANGE).toBe(100);
      expect(pc[2].PERCENTCHANGE).toBe(-50);
    });

    test('it should throw an error if close is not present in the objects', () => {
      expect(() => percentageMovement([{}])).toThrow(errors.missingRequiredProperty('close'));
    });
  });

  describe('percentBollinger', () => {
    test('it should calculate bollinger bands in percentual relationship to close price', () => {
      const period = 21;
      const input = [
        { close: 10, [`LOWERBB${period}`]: 20, [`MIDDLEBB${period}`]: 20, [`UPPERBB${period}`]: 20 },
        { close: 10, [`LOWERBB${period}`]: 20, [`MIDDLEBB${period}`]: 20, [`UPPERBB${period}`]: 20 },
        { close: 10, [`LOWERBB${period}`]: 20, [`MIDDLEBB${period}`]: 20, [`UPPERBB${period}`]: 20 }
      ];
      const pb = percentageBollinger(input, 21);
      pb.forEach(e => {
        expect(e[`PERCENTLOWERBB${period}`]).toBe(100);
        expect(e[`PERCENTMIDDLEBB${period}`]).toBe(100);
        expect(e[`PERCENTUPPERBB${period}`]).toBe(100);
      });
    });

    test('it should throw an error if close is not present in the objects', () => {
      const period = 21;
      expect(() =>
        percentageBollinger(
          [{ [`LOWERBB${period}`]: 20, [`MIDDLEBB${period}`]: 20, [`UPPERBB${period}`]: 20 }],
          period
        )
      ).toThrow(errors.missingRequiredProperty('close'));
    });
    test('it should throw an error if LOWERBB + period is not present in the objects', () => {
      const period = 21;
      expect(() =>
        percentageBollinger([{ close: 10, [`MIDDLEBB${period}`]: 20, [`UPPERBB${period}`]: 20 }], period)
      ).toThrow(errors.missingRequiredProperty(`LOWERBB${period}`));
    });
    test('it should throw an error if MIDDLEBB + period is not present in the objects', () => {
      const period = 21;
      expect(() =>
        percentageBollinger([{ close: 10, [`LOWERBB${period}`]: 20, [`UPPERBB${period}`]: 20 }], period)
      ).toThrow(errors.missingRequiredProperty(`MIDDLEBB${period}`));
    });
    test('it should throw an error if UPPERBB + period is not present in the objects', () => {
      const period = 21;
      expect(() =>
        percentageBollinger([{ close: 10, [`MIDDLEBB${period}`]: 20, [`LOWERBB${period}`]: 20 }], period)
      ).toThrow(errors.missingRequiredProperty(`UPPERBB${period}`));
    });
  });

  describe('percentEmaAndOrder', () => {
    test('it should calculate EMA in percentual relationship to close price and check for order', () => {
      const periodArr = [8, 13, 21, 55];
      const input = periodArr.reduce(
        (res, p) => {
          return { ...res, [`EMA${p}`]: 20 };
        },
        { close: 10 }
      );
      const pe = percentEmaAndOrder([input], periodArr);
      periodArr.forEach(p => {
        expect(pe[0][`PERCENTEMA${p}`]).toBe(100);
        expect(pe[0][`PERCENTEMA${p}`]).toBe(100);
        expect(pe[0][`PERCENTEMA${p}`]).toBe(100);
        expect(pe[0][`PERCENTEMA${p}`]).toBe(100);
        expect(pe[0].ORDEREDEMA).toBe(false);
      });
    });

    test('ORDEREDEMA should return true if EMAs are in asc desc order', () => {
      const periodArr = [8, 13, 21, 55];
      const input = periodArr.reduce(
        (res, p, index) => {
          return { ...res, [`EMA${p}`]: 10 / (index + 1) };
        },
        { close: 10 }
      );
      const pe = percentEmaAndOrder([input], periodArr);
      expect(pe[0].ORDEREDEMA).toBe(true);
    });

    test('it should throw an error if periodArr is not in asc order', () => {
      const periodArr = [8, 13, 55, 21];
      const input = [];
      expect(() => percentEmaAndOrder([input], periodArr)).toThrow(
        errors.defaultError('Periods need to be in asc order')
      );
    });

    test('it should throw an error if periodArr is missing or empty', () => {
      const periodArr = [];
      const input = [];
      expect(() => percentEmaAndOrder([input], periodArr)).toThrow(
        errors.defaultError('No periods in array')
      );
    });

    test('it should throw an error if any EMA to derive is missing from original objects', () => {
      const periodArr = [8, 13, 21, 55];
      const input = periodArr.reduce(
        (res, p, index) => {
          if (index !== 0) return { ...res, [`EMA${p}`]: 10 / (index + 1) };
          else return res;
        },
        { close: 10 }
      );
      expect(() => percentEmaAndOrder([input], periodArr)).toThrow(
        errors.missingRequiredProperty(`EMA${periodArr[0]}`)
      );
    });
  });

  describe('percentVwap', () => {
    test('it should calculate VWAP in percentual relationship to close price', () => {
      const input = [{ close: 10, VWAP: 20 }];
      const pv = percentVwap(input);
      expect(pv[0]).toHaveProperty('PERCENTVWAP');
      expect(pv[0].PERCENTVWAP).toBe(100);
    });

    test('it should throw an error if VWAP property is missing from the original objects', () => {
      const input = [{ close: 10 }];
      expect(() => percentVwap(input)).toThrow(errors.missingRequiredProperty('VWAP'));
    });
  });
});

describe('INDEX', () => {
  describe('combineIndicators', () => {
    test('it should combina several object array in a single one', () => {
      const input1 = [{ example1: 0 }];
      const input2 = [{ example2: 0 }];
      const result = combineIndicators([input1, input2]);
      expect(result).toMatchObject([{ example1: 0, example2: 0 }]);
    });
    test('it should throw an error if indicator array are of different length', () => {
      const input1 = [{ example1: 0 }, { example1: 0 }];
      const input2 = [{ example2: 0 }];
      expect(() => combineIndicators([input1, input2])).toThrow(
        errors.defaultError('indicator lengths should be equal')
      );
    });
  });

  describe('advancedFeatures', () => {
    const { features, advancedHistoric } = advancedFeatures(testData);
    const expectedFeatures = [
      'EMA8',
      'EMA13',
      'EMA21',
      'EMA55',
      'RSI14',
      'ADX14',
      'MDI14',
      'PDI14',
      'MFI14',
      'LOWERBB21',
      'MIDDLEBB21',
      'UPPERBB21',
      'PERCENTB21',
      'STOCHK14',
      'STOCHD14',
      'VWAP',
      'VO',
      'PERCENTCHANGE',
      'PERCENTLOWERBB21',
      'PERCENTMIDDLEBB21',
      'PERCENTUPPERBB21',
      'ORDEREDEMA',
      'PERCENTEMA8',
      'PERCENTEMA13',
      'PERCENTEMA21',
      'PERCENTEMA55',
      'PERCENTVWAP',
      'ABANDONEDBABY',
      'DARKCLOUDCOVER',
      'DOWNSIDETSUKIGAP',
      'BULLISHHARAMI',
      'BEARISHHARAMI',
      'BULLISHHARAMICROSS',
      'BEARISHHARAMICROSS',
      'EVENINGDOJISTAR',
      'EVENINGSTAR',
      'PIERCINGLINE',
      'MORNINGDOJISTAR',
      'MORNINGSTAR',
      'THREEBLACKCROWS',
      'THREEWHITESOLDIERS',
      'BEARISHENGULFING',
      'BULLISHENGULFING'
    ];
    expect(features).toEqual(expectedFeatures);
  });
});
