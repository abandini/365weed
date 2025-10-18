import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Today from './routes/Today';
import Calendar from './routes/Calendar';
import Journal from './routes/Journal';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-white">
        <nav className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-primary">365 Days of Weed</h1>
              <div className="flex gap-4">
                <Link to="/" className="hover:text-primary transition">
                  Today
                </Link>
                <Link to="/calendar" className="hover:text-primary transition">
                  Calendar
                </Link>
                <Link to="/journal" className="hover:text-primary transition">
                  Journal
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/journal" element={<Journal />} />
          </Routes>
        </main>

        <footer className="mt-12 py-6 text-center text-sm text-gray-500 border-t border-gray-800">
          <p>For adults 21+ in legal jurisdictions.</p>
          <p className="mt-2">Educational content only; not medical advice.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
