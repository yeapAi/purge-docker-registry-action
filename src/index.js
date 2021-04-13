const parse = require('parse-link-header');
const utils = require('./utils');
const github = require('@actions/github');
const log = require('loglevel');
const core = require('@actions/core');

function deleteVersions(inputs, versions) {
    for (const version of versions) {
        log.debug(`Removing version id: ${version.id}`);
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
    const result = await octokit.request('DELETE  /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}', {
        org: inputs.organisation,
        package_type: inputs.packageType,
        package_name: inputs.packageName,
        package_version_id: versionId,
    });
    if(!result || result.status != '200') {
        throw `Error during deletion of id: ${versionId}`;
    }
    return result;
}

async function getVersions(inputs, page=1)  {
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
    return images;
}

async function getOrderedVersions(inputs, page=1)  {
    const images = await getVersions(inputs, page=1);
    log.info(`Found ${images.length} docker images in ${inputs.packageName}`);
    return images.reduce((versions, version) => {
        return [...versions, { id: version.id, date: version.updated_at, tags: version.metadata.container.tags }]
    }, []).sort(function(a,b){
        return new Date(b.date) - new Date(a.date);
    });
}

async function run() {
    try {
        core.info('::group::🚀 Running Purge docker registry');
        const inputs = utils.handleInputs();
        const versions = await getOrderedVersions(inputs);
        const versionsForDeletion = utils.getVersionsForDeletion(inputs, versions);
        if(!inputs.dryRun) {
            await deleteVersions(inputs, versionsForDeletion);
        }
    } catch (error) {
        core.setFailed(error.message);
    } finally {
        core.info('::endgroup::');
    }
}

run();
