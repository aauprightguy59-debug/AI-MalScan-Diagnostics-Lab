/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Camera, Database, ShieldAlert, Wifi, WifiOff, RefreshCw, 
  Layers, CheckCircle, Info, Heart, ArrowRight, Trash2,
  Lock, LogOut, UserCheck, ShieldCheck, Award
} from 'lucide-react';
import MicroscopeScanner from './components/MicroscopeScanner';
import DiagnosticReport from './components/DiagnosticReport';
import SurveillanceDashboard from './components/SurveillanceDashboard';
import TechnicianLogin from './components/TechnicianLogin';
import { DiagnosticRecord, Patient, ChiefTechnician } from './types';
import { Capacitor } from '@capacitor/core';

export default function App() {
  const [technician, setTechnician] = useState<ChiefTechnician | null>(null);
  const [activeTab, setActiveTab] = useState<'scan' | 'dashboard'>('scan');
  const [records, setRecords] = useState<DiagnosticRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('offline'); // Default offline to showcase local queuing!
  const [detectedPlatform, setDetectedPlatform] = useState<string>('web');
  
  // Current active scan report state
  const [currentReport, setCurrentReport] = useState<DiagnosticRecord | null>(null);
  const [reportSource, setReportSource] = useState('local_diagnostic_engine');

  // Offline queue state
  const [offlineQueue, setOfflineQueue] = useState<DiagnosticRecord[]>([]);

  // Check stored Chief Technician session on mount
  useEffect(() => {
    const cachedSession = localStorage.getItem('aimalscan_technician_session') || sessionStorage.getItem('aimalscan_technician_session');
    if (cachedSession) {
      try {
        setTechnician(JSON.parse(cachedSession));
      } catch (e) {
        console.error('Failed to parse cached technician session', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('aimalscan_technician_session');
    sessionStorage.removeItem('aimalscan_technician_session');
    setTechnician(null);
    setCurrentReport(null);
  };

  // 1. FETCH RECORDS FROM EXPRESS BACKEND ON MOUNT
  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/records');
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (err) {
      console.error('Failed to fetch surveillance records from central database:', err);
    }
  };

  useEffect(() => {
    fetchRecords();
    
    // Read platform from Capacitor
    const currentPlatform = Capacitor.getPlatform();
    setDetectedPlatform(currentPlatform);
    
    // Load local offline queue from localstorage if present
    const cachedQueue = localStorage.getItem('aimalscan_offline_queue');
    if (cachedQueue) {
      try {
        setOfflineQueue(JSON.parse(cachedQueue));
      } catch (e) {
        console.error('Failed to parse cached queue', e);
      }
    }
  }, []);

  // Sync offline queue changes to localStorage
  useEffect(() => {
    localStorage.setItem('aimalscan_offline_queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  // 2. TRIGGER SYNC OF QUEUED ITEMS WHEN TOGGLED ONLINE
  const handleNetworkToggle = (status: 'online' | 'offline') => {
    setNetworkStatus(status);
    if (status === 'online' && offlineQueue.length > 0) {
      triggerQueueSync(offlineQueue);
    }
  };

  const triggerQueueSync = async (queueToSync: DiagnosticRecord[]) => {
    setIsSyncing(true);
    let successCount = 0;
    
    for (const record of queueToSync) {
      try {
        const syncedRecord = { ...record, synced: true };
        const res = await fetch('/api/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syncedRecord)
        });
        
        if (res.ok) {
          successCount++;
        }
      } catch (err) {
        console.error(`Failed to sync queued case ${record.id}:`, err);
      }
    }

    if (successCount > 0) {
      // Clear synced items from queue
      setOfflineQueue([]);
      // Refresh clinical records list from central server
      await fetchRecords();
    }
    
    setIsSyncing(false);
  };

  // 3. TRIGGER AI DIAGNOSTIC SCAN ENDPOINT
  const handleScanComplete = async (scanDetails: {
    imageKey: string;
    imageData: string | null;
    patient: Patient;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanDetails)
      });

      if (!res.ok) {
        throw new Error('AI analysis backend failed.');
      }

      const data = await res.json();
      
      // Construct a new pending DiagnosticRecord
      const newRecord: DiagnosticRecord = {
        id: `rec-${Math.random().toString(36).substr(2, 9)}`,
        deviceId: 'MAL-SCAN-001',
        patient: scanDetails.patient,
        result: data.result,
        timestamp: new Date().toISOString(),
        workerConfirmed: null, // worker must confirm
        treatmentRegimen: null,
        notes: '',
        synced: false,
        imageKey: scanDetails.imageKey
      };

      setReportSource(data.source);
      setCurrentReport(newRecord);

    } catch (err) {
      console.error('AI diagnosis request failed:', err);
      alert('Clinical Diagnostic Unit error: Failed to connect to AI Classification service.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. AUTHORIZE SIGN-OFF ON SCAN REPORT
  const handleAuthorizeRecord = async (authorizedRecord: DiagnosticRecord) => {
    if (networkStatus === 'online') {
      setIsSyncing(true);
      try {
        const syncedRecord = { ...authorizedRecord, synced: true };
        const res = await fetch('/api/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syncedRecord)
        });

        if (res.ok) {
          // Add to clinical records list directly
          setRecords(prev => [syncedRecord, ...prev]);
          setCurrentReport(syncedRecord);
        } else {
          throw new Error('Server reject');
        }
      } catch (err) {
        console.error('Failed to upload authorized record immediately:', err);
        // Fallback to queue if server is down despite online flag
        setOfflineQueue(prev => [...prev, authorizedRecord]);
        setRecords(prev => [authorizedRecord, ...prev]);
        setCurrentReport(authorizedRecord);
      } finally {
        setIsSyncing(false);
      }
    } else {
      // Offline mode: Save in local offline queue
      setOfflineQueue(prev => [...prev, authorizedRecord]);
      // Also temporarily add to client list so ledger displays it
      setRecords(prev => [authorizedRecord, ...prev]);
      setCurrentReport(authorizedRecord);
    }
  };

  const clearActiveReport = () => {
    setCurrentReport(null);
  };

  const clearQueue = () => {
    setOfflineQueue([]);
  };

  return (
    <div id="app-root-frame" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* If unauthorized, render the Chief Lab Technician Security Login Portal */}
      {!technician ? (
        <TechnicianLogin onLogin={(tech) => setTechnician(tech)} />
      ) : (
        <>
          {/* GLOBAL HEADER BAR */}
          <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-30 shadow-md">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              
              {/* Brand/Product Logo */}
              <div className="flex items-center space-x-3">
                <div className="relative h-11 w-11 rounded-xl overflow-hidden shadow-lg shadow-teal-500/15 border border-teal-500/30 shrink-0">
                  <img 
                    src="/src/assets/images/malaria_lab_logo_1783687025061.jpg" 
                    alt="AI-MalScan Malaria Lab Logo" 
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-lg font-black tracking-tight text-white uppercase">AI-MalScan Suite</h1>
                    <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-teal-400 shrink-0">
                      V2.4 PORTABLE
                    </span>
                    {detectedPlatform === 'android' ? (
                      <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 animate-pulse shrink-0">
                        ANDROID NATIVE
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 shrink-0">
                        ANDROID HYBRID WEB
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">Digital Microscope Parasitemia Diagnostic & National Outbreak surveillance</p>
                </div>
              </div>

              {/* Chief Technician Badge & Environment Selector */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Authenticated Chief Lab Technician Badge */}
                <div id="technician-session-badge" className="flex items-center space-x-2.5 bg-slate-950/90 border border-teal-500/30 rounded-xl px-3 py-1.5 shadow-sm">
                  <div className="h-7 w-7 rounded-lg bg-teal-500/15 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-white truncate max-w-[150px] sm:max-w-[200px]">
                        {technician.name}
                      </span>
                      <span className="text-[8px] bg-teal-500/20 text-teal-300 font-mono px-1.5 py-0.2 rounded font-bold uppercase border border-teal-500/30">
                        CHIEF TECH
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono truncate max-w-[160px] sm:max-w-[220px]">
                      {technician.facility}
                    </div>
                  </div>
                  <button 
                    id="lock-console-btn"
                    onClick={handleLogout}
                    title="Lock Diagnostic Console (Sign Out)"
                    className="ml-1 p-1.5 bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded-lg border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer flex items-center space-x-1 text-[10px] font-mono"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Lock</span>
                  </button>
                </div>

                {/* Sync Queue indicator */}
                {offlineQueue.length > 0 && (
                  <div id="sync-queue-badge" className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg text-xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span className="text-amber-400 font-mono font-bold">{offlineQueue.length} Queue</span>
                    {networkStatus === 'online' && (
                      <button
                        id="sync-now-btn"
                        onClick={() => triggerQueueSync(offlineQueue)}
                        className="text-[10px] bg-amber-500 hover:bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black uppercase transition-all cursor-pointer"
                        disabled={isSyncing}
                      >
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                      </button>
                    )}
                  </div>
                )}

                {/* Network Toggle */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-1 flex items-center">
                  <button
                    id="net-offline-toggle"
                    onClick={() => handleNetworkToggle('offline')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      networkStatus === 'offline'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <WifiOff className="h-3.5 w-3.5" />
                    <span>Offline Field</span>
                  </button>
                  <button
                    id="net-online-toggle"
                    onClick={() => handleNetworkToggle('online')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      networkStatus === 'online'
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Wifi className="h-3.5 w-3.5" />
                    <span>Online Sync</span>
                  </button>
                </div>
              </div>

            </div>
          </header>

          {/* TABS SELECTOR MENU */}
          <div className="hidden md:block bg-slate-900 border-b border-slate-800 px-6 py-2">
            <div className="max-w-7xl mx-auto flex items-center space-x-1.5">
              <button
                id="tab-scan-selector"
                onClick={() => setActiveTab('scan')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'scan'
                    ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>🔬 Diagnostic Microscope Unit</span>
              </button>
              
              <button
                id="tab-dashboard-selector"
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Database className="h-4 w-4" />
                <span>📊 Central Surveillance Dashboard</span>
              </button>
            </div>
          </div>

          {/* CORE WORKSPACE */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6 pb-20 md:pb-6">
            
            {/* TAB 1: PORTABLE MICROSCOPE SCANNING SYSTEM */}
            {activeTab === 'scan' && (
              <div className="space-y-6 animate-fade-in">
                {/* Active alert indicator for offline simulation */}
                {networkStatus === 'offline' && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start space-x-3">
                    <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-400 leading-normal">
                      <span className="font-bold">Offline Clinic Mode Active: </span> 
                      You are operating in a simulated remote clinical sector (e.g. malaria risk zone, border clinic). 
                      Scans will run completely locally on our high-fidelity Sandbox engine, logging reports to local queues. 
                      Toggle <span className="font-semibold underline">"Online Sync"</span> in the top right to instantly upload and stream outbreak records to the national registry.
                    </div>
                  </div>
                )}

                {!currentReport ? (
                  /* Microscope Stage Loader Component */
                  <MicroscopeScanner 
                    onScanComplete={handleScanComplete} 
                    isLoading={isLoading} 
                  />
                ) : (
                  /* Diagnostic Report sheet overlay */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-mono">
                        <span className="text-slate-500">Active Stage:</span>
                        <span className="text-teal-400 font-bold">Scanning Completed</span>
                      </div>
                      <button
                        id="load-next-slide-btn"
                        onClick={clearActiveReport}
                        className="flex items-center space-x-1 px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg text-xs font-bold border border-slate-800 transition-all cursor-pointer"
                      >
                        <span>Load New Slide</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>

                    <DiagnosticReport 
                      record={currentReport} 
                      source={reportSource}
                      onAuthorizeRecord={handleAuthorizeRecord}
                      isSyncing={isSyncing}
                      networkStatus={networkStatus}
                      technician={technician}
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: NATIONAL OUTBREAK SURVEILLANCE & LOGS */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-fade-in">
                {/* Outbreak warning alert */}
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-start space-x-3">
                    <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-rose-300 leading-normal">
                      <span className="font-bold">National Malaria Outbreak Alert System: </span> 
                      Monitoring surveillance nodes across three sectors. Any positivity rate exceeding 40% will trigger regional clinical dispatch mandates automatically.
                    </div>
                  </div>
                  
                  {offlineQueue.length > 0 && (
                    <button
                      id="sync-dashboard-btn"
                      onClick={() => triggerQueueSync(offlineQueue)}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-black border border-rose-500/20 px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all cursor-pointer shrink-0 ml-4"
                      disabled={isSyncing}
                    >
                      Sync {offlineQueue.length} Queued Cases
                    </button>
                  )}
                </div>

                {/* Surveillance Dashboard Component */}
                <SurveillanceDashboard records={records} />
              </div>
            )}

          </main>

          {/* FOOTER SYSTEM */}
          <footer className="bg-slate-900 border-t border-slate-800 py-6 px-6 text-center text-slate-500 text-[11px] font-mono mt-auto pb-24 md:pb-6">
            <div className="max-w-7xl mx-auto flex flex-col space-y-4">
              
              {/* Program Credits Row */}
              <div id="program-credits-container" className="border-b border-slate-800/60 pb-4 text-[11px] text-slate-400 flex flex-col md:flex-row justify-between items-center gap-2">
                <div>
                  <span className="text-teal-400 font-bold">Initiated by:</span> GECN-HP <span className="text-slate-600">|</span> <span className="text-teal-400 font-bold">Developed by:</span> JADSL ICT Unit Community Center-Gboko Benue State
                </div>
                <div>
                  <span className="text-amber-400 font-bold">Emergency Technical Assistance:</span> +2348071119766
                </div>
              </div>

              {/* System Info Row */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <div>
                  AI-MALSCAN MICRO-DIAGNOSTIC SYSTEM | SERIAL: <span className="text-slate-400">MAL-SCAN-001</span>
                </div>
                <div className="flex items-center space-x-3 text-[10px] text-slate-400">
                  <span className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full"></span>
                    <span>Local Engine: Sandbox Active</span>
                  </span>
                  <span className="text-slate-700">|</span>
                  <span className="flex items-center space-x-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${networkStatus === 'online' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                    <span>Sync Server: {networkStatus === 'online' ? 'Connected' : 'Offline Mode'}</span>
                  </span>
                </div>
                <div>
                  &copy; 2026 National Disease Surveillance Registry
                </div>
              </div>

            </div>
          </footer>

          {/* BOTTOM NAVIGATION BAR FOR MOBILE */}
          <nav id="mobile-android-nav-dock" className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 py-3.5 px-8 flex justify-around items-center z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.6)]">
            <button
              id="mobile-tab-scan-selector"
              onClick={() => setActiveTab('scan')}
              className={`flex flex-col items-center space-y-1.5 transition-all cursor-pointer ${
                activeTab === 'scan' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-5 w-5" />
              <span className="text-[10px] font-bold tracking-widest uppercase">Microscope</span>
            </button>
            <button
              id="mobile-tab-dashboard-selector"
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center space-y-1.5 transition-all cursor-pointer ${
                activeTab === 'dashboard' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="h-5 w-5" />
              <span className="text-[10px] font-bold tracking-widest uppercase">Surveillance</span>
            </button>
          </nav>
        </>
      )}

    </div>
  );
}
