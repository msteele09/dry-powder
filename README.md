# Dry Powder

A personal money desk and AI bubble playbook that installs on your phone like an app. It shows budgets, net worth, investments and goals; pulls live prices from Alpha Vantage; and sends push notifications.

Live app: https://msteele09.github.io/dry-powder/

## Install on iPhone
1. Open the live app link in **Safari**.
2. Tap **Share**, then **Add to Home Screen**, then **Add**.
3. Open Dry Powder from the new icon. Your data is stored on the phone only.

## Bring over your data
In the Claude version, open More, then Data and backup, then Export backup. In this app, open More, then Settings and data, then Restore from backup.

## Live prices
Get a free key at alphavantage.co and paste it under More, then Settings and data. Prices refresh the first time you open the app each day. The free plan allows 25 lookups a day.

## Notifications
Notifications are sent by a scheduled GitHub Action (`.github/workflows/notify.yml`):
- Weekdays after the market close: S&P 500, Nasdaq, Nvidia and chip-stock moves, plus a heads-up the day before key dates.
- Sundays: a money check-in.

Setup:
1. In the app (opened from the Home Screen icon, iOS 16.4+), open More, then Settings and data, and tap **Turn on notifications**. Copy the device code it shows.
2. In this repo, open **Settings, then Secrets and variables, then Actions** and add these repository secrets:
   - `PUSH_SUBSCRIPTION`: the device code from step 1
   - `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`: the key pair for this app (the public key is also in `index.html`)
   - `ALPHA_VANTAGE_KEY`: your Alpha Vantage key
3. Open **Actions, then Notifications, then Run workflow** with mode `test` to check it works.

Never commit the VAPID private key or your API key to this repo.

General education, not personalized financial advice.
