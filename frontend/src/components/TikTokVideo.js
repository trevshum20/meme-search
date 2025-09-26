import React, { useEffect, useRef } from "react";
import "./TikTokSearch.css";

const TikTokVideo = ({ video }) => {
  const embedRef = useRef(null);

  // Prefer uiFriendlyUrl, else originalUrl (new), else original_url (defensive)
  const url =
    video?.uiFriendlyUrl ||
    video?.originalUrl ||
    video?.original_url ||
    "";

  // Try to grab the numeric id after /video/
  const videoId = (() => {
    const m = url.match(/\/video\/(\d+)/);
    return m ? m[1] : "";
  })();

  const caption = video?.caption || video?.ogDescription || "View on TikTok";

  useEffect(() => {
    // If TikTok embed script already loaded, ask it to (re)hydrate this block
    if (window.tiktokEmbed?.load) {
      window.tiktokEmbed.load();
    }
  }, [url]);

  if (!url) {
    // nothing to render if we didn't get a usable URL
    return null;
  }

  return (
    <div className="tiktok-card">
      <blockquote
        className="tiktok-embed"
        cite={url}
        data-video-id={videoId}
        ref={embedRef}
      >
        <a href={url} target="_blank" rel="noopener noreferrer">
          {caption}
        </a>
      </blockquote>

      {/* Keep the embed script; TikTok recommends including it near the embed */}
      <script async src="https://www.tiktok.com/embed.js"></script>

      <div className="video-info">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          <b>Watch on TikTok</b>
        </a>
      </div>
    </div>
  );
};

export default TikTokVideo;
