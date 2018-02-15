# TucoChat-Twitch
TucoFlyer chat daemon for Twitch.

## Setup

 1. Download the packages using `yarn` or `npm install`.
 2. Define environment variables: `TUCOCHAT_CONNECTION_FILE` for specifying the `connection.txt` path, `TUCOCHAT_TWITCH_OAUTH` for the [Twitch OAuth key](https://twitchapps.com/tmi/), `TUCOCHAT_TWITCH_USERNAME` for the Twitch username (case sensitive), and `TUCOCHAT_TWITCH_CHANNEL` for the channels to join (channel = streamer username with `#` on the start, seperate with commas, ex. `#TucoFlyer,#scanlime`)
 3. Run! (`node index.js`)

## Log data types

 * Magenta: data
 * Blue: method
 * Green: OK
 * Red: FAIL
 * Yellow: Warning

## Dependencies

 * chalk: Used for colored console.
 * deasync: Used to wait for needed async functions (like request).
 * tmi.js: Twitch TMI library.
 * request: Used for HTTP requests. (communication w/ Bot-Controller)
 * websocket: Used for websockets. (communication w/ Bot-Controller)

## To-do

 - [ ] Write websocket code.