## EDUCATION TELEGRAM BOT

Feature
- Brainly Text Search
- Roboguru Text Search

Windows
```bash
git clone https://github.com/navetacandra/education-telegram-bot
cd education-telegram-bot
npm install
npm start
```

Termux (Android)
```bash
pkg update -y && pkg upgrade -y
pkg install proot-distro
proot-distro install alpine
proot-distro login alpine
apk update && apk add --no-cache nmap && \
  echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
  echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
  apk update && \
  apk add --no-cache \
  chromium
```
```bash
git clone https://github.com/navetacandra/education-telegram-bot
cd education-telegram-bot
npm install
npm start
```