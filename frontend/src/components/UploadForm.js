import axios from "axios";
import { useRef, useState } from "react";
import { getFirebaseToken } from "../firebase";
import ImagePreview from "./ImagePreview";
import "./UploadForm.css";

const UploadForm = ({ onUploadSuccess, user }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showTooltip, setShowTooltip] = useState(false); // Toggle tooltip visibility
  const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL;

  const fileInputRef = useRef(null);
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_FILES = 10;

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    if (files.length > MAX_FILES) {
      setErrorMessage(
        `⚠️ You can only upload up to ${MAX_FILES} images at a time.`
      );
      event.target.value = "";
      return;
    }

    const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setErrorMessage(
        `⚠️ Some files are too large! Each file must be under 10MB.`
      );
      event.target.value = "";
      return;
    }

    setErrorMessage("");
    const previews = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      context: { popCulture: "", characters: "", notes: "" },
    }));

    setSelectedFiles(previews);
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) {
      setErrorMessage("⚠️ Please select images first.");
      return;
    }

    setUploading(true);
    setErrorMessage("");

    try {
      const token = await getFirebaseToken();
      const formData = new FormData();

      selectedFiles.forEach(({ file }) => {
        formData.append("memes", file);
      });

      formData.append("userEmail", user.email);
      formData.append(
        "context",
        JSON.stringify(selectedFiles.map((f) => f.context))
      );

      let response = await axios.post(
        `${BACKEND_BASE_URL}/api/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 429) {
        setErrorMessage(
          "⚠️ You have exceeded the rate limit. Please wait a few minutes before trying again."
        );
        return;
      }

      setSelectedFiles([]);
      fileInputRef.current.value = "";
      onUploadSuccess();
    } catch (error) {
      console.error("Upload failed:", error);

      if (error.response) {
        if (error.response.status === 413) {
          setErrorMessage(
            "⚠️ An uploaded file was too large. Please select a smaller image."
          );
        } else {
          setErrorMessage(
            error.response.data.error || "⚠️ Upload failed. Please try again."
          );
        }
      } else {
        setErrorMessage("⚠️ Network error. Please check your connection.");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="card shadow-sm p-4 text-center upload-container"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
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
            onClick={() => fileInputRef.current.click()}
            style={{ fontSize: "18px", fontWeight: "bolder" }}
          >
            Choose Files
          </button>
        </div>
      </div>

      {/* Display error messages */}
      {errorMessage && (
        <p style={{ color: "red", fontWeight: "bold" }}>{errorMessage}</p>
      )}

      {/* Image Previews with Context Inputs */}
      <div className="image-preview-container">
        {selectedFiles.map((file, index) => (
          <ImagePreview key={index} file={file} index={index} />
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
      <br></br>

      {selectedFiles.length > 0 && (
        <button
          className="btn btn-secondary cancel-upload-button"
          onClick={() => setSelectedFiles([])}
        >
          <b>Cancel Upload</b>
        </button>
      )}

      {/* Tooltip - Appears below the entire upload component */}
      {showTooltip && (
        <div className="tooltip-box">
          <p>
            <b>Upload Instructions:</b>
          </p>
          <ul>
            <li>
              📌 Max <b>10 files</b> at a time
            </li>
            <li>📌 All files must be under <b>10MB</b></li>
            <li>
              ⚠️ Please do not upload private/personal images. The S3 storage is
              public for now.
            </li>
            <li>
              🤖 OpenAI is bad at identifying "who is in your meme" and "what your meme is from".
              📝 If that info is important to your meme being funny, add that context manually via the{" "}
              <b>"Add Context"</b> button.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default UploadForm;
