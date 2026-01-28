# Profiles (.ini)

For slicing to be meaningful, PrusaSlicer needs a profile (`.ini`).

## Recommended prototype setup
1) Open PrusaSlicer GUI
2) Select your Printer + Filament + Print settings
3) Export config/profile to an `.ini` file
4) Save it as:

```
C:\modelpricer\profiles\default.ini
```

The backend will use this file by default (via `PRUSA_DEFAULT_INI`).

## Later (ModelPricer Admin)
In the real product you will generate/select the `.ini` based on Admin Presets and send it to the backend.
