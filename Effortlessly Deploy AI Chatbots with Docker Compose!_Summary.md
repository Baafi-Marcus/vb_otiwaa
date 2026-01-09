# Effortlessly Deploy AI Chatbots with Docker Compose!

## Overview
This tutorial demonstrates how to effortlessly deploy a WhatsApp AI chatbot using Docker Compose. It covers essential steps, from initial setup and Docker configuration to integrating Redis for data persistence and production deployment on a VPS with Dokploy, ensuring seamless service communication and functionality testing.

`#AI Chatbot`  `#Docker Compose`  `#Redis Integration`  `#VPS Deployment`  `#NestJS Tutorial`

## Timeline

## 00:00:00 - 00:01:27

Introduction & Problem Overview


- 00:00:00  The chatbot uses a NestJS backend, GPT-4 for intelligence, and Redis for conversational context.

- 00:00:18  The video will demonstrate simplifying deployment using Docker Compose to manage the backend, Redis, and environment files.

- 00:00:53  Docker Compose addresses the time-consuming and error-prone process of manually managing multiple services in application deployment.

- 00:01:11  It bundles all application requirements, including services, into a single configuration file for streamlined deployment.

## 00:01:27 - 00:02:14

Setting Up the Project


- 00:01:35  Install Docker for your platform using the link provided in the description.

- 00:01:44  Clone the WhatsApp AI chatbot's source code from the public GitHub repository.

- 00:01:55  Create a new development branch named "dev/dockerise-application" to work on your changes.

## 00:02:14 - 00:03:30

Using Docker Init Command


- 00:02:14  The 'docker init' command is used to set up boilerplate code for dockerizing the application, automating much of the initial configuration.

- 00:02:25  The command automatically detects the application type as Node.js and prompts for the version, start script, and listening port.

- 00:03:00  Docker init generates a .dockerignore file, a Dockerfile, a compose file, and a README with instructions for starting the application.

- 00:03:19  The generated Dockerfile uses the Alpine version of the image, which is a lean and secure container optimized for running the application.

## 00:03:30 - 00:04:40

Configuring Docker Compose


- 00:03:34  The Dockerfile's instructions are used by taking the context from the current directory, which is the root of the project.

- 00:03:47  Redis is specified as a service for conversational intelligence, using the Redis 8 alpine version.

- 00:04:03  The application will not start without proper configuration because Redis is a critical part of the application.

- 00:04:24  Environment variables are missing and need to be specified in the compose file to add them to the container.

## 00:04:40 - 00:05:25

Adding Redis Service


- 00:04:40  The segment begins with the chapter title, 'Adding Redis Service'.

- 00:04:51  The presenter returns to the terminal, confirming environment files are loaded but noting a connection issue to Redis.

- 00:05:00  It is explained that both the server and Redis are part of the same Docker network.

- 00:05:24  The presenter demonstrates that Redis can be referenced directly by its container name and port 6379 within the Docker network.

## 00:05:25 - 00:06:45

Docker Networking Magic


- 00:05:36  The application successfully starts after running the command in the terminal.

- 00:05:43  The configuration can be improved to ensure the NestJS server starts only after the Redis container is ready.

- 00:05:56  Using 'depends_on' with the 'service_started' condition ensures the server builds and starts only after Redis is operational.

- 00:06:20  To prevent the loss of conversational context when containers stop, Redis data needs to be made persistent.

## 00:06:45 - 00:06:59

Adding Service Dependencies


- 00:06:45  The segment begins with the chapter title, "Adding Service Dependencies."

- 00:06:45  A volume has been created specifically for Redis data to ensure persistence.

## 00:06:59 - 00:08:00

Preparing for Production Deployment


- 00:07:14  The current configuration will be hosted on a VPS using Dokploy, continuing from a previous video that covered VPS setup and WhatsApp application deployment.

- 00:07:30  The chatbot setup, including the NestJS backend and Redis, is now fully defined in a Docker Compose file, eliminating the need for manual creation.

- 00:07:50  A separate Docker Compose file will be created specifically for Dokploy to accommodate additional steps required for its deployment setup.

## 00:08:00 - 00:15:34

Dokploy Configuration, Domain Setup, and Chatbot Testing


- 00:08:02  The process begins by extending the Docker Compose file to include Dokploy-specific configurations, such as adding networks and Traefik labels for routing domains to services.

- 00:11:30  The deployment is configured on Dokploy by selecting the GitHub repository and branch, specifying the Dokploy Compose file, and setting up environment variables including the TRAEFIK_HOST and changing entry points to 'websecure' for HTTPS.

- 00:13:15  After committing the code, the application automatically deploys, and a domain is added with an SSL certificate issued by Let's Encrypt, targeting the 'server' service on port 3000.

- 00:14:11  Initial testing of the chatbot confirms text-based responses, but image generation fails due to permission issues, which are resolved by granting write permissions to the 'node' user within the application, leading to successful image generation upon re-deployment.


> Generated by WayinVideo | https://wayin.ai/wayinvideo/