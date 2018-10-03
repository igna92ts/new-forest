const http = require('http'),
  socketio = require('socket.io'),
  plotly = require('plotly')('igna92ts', 'RN0DdzqHUxNglJiMPRgr'),
  fs = require('fs');

exports.setGraphingServer = () => {
  return new Promise((resolve, reject) => {
    const handler = (req, res) => {
      fs.readFile(`${__dirname}/index.html`, (err, data) => {
        if (err) {
          res.writeHead(500);
          return res.end('Error loading index.html');
        }
        res.writeHead(200);
        return res.end(data);
      });
    };
    const app = http.createServer(handler);
    app.listen(8080);
    const io = socketio(app);

    return resolve(tick => {
      io.emit('data', tick);
    });
  });
};

exports.graphToImg = (kLineArr, fileName = 'plot') => {
  const dates = kLineArr.map(k => new Date(k.id));
  const traces = [
    {
      x: dates,
      y: kLineArr.map(k => k.EMA8),
      line: { color: '#0000FF' },
      mode: 'lines',
      name: 'EMA8'
    },
    {
      x: dates,
      y: kLineArr.map(k => k.EMA13),
      line: { color: '#00FF00' },
      mode: 'lines',
      name: 'EMA13'
    },
    {
      x: dates,
      y: kLineArr.map(k => k.EMA21),
      line: { color: '#FFFF00' },
      mode: 'lines',
      name: 'EMA21'
    },
    {
      x: dates,
      y: kLineArr.map(k => k.EMA55),
      line: { color: '#FF0000' },
      mode: 'lines',
      name: 'EMA55'
      // xaxis: 'x2',
      // yaxis: 'y2'
    },
    {
      x: kLineArr.filter(k => k.action && k.action === 'BUY').map(k => new Date(k.id)),
      y: kLineArr.filter(k => k.action && k.action === 'BUY').map(k => k.close),
      mode: 'markers',
      name: 'BUY',
      marker: { color: '#FF0000' }
    },
    {
      x: kLineArr.filter(k => k.action && k.action === 'SELL').map(k => new Date(k.id)),
      y: kLineArr.filter(k => k.action && k.action === 'SELL').map(k => k.close),
      mode: 'markers',
      name: 'SELL',
      marker: { color: '#000000' }
    },
    // {
    //   x: kLineArr.filter(k => k.action && k.action === 'NOTHING').map(k => new Date(k.id)),
    //   y: kLineArr.filter(k => k.action && k.action === 'NOTHING').map(k => k.price),
    //   mode: 'markers',
    //   name: 'NOTHING',
    //   marker: { color: '#000000' }
    // },
    // {
    //   x: dates,
    //   y: kLineArr.map(k => k.STOCHRSI.percentK),
    //   mode: 'lines',
    //   name: 'K',
    //   line: { color: '#0000FF' },
    //   xaxis: 'x2',
    //   yaxis: 'y2'
    // },
    // {
    //   x: dates,
    //   y: kLineArr.map(k => k.STOCHRSI.percentD),
    //   mode: 'lines',
    //   name: 'D',
    //   line: { color: '#00FF00' },
    //   xaxis: 'x2',
    //   yaxis: 'y2'
    // },
    {
      x: dates,
      y: kLineArr.map(k => k.VOLUMEOSCILLATOR),
      mode: 'lines',
      name: 'VOLUMEOSCILLATOR',
      line: { color: '#000000' },
      xaxis: 'x2',
      yaxis: 'y2'
    },
    {
      x: dates,
      y: kLineArr.map(k => k.RSI14),
      mode: 'lines',
      name: 'RSI14',
      line: { color: '#00FF00' },
      xaxis: 'x2',
      yaxis: 'y2'
    },
    {
      x: dates,
      y: kLineArr.map(k => k.ADX14),
      mode: 'lines',
      name: 'ADX14',
      line: { color: '#FF0000' },
      xaxis: 'x3',
      yaxis: 'y3'
    }
    // {
    //   x: dates,
    //   y: kLineArr.map(k => k.MFI14),
    //   mode: 'lines',
    //   name: 'MFI14',
    //   line: { color: '#00FF00' },
    //   xaxis: 'x3',
    //   yaxis: 'y3'
    // }
  ];
  const layout = {
    yaxis: { domain: [0, 0.266] },
    legend: { traceorder: 'reversed' },
    xaxis3: { anchor: 'y3' },
    xaxis2: { anchor: 'y2' },
    yaxis2: { domain: [0.366, 0.633] },
    yaxis3: { domain: [0.733, 1] }
  };
  const figure = { data: traces, layout };
  const imgOptions = {
    format: 'png',
    width: 3000,
    height: 2000
  };
  plotly.getImage(figure, imgOptions, (error, imageStream) => {
    if (error) console.log(error);
    const fileStream = fs.createWriteStream(`${fileName}.png`);
    imageStream.pipe(fileStream);
  });
};
