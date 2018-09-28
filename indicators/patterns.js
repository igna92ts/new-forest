const patterns = require('technicalindicators');

const getPeriodInput = (index, historic, period) => {
  const nDayInput = historic.slice(index + 1 - period, index + 1); // +1 to include current
  if (nDayInput.length < period) return null;
  const close = nDayInput.map(t => t.price);
  const open = nDayInput.map(t => t.openPrice);
  const high = nDayInput.map(t => t.highPrice);
  const low = nDayInput.map(t => t.lowPrice);
  return { close, open, high, low };
};

const functions = {
  ABANDONEDBABY: (historic, index) => {
    const threeDayInput = getPeriodInput(index, historic, 3);
    if (!threeDayInput) return false;
    return patterns.abandonedbaby(threeDayInput);
  },
  DARKCLOUDCOVER: (historic, index) => {
    const twoDayInput = getPeriodInput(index, historic, 2);
    if (!twoDayInput) return false;
    return patterns.darkcloudcover(twoDayInput);
  },
  DOWNSIDETSUKIGAP: (historic, index) => {
    const threeDayInput = getPeriodInput(index, historic, 3);
    if (!threeDayInput) return false;
    return patterns.downsidetasukigap(threeDayInput);
  },
  BULLISHHARAMI: (historic, index) => {
    const twoDayInput = getPeriodInput(index, historic, 2);
    if (!twoDayInput) return false;
    return patterns.bullishharami(twoDayInput);
  },
  BEARISHHARAMI: (historic, index) => {
    const twoDayInput = getPeriodInput(index, historic, 2);
    if (!twoDayInput) return false;
    return patterns.bearishharami(twoDayInput);
  },
  BULLISHHARAMICROSS: (historic, index) => {
    const twoDayInput = getPeriodInput(index, historic, 2);
    if (!twoDayInput) return false;
    return patterns.bullishharamicross(twoDayInput);
  },
  BEARISHHARAMICROSS: (historic, index) => {
    const twoDayInput = getPeriodInput(index, historic, 2);
    if (!twoDayInput) return false;
    return patterns.bearishharamicross(twoDayInput);
  },
  EVENINGDOJISTAR: (historic, index) => {
    const threeDayInput = getPeriodInput(index, historic, 3);
    if (!threeDayInput) return false;
    return patterns.eveningdojistar(threeDayInput);
  },
  EVENINGSTAR: (historic, index) => {
    const threeDayInput = getPeriodInput(index, historic, 3);
    if (!threeDayInput) return false;
    return patterns.eveningstar(threeDayInput);
  },
  PIERCINGLINE: (historic, index) => {
    const twoDayInput = getPeriodInput(index, historic, 2);
    if (!twoDayInput) return false;
    return patterns.piercingline(twoDayInput);
  },
  MORNINGDOJISTAR: (historic, index) => {
    const threeDayInput = getPeriodInput(index, historic, 3);
    if (!threeDayInput) return false;
    return patterns.morningdojistar(threeDayInput);
  },
  MORNINGSTAR: (historic, index) => {
    const threeDayInput = getPeriodInput(index, historic, 3);
    if (!threeDayInput) return false;
    return patterns.morningstar(threeDayInput);
  },
  THREEBLACKCROWS: (historic, index) => {
    const threeDayInput = getPeriodInput(index, historic, 3);
    if (!threeDayInput) return false;
    return patterns.threeblackcrows(threeDayInput);
  },
  THREEWHITESOLDIERS: (historic, index) => {
    const threeDayInput = getPeriodInput(index, historic, 3);
    if (!threeDayInput) return false;
    return patterns.threewhitesoldiers(threeDayInput);
  },
  BEARISHENGULFING: (historic, index) => {
    const twoDayInput = getPeriodInput(index, historic, 2);
    if (!twoDayInput) return false;
    return patterns.bearishengulfingpattern(twoDayInput);
  },
  BULLISHENGULFING: (historic, index) => {
    const twoDayInput = getPeriodInput(index, historic, 2);
    if (!twoDayInput) return false;
    return patterns.bullishengulfingpattern(twoDayInput);
  }
  // BULLISHHAMMER: (historic, index) => {
  //   const h = historic[index];
  //   return patterns.bullishhammer({
  //     close: h.price,
  //     high: h.highPrice,
  //     low: h.lowPrice,
  //     open: h.openPrice
  //   });
  // },
  // BEARISHHAMMER: (historic, index) => {
  //   const h = historic[index];
  //   return patterns.bearishhammer({
  //     close: h.price,
  //     high: h.highPrice,
  //     low: h.lowPrice,
  //     open: h.openPrice
  //   });
  // },
  // BULLISHINVERTEDHAMMER: (historic, index) => {
  //   const h = historic[index];
  //   return patterns.bullishinvertedhammer({
  //     close: h.price,
  //     high: h.highPrice,
  //     low: h.lowPrice,
  //     open: h.openPrice
  //   });
  // },
  // BEARISHINVERTEDHAMMER: (historic, index) => {
  //   const h = historic[index];
  //   return patterns.bearishinvertedhammer({
  //     close: h.price,
  //     high: h.highPrice,
  //     low: h.lowPrice,
  //     open: h.openPrice
  //   });
  // },
  // HANGINGMAN: (historic, index) => {
  //   const fiveDayInput = getPeriodInput(index, historic, 5);
  //   if (!fiveDayInput) return false;
  //   return patterns.hangingman(fiveDayInput);
  // },
  // SHOOTINGSTAR: (historic, index) => {
  //   const fiveDayInput = getPeriodInput(index, historic, 5);
  //   if (!fiveDayInput) return false;
  //   return patterns.shootingstar(fiveDayInput);
  // },
  // TWEEZERTOP: (historic, index) => {
  //   const fiveDayInput = getPeriodInput(index, historic, 5);
  //   if (!fiveDayInput) return false;
  //   return patterns.tweezertop(fiveDayInput);
  // },
  // TWEEZERBOTTOM: (historic, index) => {
  //   const fiveDayInput = getPeriodInput(index, historic, 5);
  //   if (!fiveDayInput) return false;
  //   return patterns.tweezerbottom(fiveDayInput);
  // }
};

exports.detectPatterns = historic => {
  return historic.map((h, index) => {
    console.log(index);
    return {
      ...h,
      ...Object.keys(functions).reduce((res, key) => {
        return { ...res, [key]: functions[key](historic, index) };
      }, {})
    };
  });
};
