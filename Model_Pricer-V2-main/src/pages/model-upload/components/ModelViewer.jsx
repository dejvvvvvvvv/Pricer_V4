import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Center, Environment } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import * as THREE from 'three';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

// 1. Model Loader
const Model = ({ url }) => {
  const geom = useLoader(STLLoader, url);
  const mesh = useMemo(() => {
    geom.computeVertexNormals();
    return new THREE.Mesh(geom, new THREE.MeshStandardMaterial({
      color: '#1E90FF',
      metalness: 0.1,
      roughness: 0.5,
    }));
  }, [geom]);
  return <primitive object={mesh} />;
};

// Helper to format seconds into a readable string
const formatDuration = (totalSeconds) => {
  if (totalSeconds <= 0) return '-';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m`;
  return result.trim() || '0m';
};


// 2. Model Info
const ModelInfo = ({ file, stats }) => {
    const [dimensions, setDimensions] = useState(null);
    const [volume, setVolume] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (file && file.file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const loader = new STLLoader();
                    const geometry = loader.parse(event.target.result);
                    if (!geometry.hasAttribute('position') || geometry.getAttribute('position').count === 0) {
                        setError("Nelze analyzovat model.");
                        return;
                    }
                    geometry.computeBoundingBox();
                    const box = geometry.boundingBox;
                    const size = new THREE.Vector3();
                    box.getSize(size);
                    setDimensions(size);

                    let vol = 0;
                    const pos = geometry.getAttribute('position');
                    const p1 = new THREE.Vector3(), p2 = new THREE.Vector3(), p3 = new THREE.Vector3();
                    for (let i = 0; i < pos.count; i += 3) {
                        p1.fromBufferAttribute(pos, i);
                        p2.fromBufferAttribute(pos, i + 1);
                        p3.fromBufferAttribute(pos, i + 2);
                        vol += p1.dot(p2.cross(p3));
                    }
                    setVolume(Math.abs(vol / 6.0));
                    setError(null);
                } catch (e) {
                    setError("Chyba při čtení modelu.");
                }
            };
            reader.onerror = () => setError("Nepodařilo se přečíst soubor.");
            reader.readAsArrayBuffer(file.file);
        }
    }, [file]);

    if (error) return <p className="text-xs text-destructive">{error}</p>;
    
    const isLoadingGeo = !dimensions || volume === null;
    const isLoadingStats = file.status === 'processing' || file.status === 'pending';

    return (
        <div className='space-y-2'>
            <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-muted/50 rounded-md"><p className="font-bold text-foreground">{isLoadingGeo ? '-' : dimensions.x.toFixed(1)}</p><p className="text-muted-foreground">X (mm)</p></div>
                <div className="text-center p-2 bg-muted/50 rounded-md"><p className="font-bold text-foreground">{isLoadingGeo ? '-' : dimensions.y.toFixed(1)}</p><p className="text-muted-foreground">Y (mm)</p></div>
                <div className="text-center p-2 bg-muted/50 rounded-md"><p className="font-bold text-foreground">{isLoadingGeo ? '-' : dimensions.z.toFixed(1)}</p><p className="text-muted-foreground">Z (mm)</p></div>
                <div className="col-span-3 text-center p-2 bg-muted/50 rounded-md"><p className="font-bold text-foreground">{isLoadingGeo ? '-' : (volume / 1000).toFixed(2) + ' cm³'}</p><p className="text-muted-foreground">Objem</p></div>
            </div>
            { (stats || isLoadingStats) &&
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 bg-muted/50 rounded-md"><p className="font-bold text-foreground">{isLoadingStats ? <Icon name='Loader' className='animate-spin mx-auto'/> : formatDuration(stats?.time)}</p><p className="text-muted-foreground">Čas tisku</p></div>
                    <div className="text-center p-2 bg-muted/50 rounded-md"><p className="font-bold text-foreground">{isLoadingStats ? <Icon name='Loader' className='animate-spin mx-auto'/> : (stats?.material ? stats.material.toFixed(1) + ' g' : '-')}</p><p className="text-muted-foreground">Materiál</p></div>
                </div>
            }
        </div>
    );
};

// 3. FullScreen Modal
const FullScreenViewer = ({ fileUrl, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="relative w-[90vw] h-[90vh] bg-transparent" onClick={(e) => e.stopPropagation()}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 pt-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        aria-label="Zavřít celé okno"
                        className="h-12 w-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md text-white/90 hover:text-white transition-colors"
                    >
                        <Icon name="Minimize" size={28} />
                    </Button>
                </div>
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center h-full"><Icon name="Loader" className="animate-spin text-primary" size={32} /></div>
                }>
                    <Canvas shadows camera={{ position: [0, 0, 75], fov: 50 }} gl={{ alpha: true }}>
                        <ambientLight intensity={1.5} />
                        <directionalLight position={[10, 10, 5]} intensity={2} />
                        <directionalLight position={[-10, -5, -10]} intensity={1} />
                        <Center>
                            <Model url={fileUrl} />
                        </Center>
                        <OrbitControls autoRotate autoRotateSpeed={1.0} />
                    </Canvas>
                </Suspense>
            </div>
        </div>
    );
};

// 4. Main Component
const ModelViewer = ({ selectedFile, onRemove }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (selectedFile && selectedFile.file) {
      const url = URL.createObjectURL(selectedFile.file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFileUrl(null);
    }
  }, [selectedFile]);
  
  const handleRemove = () => {
      setIsFullScreen(false);
      onRemove(selectedFile);
  }

  return (
    <>
      <div className="relative bg-card border border-border rounded-xl aspect-square flex flex-col items-center justify-center p-2 text-center">
        {selectedFile ? (
          <>
            <div className="absolute top-2 right-2 z-10 flex space-x-1">
                <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(true)} aria-label="Celá obrazovka"><Icon name="Expand" size={16} /></Button>
                <Button variant="ghost" size="icon" onClick={handleRemove} aria-label="Odstranit model"><Icon name="X" size={16} /></Button>
            </div>
            <div className="w-full h-full">
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center h-full">
                        <Icon name="Loader" className="animate-spin text-primary" size={32} />
                        <p className="text-sm text-muted-foreground mt-2">Načítám model...</p>
                    </div>
                }>
                    {fileUrl && (
                        <Canvas shadows camera={{ position: [0, 0, 150], fov: 50 }}>
                            <Environment preset="city" />
                            <ambientLight intensity={0.7} />
                            <directionalLight intensity={0.5} position={[10,10,10]} />
                            <Center>
                                <Model url={fileUrl} />
                            </Center>
                            <OrbitControls autoRotate autoRotateSpeed={0.5} />
                        </Canvas>
                    )}
                </Suspense>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-card/80 backdrop-blur-sm rounded-b-xl border-t border-border">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground truncate" title={selectedFile.name}>{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground whitespace-nowrap pl-2">{selectedFile.size > 0 ? (selectedFile.size / (1024 * 1024)).toFixed(2) + " MB" : ""}</p>
                </div>
                <ModelInfo file={selectedFile} stats={selectedFile.result} />
            </div>
          </>
        ) : (
          <div className="space-y-4 p-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto"><Icon name="Scan" size={40} className="text-muted-foreground" /></div>
            <h3 className="font-semibold text-foreground">Náhled modelu</h3>
            <p className="text-sm text-muted-foreground">Po nahrání souboru se zde zobrazí náhled vašeho 3D modelu a jeho parametry.</p>
          </div>
        )}
      </div>

      {isFullScreen && fileUrl && (
          <FullScreenViewer 
            fileUrl={fileUrl}
            onClose={() => setIsFullScreen(false)}
          />
      )}
    </>
  );
};

export default ModelViewer;
