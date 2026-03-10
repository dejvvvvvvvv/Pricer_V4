import React from 'react';
import Routes from './Routes';
import { NotificationProvider } from './contexts/NotificationContext';
import ToastContainer from './components/ui/forge/ToastContainer';
import NetworkErrorListener from './components/NetworkErrorListener';
import OfflineBanner from './components/ui/OfflineBanner';

function App() {
  return (
    <NotificationProvider>
      <NetworkErrorListener />
      <Routes />
      <ToastContainer />
      <OfflineBanner />
    </NotificationProvider>
  );
}

export default App;
