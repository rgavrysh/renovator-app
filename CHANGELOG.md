# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-11-05

### Added

- Milestone filter on the **Budget Summary** panel. Choose all milestones, no
  milestone, or a specific milestone; Total Actual, From Budget Items and From
  Tasks are recalculated to include only the matching budget items and tasks.
  While filtered, Variance and Spent are replaced by the selection's share of the
  project total, and the estimated budget is labelled as project-wide.
- Independent milestone filter on the **Budget Items** panel, with category
  groups, counts and totals recalculated and a no-match message.
- Reusable `MilestoneFilter` menu (icon trigger, keyboard navigation, outside
  click to close) and `MilestoneFilterChip` showing the active filter with a
  one-click clear.
- Budget PDF export pre-selects the milestone currently filtered in the Budget
  Summary.

### Changed

- Budget Summary header actions ("Export to PDF", "Add budget item") are now
  compact icon buttons with tooltips, alongside the filter.
- Budget breakdown amounts are right-aligned with tabular figures.
- UI upgrade (batches A–H): type scale, control heights, flat surfaces and
  motion, self-hosted Inter, semantic status colors, persistent app shell with
  collapsible sidebar, uniform iconography and status glyphs, reading comfort,
  unified list rows, refreshed login and empty states.

### Removed

- "View" link next to the From Tasks amount in the Budget Summary.

### Fixed

- `ProjectDetail` tests no longer fail intermittently: the shared fetch mock
  overrode the photo/document responses, so the photo gallery received a
  non-array payload.

## [1.0.0] - 2026-08-19

- Initial tagged release.

[Unreleased]: ../../compare/v1.1...HEAD
[1.1.0]: ../../compare/v1.0...v1.1
[1.0.0]: ../../releases/tag/v1.0
