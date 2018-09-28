const { getKLineHistory, fetchKLines } = require('./binance'),
  { advancedFeatures } = require('./indicators'),
  { graphToImg } = require('./chart'),
  validator = require('./validator'),
  awsService = require('./amazon');

const tradingFee = 0.001 * 2; // buy and sell
const marginFee = 0.01 * 2; // buy and sell earnings
const fastSellingMargin = 0.001 * 2; // 0.5% to buy and sell fast
const accumulatedFees = price => price + (price * tradingFee + price * marginFee + price * fastSellingMargin);
const expectedAction = trades => {
  return trades.reduce((res, t, index) => {
    if (t.action) return [...res, t];
    const newTrades = trades.slice(index + 1); // trades after this one
    if (newTrades.length === 0) return [...res, { ...t, action: 'NOTHING' }];
    if (newTrades[0].price >= t.price) {
      let under55 = true;
      let accumulated = 0;
      let average = 0;
      for (let i = 0; i < newTrades.length; i++) {
        accumulated += newTrades[i].price;
        average = accumulated / (i + 1);
        // if (average < t.realPrice) return [...res, { ...t, action: 'NOTHING' }];
        if (newTrades[i].price > accumulatedFees(t.price)) {
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
    } else if (newTrades[0].price < t.price) {
      const ahead = 5;
      const nextTrades = newTrades.slice(0, ahead);
      if (nextTrades.length === ahead) {
        const avgNext = nextTrades.reduce((sum, e) => sum + e.price, 0) / ahead;
        if (avgNext < t.price && nextTrades.some(n => n.EMA8 < n.EMA55)) {
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

const run = async () => {
  const symbol = 'XRPETH';
  const historic = await fetchKLines(symbol, 10000);
  const { advancedHistoric, features } = advancedFeatures(historic);
  const trainingData = expectedAction(advancedHistoric);
  const constrainedFeatures = exclude(['EMA8', 'EMA13', 'EMA21', 'EMA55', 'VWAP', 'OBV', 'price'], features);
  await validator.validate(
    4,
    constrainedFeatures,
    trainingData.slice(200).map(e => ({ ...e, action: e.action === 'BUY' ? e.action : 'NOTHING' }))
  );
  graphToImg(trainingData.slice(100));
};

run();
