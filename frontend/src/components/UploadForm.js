import axios from "axios";
import { useState } from "react";

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an image first.");
      return;
    }

    setUploading(true);
    
    const formData = new FormData();
    formData.append("meme", file);

    try {
      const response = await axios.post("http://localhost:5001/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setImageUrl(response.data.imageUrl);
      alert("Upload successful!");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Check the console for details.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Upload a Meme</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      
      {preview && (
        <div>
          <img src={preview} alt="Preview" style={{ width: "300px", marginTop: "10px" }} />
        </div>
      )}

      <button onClick={handleUpload} disabled={uploading} style={{ marginTop: "10px" }}>
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {imageUrl && (
        <div style={{ marginTop: "20px" }}>
          <h3>Uploaded Meme:</h3>
          <img src={imageUrl} alt="Uploaded Meme" style={{ width: "300px" }} />
          <p>Image URL: <a href={imageUrl} target="_blank" rel="noopener noreferrer">{imageUrl}</a></p>
        </div>
      )}
    </div>
  );
};

export default UploadForm;
