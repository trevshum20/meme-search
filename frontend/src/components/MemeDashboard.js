import { useState } from "react";
import RecentMemes from "./RecentMemes";
import SearchMemes from "./SearchMemes";
import UploadForm from "./UploadForm";

const MemeDashboard = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1); // Increment to trigger re-fetch
  };

  const handleMemeDeleted = () => {
    setRefreshTrigger((prev) => prev + 1); // Refresh recent memes after deletion
  };

  return (
    <div className="dashboard-container">
      <div className="row gy-4 justify-content-center">
        <div className="col-lg-6 col-md-12 col-12">
          <SearchMemes onMemeDeleted={handleMemeDeleted} />
        </div>
        <div className="col-lg-6 col-md-12 col-12">
          <UploadForm onUploadSuccess={handleUploadSuccess} />
        </div>
      </div>
      <br></br>
      <div className="recent-memes-section">
        <RecentMemes refreshTrigger={refreshTrigger} />
      </div>
      <br></br>
    </div>
  );
};

export default MemeDashboard;
