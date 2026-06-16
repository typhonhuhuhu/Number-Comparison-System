@echo off
chcp 65001 >nul
title 炸金花娱乐模拟器 - 一键启动
cd /d "%~dp0"

echo =============================================
echo  炸金花娱乐模拟器 - Windows 一键启动
echo  本项目仅为扑克牌规则娱乐模拟，不涉及真实金钱。
echo =============================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo 未检测到 npm。请先安装 Node.js（会自带 npm）：
  echo https://nodejs.org/
  echo.
  pause
  exit /b 1
)

echo 正在安装依赖，请稍候...
call npm install
if errorlevel 1 (
  echo.
  echo npm install 失败，请检查网络或 npm registry 配置。
  pause
  exit /b 1
)

echo.
echo 正在打开 http://localhost:3000 ...
start "" "http://localhost:3000"
echo 正在启动服务器，关闭此窗口会停止服务。
echo.
call npm start

echo.
echo 服务已停止或启动失败。
pause
