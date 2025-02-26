import axios from "axios";
import { useRef, useState } from "react";

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  // Reference for hidden file input
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
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

  // Simulate file input click
  const handleCustomButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="card shadow-sm p-4 text-center upload-container">
      <h2 className="mb-3">Upload a Meme</h2>

      <div className="mb-3">
        <label className="form-label">Select an Image</label>
        <div className="custom-file-wrapper">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden-file-input"
            accept="image/*"
            onChange={handleFileChange}
          />
          {/* Custom button to trigger file input */}
          <button className="btn btn-secondary custom-file-button" style={{fontSize: "18px", fontWeight: "bolder"}} onClick={handleCustomButtonClick}>
            Choose File
          </button>
          {/* Display selected file name */}
          {file && <span className="file-name">{file.name}</span>}
        </div>
      </div>

      {preview && (
        <div className="mb-3">
          <img src={preview} alt="Preview" className="img-fluid rounded shadow-sm" style={{ maxWidth: "100%", maxHeight: "200px" }} />
        </div>
      )}

      <button className="btn upload-button" onClick={handleUpload} disabled={uploading} style={{fontSize: "18px", fontWeight: "bolder"}} >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {imageUrl && (
        <div className="mt-3">
          <h5>Uploaded Meme:</h5>
          <img src={imageUrl} alt="Uploaded Meme" className="img-fluid rounded shadow-sm mb-2" style={{ maxWidth: "100%", maxHeight: "200px" }} />
          <p>
            <a href={imageUrl} target="_blank" rel="noopener noreferrer">
              View Image
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

export default UploadForm;
