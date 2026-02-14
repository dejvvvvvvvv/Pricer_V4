import React from 'react';
import SlicerLayout from './components/SlicerLayout';
import SlicerTopBar from './components/SlicerTopBar';
import SlicerLeftPanel from './components/SlicerLeftPanel';
import SlicerViewport from './components/SlicerViewport';
import SlicerRightPanel from './components/SlicerRightPanel';
import SlicerMaterialsPanel from './components/SlicerMaterialsPanel';
import SlicerObjectsPanel from './components/SlicerObjectsPanel';
import SlicerSimulationBar from './components/SlicerSimulationBar';
import SlicerSlicePanel from './components/SlicerSlicePanel';

export default function SlicerPage() {
  return (
    <SlicerLayout>
      <SlicerTopBar />
      <SlicerLeftPanel />
      <SlicerViewport>
        <SlicerMaterialsPanel />
        <SlicerObjectsPanel />
        <SlicerSimulationBar />
        <SlicerSlicePanel />
      </SlicerViewport>
      <SlicerRightPanel />
    </SlicerLayout>
  );
}
