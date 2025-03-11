import React from "react";

const About = () => {
  return (
    <div className="mt-5 container-fluid">
      <div className="row align-items-center">
        {/* Image Section */}
        <div className="col-md-6 text-center">
          <img
            src="https://trevorshumway.com/images/tiktok_saved.jpeg"
            alt="TikTok and Meme Searching"
            className="img-fluid rounded shadow-lg w-50"
          />
        </div>

        {/* About Content */}
        <div className="col-md-6">
          <h1 className="fw-bold text-primary">
            Find Your Saved TikToks & Memes Instantly
          </h1>
          <p className="lead">
            Ever wanted to rewatch a "Saved" TikTok or show that hidden gem to a
            friend, and then struggled to find it again? Many TikTok users have hundreds or thousands of
            saved TikToks, and scrolling through your Saved
            collection to find the right one can be frustrating, especially if
            you saved it a long time ago. <b>Now, you can instantly search your
            saved TikToks using AI-powered natural language search.</b>
          </p>

          <p> 
            TikTok already has a solid search feature, likely powered by AI, but
            it searches across the entire platform. <b>What makes this tool
            unique is that it focuses exclusively on your Saved videos</b>—the
            ones you’ve already curated and want to find again. By leveraging a
            <b> vectorized database and AI-powered search parameters</b>, this tool
            provides a deeper, more intuitive way to recall your Saved
            TikToks. Instead of relying on exact text matches, it understands
            meaning and context, making it far better at surfacing the videos
            you're looking for.
          </p>

          <h4 className="fw-bold text-secondary mt-4">How It Works:</h4>
          <ul className="list-group list-group-flush">
            <li className="list-group-item">
              🎥 <b>Search Your Saved TikToks</b> - AI summarizes your saved
              TikToks so you can find them instantly.
            </li>
            <li className="list-group-item">
              📝 <b>AI-Powered Summaries</b> - The app extracts captions, authors,
              keywords, and transcriptions.
            </li>
            <li className="list-group-item">
              🧠 <b>Vectorized Search</b> - AI converts TikTok descriptions and
              meme captions into searchable data.
            </li>
            <li className="list-group-item">
              🔍 <b>Instant Retrieval</b> - Enter any description or keyword, and
              the app finds the TikTok or meme you're looking for.
            </li>
            <li className="list-group-item">
              ⚡ <b>Google SSO Login & Private Search</b> - Your searches are
              private and only accessible to you.
            </li>
          </ul>

          <p className="mt-3">
            This app reinvents how you <b>find your saved TikToks and memes</b>. No
            more endless scrolling—just search naturally, and the AI does the
            work for you!
          </p>


          <p>
            Similarly, this app also solves a similar problem of <b>meme searching</b> on your camera role, 
            which has the same problem—there's not a powerful way to search them with AI! Sure, you can search for specific
            keywords or objects, but most memes cannot be found in such a simple way. AI and vectorized search allows you
            to go deeper and use the power of AI to find memes that are abstractly related to your text based search. 
          </p>

          <p className="text-muted">
            Enjoy finding your favorite TikToks and memes effortlessly! 🚀
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
