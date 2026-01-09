# Build an AI WhatsApp Chatbot with NestJS, GPT-4o, & WhatsApp Cloud API: Step-by-Step Guide

## Overview
This tutorial provides a comprehensive guide to building a WhatsApp chatbot using NestJS, GPT-4o, and the WhatsApp Cloud API. It covers environment setup, WhatsApp app configuration, backend development, webhook verification, message processing, AI integration, and adding conversational context with Redis for enhanced user interaction.

`#AIChatbot`  `#WhatsAppAPI`  `#NestJS`  `#GPT4o`  `#RedisIntegration`

## Timeline

## 00:00:00 - 00:00:15

Introduction to Building a WhatsApp Chatbot with GPT-4o


- 00:00:00  The tutorial will guide users through building a WhatsApp chatbot with GPT-4o, noting that the process is not overly complex.

- 00:00:13  The presenter will use WebStorm and Windows Subsystem for Linux (WSL 2) running Ubuntu, but encourages viewers to use their preferred editor and environment, starting with nvm and Node.js installation.

## 00:00:15 - 00:01:15

Setting Up Your Development Environment


- 00:00:25  Install Node.js using a version manager and verify its installation by running a simple command in the terminal.

- 00:00:38  Install the Nest CLI to automate the creation of NestJS project components and then create a new NestJS project using the 'nest new' command.

- 00:01:01  Navigate into the newly created project folder, start the application in development mode, and verify it's running by accessing localhost port 3000.

- 00:01:14  Log in to the Facebook for Developers platform to create a new WhatsApp application for integration, selecting 'other' as the application type.

## 00:01:15 - 00:02:26

Creating a WhatsApp Application on Facebook Developer Platform


- 00:01:26  Create a business app on the Facebook Developer Platform, providing an application name and selecting a business portfolio.

- 00:01:38  Set up WhatsApp integration within the newly created application, noting that in a testing environment, messages can only be sent to verified phone numbers.

- 00:02:04  Test the application by sending a message to confirm everything is working correctly and fork a Postman collection for easier API reference during development.

## 00:02:26 - 00:03:51

Building the Chatbot Backend with NestJS


- 00:02:29  The video demonstrates how to generate a WhatsApp module and controller using NestJS CLI, explaining their roles in organizing application functionality and handling HTTP requests.

- 00:03:05  A WhatsApp service is created and automatically registered, illustrating how controllers delegate requests to services for processing.

- 00:03:17  An example of defining an endpoint in NestJS is shown, creating a "Hello World" API using the @Get decorator.

- 00:03:42  The segment concludes by preparing for WhatsApp Webhook verification, which is necessary to authenticate the application with WhatsApp servers.

## 00:03:51 - 00:07:17

Implementing WhatsApp Cloud API Webhook Verification


- 00:03:54  Create a WhatsApp verification challenge function to save the mode, challenge, and a self-generated token from the incoming request for server verification.

- 00:04:44  Authenticate the server on the WhatsApp Cloud API by responding with the hub challenge if the mode is 'subscribe' and the tokens match, and store the verification token securely in an environment file, excluding it from version control.

- 00:05:22  Generate a random, base64-encoded cryptographic key using OpenSSL for the WhatsApp Cloud API Webhook verification token and save it as a single line in the environment file.

- 00:06:23  Install and import the NestJS config module to enable NestJS to work with the environment file, then verify and save the Webhook configuration on the Meta for Developers platform, subscribing to the message Webhook to prepare for receiving and responding to WhatsApp messages.

## 00:07:17 - 00:08:16

Handling Incoming WhatsApp Messages and Extracting Data


- 00:07:26  The system extracts the sender ID and message ID from incoming messages, using a switch statement to handle various message types such as text, audio, or images.

- 00:07:38  Currently, the focus is on text messages, where the content is found within the message's text body, and using Postman is recommended for easier development.

- 00:07:51  To prepare a response, a JSON object from Postman's text message sending request is copied, encoded as a JSON string, and the recipient phone number is replaced with the message sender ID.

- 00:08:03  The "@nestjs/axios" package is installed to enable POST requests in NestJS, and the HTTP service is then imported and registered in the controller.

## 00:08:16 - 00:10:41

Sending Messages with the WhatsApp Cloud API


- 00:08:16  The process begins by obtaining a code snippet for sending messages via the WhatsApp Cloud API using Postman, specifically selecting "NodeJs - Axios".

- 00:08:29  The configuration object, including the Bearer token, version, and phone number ID, is copied and saved in the .env file for environment variables, with the access token obtained from the Facebook for Developers platform.

- 00:09:01  The HTTP service from "@nestjs/axios" is used to make a POST request with the specified URL, JSON-serialized data, and configuration, while also implementing error handling and logging for debugging.

- 00:09:49  To keep controllers lean, the logic for sending WhatsApp messages is delegated to a dedicated WhatsApp service, which is then imported and called from the WhatsApp controller, ensuring modularity and maintainability.

## 00:10:41 - 00:12:47

Integrating GPT-4o for Intelligent Responses (OpenAI API)


- 00:10:50  Create an OpenAI service using NestJS CLI, install the OpenAI package, and instantiate a new class to prepare for generating responses.

- 00:11:13  Utilize 'chat completions.create' with the GPT-4o model to generate AI responses, targeting the first response choice.

- 00:11:50  Replace the static message in the WhatsApp service with the AI-generated response from GPT-4o and securely store the OpenAI API key in the environment file.

- 00:12:27  Correct a minor error in the WhatsApp controller by supplying the text message to the 'send WhatsApp' function and test the chatbot's AI response to a user query.

## 00:12:47 - 00:22:12

Adding Conversational Context with Redis (Upstash)


- 00:12:53  The tutorial demonstrates how to store conversation history in Redis for fast read and write operations, utilizing Upstash's free tier for a Redis instance.

- 00:14:09  The user context is imported into the WhatsApp service to save incoming messages and GPT-4o responses, making the AI context-aware by fetching conversation history using the user's phone number as a unique identifier.

- 00:16:03  To optimize the process of saving and fetching conversation history, a Redis pipeline is implemented to combine multiple requests into a single operation, improving efficiency.

- 00:17:58  The chatbot's personality is defined using system prompts, and user phone numbers are hashed for security, while a rolling expiration policy is implemented in Redis to automatically delete conversation context after three hours.


> Generated by WayinVideo | https://wayin.ai/wayinvideo/