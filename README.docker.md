# Docker Setup for DG Games

This document explains how to run the DG Games application using Docker.

## Prerequisites

- Docker and Docker Compose installed on your machine
- Create a `.env` file with required environment variables (see below)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
NEXTAUTH_SECRET=your-nextauth-secret
# Add any OAuth provider credentials if needed
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Running in Production Mode

To run the application in production mode:

```bash
docker-compose up -d
```

This will:
- Build the application image
- Start the Next.js application on port 3000
- Start MongoDB on port 27017

## Running in Development Mode

To run the application in development mode with hot reloading:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

This will:
- Start the application in development mode with hot reloading
- Mount your local codebase into the container
- Start Mongo Express (MongoDB UI) on port 8081

## Accessing the Application

- Next.js application: http://localhost:3000
- MongoDB admin interface (development only): http://localhost:8081

## Managing Data

MongoDB data is persisted in a Docker volume named `mongodb_data`. This ensures your data isn't lost when containers are stopped or removed.

## Stopping the Application

```bash
docker-compose down
```

To remove volumes and completely reset:

```bash
docker-compose down -v
``` 