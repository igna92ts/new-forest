const rndForest = require('../forest'),
  { graphToImg } = require('../chart'),
  aws = require('../amazon');

const chunkArray = (myArray, folds) => {
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
  data.forEach(d => {
    if (previousAction !== d.action) {
      result = operate('XRPETH', d.action, d.price, money);
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
    { BUY: 0, NOTHING: 0, SELL: 0 }
  );
  return Object.keys(sum).reduce((t, k) => {
    if (sum[k] === Math.max(...['BUY', 'NOTHING', 'SELL'].map(e => sum[e]))) return k;
    else return t;
  });
};

const validate = (folds = 10, features, data) => {
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

const validateResult = async () => {
  const trees = await aws.downloadTrees();
  const groupedTrees = groupBy(trees, 'fold');
  const chunks = await aws.getData('validation-chunks');

  const comparisons = Object.keys(groupedTrees).map(fold => {
    const forest = groupedTrees[fold].map(t => t.tree);
    const results = chunks[fold].map(c => classify(forest, c));
    const compare =
      chunks[fold].reduce((sum, c, i) => {
        if (c.action === results[i]) return sum + 1;
        else return sum;
      }, 0) / chunks[fold].length;
    graphToImg(chunks[fold], `training-${fold}`);
    const expectedReturns = calculateReturns(chunks[fold]);
    const predictedData = chunks[fold].map((c, index) => ({ ...c, action: results[index] }));
    graphToImg(predictedData, `predicted-${fold}`);
    const predictedReturns = calculateReturns(predictedData);
    return { compare, predictedReturns, expectedReturns };
  });
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

module.exports = { validate, validateResult };
