export const SLICER_MOCK = {
  printer: { value: 'bambu-p1s', label: 'Bambu Lab P1S' },
  printerOptions: [
    { value: 'bambu-p1s', label: 'Bambu Lab P1S' },
    { value: 'bambu-x1c', label: 'Bambu Lab X1C' },
    { value: 'prusa-mk4', label: 'Prusa MK4' },
  ],
  position: { x: '-0.0144', y: '1.0386', z: '0' },
  materials: [
    { name: 'Black ABS', spec: 'AA 0.8', color: '#1a1a1a' },
    { name: 'White PLA', spec: 'AA 0.25', color: '#f0f0f0' },
  ],
  materialOptions: [
    { value: 'black-abs', label: 'Black ABS' },
    { value: 'white-pla', label: 'White PLA' },
    { value: 'generic-petg', label: 'Generic PETG' },
  ],
  printCoreOptions: [
    { value: 'aa-04', label: 'AA 0.4' },
    { value: 'aa-08', label: 'AA 0.8' },
    { value: 'bb-04', label: 'BB 0.4' },
  ],
  presets: [
    { key: 'balanced', label: 'Balanced', icon: 'Scale' },
    { key: 'visual', label: 'Visual', icon: 'Eye' },
    { key: 'engineering', label: 'Engineering', icon: 'Settings' },
    { key: 'draft', label: 'Draft', icon: 'Zap' },
  ],
  selectedPreset: 'balanced',
  resolutionOptions: [
    { value: 'draft', label: 'Draft - 0.2mm' },
    { value: 'normal', label: 'Normal - 0.15mm' },
    { value: 'fine', label: 'Fine - 0.1mm' },
  ],
  infill: { density: 20, pattern: 'triangles' },
  patternOptions: [
    { value: 'grid', label: 'Grid' },
    { value: 'lines', label: 'Lines' },
    { value: 'triangles', label: 'Triangles' },
    { value: 'gyroid', label: 'Gyroid' },
  ],
  shell: { wall: '0.8', topBottom: '1.2' },
  support: { enabled: true, type: 'normal', placement: 'everywhere' },
  supportTypeOptions: [
    { value: 'normal', label: 'Normal' },
    { value: 'tree', label: 'Tree' },
  ],
  placementOptions: [
    { value: 'touching', label: 'Touching Buildplate' },
    { value: 'everywhere', label: 'Everywhere' },
  ],
  adhesion: { enabled: true },
  object: {
    filename: 'UMS7_Man_with_gun.stl',
    dimensions: { length: 216, width: 178, height: 229 },
  },
  simulation: {
    currentTime: '11:27:12',
    totalTime: '22:54:25',
    progress: 50,
    speed: '100x',
    speeds: ['1x', '5x', '10x', '50x', '100x'],
  },
};
