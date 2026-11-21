# Changelog

All notable changes to this integration are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
uses [semantic versioning](https://semver.org/).

Describe each change under `## [Unreleased]` as you make it. The Release
workflow moves that section under the version it ships, and the section becomes
the notes of the version's GitHub Release.

## [Unreleased]

### Added

- First version: the leased car as a Gladys device (odometer, expected
  odometer, delta, km left, monthly budget, projected final odometer, projected
  extra km and cost, days left).
- Odometer readings from the Configuration screen, the `lease_status`
  dashboard widget and the `record_reading` scene action.
- `get_summary` scene action and `show_summary` button: the lease figures and a
  ready-made sentence, in French or English.
- Chart in the `lease_status` widget: the allowance line over the whole
  contract and your own pace, extended to the projected final odometer.

### Fixed

- The six distance figures (expected odometer, delta, km left, monthly budget,
  projected final odometer, projected extra km) showed as unnamed features in
  Gladys: they now use the distance type Gladys knows. Already created device:
  apply the **Update** offered in the integration's Discovery screen.

[Unreleased]: https://github.com/Nagromdark/gladys-suivi-loa-lld/commits/HEAD
