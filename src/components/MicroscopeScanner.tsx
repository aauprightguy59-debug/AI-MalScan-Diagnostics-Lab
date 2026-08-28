/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Sliders, CheckCircle2, User, RefreshCw } from 'lucide-react';
import { SAMPLE_SLIDES, Patient } from '../types';

interface MicroscopeScannerProps {
  onScanComplete: (result: {
    imageKey: string;
    imageData: string | null;
    patient: Patient;
  }) => void;
  isLoading: boolean;
}

export default function MicroscopeScanner({ onScanComplete, isLoading }: MicroscopeScannerProps) {
  // Patient details
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientWeight, setPatientWeight] = useState('');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [clinicId, setClinicId] = useState('Clinic MAL-01 (North)');

  // Slide state
  const [selectedSlideKey, setSelectedSlideKey] = useState('falciparum');
  const [focusValue, setFocusValue] = useState(10); // 0 to 100. Best focus around 75
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Scanning sequence state
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0); // 0: idle, 1: field 1, 2: field 2, 3: field 3, 4: complete
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focus mechanics
  const isFocused = focusValue >= 70 && focusValue <= 85;
  const blurStrength = Math.max(0, Math.abs(focusValue - 77) / 2.5);

  const selectedSlide = SAMPLE_SLIDES.find(s => s.key === selectedSlideKey);
  const currentImage = selectedSlideKey === 'uploaded' ? uploadedImage : (selectedSlide ? selectedSlide.imagePath : null);

  // Form check
  const isFormValid = patientName.trim() !== '' && patientAge !== '' && patientWeight !== '';

  const handleSlideChange = (key: string) => {
    setSelectedSlideKey(key);
    // Add small random misfocus to make it realistic
    setFocusValue(Math.floor(Math.random() * 30) + 10);
    setIsScanning(false);
    setScanStep(0);
    setScanLogs([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImage(event.target.result as string);
          setSelectedSlideKey('uploaded');
          setFocusValue(Math.floor(Math.random() * 30) + 10);
          setIsScanning(false);
          setScanStep(0);
          setScanLogs([]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Automated multi-field scan simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isScanning) {
      if (scanStep === 1) {
        setScanLogs(prev => [...prev, '🔬 Field 1: Aligning mechanical stage, focusing oil objective...']);
        timer = setTimeout(() => {
          setScanStep(2);
          setScanLogs(prev => [...prev, '✓ Field 1 Captured. Analyzing ring-form structures...', '🔬 Field 2: Shifting objective to secondary diagnostic quadrant...']);
        }, 1200);
      } else if (scanStep === 2) {
        timer = setTimeout(() => {
          setScanStep(3);
          setScanLogs(prev => [...prev, '✓ Field 2 Captured. Counting infected RBC density...', '🔬 Field 3: Fine scanning terminal slide smear periphery...']);
        }, 1200);
      } else if (scanStep === 3) {
        timer = setTimeout(() => {
          setScanStep(4);
          setScanLogs(prev => [...prev, '✓ Field 3 Captured. Generating high-resolution diagnostic stitch...', '⚡ Running AI Classifier Model...']);
        }, 1200);
      } else if (scanStep === 4) {
        timer = setTimeout(() => {
          setIsScanning(false);
          onScanComplete({
            imageKey: selectedSlideKey,
            imageData: selectedSlideKey === 'uploaded' ? uploadedImage : null,
            patient: {
              name: patientName,
              age: parseInt(patientAge),
              weight: parseFloat(patientWeight),
              gender: patientGender,
              clinicId
            }
          });
        }, 1000);
      }
    }
    return () => clearTimeout(timer);
  }, [isScanning, scanStep]);

  const startScan = () => {
    if (!isFormValid || !isFocused || isLoading) return;
    setIsScanning(true);
    setScanStep(1);
    setScanLogs(['⚙️ Initializing portable AI-microscope lens system...']);
  };

  return (
    <div id="microscope-scanner-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl">
      {/* Column 1: Patient Intake & Slide Picker */}
      <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
        {/* Patient Intake Form */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
            <User className="h-5 w-5 text-teal-400" />
            <h2 className="text-lg font-medium tracking-tight text-white">Patient Intake</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Patient Full Name</label>
              <input
                id="patient-name-input"
                type="text"
                placeholder="e.g. John Doe"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                disabled={isScanning || isLoading}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Age (Years)</label>
              <input
                id="patient-age-input"
                type="number"
                placeholder="Age"
                min="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
                value={patientAge}
                onChange={e => setPatientAge(e.target.value)}
                disabled={isScanning || isLoading}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Weight (kg)</label>
              <input
                id="patient-weight-input"
                type="number"
                placeholder="Weight"
                min="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
                value={patientWeight}
                onChange={e => setPatientWeight(e.target.value)}
                disabled={isScanning || isLoading}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Gender</label>
              <select
                id="patient-gender-select"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
                value={patientGender}
                onChange={e => setPatientGender(e.target.value as any)}
                disabled={isScanning || isLoading}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Clinic Site</label>
              <select
                id="patient-clinic-select"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
                value={clinicId}
                onChange={e => setClinicId(e.target.value)}
                disabled={isScanning || isLoading}
              >
                <option value="Clinic MAL-01 (North)">Clinic MAL-01 (North)</option>
                <option value="Clinic MAL-02 (East)">Clinic MAL-02 (East)</option>
                <option value="Clinic MAL-03 (Border)">Clinic MAL-03 (Border)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Slide Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-sm font-medium text-slate-400">Microscope Stage (Slides)</span>
            <button
              id="upload-smear-btn"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-teal-400 hover:text-teal-300 flex items-center space-x-1 border border-teal-500/30 rounded px-2 py-0.5 hover:bg-teal-500/5 transition-all"
              disabled={isScanning || isLoading}
            >
              <Upload className="h-3 w-3" />
              <span>Upload Custom</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {SAMPLE_SLIDES.map((slide) => (
              <button
                id={`slide-btn-${slide.key}`}
                key={slide.key}
                onClick={() => handleSlideChange(slide.key)}
                className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                  selectedSlideKey === slide.key
                    ? 'bg-teal-950/40 border-teal-500 text-teal-200'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
                disabled={isScanning || isLoading}
              >
                <span className="text-xs font-semibold">{slide.name}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{slide.description}</span>
              </button>
            ))}
            {uploadedImage && (
              <button
                id="slide-btn-uploaded"
                onClick={() => handleSlideChange('uploaded')}
                className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                  selectedSlideKey === 'uploaded'
                    ? 'bg-teal-950/40 border-teal-500 text-teal-200'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
                disabled={isScanning || isLoading}
              >
                <span className="text-xs font-semibold">★ Custom Upload</span>
                <span className="text-[10px] text-teal-400 mt-0.5 font-mono">Ready to scan</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Column 2: Microscope Lens Viewer */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-slate-800 pt-6 lg:pt-0 lg:pl-6 space-y-6">
        <div className="relative flex flex-col items-center">
          {/* Circular Microscope Aperture */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden border-4 border-slate-950 shadow-2xl bg-white flex items-center justify-center">
            {currentImage ? (
              <div 
                className="w-full h-full relative transition-all duration-300"
                style={{
                  filter: `blur(${blurStrength}px)`,
                  backgroundImage: `url(${currentImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  transform: isScanning 
                    ? `scale(1.2) translate(${scanStep === 1 ? '-10px, -5px' : scanStep === 2 ? '8px, 12px' : scanStep === 3 ? '-5px, 8px' : '0px, 0px'})`
                    : 'scale(1) translate(0px, 0px)',
                  transition: 'transform 1s ease-in-out, filter 0.15s ease-out'
                }}
              >
                {/* Simulated Glass Slide Reticle */}
                <div className="absolute inset-0 pointer-events-none border border-slate-100/10 rounded-full flex items-center justify-center">
                  <div className="w-1/2 h-[1px] bg-slate-100/15"></div>
                  <div className="h-1/2 w-[1px] bg-slate-100/15 absolute"></div>
                  <div className="w-24 h-24 border border-dashed border-slate-100/10 rounded-full absolute"></div>
                </div>
              </div>
            ) : (
              <div className="text-center p-4">
                <Camera className="h-12 w-12 text-slate-700 mx-auto mb-2 animate-pulse" />
                <span className="text-xs text-slate-500">No Slide Loaded</span>
              </div>
            )}

            {/* Scanning Overlay Grid */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none bg-teal-500/5 flex flex-col justify-between p-4">
                {/* Moving Green Scanning laser line */}
                <div className="w-full h-0.5 bg-teal-400 shadow-md shadow-teal-400/50 animate-bounce"></div>
                
                {/* AI Target Box indicators bounding the simulated parasites */}
                <div className="absolute top-1/4 left-1/3 w-10 h-10 border border-red-500 rounded bg-red-500/10 animate-pulse flex items-center justify-center">
                  <span className="text-[8px] text-red-400 font-mono scale-90">RBC_INF</span>
                </div>
                {scanStep >= 2 && (
                  <div className="absolute bottom-1/3 right-1/4 w-8 h-8 border border-teal-400 rounded bg-teal-400/10 animate-pulse flex items-center justify-center">
                    <span className="text-[8px] text-teal-400 font-mono scale-90">RING_T</span>
                  </div>
                )}
                {scanStep >= 3 && (
                  <div className="absolute top-1/2 right-1/3 w-6 h-6 border border-yellow-400 rounded bg-yellow-400/10 animate-pulse flex items-center justify-center">
                    <span className="text-[8px] text-yellow-400 font-mono scale-90">CONF_0.9</span>
                  </div>
                )}
                
                <div className="absolute inset-x-0 bottom-3 text-center">
                  <span className="bg-black/80 px-2 py-1 rounded text-[10px] font-mono text-teal-300 border border-teal-500/20 uppercase tracking-wider">
                    Auto-Scanning Field {scanStep}/3
                  </span>
                </div>
              </div>
            )}

            {/* Loader */}
            {isLoading && !isScanning && (
              <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="h-10 w-10 text-teal-400 animate-spin" />
                <span className="text-xs text-teal-300 font-mono uppercase tracking-widest animate-pulse">Running AI Model...</span>
              </div>
            )}

            {/* Circular lens bezel overlay */}
            <div className="absolute inset-0 border-[16px] border-slate-900 pointer-events-none rounded-full opacity-95"></div>
            <div className="absolute inset-0 border border-slate-800 pointer-events-none rounded-full"></div>
          </div>

          {/* Focal Status Bar */}
          <div className="w-full mt-4 flex items-center justify-between text-xs px-2">
            <span className="text-slate-400">Microscope Lens Focus Status:</span>
            {isFocused ? (
              <span id="focus-status-badge" className="text-teal-400 font-medium flex items-center space-x-1 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                <CheckCircle2 className="h-3 w-3" />
                <span>SHARP FOCUS (100x Oil)</span>
              </span>
            ) : (
              <span id="focus-status-badge" className="text-yellow-400 font-medium bg-yellow-500/10 px-2.5 py-0.5 rounded-full border border-yellow-500/20">
                BLURRED (Adjust focus knob)
              </span>
            )}
          </div>
        </div>

        {/* Focus Controls */}
        <div className="w-full max-w-sm bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
              <Sliders className="h-3.5 w-3.5 text-teal-400" />
              <span>Fine Focus Control</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Target: 70 - 85 %</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-mono text-slate-500">Min</span>
            <input
              id="microscope-focus-slider"
              type="range"
              min="0"
              max="100"
              value={focusValue}
              onChange={e => setFocusValue(parseInt(e.target.value))}
              className="flex-1 accent-teal-400 bg-slate-800 rounded-lg cursor-pointer h-1.5"
              disabled={isScanning || isLoading}
            />
            <span className="text-[10px] font-mono text-slate-500">{focusValue}%</span>
          </div>
        </div>

        {/* Logs Output Box */}
        {scanLogs.length > 0 && (
          <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 h-28 overflow-y-auto font-mono text-[11px] text-teal-300/90 space-y-1 scrollbar-thin">
            {scanLogs.map((log, i) => (
              <div key={i} className="animate-fade-in">{log}</div>
            ))}
          </div>
        )}

        {/* Scan Button Trigger */}
        <div className="w-full max-w-sm">
          <button
            id="initiate-scan-btn"
            onClick={startScan}
            disabled={!isFormValid || !isFocused || isScanning || isLoading}
            className={`w-full py-3 rounded-xl font-medium tracking-wide flex items-center justify-center space-x-2 transition-all ${
              !isFormValid 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-900'
                : !isFocused
                ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500/20 cursor-help'
                : 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold shadow-lg shadow-teal-500/20 cursor-pointer scale-100 hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            <Camera className="h-5 w-5" />
            <span>
              {!isFormValid 
                ? 'Fill Patient Intake First' 
                : !isFocused 
                ? 'Slide Focus Knob to Sharp Focus' 
                : 'Initiate 3-Field Auto-Scan'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
