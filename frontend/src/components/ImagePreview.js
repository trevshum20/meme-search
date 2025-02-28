import React, { useState } from "react";

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
    <div className="image-preview-item" style={{ position: "relative", display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
      <div style={{ position: "relative", display: "inline-block" }}>
        <img src={file.previewUrl} alt="preview" className="image-thumbnail" width="200" height="200" />
        
        {/* Trash Icon - Delete Button */}
        <button className="delete-button" onClick={() => removeFile(index)}
          style={{
            position: "absolute",
            top: "-15px",
            right: "-15px",
            background: "rgba(255, 0, 0, 0.7)",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer"
          }}>
          <i className="bi bi-trash"></i>
        </button>
      </div>
      
      <button 
        className="btn btn-primary add-context-button"
        onClick={() => setShowForm((prev) => !prev)}
      >
        {showForm ? "Cancel" : "Add Context"}
      </button>

      {showForm && (
        <div className="context-form" style={{ marginTop: "10px" }}>
          <input 
            type="text" 
            name="popCulture" 
            placeholder="Pop Culture References" 
            value={context.popCulture} 
            maxLength="30"
            onChange={handleInputChange} 
          />
          <input 
            type="text" 
            name="characters" 
            placeholder="Characters" 
            value={context.characters} 
            maxLength="30"
            onChange={handleInputChange} 
          />
          <input 
            type="text" 
            name="notes" 
            placeholder="Other Notes" 
            value={context.notes} 
            maxLength="30"
            onChange={handleInputChange} 
          />
          <button 
            className="btn btn-success save-context-button"
            onClick={handleSaveContext}
          >
            Save Context
          </button>
        </div>
      )}
    </div>
  );
};

export default ImagePreview;
