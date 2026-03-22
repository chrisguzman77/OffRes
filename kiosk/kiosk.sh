#!/bin/bash
echo "Waiting for backend..."
for i in $(seq 1 30); do
	if curl -s http://localhost:8000/health > /dev/null 2>&1; then
		echo "Backend is ready!"
		break
	fi
	sleep 1
done

xset s off
xset -dpms
xset s noblank

unclutter -idle 3 &

# System on-screen keyboard (Chromium’s built-in VK still needs focus; many Pi images
# have no keyboard until one of these is running).
if [ -n "${WAYLAND_DISPLAY:-}" ]; then
	if command -v squeekboard >/dev/null 2>&1; then
		squeekboard >/dev/null 2>&1 &
	elif command -v wvkbd-mobintl >/dev/null 2>&1; then
		wvkbd-mobintl >/dev/null 2>&1 &
	fi
else
	if command -v onboard >/dev/null 2>&1; then
		onboard --size=large >/dev/null 2>&1 &
	fi
fi

chromium-browser \
	--kiosk \
	--noerrdialogs \
	--disable-infobars \
	--disable-session-crashed-bubble \
	--disable-restore-session-state \
	--disable-component-update \
	--disable-features=TranslateUI \
	--overscroll-history-navigation=0 \
	--touch-events=enabled \
	--enable-features=VirtualKeyboard \
	http://localhost:8000
