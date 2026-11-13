# SDTH Smart Promotions — Railway integration rollout

The public D&B Poutine homepage already contains an optional daily-specials section. This integration connects it to the existing FastAPI read-only feed at:

`https://promotions-manager-api-production.up.railway.app/api/promotions`

## Safety control

The new `smart-promotions-source.json` file has `"enabled": false` by default. **An approved offer in the manager is NOT enough to make the homepage show it until this switch is enabled.** We keep it off during initial deployment because the manager previously contained an enabled test offer.

To enable it in a separately reviewed commit, first check that **every** currently active offer is approved for real redemption, including the exact meal, menu price, discount, permitted ordering channels, Ottawa date and time and translated names. Pause all test offers in the manager, then confirm the API responds with `{"timeZone":"America/Toronto","offers":[]}`. Review the browser and mobile experience, then set `enabled: true` in this file and deploy.

## Behaviour

- No changes to menu items, menu prices, existing layout or ordering links.
- No credentials are used in the public page. Only the API's public, read-only `GET /api/promotions` endpoint is contacted.
- Only the exact Railway HTTPS endpoint is accepted; arbitrary URL injection is refused.
- The API is configured to allow browser GET requests from `https://dbpoutine.com` using CORS.
- Only offers marked enabled and approved with an Ottawa-valid date and weekday, a vetted photograph, a real reduction and explicit redemption instructions can appear.
- Date/time filtering is performed by the FastAPI server. The homepage rechecks approximately every minute and when the visitor returns to the tab.
- On API errors, wrong data, timeouts or a disabled switch, the section stays hidden.
- Offer text is displayed using `textContent` (not parsed as HTML) to avoid injection.
- The restaurant's original static `smart-promotions.json` remains empty and is **not used as an automatic fallback**.
- The website copies only the offer's approved meal names, discount, end date and redemption instructions. Customer payments and third-party platform prices do not change.
- The manager's redemption instructions are written by staff; these are displayed literally. Translation of redemption conditions into multiple languages requires a separately reviewed workflow.

## Testing

`node --test tests/smart-promotions.test.cjs`

The test suite covers the disabled switch, empty API response, valid offers, languages, discount display, invalid/unapproved/expired offers, network failures and automatic hiding after pausing.

`node tests/check-promotions-api.cjs`

The CI probe checks that the switch remains off and confirms the Railway API responds with JSON and a CORS header for the restaurant domain. It prints the **number** of active offers, but does not publish any offer details.

## Release policy

This branch is a safe, default-off integration. Do not enable the public feature until the owner has confirmed there are no unauthorised current offers and browser regression checks have passed. SDTH MusicHub is not involved.
