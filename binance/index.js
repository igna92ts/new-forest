const request = require('request-promise'),
  WebSocket = require('ws');

const binanceKey = '8tc4fJ1ddM2VmnbFzTk3f7hXsrehnT8wP7u6EdIoVq7gyXWiL852TP1wnKp0qaGM';

// "k": {
//   "t": 123400000, // Kline start time
//   "T": 123460000, // Kline close time
//   "s": "BNBBTC",  // Symbol
//   "i": "1m",      // Interval
//   "f": 100,       // First trade ID
//   "L": 200,       // Last trade ID
//   "o": "0.0010",  // Open price
//   "c": "0.0020",  // Close price
//   "h": "0.0025",  // High price
//   "l": "0.0015",  // Low price
//   "v": "1000",    // Base asset volume
//   "n": 100,       // Number of trades
//   "x": false,     // Is this kline closed?
//   "q": "1.0000",  // Quote asset volume
//   "V": "500",     // Taker buy base asset volume
//   "Q": "0.500",   // Taker buy quote asset volume
//   "B": "123456"   // Ignore

const K_LINE_INTERVAL = '5m'; // MINUTES
const getKLineHistory = (symbol, limit = 100, endTime) => {
  return request
    .get({
      url: `https://api.binance.com/api/v1/klines?symbol=${symbol}&interval=${K_LINE_INTERVAL}&limit=${limit}${
        endTime ? `&endTime=${endTime}` : ''
      }`,
      headers: {
        'X-MBX-APIKEY': binanceKey
      },
      json: true
    })
    .then(kLineData =>
      kLineData.map(k => ({
        id: k[0],
        highPrice: parseFloat(k[2]),
        lowPrice: parseFloat(k[3]),
        price: parseFloat(k[4]),
        closeTime: k[6],
        volume: parseFloat(k[5]),
        openPrice: parseFloat(k[1])
      }))
    )
    .catch(console.log);
};

const fetchKLines = async (symbol, count, accumulator = [], endTime) => {
  const history = await getKLineHistory(symbol, 1000, endTime);
  accumulator = [...history, ...accumulator];
  if (accumulator.length < count) {
    const [firstLine] = history;
    return fetchKLines(symbol, count, accumulator, firstLine.id - 1);
  } else {
    return accumulator;
  }
};

module.exports = { getKLineHistory, fetchKLines };
