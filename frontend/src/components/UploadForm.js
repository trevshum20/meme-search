import axios from "axios";
import { useRef, useState } from "react";
import { getFirebaseToken } from "../firebase";

const UploadForm = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

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
      const token = await getFirebaseToken();
      await axios.post("http://localhost:5001/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}`},
      });

      alert("Upload successful!");
      setFile(null);
      setPreview(null);
      fileInputRef.current.value = ""; // Reset file input

      // Notify RecentMemes to refetch
      onUploadSuccess();
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Check the console for details.");
    } finally {
      setUploading(false);
    }
  };

  const handleCustomButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="card shadow-sm p-4 text-center upload-container">
      <h2 className="mb-3"><b>Upload a Meme</b></h2>

      <div className="mb-3">
        <label className="form-label">Select an Image</label>
        <div className="custom-file-wrapper">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden-file-input"
            accept="image/*"
            onChange={handleFileChange}
          />
          <button className="btn btn-secondary custom-file-button" onClick={handleCustomButtonClick} style={{fontSize: "18px", fontWeight: "bolder"}} >
            Choose File
          </button>
          {file && <span className="file-name">{file.name}</span>}
        </div>
      </div>

      {preview && (
        <div className="mb-3">
          <img src={preview} alt="Preview" className="img-fluid rounded shadow-sm" style={{ maxHeight: "150px", maxHeight: "200px" }} />
        </div>
      )}

      <button className="btn upload-button" onClick={handleUpload} disabled={uploading} style={{fontSize: "18px", fontWeight: "bolder"}} >
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
};

export default UploadForm;
