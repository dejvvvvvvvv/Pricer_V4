# ModelPricer – Local Backend (PrusaSlicer CLI)

This folder adds a simple local Node/Express backend that:
- accepts a 3D model upload (STL/OBJ/3MF)
- runs PrusaSlicer CLI (`prusa-slicer-console.exe`) with an `.ini` profile
- returns parsed results: estimated print time + filament usage

## Where to place this folder
Copy `backend-local/` into the ROOT of your project:

```
C:\Users\Kuňákovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\Model_Pricer-V2-main\backend-local
```

PrusaSlicer portable should be in:

```
...\tools\prusaslicer\PrusaSlicer-2.9.4\prusa-slicer-console.exe
```

## Setup (Windows 10)

1) Create job folders (once):

```powershell
mkdir C:\modelpricer\tmp -Force | Out-Null
mkdir C:\modelpricer\data -Force | Out-Null
mkdir C:\modelpricer\profiles -Force | Out-Null
```

2) Export your default profile from PrusaSlicer GUI and save it as:

```
C:\modelpricer\profiles\default.ini
```

3) Create `.env` from `.env.example` (recommended).
   - Without `.env`, the backend can still run, but you must pass `ini` in each request.
   - With `.env`, you can set a permanent default `.ini` + (optionally) the PrusaSlicer path.

```powershell
cd <PROJECT_ROOT>\backend-local
copy .env.example .env
```

4) Install & run:

```powershell
cd <PROJECT_ROOT>\backend-local
npm install
npm run dev
```

## Test endpoints

### Health
```powershell
curl.exe http://127.0.0.1:3001/api/health
curl.exe http://127.0.0.1:3001/api/health/prusa
```

### Slice (model upload)
```powershell
curl.exe -s -X POST `
  -F "model=@C:\\path\\to\\model.stl" `
  http://127.0.0.1:3001/api/slice
```

Optional custom ini per request:
```powershell
curl.exe -s -X POST `
  -F "model=@C:\\path\\to\\model.stl" `
  -F "ini=@C:\\path\\to\\profile.ini" `
  http://127.0.0.1:3001/api/slice
```

## Response shape
```json
{
  "success": true,
  "jobId": "...",
  "jobDir": "C:\\modelpricer\\tmp\\job-...",
  "outGcodePath": "...",
  "metrics": {
    "estimatedTimeSeconds": 1234,
    "filamentGrams": 12.34,
    "filamentMm": 5678
  },
  "modelInfo": {
    "sizeMm": { "x": 20, "y": 20, "z": 20 },
    "bboxMm": {
      "min": { "x": 0, "y": 0, "z": 0 },
      "max": { "x": 20, "y": 20, "z": 20 }
    },
    "volumeMm3": 7788.19
  }
}
```

## Troubleshooting: metrics are null

Sometimes PrusaSlicer writes the summary lines (filament/time) far into the header.
This backend scans a large head+tail chunk, but if you still get `null`, inspect the G-code:

```powershell
$G="C:\\modelpricer\\tmp\\job-XXXX\\output\\out.gcode"
Select-String -Path $G -Pattern "estimated printing time|printing time|filament used|^;TIME:" | Select-Object -First 50
```
