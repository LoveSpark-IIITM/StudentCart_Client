import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { OrderList } from './components/OrderList';
import { Login } from './components/Login';
import { Toaster } from 'react-hot-toast';
import { ShoppingCart, LogOut, Menu, X } from 'lucide-react';
import { setupNotifications } from './lib/notifications';
import { supabase, signOut } from './lib/supabase';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Hamburger menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-600"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo (Centered) */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">Grocery Order Management</h1>
            </div>
          </div>

          {/* Sign Out Button on Right */}
          <button
            onClick={async () => {
              await signOut();
              window.location.href = '/login';
            }}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Sign out</span>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {menuOpen && (
          <nav className="md:hidden bg-white shadow-md p-4 flex flex-col gap-4">
            <Link to="/" className="text-gray-600 hover:text-gray-900">New Orders</Link>
            <Link to="/processing" className="text-gray-600 hover:text-gray-900">Processing</Link>
            <Link to="/completed" className="text-gray-600 hover:text-gray-900">Completed</Link>
          </nav>
        )}

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 px-4 sm:px-6 lg:px-8 py-2">
          <Link to="/" className="text-gray-600 hover:text-gray-900">New Orders</Link>
          <Link to="/processing" className="text-gray-600 hover:text-gray-900">Processing</Link>
          <Link to="/completed" className="text-gray-600 hover:text-gray-900">Completed</Link>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  useEffect(() => {
    setupNotifications();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={() => window.location.href = '/'} />} />
        <Route
          path="/"
          element={
            <ProtectedLayout>
              <OrderList />
            </ProtectedLayout>
          }
        />
        <Route
          path="/processing"
          element={
            <ProtectedLayout>
              <OrderList status="processing" />
            </ProtectedLayout>
          }
        />
        <Route
          path="/completed"
          element={
            <ProtectedLayout>
              <OrderList status="completed" showActions={false} />
            </ProtectedLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
