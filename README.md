# purge-docker-registry-action

Github action to remove Yeap outdated docker image.

- Deletion is based on `keepDays` parameter. Version upgraded or created during the conservation period will not be deleted.
- This action doesn't remove image with a tag starting with a production version ( vX.Y.Z or vX.Y.Z.A or vX.Y.Z.A-hotfix )
- This action doesn't remove the last version outside of the conservation period for every environnement

## local test with act

- install [act](https://github.com/nektos/act)
- run :

```console
npm run build && act -j act-test -P ubuntu-latest=nektos/act-environments-ubuntu:18.04 -s GITHUB_TOKEN=XXXXXXXXXXX
```

## Usage

```yaml
on:
  schedule:
    - cron:  '* 9 * * 1'

name: Purge image docker
jobs:
  purge:
    name: Purge image
    runs-on: ubuntu-latest
    steps:
      uses: yeapAi/purge-docker-registry-action@v1.0.1
      with:
        token: ${{ secrets.PAT }}
        packageName: yeap-modelisation-api
        organisation: yeapAi
        dryRun: false
        logLevel: trace
```

## Parameters

### inputs

| Name                | Type     | Default/Require | Description                        |
|---------------------|----------|-----------------|-------------------|
| `packageType`       | String   | Required        | Type of package (container: new registry docker, ) |
| `packageName`       | String   | Required        | Package name, must match the registry name in <https://github.com/orgs/ORG/packages> |
| `organisation`      | String   | Required        | Organisation |
| `token`             | String   | Required        | Token (needs to be able to delete package) |
| `pagination`        | Integer  | `100`           | Paginate package lookup to X items by query  |
| `keepDays`          | Integer  | `30`            | Keep all package upadte or created last X days |
| `dryRun`            | Boolean  | `false`         | Activate dry run |
| `logLevel`          | String   | `info`          | Log level (trace, debug, info, warn, error) |

### outputs

Following outputs are available

| Name          | Type    | Description                           |
|---------------|---------|---------------------------------------|
| `deleted`     | Json    | Output version to delete as json text |
| `envList`     | Array   | List environment having 1 outdated version kept |

## Exemples

### Exemple with 3 versions out of the conservation period

version: 1, tag: dev-test, sprint-v1.1.1,
version: 2, tag: dev-test2, uat-v1.2.2
version: 3, tag; dev-test3, sprint-V1.1.0

This action will only remove the last version because it has already a version for [dev, uat, sprint]

### Exemple with ordered version

This action sort version by updated date, it doesn't look for semvers

Ordered by  updated-last descending
version: 1, tag: dev-test, sprint-v1.1.1
version: 2, tag: dev-test2, uat-v1.2.0
version: 3, tag; dev-test3, uat-V1.2.2
version: 4, tag; preprod-V1.2.2

This action will only remove the version 3 because it has already a version for [dev, uat, sprint]

## Exemple with production version

Any tag starting with `v` followed by a semver on 3 or 4 digits will not be remove regardless of the uploaded date.
Every tag on a production version count toward detecting a version on an environnement

version: 1, tag: uat-v1.2.0
version: 2, tag: dev-v1.1.1, v1.1.1
version: 3, tag; dev-test
version: 4, tag; v1.1.1-preview

Only the version 3 will be removed because version 2 has a production tag and count for dev environment
