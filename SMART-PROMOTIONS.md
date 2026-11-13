# SDTH Smart Promotions — D&B Poutine

The homepage component is integrated but **hidden by default**. No promotions are active on launch. It never changes the existing menu prices, ordering services or payment totals.

## Scheduling a restaurant-approved promotion

Edit `smart-promotions.json` in a reviewed pull request. Keep `timeZone` as `America/Toronto`. Each offer in `offers` must have all of the following:

- `approved: true` — set only once D&B Poutine has explicitly approved the exact offer.
- `enabled: true` — control whether it can display.
- `startDate`, `endDate` — inclusive Ottawa-local dates, format `YYYY-MM-DD`.
- `weekdays` — Ottawa day numbers: Sunday 0, Monday 1, Tuesday 2, Wednesday 3, Thursday 4, Friday 5, Saturday 6.
- `name` — an `en-CA` string and optional `en-GB`, `fr-CA` and `es` translations.
- `image` — an existing approved menu photograph filename from the allowlist in `smart-promotions.js`.
- `originalCents` and `discountedCents` — genuine, approved Canadian dollar values expressed as integer cents, with discounted price less than regular price.

No offer is currently configured. **Do not add an offer without the restaurant's approval of the meal, regular price, discounted price, dates, and redemption method.** If no offers qualify, the section is hidden and the homepage appears as before.

### Example schema (fictional, DO NOT publish as an active offer)

```json
{
  "timeZone": "America/Toronto",
  "offers": [
    {
      "approved": false,
      "enabled": false,
      "startDate": "2026-11-16",
      "endDate": "2026-11-20",
      "weekdays": [1, 3, 5],
      "name": {
        "en-CA": "Example Meal",
        "fr-CA": "Repas fictif",
        "es": "Comida de ejemplo"
      },
      "image": "small-pou.webp",
      "originalCents": 1500,
      "discountedCents": 1200
    }
  ]
}
```

The above illustration remains disabled even if copied into the live configuration. To publish a real offer, enter **verified** product and price information and obtain restaurant approval before setting `approved` and `enabled` to `true`.

## Behaviour and safety

- The browser checks the **Ottawa local date** and day of week, including daylight-saving changes.
- Dates are inclusive. It refreshes each minute while the page is open and whenever the visitor returns to the tab.
- Inactive, unapproved, malformed, out-of-window or wrongly priced offers never display.
- Unavailable or invalid JSON fails closed: the promotional section stays hidden.
- The first matching approved offer displays. Schedule non-overlapping offers to avoid ambiguity.
- This module is advertising only. It does **not** modify menu prices, accept payment, validate a voucher or apply a discount on Uber Eats or any other ordering channel.
- The restaurant must decide where and how customers may redeem any promotion before approving it.
- The JSON is publicly readable on a static site: do not store secrets or customer information in it.
- Changes to this configuration require a repository update and new deployment; there is no management dashboard yet.

## Release checks

Before publishing a future offer, verify the weekday and date in Ottawa, original and discounted prices, item photograph, language labels, mobile layout, the existing menu link, and discount availability on the actual redemption channel.
