# Build the frontend [dist folder]
# Copy the dist folder content in Backend/public folder
FROM node:20-alpine AS frontend-builder

COPY ./frontend /app

WORKDIR /app

RUN npm i

RUN npm run build

# Build the backend
FROM node:20-alpine

COPY ./backend /app

WORKDIR /app

RUN npm i

COPY --from=frontend-builder /app/dist /app/public

EXPOSE 3000

CMD [ "npm", "start" ]

