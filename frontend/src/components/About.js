import React from "react";

const About = () => {
  return (
    <div className="mt-5 container-fluid">
      <div className="row align-items-center" >
        {/* Image Section */}
        <div className="col-md-6 text-center">
          <img
            src="https://trevorshumway.com/images/meme.jpeg"
            alt="Meme Searching"
            className="img-fluid rounded shadow-lg"
          />
        </div>

        {/* About Content */}
        <div className="col-md-6">
          <h1 className="fw-bold text-primary">About Smart Meme Index</h1>
          <p className="lead">
            Memes have been a core part of internet culture for years.
            However, finding a specific meme can be surprisingly difficult. Whether it's buried
            in your camera roll, lost in a group chat, or impossible to find through traditional
            search engines, meme remembering and retrieval can be frustrating.
          </p>

          <p>
            I built this app to make meme searching fast, easy, and AI-powered. This is a
            full-stack web app built with Node.js and React, deployed on AWS Elastic Beanstalk.
            It leverages cutting-edge AI to allow natural language meme search using OpenAI and Pinecone.
          </p>

          <h4 className="fw-bold text-secondary mt-4">How It Works:</h4>
          <ul className="list-group list-group-flush" >
            <li className="list-group-item">
              📂 Meme Upload - Upload your memes, and they are stored securely in AWS S3.
            </li>
            <li className="list-group-item">
              📝 AI Meme Analysis - OpenAI analyzes and generates a concise summary of the meme.
            </li>
            <li className="list-group-item">
              🧠 Vectorized Database - The AI-generated summary is stored in Pinecone (Vector Database).
            </li>
            <li className="list-group-item">
              🔍 Natural Language Search - When searching for a meme, OpenAI converts your 
              query into a vector representation.
            </li>
            <li className="list-group-item">
              ⚡ AI-Powered Retrieval - The app finds and returns most relevant memes based on similarity.
            </li>
          </ul>

          <p className="mt-3">
            This app reinvents meme searching by leveraging artificial intelligence and vector search technology 
            to help you quickly find memes using simple descriptions. Whether you remember a funny caption, 
            a vague description, or a meme's theme, this app will find it for you!
          </p>

          <p className="text-muted">Enjoy finding your favorite memes effortlessly! 🚀</p>
        </div>
      </div>
    </div>
  );
};

export default About;
