import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF, Bounds, Html } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import * as THREE from 'three';

const Model = ({ url, extension }) => {
    const modelRef = React.useRef();
    
    const modelObject = extension === 'stl' 
        ? useLoader(STLLoader, url)
        : useGLTF(url).scene;

    React.useLayoutEffect(() => {
        if (!modelRef.current) return;
        modelRef.current.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }, [modelObject]);

    if (extension === 'stl') {
        return (
            <mesh ref={modelRef} castShadow receiveShadow geometry={modelObject}>
                <meshStandardMaterial color={'#E5E7EB'} />
            </mesh>
        );
    }
    
    return <primitive ref={modelRef} object={modelObject} />;
};


const ModelPreview = ({ file }) => {
    const [modelKey, setModelKey] = useState(0);
    const [fileUrl, setFileUrl] = useState(null);
    const [fileExtension, setFileExtension] = useState('');
    const [error, setError] = useState(null);
    const [lightPosition, setLightPosition] = useState({ x: 10, y: 10, z: 10 });

    useEffect(() => {
        if (file) {
            const extension = file.name.split('.').pop().toLowerCase();
            
            if (!['stl', 'gltf', 'glb'].includes(extension)) {
                setError('Nepodporovaný typ souboru.');
                setFileUrl(null);
                return;
            }

            const url = URL.createObjectURL(file);
            setFileUrl(url);
            setFileExtension(extension);
            setModelKey(prevKey => prevKey + 1);
            setError(null);

            return () => URL.revokeObjectURL(url);
        } else {
            setFileUrl(null);
            setFileExtension('');
            setError(null);
        }
    }, [file]);

    const handleLightChange = (axis, value) => {
        setLightPosition(prev => ({ ...prev, [axis]: parseFloat(value) }));
    };

    return (
        <div className="w-full h-full flex flex-col rounded-md overflow-hidden border border-border bg-card">
            <div className="flex-grow relative">
                {fileUrl ? (
                    <Canvas key={modelKey} camera={{ fov: 50 }} shadows>
                        <ambientLight intensity={0.75} />
                        <directionalLight
                            position={[lightPosition.x, lightPosition.y, lightPosition.z]}
                            intensity={1.0}
                            castShadow
                            shadow-mapSize-width={2048}
                            shadow-mapSize-height={2048}
                            shadow-bias={-0.001}
                            shadow-normalBias={0.02}
                        />
                        
                        <Suspense fallback={<Html center><p>Načítání...</p></Html>}> 
                            <Bounds fit clip observe margin={1.1}>
                                <Model url={fileUrl} extension={fileExtension} />
                            </Bounds>
                        </Suspense>
                        
                        <OrbitControls makeDefault />
                    </Canvas>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                        {error 
                            ? <p className="text-xs text-destructive p-2">{error}</p>
                            : <p className="text-xs text-muted-foreground">Náhled není k dispozici</p>
                        }
                    </div>
                )}
            </div>
            {fileUrl && (
                 <div className="p-2 border-t border-border">
                    <h4 className="text-xs font-semibold text-foreground mb-2">Ovládání osvětlení</h4>
                     <div className="grid grid-cols-3 gap-x-2">
                         {['x', 'y', 'z'].map(axis => (
                             <div key={axis} className="flex flex-col space-y-1">
                                 <label htmlFor={`light-preview-${axis}`} className="text-xs font-medium text-muted-foreground uppercase flex justify-between">
                                     <span>{axis.toUpperCase()}</span>
                                     <span>{lightPosition[axis].toFixed(0)}</span>
                                 </label>
                                 <input
                                     id={`light-preview-${axis}`}
                                     type="range"
                                     min="-50"
                                     max="50"
                                     step="1"
                                     value={lightPosition[axis]}
                                     onChange={(e) => handleLightChange(axis, e.target.value)}
                                     className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                                 />
                             </div>
                         ))}
                     </div>
                 </div>
            )}
        </div>
    );
};

export default ModelPreview;
