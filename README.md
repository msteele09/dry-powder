# Dry Powder

A personal money desk and AI bubble playbook that installs on your phone like an app. It shows budgets, net worth, investments and goals; pulls live prices from Alpha Vantage; and sends push notifications.

Live app: https://msteele09.github.io/dry-powder/

## Install on iPhone
1. Open the live app link in **Safari**.
2. Tap **Share**, then **Add to Home Screen**, then **Add**.
3. Open Dry Powder from the new icon. Your data is stored on the phone only.

## Bring over your data
Ask Claude for an import code, then in the app open More, then Settings and data, paste it under Paste an import code, and tap Import. A JSON backup file also works with Restore from backup.

## Live prices
Get a free key at alphavantage.co and paste it under More, then Settings and data. Prices refresh the first time you open the app each day. The free plan allows 25 lookups a day.

## Notifications
Notifications are sent by a scheduled GitHub Action (`.github/workflows/notify.yml`):
- Weekdays after the market close: S&P 500, Nasdaq, Nvidia and chip-stock moves, plus a heads-up the day before key dates.
- Sundays: a money check-in.

Setup needs two repository secrets (Settings, then Secrets and variables, then Actions, then New repository secret):
- `VAPID_PRIVATE_KEY`: the private half of this app's notification key pair.
- `DRY_POWDER_DEVICE`: in the app, save your Alpha Vantage key, tap Turn on notifications, then Copy device code.

Then open Actions, then Notifications, then Run workflow with mode `test`.

Never commit the VAPID private key or your API key to this repo.

General education, not personalized financial advice.
