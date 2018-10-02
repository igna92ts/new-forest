jest.mock('../amazon');
jest.mock('../forest');
const {
    calculateReturns,
    validateFold,
    compareWithOutOfBag,
    validate,
    chunkArray,
    mergeWithout,
    chain,
    groupBy,
    classify
  } = require('../validator'),
  errors = require('../errors'),
  rndForest = require('../forest'),
  aws = require('../amazon');

describe('VALIDATOR', () => {
  describe('chunkArray', () => {
    test('it should partition an array in n arrays', () => {
      const testArray = [1, 2, 3, 4, 5];
      const chunked = chunkArray(testArray, 2);
      expect(chunked[0]).toEqual([1, 2]);
      expect(chunked[1]).toEqual([3, 4, 5]);
    });

    test('it should throw an error if folds are bigger than array length', () => {
      const testArray = [1, 2, 3, 4, 5];
      expect(() => chunkArray(testArray, 10)).toThrow(
        errors.defaultError('folds cant be bigger that arr length')
      );
    });
  });

  describe('mergeWithout', () => {
    test('it should merge an array of array without one of its indexes into one array', () => {
      const testArray = [[1], [2], [3]];
      const merged = mergeWithout(1, testArray);
      expect(merged).toEqual([1, 3]);
    });

    test('it shouldnt fail if only 2 arrays are present in the original data', () => {
      const testArray = [[1, 2], [3, 4]];
      const merged = mergeWithout(0, testArray);
      expect(merged).toEqual([3, 4]);
    });
  });

  describe('chain', () => {
    test('it should chain an array of independent promises', async done => {
      let value = 0;
      const promise = () =>
        new Promise((resolve, reject) => {
          value++;
          resolve();
        });
      const res = await chain([promise, promise, promise]);
      expect(res).toBe(1);
      expect(value).toBe(3);
      done();
    });
  });

  describe('groupBy', () => {
    test('it should group array elements by a given property', () => {
      const arr = [{ label: 'a' }, { label: 'b' }, { label: 'a' }];
      const result = groupBy(arr, 'label');
      expect(result).toEqual({ a: [{ label: 'a' }, { label: 'a' }], b: [{ label: 'b' }] });
    });

    test('it should throw an error when some of the objects dont have the label choosen', () => {
      const arr = [{ label: 'a' }, {}, { label: 'a' }];
      expect(() => groupBy(arr, 'label')).toThrow(errors.defaultError('key not present'));
    });
  });

  describe('validate', () => {
    test('it should perform its logic', async done => {
      const result = await validate(2, ['EMA8'], [{ EMA8: 1 }, { EMA8: 2 }]);
      expect(aws.uploadData.mock.calls.length).toBe(3);
      expect(aws.uploadData.mock.calls).toContainEqual(
        [[{ EMA8: 2 }], `data-fold-${0}`],
        [[{ EMA8: 1 }], `data-fold-${1}`],
        [[{ EMA8: 1 }, { EMA8: 2 }], `validation-chunks`]
      );
      expect(rndForest.buildForest.mock.calls.length).toBe(2);
      expect(rndForest.buildForest.mock.calls).toContainEqual([['EMA8'], 0], [['EMA8'], 1]);
      done();
    });

    test('it should throw an error if parameters are missing', () => {
      expect(() => validate()).toThrow(errors.defaultError('Missing parameters'));
    });
  });

  describe('classify', () => {
    test('it should classify a sample based on the forest criteria and if theres doubt do nothing', () => {
      const result = classify(
        [
          newValue => ({ NOTHING: 1 }),
          newValue => ({ BUY: 0.5, NOTHING: 0.5 }),
          newValue => ({ NOTHING: 1 })
        ],
        { EMA8: 1 }
      );
      expect(result).toBe('NOTHING');
      const result2 = classify(
        [newValue => ({ BUY: 1 }), newValue => ({ BUY: 0.5, NOTHING: 0.5 }), newValue => ({ NOTHING: 1 })],
        { EMA8: 1 }
      );
      expect(result).toBe('NOTHING');
      const result3 = classify(
        [newValue => ({ BUY: 1 }), newValue => ({ BUY: 1 }), newValue => ({ NOTHING: 1 })],
        { EMA8: 1 }
      );
      expect(result3).toBe('BUY');
      const result4 = classify([newValue => ({ NOTHING: 1 })], { EMA8: 1 });
      expect(result4).toBe('NOTHING');
    });
  });

  describe('compareWithOutOfBag', () => {
    test('it should compare a prediction result array with and out of fold sample and return the result', () => {
      const result = compareWithOutOfBag(['NOTHING', 'BUY'], [{ action: 'BUY' }, { action: 'BUY' }]);
      expect(result).toBe(0.5);
    });
    test('it should throw an error if sample and result array are not the same length', () => {
      expect(() => compareWithOutOfBag(['BUY'], [{ action: 'BUY' }, { action: 'BUY' }])).toThrow(
        errors.defaultError('both params must be of same length')
      );
      expect(() => compareWithOutOfBag(['BUY', 'NOTHING'], [{ action: 'BUY' }])).toThrow(
        errors.defaultError('both params must be of same length')
      );
    });
    test('it should throw an error if outOfFold elements dont have an action property', () => {
      expect(() => compareWithOutOfBag(['BUY', 'NOTHING'], [{}, { action: 'BUY' }])).toThrow(
        errors.missingRequiredProperty('action')
      );
    });
  });

  describe('calculateReturns', () => {
    test('it should calculate returns based on price and actions', () => {
      const result = calculateReturns([
        { close: 1, action: 'BUY', EMA8: 1, EMA55: 0 },
        { close: 2, action: 'SELL', EMA8: 0, EMA55: 1 }
      ]);
      expect(result).toBe(5.498001998001998);
    });

    test('it should throw an error if property close is missing', () => {
      expect(() => calculateReturns([{ action: 'BUY', EMA8: 1, EMA55: 2 }])).toThrow(
        errors.missingRequiredProperty('close')
      );
    });

    test('it should throw an error if property EMA8 or EMA55 is missing', () => {
      expect(() => calculateReturns([{ action: 'BUY', EMA55: 2, close: 2 }])).toThrow(
        errors.missingRequiredProperty('EMA')
      );
    });
  });

  // describe('validateFold', () => {
  //   test('it should calculate accuracy, predictedReturns and expectedReturns', () => {
  //     const result = validateFold(
  //       [{ action: 'BUY' }, { action: 'BUY' }],
  //       [
  //         newValue => ({ NOTHING: 1 }),
  //         newValue => ({ BUY: 0.5, NOTHING: 0.5 }),
  //         newValue => ({ NOTHING: 1 })
  //       ],
  //       0
  //     );
  //     console.log(result);
  //   });
  // });
});
