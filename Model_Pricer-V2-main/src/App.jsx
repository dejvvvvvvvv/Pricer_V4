import React from 'react';
import Routes from './Routes';
import { NotificationProvider } from './contexts/NotificationContext';
import ToastContainer from './components/ui/forge/ToastContainer';
import NetworkErrorListener from './components/NetworkErrorListener';
import OfflineBanner from './components/ui/OfflineBanner';
import PwaInstallBanner from './components/ui/PwaInstallBanner';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary module="App" fullPage>
      <NotificationProvider>
        <PwaInstallBanner />
        <NetworkErrorListener />
        <Routes />
        <ToastContainer />
        <OfflineBanner />
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
