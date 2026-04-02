<#
.SYNOPSIS
  Creates github.com/<you>/supersize (if missing) and pushes the current branch using GITHUB_TOKEN.

.USAGE
  Reuse the same Personal Access Token as your other projects:

    $env:GITHUB_TOKEN = "ghp_xxxxxxxx"
    cd $PSScriptRoot\..
    .\scripts\push-to-github.ps1

  Needs a PAT with scope: repo (classic) or for fine-grained: Contents read/write on this repository.

  Optional: -RepoName "supersize" -Private
#>
param(
  [string]$RepoName = "supersize",
  [switch]$Private
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root

$token = $env:GITHUB_TOKEN
if (-not $token) {
  Write-Error "Set GITHUB_TOKEN first. Example: `$env:GITHUB_TOKEN = 'ghp_...'"
}

$headers = @{
  Authorization = "Bearer $token"
  Accept        = "application/vnd.github+json"
  "User-Agent"  = "supersize-push-script"
}

$user = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers
$owner = $user.login
Write-Host "GitHub user: $owner"

$exists = $false
try {
  Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$RepoName" -Headers $headers -Method Get | Out-Null
  $exists = $true
} catch {
  if ($_.Exception.Response.StatusCode.value__ -ne 404) { throw }
}

if (-not $exists) {
  $body = @{ name = $RepoName; private = [bool]$Private; auto_init = $false } | ConvertTo-Json
  Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Headers $headers -Method Post -Body $body -ContentType "application/json" | Out-Null
  Write-Host "Created repo: https://github.com/$owner/$RepoName"
} else {
  Write-Host "Repo already exists: https://github.com/$owner/$RepoName"
}

if (-not (Test-Path (Join-Path $root ".git"))) {
  Write-Error "Run 'git init' and commit first, or run from a cloned repo."
}

$branch = (git branch --show-current).Trim()
if (-not $branch) {
  git branch -M main | Out-Null
  $branch = "main"
}

git remote remove origin 2>$null
git remote add origin "https://github.com/$owner/$RepoName.git"

$pushUrl = "https://x-access-token:$token@github.com/$owner/$RepoName.git"
git push -u $pushUrl $branch

Write-Host "Pushed $branch. Remote: https://github.com/$owner/$RepoName (token not stored in .git/config)."
