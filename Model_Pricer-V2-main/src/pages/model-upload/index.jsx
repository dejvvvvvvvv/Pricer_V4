// src/pages/model-upload/index.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import FileUploadZone from './components/FileUploadZone';
import ModelViewer from './components/ModelViewer';
import PrintConfiguration from './components/PrintConfiguration';
import PricingCalculator from './components/PricingCalculator';

const ModelUpload = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [printConfigs, setPrintConfigs] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  const updateModelStatus = useCallback((modelId, newProps) => {
    setUploadedFiles(prevFiles =>
      prevFiles.map(file => (file.id === modelId ? { ...file, ...newProps } : file))
    );
  }, []);

  const handleConfigChange = (newConfig) => {
    if (selectedFile) {
      setPrintConfigs(prev => ({ ...prev, [selectedFile.id]: newConfig }));
      updateModelStatus(selectedFile.id, { status: 'pending', result: null, error: null });
    }
  };

  const steps = [
    { id: 1, title: 'Nahrání souborů', icon: 'Upload', description: 'Nahrajte 3D modely' },
    { id: 2, title: 'Konfigurace', icon: 'Settings', description: 'Nastavte parametry tisku' },
    { id: 3, title: 'Kontrola a cena', icon: 'Calculator', description: 'Zkontrolujte objednávku' }
  ];

  useEffect(() => {
    if (uploadedFiles.length > 0 && !selectedFile) {
      setSelectedFile(uploadedFiles[0]);
    }
  }, [uploadedFiles, selectedFile]);

  useEffect(() => {
    if (selectedFile && !printConfigs[selectedFile.id]) {
      const defaultConfig = {
        material: 'pla',
        quality: 'standard',
        infill: 20,
        quantity: 1,
        postProcessing: [],
        expressDelivery: false,
        supports: false,
      };
      handleConfigChange(defaultConfig);
    }
  }, [selectedFile, printConfigs, handleConfigChange]);

  useEffect(() => {
    if (uploadedFiles.length > 0 && currentStep === 1) {
      const t = setTimeout(() => setCurrentStep(2), 1000);
      return () => clearTimeout(t);
    }
  }, [uploadedFiles, currentStep]);

  // Automatic slicing when model is uploaded or config changes
  useEffect(() => {
    const run = async () => {
      if (!selectedFile) return;

      const cfg = printConfigs[selectedFile.id];
      if (!cfg) return;

      // Skip if already processing
      if (selectedFile.status === 'processing') return;

      // Re-slice if config changed or model is pending
      const shouldSlice = selectedFile.status === 'pending' || selectedFile.status === 'completed';
      if (!shouldSlice) return;

      try {
        updateModelStatus(selectedFile.id, { status: 'processing', error: null });

        console.log('[ModelUpload] Starting slice for:', selectedFile.name, 'with config:', cfg);

        // Import API client (using backend estimation)
        const { sliceModel } = await import('../../lib/slicingApiClient');
        const { calculatePrice } = await import('../../lib/pricingService');

        // Prepare slicing config
        const slicingConfig = {
          quality: cfg.quality || 'standard',
          infill: cfg.infill || 20,
          material: cfg.material || 'pla',
          supports: cfg.supports || false,
        };

        // Call backend API (estimation algorithm)
        const result = await sliceModel(selectedFile.file, slicingConfig);
        console.log('[ModelUpload] Slice complete:', result);

        // Calculate price
        const pricing = calculatePrice({
          material: cfg.material || 'pla',
          materialGrams: result.material,
          printTimeSeconds: result.time,
          quantity: cfg.quantity || 1,
          expressDelivery: cfg.expressDelivery || false,
          postProcessing: cfg.postProcessing || [],
        });

        updateModelStatus(selectedFile.id, {
          status: 'completed',
          result: {
            time: result.time,
            material: result.material,
            layers: result.layers,
            price: pricing.total,
            pricing: pricing,
          }
        });

      } catch (err) {
        console.error('[ModelUpload] Slicing failed:', err);
        updateModelStatus(selectedFile.id, {
          status: 'failed',
          error: String(err?.message || err)
        });
      }
    };

    run();
  }, [selectedFile, printConfigs, updateModelStatus]);

  const handleFilesUploaded = (uploadedItem) => {
    const fileToProcess = uploadedItem.file instanceof File ? uploadedItem.file : uploadedItem;
    if (!(fileToProcess instanceof File)) return;

    if (!uploadedFiles.some(file => file.name === fileToProcess.name)) {
      const modelObject = {
        id: Date.now() + Math.random(),
        name: fileToProcess.name,
        size: fileToProcess.size,
        type: fileToProcess.type,
        file: fileToProcess,
        uploadedAt: new Date(),
        status: 'pending',
        result: null,
        error: null,
      };
      setUploadedFiles(prev => [...prev, modelObject]);
    }
  };

  const handleAddModelClick = () => fileInputRef.current?.click();

  const handleResetUpload = () => {
    setUploadedFiles([]);
    setSelectedFile(null);
    setPrintConfigs({});
    setCurrentStep(1);
  };

  const handleFileDelete = (fileToDelete) => {
    const newUploadedFiles = uploadedFiles.filter(file => file.id !== fileToDelete.id);
    const newPrintConfigs = { ...printConfigs };
    delete newPrintConfigs[fileToDelete.id];

    setUploadedFiles(newUploadedFiles);
    setPrintConfigs(newPrintConfigs);

    if (selectedFile && selectedFile.id === fileToDelete.id) {
      setSelectedFile(newUploadedFiles.length > 0 ? newUploadedFiles[0] : null);
    }
    if (newUploadedFiles.length === 0) {
      handleResetUpload();
    }
  };

  const handleNextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleProceedToCheckout = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    navigate('/printer-catalog', { state: { uploadedFiles, printConfigs, fromUpload: true } });
  };

  const currentConfig = selectedFile ? printConfigs[selectedFile.id] : {};

  const canProceed = () => {
    switch (currentStep) {
      case 1: return uploadedFiles.length > 0;
      case 2: return !!currentConfig && !!selectedFile;
      case 3: return uploadedFiles.every(f => f.status === 'completed');
      default: return false;
    }
  };

  const statusTooltips = {
    pending: 'Čeká na zpracování',
    processing: 'Výpočet...',
    completed: 'Hotovo',
    failed: 'Výpočet se nezdařil'
  };

  return (
    <div className="min-h-screen bg-background">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          files.forEach(file => handleFilesUploaded({ file }));
        }}
        style={{ display: 'none' }}
        multiple
        accept=".stl,.obj,.3mf"
      />

      <div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
              <button onClick={() => navigate('/customer-dashboard')} className="hover:text-foreground transition-colors">
                Dashboard
              </button>
              <Icon name="ChevronRight" size={16} />
              <span className="text-foreground">Nahrání modelu</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Nahrání 3D modelu</h1>
            <p className="text-muted-foreground">
              Nahrajte své 3D modely a nakonfigurujte parametry tisku.
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between max-w-2xl">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${currentStep >= step.id
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-border text-muted-foreground'
                        }`}
                    >
                      <Icon name={step.icon} size={20} />
                    </div>
                    <div className="mt-2 text-center">
                      <p
                        className={`text-sm font-medium ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-24 h-0.5 mx-4 transition-colors ${currentStep > step.id ? 'bg-primary' : 'bg-border'
                        }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {uploadedFiles.length === 0 && currentStep === 1 && (
                <FileUploadZone onFilesUploaded={handleFilesUploaded} />
              )}

              {uploadedFiles.length > 0 && (
                <>
                  <div className={currentStep === 1 || (currentStep === 2 && selectedFile) ? 'block' : 'hidden'}>
                    <PrintConfiguration
                      key={selectedFile ? selectedFile.id : 'empty'}
                      selectedFile={selectedFile}
                      onConfigChange={handleConfigChange}
                      initialConfig={currentConfig}
                      disabled={uploadedFiles.find(f => f.status === 'processing')}
                    />
                  </div>
                  {currentStep === 3 && (
                    <PricingCalculator files={uploadedFiles} configs={printConfigs} />
                  )}
                </>
              )}
            </div>

            <div className="space-y-6">
              <ModelViewer selectedFile={selectedFile} onRemove={handleFileDelete} />
              {uploadedFiles.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Nahrané modely</h3>
                    <Button variant="ghost" size="icon" onClick={handleAddModelClick}>
                      <Icon name="Plus" size={16} />
                      <span className="sr-only">Přidání Modelu</span>
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {uploadedFiles.map((file) => (
                      <Button
                        key={file.id}
                        variant={selectedFile && selectedFile.id === file.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedFile(file)}
                        className="w-full justify-start text-left h-auto py-2 px-3"
                        title={statusTooltips[file.status] || 'Neznámý stav'}
                      >
                        <div className="flex items-center gap-2 w-full">
                          {file.status === 'processing' && (
                            <Icon name="Loader" size={14} className="animate-spin flex-shrink-0" />
                          )}
                          {file.status === 'pending' && <Icon name="Clock" size={14} className="flex-shrink-0" />}
                          {file.status === 'completed' && (
                            <Icon name="CheckCircle" size={14} className="text-green-500 flex-shrink-0" />
                          )}
                          {file.status === 'failed' && (
                            <Icon name="XCircle" size={14} className="text-red-500 flex-shrink-0" />
                          )}
                          <span className="truncate flex-grow text-left">{file.name}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              iconName="ChevronLeft"
              iconPosition="left"
            >
              Zpět
            </Button>
            <div className="flex items-center space-x-4">
              {currentStep < 3 ? (
                <Button
                  variant="default"
                  onClick={handleNextStep}
                  disabled={!canProceed()}
                  iconName="ChevronRight"
                  iconPosition="right"
                >
                  Pokračovat
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={handleProceedToCheckout}
                  disabled={!canProceed() || isProcessing}
                  loading={isProcessing}
                  iconName="ArrowRight"
                  iconPosition="right"
                >
                  {isProcessing ? 'Zpracovávám...' : 'Přejít k výběru tiskárny'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelUpload;
