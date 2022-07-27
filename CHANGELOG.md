# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 27.07.2022
### Added
- New iterators for iterating variables and array elements
  - `variableIterator()`
    - Iterates each variable recursively in memory order
    - Usage: `for(const variable of dataType.variableIterator()) {...}` OR shorthand: `for(const variable of dataType) {...}`
  - `elementIterator()`
    - Iterates each variable and array element recursively in memory-order
    - Usage: `for(const variable of dataType.elementIterator()) {...}`

### Changed
- `IecType` interface is now exported for external use

## [1.0.0] - 17.08.2021
### Added
- `fromString()` support for other data types than STRUCT
  - ENUM
  - ALIAS
  - UNION
- New data types
  - ENUM
  - UNION
  - ALIAS (only with `fromString()`)
  
### Updated
- README updated
- `fromString()` updated to work better

## [0.2.0] - 10.08.2021
### Added
- fromString() method to convert IEC types automatically from PLC data type declarations
  - All non-complex data types supported (INT, REAL, ...)
  - STRING and WSTRING support
  - STRUCT support
  - ARRAY support (multi-dimensional)

### Updated
- Updated multi-dimensional array handling to work properly
- Updated README

## [0.1.1] - 07.08.2021
### Added
- README updates etc.

## [0.1.0] - 07.08.2021
### Added
- First release