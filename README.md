# Meme Search

Meme Search is a full-stack web app that allows users to upload memes, generate AI-powered descriptions, and search for previously uploaded memes using natural language processing and a vector database.

## Features
- **Google SSO Authentication**: Secure login using Google Sign-In, with access restricted to whitelisted email addresses.
- **Meme Uploading**: Batch upload memes, which are asynchronously stored in AWS S3.
- **AI-Powered Descriptions**: OpenAI processes each uploaded meme to generate a textual description.
- **Vector Search**: Meme descriptions are vectorized and indexed in Pinecone, enabling fast and accurate similarity searches using natural language queries.
- **Modern UI**: A polished and responsive interface styled with Bootstrap for a seamless user experience.
- **Private Access**: Only authenticated users can access the app, ensuring a controlled user environment.

## Tech Stack
- **Frontend**: React, Bootstrap
- **Backend**: Node.js (Express) with modularized services for authentication, file storage, AI processing, and vector search
- **Database**: Pinecone for vector search, AWS S3 for meme storage
- **Authentication**: Firebase Authentication (Google SSO)
- **Hosting**:
  - React frontend: Hosted on AWS S3 with a custom domain (https://memes.trevorshumway.com)
  - Backend: Hosted on AWS Elastic Beanstalk

## Future Enhancements
- Support for TikTok "Saved Videos"
    - Upload your TikTok data as JSON, AI asynchronously summarizes your "Saved" videos allowing you to do AI powered natural language searches on your TikToks.
- Improved user experience with additional UI refinements

## Author
Developed by Trevor Shumway


