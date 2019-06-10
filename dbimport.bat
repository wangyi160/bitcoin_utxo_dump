@echo off
SET count=1
FOR /f "tokens=*" %%G IN ('dir /b csv\out*') DO (
	mongoimport /d mydb2 /c btcutxo /type json /file csv\%%G /jsonArray 
)

