Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d C:\Users\fazt\Desktop\ecommerce-clothes\ecommerce-api && npm run dev > C:\tmp\api.log 2>&1", 0, False
WshShell.Run "cmd /c cd /d C:\Users\fazt\Desktop\ecommerce-clothes\ecommerce-web && npm run dev > C:\tmp\web.log 2>&1", 0, False
