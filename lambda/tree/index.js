const Random = require('random-js'),
  mt = Random.engines.mt19937().autoSeed();

const pickRandomElement = array => Random.pick(mt, array);
const pickRandomElements = (count, array) => {
  const elements = [];
  for (let i = 0; i < count; i++) {
    elements.push(Random.pick(mt, array));
  }
  return elements;
};
const getRandomInt = (min, max) => Random.integer(min, max)(mt);

const calculateClassProportion = (classArray, data) => {
  return classArray.reduce((t, e) => {
    const filteredData = data.filter(d => d.action === e);
    return { ...t, [e]: filteredData.length / data.length };
  }, {});
};

const getUniqueValues = (key, data) => {
  return Array.from(new Set(data.map(e => e[key])));
};

const createQuestion = (key, value) => {
  if (typeof value === 'string' || typeof value === 'boolean')
    return { str: `e => e['${key}'] === ${value}`, fn: e => e[key] === value };
  else return { str: `e => e['${key}'] >= ${value}`, fn: e => e[key] >= value };
};

const partition = (data, question) => {
  return data.reduce(
    (acc, e) => {
      acc[question.fn(e) ? 0 : 1].push(e);
      return acc;
    },
    [[], []]
  );
};

const gini = data => {
  // const uniqueValues = getUniqueValues('action', data);
  const uniqueValues = ['NOTHING', 'SELL', 'BUY'].reduce(
    (res, e) => (data.some(d => d.action === e) ? [...res, e] : res),
    []
  );
  return uniqueValues.reduce((impurity, val) => {
    const prob = data.filter(e => e.action === val).length / data.length;
    return impurity - prob ** 2; // Math.pow(prob, 2);
  }, 1);
};

const informationGain = (left, right, currentUncertainty) => {
  const p = left.length / (left.length + right.length);
  return currentUncertainty - p * gini(left) - (1 - p) * gini(right);
};

const pickRandomFeatures = (count, array) => {
  let elements = [];
  while (elements.length !== count) {
    elements.push(Random.pick(mt, array));
    elements = Array.from(new Set(elements));
  }
  return elements;
};

const findBestSplit = (features, data) => {
  const currentUncertainty = gini(data);
  let matched = [];
  let rest = [];

  return features.reduce(
    (finalResult, key) => {
      const values = getUniqueValues(key, data);
      const newResult = values.reduce(
        (result, v) => {
          const question = createQuestion(key, v);
          [matched, rest] = partition(data, question);

          if (matched.length === 0 || rest.length === 0) return result;

          const gain = informationGain(matched, rest, currentUncertainty);

          if (gain >= result.gain) return { question, gain, matched, rest, questionFeature: key };
          return result;
        },
        { gain: 0, question: { fn: d => d, str: `d => d` }, questionFeature: null }
      );
      if (newResult.gain >= finalResult.gain) return newResult;
      else return finalResult;
    },
    { gain: 0, question: { fn: d => d, str: `d => d` }, matched, rest, questionFeature: null }
  );
};

const buildTree = (features, data, random = true) => {
  let rnd = [];
  const MIN_FEATURES = 2;
  if (random) rnd = pickRandomFeatures(getRandomInt(MIN_FEATURES, features.length), features);
  else rnd = features;
  const split = findBestSplit(rnd, data);
  if (split.gain === 0) {
    const proportion = calculateClassProportion(getUniqueValues('action', data), data);
    const proportionText = JSON.stringify(proportion);
    return {
      str: `(newData => (${proportionText}))`,
      fn: newData => proportion,
      questionFeatures: []
    };
  }
  const { matched, rest } = split;

  const matchedQuestion = buildTree(features, matched);
  const restQuestion = buildTree(features, rest);
  const { question } = split;
  return {
    str: `newValue => (${question.str})(newValue) ? (${matchedQuestion.str})(newValue) : (${
      restQuestion.str
    })(newValue)`,
    fn: newValue => (question.fn(newValue) ? matchedQuestion.fn(newValue) : restQuestion.fn(newValue)),
    questionFeatures: [
      ...matchedQuestion.questionFeatures,
      ...restQuestion.questionFeatures,
      { key: split.questionFeature, size: split.matched.length + split.rest.length, gain: split.gain }
    ]
  };
};

module.exports = { buildTree };
