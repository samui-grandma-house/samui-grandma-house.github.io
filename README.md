# Samui Grandma House

Static website published from the root of the `main` branch.

## Website visibility switch

Near the top of `index.html`, change the setting on the `<html>` element:

- `data-site-offline="true"`: show only “Website unavailable”.
- `data-site-offline="false"`: show the normal website (default).

Then publish the change:

```sh
git add index.html
git commit -m "Update website visibility"
git push
```

Wait for GitHub Pages deployment to finish, then reload the website. This is a visual switch, not access control: the source and assets remain public, and the page still returns HTTP 200. Already-open pages change only after reloading. The unavailable view also works without JavaScript.
