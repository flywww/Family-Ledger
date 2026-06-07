## MODIFIED Requirements

### Requirement: Existing listed asset workflows remain unchanged
The system SHALL preserve the existing cryptocurrency, Taiwan listed-stock, and US listed-stock holding search, price fetch, and monthly refresh behavior while fixing US listed-security search coverage for supported stocks and ETFs.

#### Scenario: Existing cryptocurrency flow
- **WHEN** a user searches, creates, or refreshes a cryptocurrency holding
- **THEN** the system continues using the existing CoinMarketCap behavior

#### Scenario: Existing US listed stock flow
- **WHEN** a user searches, creates, or refreshes an existing US listed-stock holding with an unprefixed stock source ID
- **THEN** the system continues using the existing Financial Modeling Prep behavior

#### Scenario: Existing Taiwan listed stock flow
- **WHEN** a user searches, creates, or refreshes an existing Taiwan listed-stock holding with a `TWSE:` or `TPEX:` source ID
- **THEN** the system continues using the existing official Taiwan provider behavior
