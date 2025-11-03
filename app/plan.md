# Frontend Polish Plan (Updated)

## Scope & notes
- Remove manual stream cancellation; streaming toggle just controls SSE vs. full response.
- Convert buttons (send, new chat, sidebar toggle) into icons; minimize copy (no avatar, fewer labels).
- Use proper Russian plural forms for message counters; hide timestamps and other metadata.
- Login becomes optimistic (no ping); 401 during usage kicks back to login with error.
- Palette shift to soft green/turquoise; collapsible sidebar auto-hides when no chats.
- Provide instructions for generating Tauri icons from a 1000×1000 PNG.

## Tasks

1. **Streaming toggle**
   - Add “Стримить” checkbox near composer, default on.
   - When on → `startStreamRequest`; when off → `sendJsonRequest`.
   - Remove stop/abort plumbing (`StreamHandle.abort`, `onStop` props, etc.).

2. **Minimal UI trim**
   - Drop avatar & verbose text; compact sidebar header.
   - Replace “Отправить” button text with paper-plane icon; new chat and sidebar toggle use icons.
   - Simplify empty-state copy.

3. **Auth without ping**
   - On login save creds immediately, skip ping.
   - Central 401 handler clears creds, shows banner, returns to login.

4. **Theme refresh**
   - Apply green/turquoise gradients and adjust typography.
   - Add centered placeholder icon (temporary if final asset not ready).

5. **Sidebar toggle**
   - Icon button to collapse/expand sidebar; width ~260px expanded / 72px collapsed.
   - Auto-hide when no conversations (ties into task 8).

6. **Pluralization & stats cleanup**
   - Replace raw counts with helper that yields “1 сообщение / 2 сообщения / 5 сообщений”.
   - Remove per-message timestamps and conversation updated timestamps.

7. **Hotkeys**
   - Enter = send (unless Shift held), Shift+Enter newline.
   - Cmd+N creates new chat, Cmd+B (or similar) toggles sidebar.

8. **Auto-hide handling**
   - When conversations list empty → collapse sidebar; reopen automatically on first chat.

9. **App icons**
   - Generate multi-size assets from provided 1000×1000 PNG:
     ```bash
     magick giga.png -resize 1024x1024 icons/icon_1024.png
     magick giga.png -resize 512x512 icons/512.png
     magick giga.png -resize 256x256 icons/256.png
     magick giga.png -resize 128x128 icons/128.png
     magick giga.png -resize 64x64 icons/64.png
     magick giga.png -resize 48x48 icons/48.png
     magick giga.png -resize 32x32 icons/32.png
     magick giga.png -resize 16x16 icons/16.png
     # macOS icns
     mkdir icon.iconset
     for size in 16 32 64 128 256 512 1024; do
       magick giga.png -resize ${size}x${size} icon.iconset/icon_${size}x${size}.png
       magick giga.png -resize $((size*2))x$((size*2)) icon.iconset/icon_${size}x${size}@2x.png
     done
     iconutil -c icns icon.iconset -o src-tauri/icons/icon.icns
     # Windows ico
     magick giga.png -define icon:auto-resize="256,128,64,48,32,16" src-tauri/icons/icon.ico
     ```
   - Update `tauri.conf.json` product/title metadata if needed.

10. **Spacing & responsiveness**
    - Increase paddings, responsive gaps; ensure layout breathes on ≥1280px.

## TODOs
- stream-toggle
- minimal-ui-trim
- auth-without-ping
- theme-refresh
- sidebar-toggle
- empty-state-icon
- hotkeys
- auto-hide-sidebar
- pluralization
- app-icons
- spacing-responsive
