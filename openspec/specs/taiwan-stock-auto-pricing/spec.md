## Purpose
Define Taiwan listed-stock search, source metadata, quote pricing, and monthly refresh behavior for Family Ledger holdings.

## Requirements

### Requirement: Taiwan stock search
The system SHALL allow users to find Taiwan listed-stock holdings from the existing listed-stock holding search flow by stock code, display symbol, Chinese stock name, Chinese company name, or free official English abbreviation when the exchange profile data provides one.

#### Scenario: Search TWSE stock by code
- **WHEN** a user searches listed stocks for `2330`
- **THEN** the system returns a Taiwan stock result for TWSE code `2330` with a display symbol equivalent to `2330.TW`

#### Scenario: Search TWSE stock by English abbreviation
- **WHEN** a user searches listed stocks for `TSMC`
- **THEN** the system returns the TWSE `2330` Taiwan stock result when the official company profile contains `TSMC` as the English abbreviation

#### Scenario: English search has no free official match
- **WHEN** a user searches listed stocks with an English company name or abbreviation that is not available in free official TWSE or TPEx profile data
- **THEN** the system does not call a paid provider, web search, scraping fallback, new dependency, or new environment-variable-backed provider to force an English match

#### Scenario: Search TPEx stock by display symbol
- **WHEN** a user searches listed stocks for `8069.TWO`
- **THEN** the system returns a Taiwan stock result for TPEx code `8069`

#### Scenario: Search Taiwan stock by Chinese name
- **WHEN** a user searches listed stocks for `台積電` or `元太`
- **THEN** the system returns matching Taiwan stock results using official Chinese quote or company-profile names

### Requirement: Taiwan stock source metadata
The system SHALL store Taiwan stock provider identity in existing holding source metadata without requiring a database schema change.

#### Scenario: Save TWSE holding source
- **WHEN** a user creates a holding from a TWSE Taiwan stock search result
- **THEN** the holding source ID is stored with a TWSE provider prefix and stock code, such as `TWSE:2330`

#### Scenario: Save TPEx holding source
- **WHEN** a user creates a holding from a TPEx Taiwan stock search result
- **THEN** the holding source ID is stored with a TPEx provider prefix and stock code, such as `TPEX:8069`

### Requirement: Taiwan daily close price fetch
The system SHALL fetch Taiwan stock prices from official free no-key TWSE and TPEx daily close quote data and SHALL store refreshed Taiwan stock prices in TWD.

#### Scenario: Fetch TWSE daily close price
- **WHEN** the system fetches a price for source ID `TWSE:2330`
- **THEN** it uses the TWSE daily close quote data for code `2330` and returns a numeric TWD price

#### Scenario: Fetch TPEx daily close price
- **WHEN** the system fetches a price for source ID `TPEX:8069`
- **THEN** it uses the TPEx daily close quote data for code `8069` and returns a numeric TWD price

#### Scenario: Missing Taiwan quote
- **WHEN** the official Taiwan quote data does not contain the requested source code or contains no numeric close price
- **THEN** the system reports a provider error instead of silently using a zero or stale price

### Requirement: Existing listed asset workflows remain unchanged
The system SHALL preserve the existing cryptocurrency and US listed-stock holding search, price fetch, and monthly refresh behavior while adding Taiwan stock support.

#### Scenario: Existing cryptocurrency flow
- **WHEN** a user searches, creates, or refreshes a cryptocurrency holding
- **THEN** the system continues using the existing CoinMarketCap behavior

#### Scenario: Existing US listed stock flow
- **WHEN** a user searches, creates, or refreshes an existing US listed-stock holding with an unprefixed stock source ID
- **THEN** the system continues using the existing Financial Modeling Prep behavior

### Requirement: Taiwan monthly refresh
The system SHALL include Taiwan stock holdings in the existing quote-backed monthly refresh workflow.

#### Scenario: Copied Taiwan balance is pending refresh
- **WHEN** monthly refresh copies a prior-month Taiwan stock balance into a new month
- **THEN** the copied balance is marked pending with the Taiwan provider as its price source

#### Scenario: Taiwan balance refresh succeeds
- **WHEN** monthly refresh successfully fetches a Taiwan stock daily close price
- **THEN** the balance price, value, currency, price status, fetched timestamp, and snapshot state are updated through the existing refresh workflow

#### Scenario: Taiwan balance refresh fails
- **WHEN** monthly refresh cannot fetch or parse a Taiwan stock daily close price
- **THEN** the balance and asset price snapshot are marked failed with a retryable provider error
