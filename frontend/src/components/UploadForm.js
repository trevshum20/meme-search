import axios from "axios";
import { useRef, useState } from "react";
import { getFirebaseToken } from "../firebase";
import ImagePreview from "./ImagePreview";
import "./UploadForm.css";

const UploadForm = ({ onUploadSuccess, user }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL;

  // Reference for hidden file input
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const files = event.target.files;
    if (!files.length) return;

    if (files.length > 10) {
      alert("You can only upload up to 10 images at a time.");
      event.target.value = ""; // Reset input
      return;
    }

    const fileArray = Array.from(files);
    const previews = fileArray.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      context: { popCulture: "", characters: "", notes: "" }, // Initial empty context
    }));

    setSelectedFiles(previews);
  };

  const updateFileContext = (index, newContext) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.map((file, i) => (i === index ? { ...file, context: newContext } : file))
    );
  };

  const removeFile = (index) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };
  

  const handleUpload = async () => {
    if (!selectedFiles.length) {
      alert("Please select images first.");
      return;
    }

    setUploading(true);

    try {
      const token = await getFirebaseToken();
      const formData = new FormData();

      // Append all files under the same key "memes"
      selectedFiles.forEach(({ file }) => {
        formData.append("memes", file); // Ensure "memes" matches backend array key
      });

      formData.append("userEmail", user.email);
      formData.append("context", JSON.stringify(selectedFiles.map(f => f.context)));

      await axios.post(`${BACKEND_BASE_URL}/api/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      alert("All uploads successful!");
      setSelectedFiles([]);
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
      <h2 className="mb-3">
        <b>Upload Memes</b>
      </h2>

      <div className="mb-3">
        <label className="form-label">Select Images</label>
        <div className="custom-file-wrapper">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden-file-input"
            multiple
            accept="image/*"
            onChange={handleFileChange}
          />
          <button
            className="btn btn-secondary custom-file-button"
            onClick={handleCustomButtonClick}
            style={{ fontSize: "18px", fontWeight: "bolder" }}
          >
            Choose Files
          </button>
        </div>
      </div>

      {/* Image Previews with Context Inputs */}
      <div className="image-preview-container">
        {selectedFiles.map((file, index) => (
          <ImagePreview key={index} file={file} index={index} updateContext={updateFileContext} removeFile={removeFile}/>
        ))}
      </div>

      <button
        className="btn upload-button"
        onClick={handleUpload}
        disabled={uploading}
        style={{ fontSize: "18px", fontWeight: "bolder" }}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      <div>
        <br></br>
        {selectedFiles.length > 0 && (
          <button className="btn btn-secondary cancel-upload-button" onClick={ () => setSelectedFiles([])}>
            <b>Cancel Upload</b>
          </button>
        )}
    </div>
    </div>
  );
};

export default UploadForm;
