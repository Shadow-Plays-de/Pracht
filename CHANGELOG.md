# Changelog - SR5 Pracht

All notable changes to the SR5 Pracht module will be documented in this file.

## [1.2.0] - 2026-08-10

### Added
- **Foundry VTT v14 Support**: Updated module compatibility to Foundry v14 (`minimum: 14`, `verified: 14`, `maximum: 14`).
- **Native Character Sheet Tab**: Extended `SR5CharacterSheet` AppV2 class with a dedicated, space-saving skinny icon tab (`<i class="fas fa-sun"></i>`) for Pracht & Funke actions.
- **Funke Modifier Controls**: Added interactive green `[+]` and red `[-]` buttons next to Funke on the character sheet to increment or decrement the active Funke modifier.
- **Dynamic Modifier Badges**: Displays colored `(+X)` or `(-X)` badges next to Funke whenever the modifier is non-zero.
- **Roll Dialog Test Modifiers**: Integrated `sr5_testPrepareBaseValues` hook to inject labeled `Funke-Modifikator` entries directly into test pools, cleanly separating base attribute (`Funke 9`) from active modifiers (`-1`) in the dice pool breakdown.
- **Automated Drain Reduction**: Integrated `sr5_afterTestComplete` hook to automatically reduce Funke modifier when Pracht action tests miss target success thresholds.
- **System Translation Mapping**: Mapped system translation keys for *Resonanz* and *Wandlung/Submersion* to *Pracht* and *Funke*.
- **Vite Build System**: Added Vite 8 build pipeline with `@tailwindcss/vite`, static asset copy, and localized locale merging.
- **GitHub Release Automation**: Reworked `.github/workflows/main.yml` to compile Vite `dist/` artifacts and release `./dist/module.json` and `./module.zip`.

### Changed
- Refactored `prachtSheet.mjs` to use robust multi-source `getSR5CharacterSheetClass()` resolution.
- Updated attribute controls layout to use compact horizontal inline flex containers without `!important` flags.

---

## [1.0.0] - Initial Release
- Initial release for SR5 Pracht house rules.
