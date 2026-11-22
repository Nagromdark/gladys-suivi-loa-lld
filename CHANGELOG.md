# Changelog

All notable changes to this integration are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
uses [semantic versioning](https://semver.org/).

Describe each change under `## [Unreleased]

### Added

- First version: follow a leased car (LOA / LLD) against its mileage
  allowance.
- A Gladys device with nine figures, all kept in history and usable as scene
  triggers: odometer, expected odometer today, delta with the expected
  odometer, km left in the allowance, monthly budget, projected final
  odometer, projected extra km, projected extra cost and days left.
- Odometer readings from the Configuration screen, from the dashboard widget
  and from the `record_reading` scene action, whose odometer field accepts a
  scene variable (`{{`), e.g. the odometer another integration reads from a
  connected car.
- `lease_status` dashboard widget: odometer, delta (green, orange or red) and
  projected final odometer tiles; a chart of the allowance and of your pace
  over the whole contract; allowance used, expected odometer, monthly budget,
  projected extra cost, contract end with the days left, last reading; and a
  "New reading" button.
- **Show the summary** button on the Configuration screen: the lease figures
  and a ready-made sentence, in French or English.

[Unreleased]: https://github.com/Nagromdark/gladys-suivi-loa-lld/commits/HEAD
