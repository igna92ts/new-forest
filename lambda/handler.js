'use strict';

const Random = require('random-js'),
  tree = require('./tree'),
  aws = require('./amazon'),
  mt = Random.engines.mt19937().autoSeed();

const pickRandomElement = array => Random.pick(mt, array);
const getSample = (size, data) => {
  const buys = data.filter(d => d.action === 'BUY');
  const nothing = data.filter(d => d.action === 'NOTHING');
  const buySample = [];
  const nothingSample = [];
  const sample = [];
  // at least 20% each
  for (let i = 0; i < size / 5; i++) {
    buySample.push(pickRandomElement(buys));
    nothingSample.push(pickRandomElement(nothing));
    sample.push(pickRandomElement(data));
    sample.push(pickRandomElement(data));
    sample.push(pickRandomElement(data));
  }
  return [...sample, ...buySample, ...nothingSample];
};

const SAMPLE_SIZE = 500;
module.exports.createTree = (event, context, callback) => {
  if (!event.Records) return console.error('No Records in event');
  const params = JSON.parse(event.Records[0].body);
  if (!params.features || !params.fileName || params.number === undefined || params.fold === undefined) {
    console.error('no features or fileName or fold or number');
  }
  return aws
    .getData(params.fileName)
    .then(data => {
      const sample = getSample(SAMPLE_SIZE, data);
      const newTree = tree.buildTree(params.features, sample);
      return aws
        .uploadTree({ tree: newTree.str, number: params.number, fold: params.fold })
        .then(
          () =>
            params.fold === 'production' ? aws.sendMessage({ number: params.number }) : Promise.resolve()
        );
    })
    .catch(console.error);
};
