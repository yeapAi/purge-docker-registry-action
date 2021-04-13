const utils = require('../src/utils');

test('every item of b is include in a with different array', () => {
    const a = ['2', 'test'];
    const b = ['3', 'test']
    expect(utils.includesAll(a,b)).toBe(false);
});

test('every item of b is include in a with the same array', () => {
    const a = ['2', 'test'];
    const b = ['2', 'test']
    expect(utils.includesAll(a,b)).toBe(true);
});

test('every item of b is include in a with b empty', () => {
    const a = ['2', 'test'];
    const b = []
    expect(utils.includesAll(a,b)).toBe(true);
});

test('every item of b is include in a with a empty', () => {
    const a = [];
    const b = ['2', 'test']
    expect(utils.includesAll(a,b)).toBe(false);
});

test('every item of b is include in a with b include in a', () => {
    const a = ['2', 'test', 'test2', 'test3'];
    const b = ['test2', 'test']
    expect(utils.includesAll(a,b)).toBe(true);
});

test('semVerProd empty', () => {
    expect(utils.semVerProd([])).toBe(false);
});

test('semVerProd with semverkey', () => {
    expect(utils.semVerProd(['dev-test', 'v1.1.0', 'test'])).toBe(true);
});

test('semVerProd without semverkey', () => {
    expect(utils.semVerProd(['dev-v1.1.1', 'v1.1', '1.1.0'])).toBe(false);
});

test('splitEnv dev-v1.1.1 ', () => {
    expect(utils.splitEnv('dev-v1.1.1', '-', 1)).toEqual(
        expect.arrayContaining(['dev', 'v1.1.1']));
});

test('splitEnv v1.1.1 ', () => {
    expect(utils.splitEnv('v1.1.1', '-', 1)).toEqual(
        expect.arrayContaining(['v1.1.1']));
});

test('splitEnv dev-v1.1.1-test', () => {
    expect(utils.splitEnv('dev-v1.1.1-test', '-', 1)).toEqual(
        expect.arrayContaining(['dev', 'v1.1.1-test']));
});

test('identifyVersion empty array ', () => {
    expect(utils.identifyVersion([])).toMatchObject({});
});

test('identifyVersion [dev, v1.1.1-test]', () => {
    expect(utils.identifyVersion(['dev', 'v1.1.1-test'])).toMatchObject({ 'dev': true, 'v1.1.1': 'test'});
});

test('identifyVersion [dev-v1.1.1, v1.1.1-test, dev-v1.1.2]', () => {
    expect(utils.identifyVersion(['dev-v1.1.1', 'v1.1.1-test', 'dev-v1.1.2'])).toMatchObject({ 'dev': 'v1.1.2', 'v1.1.1': 'test'});
});

test('identifyVersion [dev-v1.1.1, v1.1.1-test, v1.1.1]', () => {
    expect(utils.identifyVersion(['dev-v1.1.1', 'v1.1.1-test', 'v1.1.1'])).toMatchObject({ 'dev': 'v1.1.1', 'v1.1.1': true});
});

jest.mock('@actions/core');
jest.mock('loglevel');
const core = require('@actions/core');
const log = require('loglevel');

var d = new Date();
d.setMonth(d.getMonth()-1);

var d1 = new Date();
d1.getDate(d1.getDate()-1);

var d2 = new Date();
d2.setMonth(d2.getMonth()-2);

var d3 = new Date();
d3.setMonth(d2.getMonth()-3);

version1 = {
    id: 1,
    tags: [],
    date: d1.toISOString()
};

version2 = {
    id: 2,
    tags: [],
    date: d2.toISOString()
};

version3 = {
    id: 3,
    tags: [],
    date: d3.toISOString()
};

test('getVersionsForDeletion empty' , () => {
    log.info.mockResolvedValue(true);
    log.debug.mockResolvedValue(true);
    core.setOutput.mockResolvedValue(true);
    expect(utils.getVersionsForDeletion({}, [])).toEqual([]);
});

test('getVersionsForDeletion 2 empty tags with 1 too old' , () => {
    versions = [version1,version2];
    log.info.mockResolvedValue(true);
    log.debug.mockResolvedValue(true);
    core.setOutput.mockResolvedValue(true);
    expect(utils.getVersionsForDeletion({ limitDate: d.getTime() }, versions)).toMatchObject([]);
});

test('getVersionsForDeletion 3 empty tags with 2 too old' , () => {
    versions = [version1, version2, version3];
    log.info.mockResolvedValue(true);
    log.debug.mockResolvedValue(true);
    core.setOutput.mockResolvedValue(true);
    expect(utils.getVersionsForDeletion({ limitDate: d.getTime() }, versions)).toMatchObject([version3]);
});
