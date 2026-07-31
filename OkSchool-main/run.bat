@echo off
start cmd /k "cd artifacts\api-server && pnpm install && pnpm start"
start cmd /skill-creator "cd okschool && pnpm install && pnpm run dev"
