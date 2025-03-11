import React, { useState } from "react";
import "./imagePreview.css";

const ImagePreview = ({ file, index, updateContext, removeFile }) => {
  const [context, setContext] = useState(file.context);
  const [showForm, setShowForm] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContext((prevContext) => ({ ...prevContext, [name]: value }));
  };

  const handleSaveContext = () => {
    updateContext(index, context);
    setShowForm(false); // Hide form after saving
  };

  return (
    <div className="image-preview-item">
      {/* Image container */}
      <div className="image-container">
        <img src={file.previewUrl} alt="preview" className="image-thumbnail" />

        {/* Delete Button */}
        <button className="delete-button" onClick={() => removeFile(index)}>
          <i className="bi bi-trash"></i>
        </button>
      </div>

      {/* Button and Form Container */}
      <div className="context-container">
        <button className="btn btn-primary add-context-button" onClick={() => setShowForm((prev) => !prev)}>
          <b>{showForm ? "Cancel" : "Add Context"}</b>
        </button>

        {showForm && (
          <div className="context-form">
            <input type="text" name="popCulture" placeholder="Pop Culture References" value={context.popCulture} maxLength="30" onChange={handleInputChange} />
            <input type="text" name="characters" placeholder="Characters" value={context.characters} maxLength="30" onChange={handleInputChange} />
            <input type="text" name="notes" placeholder="Other Notes" value={context.notes} maxLength="30" onChange={handleInputChange} />
            <button className="btn btn-success save-context-button" onClick={handleSaveContext}>
              Save Context
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagePreview;
