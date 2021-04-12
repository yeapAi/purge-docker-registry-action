import * as parse from 'parse-link-header';
const utils = require('./utils.js');
const github = require('@actions/github');
const log = require('loglevel');
const core = require('@actions/core');

async function deleteVersions(inputs, versions) {
    for (const version of versions) {
        log.debug(`Removing version id: ${version.id}`);
        //Question: do I have async call here ? => multi thread ?
        deleteVersion(inputs, version.id).then(() => {
            log.info(`✅ Version with id: ${version.id} removed`);
        }).catch((error) => {
            log.error(`❗️ ${error}`);
            core.setFailed(error.message);
        });
    }
}

async function deleteVersion(inputs, versionId) {
    log.debug(`Querying: GET /orgs/${inputs.organisation}/packages/${inputs.packageType}/${inputs.packageName}/versions`);
    // TO DO uncomment final version
    // const result = await octokit.request('DELETE  /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}', {
    //     org: inputs.organisation,
    //     package_type: inputs.packageType,
    //     package_name: inputs.packageName,
    //     package_version_id: versionId,
    // });
    let result ={status: '200'};
    if(!result || result.status != '200') {
        throw `Error during deletion of id: ${versionId}`;
    }
    return result;
}

async function getOrderedVersions(inputs, page=1)  {
    const images = [];
    const octokit = github.getOctokit(inputs.token);

    log.debug(`Querying: GET /orgs/${inputs.organisation}/packages/${inputs.packageType}/${inputs.packageName}/versions`);

    const result = await octokit.request('GET /orgs/{org}/packages/{package_type}/{package_name}/versions', {
        org: inputs.organisation,
        package_type: inputs.packageType,
        package_name: inputs.packageName,
        per_page: inputs.pagination,
        page: page
    });

    images.push(...result.data);

    const pagination = parse(result.headers.link);
    if (pagination && pagination.next) {
        const response = await getVersions(inputs, parseInt(pagination.next.page));
        images.push(...response);
    }

    log.info(`Found ${images.length} docker images in ${inputs.packageName}`);

    return images.reduce((versions, version) => {
        return [...versions, { id: version.id, date: version.updated_at, tags: version.metadata.container.tags }]
    }, []).sort(function(a,b){
        return new Date(b.date) - new Date(a.date);
    });
}

function identifyVersion(tags) {
    return tags.reduce((result, tag) => {
        const splitTag = utils.splitEnv(tag, '-', 1);
        result[splitTag[0]] = splitTag[1] || true;
        return result;
    },{});
}

function getVersionsForDeletion(inputs, versions) {
    const toDelete = [];
    let oneTag = [];
    let oneWithoutTag = false;
    versions.forEach((version) => {
        if (!version.tags.length) {
            if (oneWithoutTag && inputs.limitDate > new Date(version.date)) {
                toDelete.push(version);
            }
            oneWithoutTag = true;
        } else {
            if (inputs.limitDate > new Date(version.date)) {
                const tagEnv = identifyVersion(version.tags);
                const keysEnv = Object.keys(tagEnv);

                if (utils.includesAll(oneTag, keysEnv) && !utils.semVerProd(tagEnv)) {
                    toDelete.push(version);
                }
                oneTag = [...new Set([...oneTag ,...keysEnv])];
            }
        }
    });
    log.info(`Selected ${toDelete.length} items for deletion`);
    log.debug(toDelete);
    log.info(`Keeping 1 expired tag for : ${oneTag}`);
    return toDelete;
}

async function run() {
    try {
        console.log('::group::🚀 Running Purge docker registry');
        const inputs = utils.handleInputs();
        const versions = await getOrderedVersions(inputs);
        const versionsForDeletion = getVersionsForDeletion(inputs, versions);
        if(!inputs.dryRun) {
            // Await assure me final completion of all delete ?
            await deleteVersions(inputs, versionsForDeletion);
        }
    } catch (error) {
        core.setFailed(error.message);
    } finally {
        console.log('::endgroup::');
    }
}

run();
