# Anchor — Build & Install the Android App (APK)

Your app is a React web app wrapped with **Capacitor** so it can build a real
installable Android APK, with **on-device local notifications** (prayer reminders
+ daily check-in). The APK is built **in the cloud by GitHub Actions** — you do
NOT need Android Studio, Java, or any SDK on your computer.

---

## One-time setup

### 1. Put the project on GitHub
```bash
cd C:\Users\Ousama\Desktop\app_tracker
git init
git add .
git commit -m "Anchor tracker app"
git branch -M main
```

Create a new **empty** repo on github.com (no README), then:
```bash
git remote add origin https://github.com/<your-username>/anchor.git
git push -u origin main
```

### 2. The build starts automatically
Pushing to `main` triggers the workflow in `.github/workflows/build-apk.yml`.
Go to your repo → **Actions** tab → watch "Build Android APK" run (~5–8 min).

### 3. Download your APK
When the run finishes (green check):
- Open the run → scroll to **Artifacts** → download **anchor-apk**
- Unzip it → you get `app-debug.apk`

### 4. Install on your phone
- Copy `app-debug.apk` to your Android phone (email/Drive/USB)
- Tap it → allow "install from unknown sources" if prompted → Install
- Open **Anchor**, go to **Settings** tab → tap **Enable** for notifications

---

## Rebuilding after changes
Any time you edit the app:
```bash
git add .
git commit -m "what changed"
git push
```
A fresh APK builds automatically. Or trigger manually: **Actions → Build Android
APK → Run workflow**.

---

## Notifications — how they work
- **Prayer reminders:** Prayer tab → "Enable prayer reminders". Schedules a
  notification for each *upcoming* prayer today. **Open the app once a day** so
  the next day's times get scheduled (local notifications can't fetch new prayer
  times on their own).
- **Daily check-in:** Settings tab → toggle on + pick a time (default 20:00).
  Repeats every day, reminds you to log sleep/gym/meditation.
- These are **local** notifications (scheduled on the phone) — they work fully
  offline and need no server. This is the right approach for a personal app;
  true server *push* would require a backend + Firebase, which isn't needed here.

---

## Notes / assumptions
- The APK is a **debug** build — installable directly, no Play Store needed.
  (A Play Store release needs a signed "release" APK/AAB — ask if you want that.)
- The `android/` folder is git-ignored on purpose; CI regenerates it each build,
  keeping your repo clean. Nothing about the app is lost.
- App id: `com.anchor.tracker` · App name: **Anchor** (change in
  `capacitor.config.json`).
- Default app icon is Capacitor's placeholder — ask if you want a custom icon.
