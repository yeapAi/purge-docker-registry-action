# purge-docker-registry-action

Github action to remove Yeap old docker image.

- Deletion is based on `keepDays` parameter. Version upgraded or created during the conservation period will not be deleted
- This action doesn't remove image with a tag starting with a production version ( vX.Y.Z )
- This action doesn't remove the last version outside of the conservation period for every environnement

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




