import axios from "axios";
import { useEffect, useState } from "react";

const AllMemes = () => {
  const [memes, setMemes] = useState([]);

  useEffect(() => {
    const fetchAllMemes = async () => {
      try {
        const response = await axios.get("http://localhost:5001/api/all-memes");
        setMemes(response.data);
      } catch (error) {
        console.error("Error fetching all memes:", error);
      }
    };

    fetchAllMemes();
  }, []);

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">All Memes</h2>
      
      {memes.length > 0 ? (
        <div className="row g-4">
          {memes.map((meme, index) => (
            <div key={index} className="col-lg-3 col-md-4 col-sm-6">
              <a href={meme.imageUrl} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                <div className="card shadow-sm">
                  <img src={meme.imageUrl} alt="Meme" className="card-img-top" style={{ objectFit: "cover", height: "200px" }} />
                </div>
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted">No memes available.</p>
      )}
    </div>
  );
};

export default AllMemes;
