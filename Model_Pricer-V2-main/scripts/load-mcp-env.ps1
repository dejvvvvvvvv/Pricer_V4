$envFile = Join-Path (Get-Location) ".env.mcp"
if (-not (Test-Path $envFile)) {
  Write-Host "Missing .env.mcp in repo root. Copy .env.mcp.example -> .env.mcp and fill keys." -ForegroundColor Red
  exit 1
}

Get-Content $envFile | ForEach-Object {
  $l = $_.Trim()
  if ($l -eq "" -or $l.StartsWith("#")) { return }
  $i = $l.IndexOf("=")
  if ($i -lt 1) { return }
  $k = $l.Substring(0,$i).Trim()
  $v = $l.Substring($i+1).Trim()
  if ($k -ne "") { Set-Item -Path ("Env:" + $k) -Value $v }
}

Write-Host "MCP env loaded for this terminal session." -ForegroundColor Green
