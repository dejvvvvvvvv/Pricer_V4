# Changes (clean prototype copy)

Goal: keep the original UI/appearance and functionality, only remove unnecessary files and reduce security risk.

## Removed / excluded from new prototype
- .firebase/
- web-projekt.tar.gz
- test-kirimoto.html
- KIRI_MOTO_DOKUMENTACE.md
- .env (replaced by .env.example)

## Modified
- .gitignore: added .env and build output ignore rules
- .env removed and replaced by .env.example (same content)

## Notes
- No UI/components/pages were removed. Visual appearance should remain the same.
- Firebase web config apiKey is public by design; if you still want it removed, we can switch it to Vite env variables without changing UI.