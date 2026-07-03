## ADDED Requirements

### Requirement: ETF holding selection prefills market price
The system SHALL prefill the create-balance price field with a fetched market price when a user selects an existing US-listed ETF holding that has valid listed-security quote metadata, including when Financial Modeling Prep requires a fallback provider for ETF quotes.

#### Scenario: Select existing US ETF holding
- **WHEN** a user selects an existing ETF holding such as `VOO`, `VT`, or `QQQ` in the new balance form
- **THEN** the system fetches the listed-security quote for the holding source ID and writes the returned numeric price into the price field

#### Scenario: ETF price updates derived value
- **WHEN** the ETF quote fetch succeeds and the quantity field has a numeric value
- **THEN** the system recalculates the value field from quantity multiplied by the fetched ETF price

#### Scenario: ETF price uses listed-security currency
- **WHEN** the selected ETF holding uses an unprefixed Financial Modeling Prep source ID
- **THEN** the system sets the balance currency to `USD`

#### Scenario: FMP blocks ETF quote endpoint
- **WHEN** Financial Modeling Prep returns a subscription-blocking response for an ETF quote such as `VT` or `XLK`
- **THEN** the system uses a no-key Yahoo chart fallback and writes the returned USD market price into the price field

### Requirement: Failed ETF quote does not create a fake zero price
The system SHALL avoid treating a failed or invalid ETF quote response as a valid zero price in the create-balance form.

#### Scenario: ETF quote provider fails
- **WHEN** a user selects an ETF holding and the quote provider fails
- **THEN** the system leaves manual price entry available and does not overwrite the price field with a provider-derived `0`

#### Scenario: ETF holding is missing quote metadata
- **WHEN** a user selects an ETF holding without a usable source ID
- **THEN** the system leaves the price field editable and does not attempt an invalid quote request

### Requirement: Existing listed holding price prefill remains compatible
The system SHALL preserve existing create-balance price prefill behavior for US stocks, Taiwan listed stocks, and cryptocurrencies while adding ETF regression coverage.

#### Scenario: Existing US stock price prefill
- **WHEN** a user selects an existing US stock holding with an unprefixed listed-security source ID
- **THEN** the system continues fetching the Financial Modeling Prep quote and prefilling the price

#### Scenario: Existing Taiwan listed-stock price prefill
- **WHEN** a user selects an existing Taiwan listed-stock holding with a `TWSE:` or `TPEX:` source ID
- **THEN** the system continues fetching the official Taiwan quote and prefilling the TWD price

#### Scenario: Existing cryptocurrency price prefill
- **WHEN** a user selects an existing cryptocurrency holding with CoinMarketCap source metadata
- **THEN** the system continues fetching the cryptocurrency quote and prefilling the USD price

### Requirement: Source rule to validation mapping
The system SHALL validate ETF price prefill with focused automated tests and authenticated workflow review evidence before archive.

#### Scenario: Automated validation is run
- **WHEN** the ETF price prefill change is implemented
- **THEN** focused tests cover ETF quote success and provider failure behavior, and the final notes record `npm run typecheck` and `npm run lint` results

#### Scenario: Manual workflow validation is recorded
- **WHEN** the ETF price prefill change is ready for review
- **THEN** the final notes record whether `/balance/create` manual create-and-visible proof was completed or explicitly skipped
