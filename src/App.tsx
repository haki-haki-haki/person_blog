import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Study from '@/pages/Study';
import Life from '@/pages/Life';
import NoteDetail from '@/pages/NoteDetail';
import Notes from '@/pages/Notes';
import Diary from '@/pages/Diary/Diary';
import Ghostty from '@/pages/Ghostty';
import Settings from '@/components/Settings/Settings';
import AskAI from '@/components/AskAI/AskAI';
import { useStore } from '@/store/useStore';

function App() {
  const { isBlackWhite } = useStore();

  return (
    <div className={`app-container ${isBlackWhite ? 'black-white' : ''}`}>
      <BrowserRouter basename="/person_blog">
        <Settings />
        <AskAI />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/study" element={<Study />} />
          <Route path="/study/:category" element={<Study />} />
          <Route path="/note/:id" element={<NoteDetail />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/notes/:notePath" element={<Notes />} />
          <Route path="/notes/*" element={<Notes />} />
          <Route path="/life" element={<Life />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/ghostty" element={<Ghostty />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
