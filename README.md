# purge-docker-registry-action

Github action to remove Yeap old docker image.

Deletion is based on `keepDays` parameter. Version upgraded or created during the conservation period will not be deleted.
This action save the last version after the conservation period for one environnement or production tag.

## Exemples

### Exemple with 3 version out of the conservation period

version: 1, tag: dev-test, sprint-v1.1.1, v1.1.1
version: 2, tag: dev-test2, uat-v1.2.2
version: 3, tag; dev-test3, sprint-V1.1.0

This action will only remove the last version because it has already a version for [dev, sprint, v1.1.1]

### Exemple with ordered version

This action order version by updated date, it doesn't
