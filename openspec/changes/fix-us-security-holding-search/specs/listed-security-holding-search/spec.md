## ADDED Requirements

### Requirement: Listed security search includes US stocks and ETFs
The system SHALL return supported US-listed stock and ETF results from the create-balance Add Holding listed-security search when the existing Financial Modeling Prep search endpoint returns valid rows.

#### Scenario: Search US stock by symbol
- **WHEN** a user searches listed holdings for a US stock symbol such as `TSLA`
- **THEN** the system returns a selectable holding result with the stock name, symbol, source URL, and unprefixed symbol source ID

#### Scenario: Search US ETFs by symbol
- **WHEN** a user searches listed holdings for US ETF symbols such as `VT`, `VOO`, `QQQ`, or `XLK`
- **THEN** the system returns a selectable holding result with the ETF name, symbol, source URL, and unprefixed symbol source ID

#### Scenario: Search keeps recognized US exchanges
- **WHEN** Financial Modeling Prep returns valid listed-security rows from recognized US exchange labels such as NASDAQ or NYSE
- **THEN** the system includes those rows instead of requiring one exact NASDAQ exchange label

### Requirement: Listed security selection creates a compatible holding
The system SHALL preserve selected listed-security metadata so the Add Holding dialog can create or update a holding through the existing holding creation action.

#### Scenario: Select US listed result
- **WHEN** a user selects a US stock or ETF result from the Add Holding search list
- **THEN** the form stores `name`, `symbol`, `sourceId`, and `sourceURL` values compatible with the existing holding create action

#### Scenario: Existing Taiwan results remain selectable
- **WHEN** a user selects a Taiwan listed-stock result from the same Add Holding search list
- **THEN** the form stores the existing Taiwan display symbol and prefixed Taiwan source ID

#### Scenario: Search Taiwan holdings by code or Chinese name
- **WHEN** a user searches listed holdings for Taiwan symbols or names such as `0050`, `台積電`, or `台達電`
- **THEN** the system returns selectable Taiwan listed-stock results with display symbols and prefixed Taiwan source IDs

### Requirement: Listed holding search shows loading state
The system SHALL show an animated loading indicator in the Add Holding search input while provider-backed holding search is fetching results.

#### Scenario: Provider search is in progress
- **WHEN** a user types into the Add Holding search input for a listed stock or cryptocurrency category
- **THEN** the search input shows an animated loading indicator until the current provider search completes

#### Scenario: Provider search completes
- **WHEN** the current provider search returns results, returns no results, or fails
- **THEN** the search input hides the loading indicator and keeps the search list in a stable state
