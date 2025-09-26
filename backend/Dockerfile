# Use a small Node image (arm64 compatible for Pi)
FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Copy package files and install dependencies first (for caching)
COPY package*.json ./
RUN npm install --production

RUN npx playwright install --with-deps chromium

# Copy the rest of the backend source
COPY . .

# Expose your backend port
EXPOSE 5001

# Default command (adjust if you use nodemon in dev)
CMD ["node", "index.js"]

# docker run --rm -p 5001:5001 --env-file .env meme-backend