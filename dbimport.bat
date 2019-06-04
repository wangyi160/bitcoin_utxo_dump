@echo off
SET count=1
FOR /f "tokens=*" %%G IN ('dir /b csv\out*') DO (
	mongoimport /d mydb /c btcutxo /type csv /file csv\%%G /headerline 
)

