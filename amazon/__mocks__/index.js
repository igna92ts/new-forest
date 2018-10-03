module.exports = {
  uploadData: jest.fn(() => Promise.resolve()),
  downloadTrees: jest.fn(() => {
    return [
      { fold: 0, number: 0, tree: newValue => ({ NOTHING: 1 }) },
      { fold: 0, number: 1, tree: newValue => ({ BUY: 0.5, NOTHING: 0.5 }) },
      { fold: 1, number: 0, tree: newValue => ({ NOTHING: 1 }) },
      { fold: 1, number: 1, tree: newValue => ({ BUY: 0.5, NOTHING: 0.5 }) }
    ];
  }),
  getData: jest.fn(() => {
    return [
      [
        { action: 'BUY', close: 1, EMA8: 1, EMA55: 2 },
        { action: 'BUY', close: 1, EMA8: 1, EMA55: 2 },
        { action: 'NOTHING', close: 1, EMA8: 2, EMA55: 1 },
        { action: 'NOTHING', close: 1, EMA8: 2, EMA55: 1 }
      ],
      [
        { action: 'BUY', close: 1, EMA8: 1, EMA55: 2 },
        { action: 'BUY', close: 1, EMA8: 1, EMA55: 2 },
        { action: 'NOTHING', close: 1, EMA8: 2, EMA55: 1 },
        { action: 'NOTHING', close: 1, EMA8: 2, EMA55: 1 }
      ]
    ];
  })
};
