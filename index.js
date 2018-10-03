const { getKLineHistory, fetchKLines } = require('./binance'),
  { advancedFeatures } = require('./indicators'),
  { graphToImg } = require('./chart'),
  validator = require('./validator'),
  awsService = require('./amazon');

const run = async () => {
  try {
    const symbol = 'XRPETH';
    const historic = await fetchKLines(symbol, 5000);
    const { advancedHistoric, features } = advancedFeatures(historic);
    await validator.validate(
      4,
      features,
      advancedHistoric.slice(200).map(e => ({ ...e, action: e.action === 'BUY' ? e.action : 'NOTHING' }))
    );
    graphToImg(advancedHistoric, 'data');
  } catch (err) {
    console.log(err);
  }
};

run();
