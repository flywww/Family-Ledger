## MODIFIED Requirements

### Requirement: Existing listed asset workflows remain unchanged
The system SHALL preserve the existing cryptocurrency, Taiwan listed-stock, US listed-stock, and US-listed ETF holding search, price fetch, and monthly refresh behavior while fixing ETF price prefill in the create-balance workflow.

#### Scenario: Existing cryptocurrency flow
- **WHEN** a user searches, creates, selects, or refreshes a cryptocurrency holding
- **THEN** the system continues using the existing CoinMarketCap behavior

#### Scenario: Existing US listed stock flow
- **WHEN** a user searches, creates, selects, or refreshes an existing US listed-stock holding with an unprefixed stock source ID
- **THEN** the system continues using the existing Financial Modeling Prep behavior

#### Scenario: Existing US listed ETF flow
- **WHEN** a user searches, creates, selects, or refreshes an existing US-listed ETF holding with an unprefixed ETF source ID
- **THEN** the system uses Financial Modeling Prep listed-security behavior when available and falls back to a no-key Yahoo chart lookup when FMP blocks ETF quote access
