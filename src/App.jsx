import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import DashboardView from './pages/DashboardView';
import RecipeViewer from './pages/RecipeViewer';
import LoginView from './pages/LoginView';
import ExploreView from './pages/ExploreView';
import AppChrome from './components/AppChrome';
import ThemeProvider from './theme/ThemeProvider';

const RecipeEditor = lazy(() => import('./pages/RecipeEditor'));
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <ThemeProvider session={session}>
      {loading ? (
        <div className="loader">Loading App...</div>
      ) : (
        <AppChrome>
          <BrowserRouter>
            <Routes>
              <Route 
                path="/" 
                element={session ? <DashboardView session={session} /> : <Navigate to="/login" replace />} 
              />
              <Route 
                path="/explore" 
                element={session ? <ExploreView session={session} /> : <Navigate to="/login" replace />} 
              />
              <Route path="/login" element={<LoginView />} />
              <Route path="/recipe/:id" element={<RecipeViewer />} />
              <Route 
                path="/editor" 
                element={
                  session ? (
                    <Suspense fallback={<div className="loader">Loading editor...</div>}>
                      <RecipeEditor />
                    </Suspense>
                  ) : <Navigate to="/login" replace />
                } 
              />
              <Route 
                path="/editor/:id" 
                element={
                  session ? (
                    <Suspense fallback={<div className="loader">Loading editor...</div>}>
                      <RecipeEditor />
                    </Suspense>
                  ) : <Navigate to="/login" replace />
                } 
              />
            </Routes>
          </BrowserRouter>
        </AppChrome>
      )}
    </ThemeProvider>
  );
}

export default App
