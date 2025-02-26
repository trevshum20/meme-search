import './App.css';
import SearchMemes from './components/SearchMemes';
import UploadForm from './components/UploadForm';

function App() {
  return (
    <div>
      <h1>Meme Upload Site</h1>
      <UploadForm />
      <SearchMemes />
    </div>
  );
}

export default App;
