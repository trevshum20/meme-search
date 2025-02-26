import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AllMemes from "./components/AllMemes";
import Footer from "./components/Footer";
import Header from "./components/Header";
import RecentMemes from "./components/RecentMemes";
import SearchMemes from "./components/SearchMemes";
import UploadForm from "./components/UploadForm";

function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Header />
        <main className="flex-grow-1 container-fluid px-4 mt-4">
          <Routes>
            <Route path="/" element={
              <div className="row gy-4 justify-content-center">
                <div className="col-lg-5 col-md-6 col-12">
                  <SearchMemes />
                </div>
                <div className="col-lg-5 col-md-6 col-12">
                  <UploadForm />
                </div>
                <div className="col-lg-2 col-md-12 col-12">
                  <RecentMemes />
                </div>
              </div>
            } />
            <Route path="/all-memes" element={<AllMemes />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
