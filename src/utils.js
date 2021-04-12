const core = require('@actions/core');
const log = require('loglevel');

const SEMVERREGEXP = /v[0-9]*\.[0-9]*\.[0-9]*(\.[0-9]*)?/g;

/* A function that splits a string `limit` times and adds the remainder as a final array index. */
function splitEnv(str, separator, limit) {
    let result = str.split(separator);
    if(result.length > limit) {
        const ret = result.splice(0, limit);
        result = [...ret, result.join(separator)];
    }
    return result;
}

function handleInputs() {
    log.setDefaultLevel(log.levels.INFO);
    if (!Object.keys(log.levels).includes(core.getInput('logLevel').toUpperCase())) {
        log.warn('📢 logLevel not recognized: using default loglevel:info');
    } else {
        log.setLevel(core.getInput('logLevel'));
    }
    const inputs = {
        packageType: core.getInput('packageType'),
        packageName: core.getInput('packageName'),
        organisation: core.getInput('organisation'),
        token: core.getInput('token'),
        pagination: core.getInput('pagination'),
        keepDays: core.getInput('keepDays'),
        limitDate: new Date().getTime() - (core.getInput('keepDays') * 24 * 60 * 60 * 1000),
        logLevel: log.getLevel(),
        dryRun: (core.getInput('dryRun')=='true'),
    }
    log.debug(`inputs: ${JSON.stringify(inputs, null, 4)}`);
    return inputs;
}

function includesAll(a, b) {
    return b.every(v => a.includes(v));
}

function semVerProd(versions) {
    const regex = new RegExp(SEMVERREGEXP);
    for (const env of Object.keys(versions)) {
        if (env.match(regex) == env) {
            return true;
        }
    }
    return false;
}

module.exports = { splitEnv, handleInputs, includesAll, semVerProd };
