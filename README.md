# Kobo e-Books Update Checker

[繁體中文](README_TW.md)

UserScript that checks whether updates are available for the e-books you own on [Kobo](https://www.kobo.com/).

## Origin

This project is forked from [Kobo e-Books Update Checker](https://greasyfork.org/scripts/482410) by **Jason Kwok**.

## Changes in This Fork

- **Check Results View** — After checking completes, a results window pops up automatically with a summary and a scrollable book list showing the status of each book (color-coded tags).
- **Copy Outdated Books** — A "Copy Outdated Books" button in the results window lets you copy all outdated book titles to the clipboard in one click.
- **Re-check Confirmation** — If the page has already been checked, clicking the check button again asks for confirmation to prevent accidental re-checks.

## Installation

1. Install a userscript manager extension: [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/)
2. Install this UserScript (or manually paste the contents of `kobo-ebooks-update-checker.user.js` into your script manager)
3. Navigate to your [Kobo Library](https://www.kobo.com/) and start using it

## Demo

![Demo 0](images/f3e3fb3953734b544209a8b326a6d0fef7b30a436b18c6321a695570b43e65c8.png)  

![Demo 1](images/e00bf5c85f234f85096a67aa11979c2c4de4a663bcf1f8fac86c38535809fe52.png)  

## License

[MIT](LICENSE) — Original author Jason Kwok, fork maintainer kevin823lin
