@echo off
@if not exist "node_modules" (
echo Installing...
npm i
)
node vac-checker.js
pause