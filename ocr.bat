@echo off
chcp 65001 >/dev/null
cd /d F:\image-recognition
node windows-ocr.js %*
