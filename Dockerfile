FROM node:14

WORKDIR /app

COPY . .

# install dependencies in node_modules
RUN npm install --quiet

# install pm2 for process management
RUN npm install pm2 -g

EXPOSE 80

CMD ["pm2-runtime", "index.js"]