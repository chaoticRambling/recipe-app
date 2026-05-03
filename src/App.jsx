import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardView from './pages/DashboardView';
import RecipeViewer from './pages/RecipeViewer';
import RecipeEditor from './pages/RecipeEditor';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardView />} />
        <Route path="/recipe/:id" element={<RecipeViewer />} />
        <Route path="/editor" element={<RecipeEditor />} />
        <Route path="/editor/:id" element={<RecipeEditor />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
