#Basisimage
FROM arm32v7/node

#Zusätzliche Programme oder Einstellungen vornehmen
#...
#...

#App installieren 
WORKDIR /app
COPY app /app
RUN npm install

#Startdatei festlegen
RUN ["chmod", "+x", "./start.sh"]
CMD ["./start.sh"]

