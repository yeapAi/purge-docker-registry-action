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
    if (inputs.dryRun) {
        log.warn('📢 Dry run - nothing will be deleted')
    }
    log.debug(`inputs: ${JSON.stringify(inputs, null, 4)}`);
    return inputs;
}

/* every item of b is in a */
function includesAll(a, b) {
    return b.every(v => a.includes(v));
}

function semVerProd(tags) {
    const regex = new RegExp(SEMVERREGEXP);
    return tags.reduce((result, tag) => {
        return result || (tag.match(regex) == tag);
    }, false);
}

function identifyVersion(tags) {
    return tags.reduce((result, tag) => {
        const splitTag = splitEnv(tag, '-', 1);
        result[splitTag[0]] = splitTag[1] || true;
        return result;
    },{});
}

function getVersionsForDeletion(inputs, versions) {
    const toDelete = [];
    let oneTag = [];
    let oneWithoutTag = false;
    versions.forEach((version) => {
        if (inputs.limitDate > new Date(version.date)) {
            if (!version.tags.length) {
                if (oneWithoutTag) {
                    toDelete.push(version);
                }
                oneWithoutTag = true;
            } else {
                const tagEnv = identifyVersion(version.tags);
                const keysEnv = Object.keys(tagEnv);

                if (includesAll(oneTag, keysEnv) && !semVerProd(keysEnv)) {
                    toDelete.push(version);
                }
                oneTag = [...new Set([...oneTag ,...keysEnv])];
            }
        }
    });
    log.info(`Select ${toDelete.length} items for deletion`);
    log.debug(toDelete);
    core.setOutput("deleted", toDelete);
    log.info(`Keeping 1 expired tag for : ${oneTag}`);
    core.setOutput("envlist", oneTag);
    return toDelete;
}

module.exports = { splitEnv, handleInputs, includesAll, semVerProd, getVersionsForDeletion, identifyVersion };
