# npm publishing & repository secrets

The `Publish` workflow ([`.github/workflows/publish.yml`](../.github/workflows/publish.yml))
publishes the `@umbrella-coop/flare-redact-*` packages to npm using the
`NPM_TOKEN` secret, then creates the `v<version>` git tag and GitHub release.

It is called automatically by the `Release` workflow after the version PR merges,
or manually with `gh workflow run publish.yml`.

## Why OTP was failing

npm requires a one-time password for publishing when the account has 2FA set to
"Authorization and writing". CI has no terminal to type an OTP, so `npm publish`
failed with `ERR_PNPM_OTP_NON_INTERACTIVE` / `E429 rate limited otp`.

## Configure a granular access token (no OTP)

Per [npm docs — About access tokens](https://docs.npmjs.com/about-access-tokens):
as of November 2025 only **granular access tokens** exist, and they support a
**"Bypass 2FA"** option that lets a token publish without a one-time password.

1. **npmjs.com → Access Tokens → Generate New Token → Granular Access Token**
2. Configure it:
   - **Name**: `github-actions-publish`
   - **Packages & scopes**: grant access to the **scope** `@umbrella-coop` with
     **Read and write** access.
     - Grant via *packages/scopes*, **not** via *organizations* — an org-level
       token grants org management rights but not the right to publish the
       org-scope packages.
   - **Bypass 2FA**: **enable**. This overrides account- and package-level 2FA for
     publishing, so CI can publish without an OTP.
     - Only do this for the token; keep account-level 2FA enabled. Do **not** use
       a bypass-2FA token if the org/package must enforce 2FA for all publishers.
   - **Expiration**: pick a rotation window (e.g. 1 year).
3. Copy the generated token and store it as the `NPM_TOKEN` secret:
   - **Repo level**: GitHub → Settings → Secrets and variables → Actions →
     *New repository secret* → name `NPM_TOKEN`, value = the token.
   - **Org level** (shared across umbrella-coop repos): org → Settings → Secrets →
     Actions → `NPM_TOKEN`, and make sure `flare-redact-ai-code-assistant` is in
     the secret's selected repositories.
4. Optional: if a token does **not** bypass 2FA, you can still publish manually by
   passing an OTP:
   ```bash
   gh workflow run publish.yml -f otp=<6-digit-code>
   ```

## Alternative: trusted publishing (OIDC, no token)

npm now recommends [trusted publishing](https://docs.npmjs.com/trusted-publishers)
for CI/CD: the GitHub repo is registered as a trusted publisher for the scope, and
`npm publish --provenance` uses a short-lived OIDC token instead of a stored
secret. This removes the long-lived `NPM_TOKEN` entirely.

To adopt it:
1. Register the `umbrella-coop/flare-redact-ai-code-assistant` repository as a
   trusted publisher on the `@umbrella-coop` scope (npm web UI → package settings).
2. Wire OIDC into `publish.yml`: grant the `id-token` permission (set it to
   `write`) and run `npm publish --provenance`, then adjust the publish step
   since `changeset publish` shells out to npm.

The granular token above is the fastest path; trusted publishing is the
more-secure upgrade.

## Required secrets summary

| Secret | Where | Used by |
|---|---|---|
| `NPM_TOKEN` | repo or org | `publish.yml` → `pnpm release` → `npm publish` |
| `GITHUB_TOKEN` | built-in | tagging + GitHub release (`gh release create`) |

Only `NPM_TOKEN` needs to be configured; `GITHUB_TOKEN` is provided by GitHub.
