import React, { useEffect, useRef } from "react";
import "./TikTokSearch.css";

const TikTokVideo = ({ video }) => {
  const embedRef = useRef(null);

  useEffect(() => {
    if (window.tiktokEmbed) {
      window.tiktokEmbed.load(); // Reload TikTok embed when component mounts
    }
  }, []);

  return (
    <div className="tiktok-card">
      <blockquote
        className="tiktok-embed"
        cite={video.uiFriendlyUrl}
        data-video-id={video.uiFriendlyUrl.split("/video/")[1]}
        ref={embedRef}
      >
        <a href={video.uiFriendlyUrl} target="_blank" rel="noopener noreferrer">
          {video.caption}
        </a>
      </blockquote>
      <script async src="https://www.tiktok.com/embed.js"></script>
      <div className="video-info">
        <a href={video.uiFriendlyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
          <b>Watch on TikTok</b>
        </a>
      </div>
    </div>
  );
};

export default TikTokVideo;
