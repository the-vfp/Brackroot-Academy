# One-time provisioning of the nudge server on Vercel. Run from the repo root
# AFTER `npx vercel login` (that step needs a human: it opens a browser/email).
#
#   npx vercel login
#   .\scripts\nudges-setup.ps1
#
# What it does: link this folder to the existing Vercel project, create a
# private Blob store for the device documents, push the secrets from .env.local
# as production env vars, deploy to production, then smoke-test /api/tick.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path '.env.local')) { throw '.env.local is missing (it holds the VAPID keys + admin key).' }
$env = @{}
Get-Content '.env.local' | ForEach-Object { if ($_ -match '^([A-Z_]+)=(.*)$') { $env[$matches[1]] = $matches[2] } }
foreach ($k in 'VAPID_PUBLIC_KEY','VAPID_PRIVATE_KEY','VAPID_SUBJECT','NUDGE_ADMIN_KEY') {
  if (-not $env[$k]) { throw ".env.local has no $k" }
}

Write-Host '1/5 Linking to the Vercel project (pick the existing "brackroot" project)...'
npx vercel link --yes --project brackroot
if ($LASTEXITCODE -ne 0) { npx vercel link }   # fall back to the interactive picker

Write-Host '2/5 Creating the private Blob store (safe to re-run; the CLI refuses duplicates)...'
npx vercel blob create-store brackroot-nudges --access private --yes
# Linking the store injects BLOB_READ_WRITE_TOKEN into the project. If the CLI
# didn't link it automatically, do it once in the dashboard: Storage > Connect.

Write-Host '3/5 Setting production env vars...'
# The two VITE_ values are public and also let the Vercel-hosted copy of the
# client find the nudge server (GitHub Pages gets them from repo variables).
$env['VITE_VAPID_PUBLIC_KEY'] = $env['VAPID_PUBLIC_KEY']
foreach ($k in 'VAPID_PUBLIC_KEY','VAPID_PRIVATE_KEY','VAPID_SUBJECT','NUDGE_ADMIN_KEY','VITE_NUDGE_API','VITE_VAPID_PUBLIC_KEY') {
  npx vercel env rm $k production --yes 2>$null
  $env[$k] | npx vercel env add $k production
}

Write-Host '4/5 Deploying to production...'
npx vercel deploy --prod --yes

Write-Host '5/5 Smoke test...'
$api = 'https://brackroot.vercel.app'
$r = Invoke-RestMethod -Uri "$api/api/tick" -Headers @{ 'X-Nudge-Key' = $env['NUDGE_ADMIN_KEY'] }
$r | ConvertTo-Json -Depth 5
Write-Host "Done. If 'ok' is true above, the server is live. Now merge the nudges branch to main (GitHub Pages picks up the client)."
