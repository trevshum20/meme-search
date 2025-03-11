# Meme Search

Meme Search is a full-stack web app that allows users to **search their saved TikToks** and also **find uploaded meme images** using AI-powered natural language processing and a vector database.

## Features

### 🔥 **AI-Powered TikTok Search** (New!)
- **Instantly find your saved TikToks.** No more scrolling endlessly through thousands of saved videos.
- **Search by keywords, captions, or video transcripts.** Our AI processes your saved TikToks and enables seamless search.
- **Rewatch and share easily.** Click on a search result to open the original TikTok and share it with friends.

### 🖼 **Meme Search & Upload**
- **Batch upload memes**: Upload multiple memes at once, which are asynchronously stored in AWS S3.
- **AI-Powered Descriptions**: OpenAI processes each uploaded meme to generate a textual description.
- **Vector Search**: Meme descriptions are vectorized and indexed in Pinecone, enabling fast and accurate similarity searches using natural language queries.
- **Modern UI**: A polished and responsive interface styled with Bootstrap for a seamless user experience.

### 🔑 **Secure & Private**
- **Google SSO Authentication**: Secure login using Google Sign-In, with access restricted to whitelisted email addresses.
- **Private Access**: Only authenticated users can access the app, ensuring a controlled user environment.

## Tech Stack
- **Frontend**: React, Bootstrap
- **Backend**: Node.js (Express) with modularized services for authentication, file storage, AI processing, and vector search
- **Database**: Pinecone for vector search, AWS S3 for meme storage, DynamoDB for record ownership and multi-tenancy.
- **Authentication**: Firebase Authentication (Google SSO)
- **Hosting**:
  - React frontend: Hosted on AWS S3 with a custom domain (https://memes.trevorshumway.com)
  - Backend: Hosted on AWS Elastic Beanstalk

## Future Enhancements
- **Automated TikTok Ingestion**
  - Upload your TikTok data as JSON, and AI asynchronously summarizes your **Saved** videos, allowing you to perform AI-powered natural language searches on your TikToks.
- **Enhanced Search Accuracy**
  - Improve AI summarization and ranking algorithms for even better search results.
- **UI Refinements & Mobile Optimizations**

## Author
Developed by Trevor Shumway