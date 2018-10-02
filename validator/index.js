const rndForest = require('../forest'),
  { graphToImg } = require('../chart'),
  errors = require('../errors'),
  aws = require('../amazon');

const chunkArray = (myArray, folds) => {
  if (folds > myArray.length) throw errors.defaultError('folds cant be bigger that arr length');
  const chunkSize = myArray.length / folds;
  const arrayLength = myArray.length;
  const tempArray = [];
  for (let index = 0; index < arrayLength; index += chunkSize) {
    const myChunk = myArray.slice(index, index + chunkSize);
    // Do something if you want with the group
    tempArray.push(myChunk);
  }
  return tempArray;
};

const mergeWithout = (index, chunks) => {
  return chunks.reduce((res, chunk, i) => {
    if (i !== index) {
      return [...res, ...chunk];
    } else return res;
  }, []);
};

const chain = promises => {
  if (promises.length === 0) return 1;
  return promises[0]().then(() => chain(promises.slice(1)));
};

const groupBy = (xs, key) => {
  return xs.reduce((rv, x) => {
    if (x[key] === undefined) throw errors.defaultError('key not present');
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

const operate = (symbol, action, currentPrice, money) => {
  if (money[symbol] === undefined) money[symbol] = 0;
  const fees = 0.001;
  const buyAmount = 0.1;
  if (action === 'BUY' && money.ETH > 0) {
    money[symbol] += (money.ETH * buyAmount) / (currentPrice + currentPrice * fees);
    money.ETH -= money.ETH * buyAmount;
  }
  if (action === 'SELL') {
    money.ETH += money[symbol] * (currentPrice - currentPrice * fees);
    money[symbol] = 0;
  }
  return money.ETH + money[symbol] * currentPrice;
};

const calculateReturns = data => {
  const money = {
    ETH: 5
  };
  let result = 0;
  let previousAction = 'NOTHING';
  data.forEach((d, index) => {
    if (!d.action) throw errors.missingRequiredProperty('action');
    if (!d.close) throw errors.missingRequiredProperty('close');
    if (d.EMA8 === undefined || d.EMA55 === undefined) throw errors.missingRequiredProperty('EMA');
    if (data[index - 1] && data[index - 1].EMA8 > data[index - 1].EMA55 && d.EMA8 < d.EMA55) {
      result = operate('XRPETH', 'SELL', d.close, money);
      previousAction = d.action;
    }
    if (previousAction !== d.action) {
      result = operate('XRPETH', d.action, d.close, money);
      previousAction = d.action;
    }
  });
  return result;
};

const classify = (forest, trade) => {
  const sum = forest.map(tree => tree(trade)).reduce(
    (res, e) => {
      const keys = Object.keys(e);
      keys.forEach(k => {
        res[k] += e[k];
      });
      return res;
    },
    { BUY: 0, NOTHING: 0 }
  );
  if ((sum.BUY || 0) > (sum.NOTHING || 0)) return 'BUY';
  else return 'NOTHING';
};

const validate = (folds = 10, features, data) => {
  if (!folds || !features || !features.length || !data.length || !data)
    throw errors.defaultError('Missing parameters');
  const chunked = chunkArray(data, folds);
  const promises = chunked.map((chunk, index) => {
    const trainingData = mergeWithout(index, chunked);
    return () => {
      return aws
        .uploadData(trainingData, `data-fold-${index}`)
        .then(() => rndForest.buildForest(features, index));
    };
  });
  return chain(promises).then(() => aws.uploadData(chunked, 'validation-chunks'));
};

const compareWithOutOfBag = (results, outOfFold) => {
  if (results.length !== outOfFold.length) throw errors.defaultError('both params must be of same length');
  const sum = outOfFold.reduce((res, c, i) => {
    if (!c.action) throw errors.missingRequiredProperty('action');
    if (c.action === results[i]) return res + 1;
    else return res;
  }, 0);
  return sum / outOfFold.length;
};

const validateFold = (outOfFold, forest, fold) => {
  const predictionResults = outOfFold.map(c => classify(forest, c));
  const compare = compareWithOutOfBag(predictionResults, outOfFold);
  graphToImg(outOfFold, `training-${fold}`);
  const expectedReturns = calculateReturns(outOfFold);
  const predictedData = outOfFold.map((c, index) => ({ ...c, action: predictionResults[index] }));
  graphToImg(predictedData, `predicted-${fold}`);
  const predictedReturns = calculateReturns(predictedData);
  return { compare, predictedReturns, expectedReturns };
};

const validateResult = async () => {
  const trees = await aws.downloadTrees();
  const groupedTrees = groupBy(trees, 'fold');
  const chunks = await aws.getData('validation-chunks');
  const comparisons = Object.keys(groupedTrees).map(fold =>
    validateFold(chunks[fold], groupedTrees[fold].map(t => t.tree), fold)
  );
  console.log(
    JSON.stringify(comparisons, 0, 2),
    JSON.stringify(
      {
        accuracy: comparisons.reduce((a, b) => a + b.compare, 0) / Object.keys(groupedTrees).length,
        predictedReturns: comparisons.reduce((a, b) => a + b.predictedReturns, 0) / comparisons.length,
        expectedReturns: comparisons.reduce((a, b) => a + b.expectedReturns, 0) / comparisons.length
      },
      0,
      2
    )
  );
};

module.exports = {
  validate,
  validateResult,
  chunkArray,
  mergeWithout,
  chain,
  groupBy,
  classify,
  compareWithOutOfBag,
  validateFold,
  calculateReturns
};
