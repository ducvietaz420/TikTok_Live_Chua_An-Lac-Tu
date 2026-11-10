# AGENTS.md

Instructions for AI coding agents working in this repo (the "đi chùa online" theme for TikTok Live Kit). Reply to the user in their language (usually Vietnamese).

- The engine is [TikTok Live Kit](https://github.com/duycuf/tiktok-live-kit), cloned next to this repo (`../tiktok-live-kit`). Its `AGENTS.md` and `docs/THEME.md` cover how themes work; this repo only holds the `chua` theme (`themes/chua/`), `config.json` and the launch scripts.
- Don't change the kit from here. Theme changes go in `themes/chua/` (`theme.json`, `scene.json`, `theme.js`).
- Keep wording respectful: this is a temple space. Gifts are thanked, never framed as buying blessings; fortune draws are free via chat.

## Going live

When the user wants to go live, **ask before giving steps**:

1. Which app puts the picture on air: LIVE Studio capturing the window (A), OBS → Virtual Camera → LIVE Studio (B, smoothest), or OBS with a stream key (C)?
2. What the account allows: can it already use LIVE Studio, or does it have a stream key? If Studio says "Không có quyền truy cập", start with the phone unlock session.
3. Live data: TikFinity Desktop or the direct connection?

Then walk them through only that route in [GO-LIVE.md](GO-LIVE.md). `run.bat` must run for the whole live in every route.
