@echo off
setlocal enabledelayedexpansion
if not exist .env.mcp (
  echo Missing .env.mcp in repo root. Copy .env.mcp.example ^> .env.mcp and fill keys.
  exit /b 1
)
for /f "usebackq tokens=* delims=" %%L in (`type .env.mcp`) do (
  set "line=%%L"
  if not "!line!"=="" (
    if not "!line:~0,1!"=="#" (
      for /f "tokens=1,* delims==" %%A in ("!line!") do (
        set "%%A=%%B"
      )
    )
  )
)
echo MCP env loaded for this terminal session.
