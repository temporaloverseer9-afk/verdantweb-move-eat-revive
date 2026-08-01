# EcoJourney Tracker

DATABASE & POINT SYSTEM ARCHITECTURE: Create a user database with fields for Username, TotalPoints, DailyDistance, and TransitLog. Setup the scoring logic as follows:

Walking (2 to 8 km/h, verified by phone step counter): 5 points per km.

Cycling (10 to 25 km/h, verified by accelerometer/bike path mapping): 3 points per km.

Private Car/Cheating (Any speed, failed verification): -1points per km

CORE FEATURES & ANTI-CHEAT LOGIC:

Background Tracking: When movement is detected, ping GPS every 45 seconds.

Walking/Cycling Check: Integrate native device sensor APIs (CoreMotion for iOS / ActivityRecognitionClient for Android) to read the phone's step counter and accelerometer patterns to distinguish active human effort from a motorized vehicle idling in traffic.



USER INTERFACE (UI) LAYOUT:

Home Screen: A large, gamified "Eco-Scoreboard" displaying the user's daily and weekly green points, alongside a live visual progress bar.

Daily Log Screen: A clean list view showing completed trips, verified transit modes (e.g., "Bus Ride Verified - 5km"), and points earned per trip.

Leaderboard Screen: A social tab ranking friends or local users by their weekly accumulated points to drive engagement.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://verdantweb-move-eat-revive.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9fe21959-145f-41a1-b3ca-9a9c7f456ced).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
