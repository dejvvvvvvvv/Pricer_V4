import React from 'react';
import Routes from './Routes';
import { NotificationProvider } from './contexts/NotificationContext';
import ToastContainer from './components/ui/forge/ToastContainer';

function App() {
  return (
    <NotificationProvider>
      <Routes />
      <ToastContainer />
    </NotificationProvider>
  );
}

export default App;
