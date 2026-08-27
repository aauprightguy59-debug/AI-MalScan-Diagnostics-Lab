/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, AlertTriangle, ShieldCheck, Heart, User, ClipboardList, Info, HelpCircle, Award, Stethoscope, Stamp } from 'lucide-react';
import { DiagnosticRecord, WHO_TREATMENT_GUIDELINES, ChiefTechnician } from '../types';

interface DiagnosticReportProps {
  record: DiagnosticRecord;
  source: string;
  onAuthorizeRecord: (updatedRecord: DiagnosticRecord) => void;
  isSyncing: boolean;
  networkStatus: 'online' | 'offline';
  technician?: ChiefTechnician | null;
}

export default function DiagnosticReport({
  record,
  source,
  onAuthorizeRecord,
  isSyncing,
  networkStatus,
  technician
}: DiagnosticReportProps) {
  const { patient, result, timestamp, id, deviceId } = record;
  const isPositive = result.parasiteDetected;

  // Active inputs for sign-off
  const [workerAction, setWorkerAction] = useState<'confirm' | 'flag'>('confirm');
  const [selectedDrug, setSelectedDrug] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  // Auto-fill drug recommendations based on species and weight
  useEffect(() => {
    if (isPositive && result.species) {
      const guideline = WHO_TREATMENT_GUIDELINES[result.species];
      if (guideline && guideline.drugs.length > 0) {
        setSelectedDrug(guideline.drugs[0]);
      }
    } else {
      setSelectedDrug('No antimalarials required');
    }
    setCustomNotes('');
    setWorkerAction('confirm');
  }, [record.id]);

  // Determine severity tier based on parasite density (per µL)
  const getSeverityTier = (density: number) => {
    if (!isPositive) return { label: 'HEALTHY / NEGATIVE', color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/20' };
    if (density < 1000) return { label: 'LOW PARASITEMIA', color: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/20' };
    if (density < 10000) return { label: 'MODERATE PARASITEMIA', color: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/20' };
    return { label: 'HIGH PARASITEMIA (URGENT)', color: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/20' };
  };

  const severity = getSeverityTier(result.density);

  // Weight-based dosing guidelines (WHO Coartem schedule for Falciparum)
  const getWeightBasedDosing = () => {
    if (result.species !== 'Plasmodium falciparum') {
      return WHO_TREATMENT_GUIDELINES[result.species]?.schedule || '';
    }
    const w = patient.weight;
    if (w < 5) return 'Artemether-Lumefantrine is not recommended for infants under 5kg. Refer immediately to emergency pediatric care.';
    if (w < 15) return '1 Tablet of Artemether-Lumefantrine (20mg/120mg) twice daily for 3 days (Total: 6 tabs).';
    if (w < 25) return '2 Tablets of Artemether-Lumefantrine (20mg/120mg) twice daily for 3 days (Total: 12 tabs).';
    if (w < 35) return '3 Tablets of Artemether-Lumefantrine (20mg/120mg) twice daily for 3 days (Total: 18 tabs).';
    return '4 Tablets of Artemether-Lumefantrine (20mg/120mg) twice daily for 3 days (Total: 24 tabs).';
  };

  const dosageSchedule = getWeightBasedDosing();
  const warningMsg = WHO_TREATMENT_GUIDELINES[result.species]?.warning;

  const handleAuthorize = () => {
    const updated: DiagnosticRecord = {
      ...record,
      workerConfirmed: workerAction === 'confirm',
      treatmentRegimen: workerAction === 'confirm' ? selectedDrug : 'MANUAL_REVIEW_FLAGGED',
      notes: customNotes.trim() !== '' ? customNotes : result.clinicalNotes,
      synced: false, // Will trigger sync in parent
      technician: technician || record.technician
    };
    onAuthorizeRecord(updated);
  };

  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div id="diagnostic-report-container" className="space-y-6">
      {/* SECTION 1: LAB REPORT SHEET */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Laboratory Watermark Header */}
        <div className="bg-slate-900 border-b border-slate-800 p-5 flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-slate-800 shrink-0">
              <img 
                src="/src/assets/images/malaria_lab_logo_1783687025061.jpg" 
                alt="Malaria Lab Logo" 
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="text-[10px] font-bold text-teal-400 tracking-widest uppercase">AI-MalScan Clinical Unit</div>
              <h1 className="text-md font-bold text-white tracking-tight uppercase">Diagnostic Lab Report Sheet</h1>
            </div>
          </div>
          <div className="text-right font-mono text-[10px] text-slate-500">
            <div>DEVICE_ID: <span className="text-slate-300 font-semibold">{deviceId}</span></div>
            <div>SCAN_UUID: <span className="text-slate-300">{id}</span></div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Patient Profile Card & Result Badge Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Patient Info */}
            <div className="md:col-span-4 bg-slate-900/50 rounded-xl p-4 border border-slate-800/40 space-y-3">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800/60">
                <User className="h-3.5 w-3.5 text-slate-500" />
                <span>Patient Profile</span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Name:</span>
                  <span className="text-slate-200 font-medium">{patient.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Age:</span>
                  <span className="text-slate-200">{patient.age} Yrs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Weight:</span>
                  <span className="text-slate-200">{patient.weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gender:</span>
                  <span className="text-slate-200">{patient.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Admit Clinic:</span>
                  <span className="text-slate-300 truncate max-w-[130px]">{patient.clinicId}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800/40 pt-2 text-[10px]">
                  <span className="text-slate-500">Date/Time:</span>
                  <span className="text-teal-400">{formatDateTime(timestamp)}</span>
                </div>
              </div>
            </div>

            {/* Diagnostic Core Result */}
            <div className="md:col-span-8 flex flex-col justify-between space-y-4">
              <div className={`p-5 rounded-xl border ${severity.border} bg-slate-900/30 flex items-start justify-between`}>
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diagnostic Findings</div>
                  <h2 className={`text-2xl font-black ${isPositive ? 'text-rose-500' : 'text-emerald-400'} tracking-tight`}>
                    {isPositive ? 'MALARIA POSITIVE' : 'MALARIA NEGATIVE'}
                  </h2>
                  <div className="flex items-center space-x-2 text-sm font-semibold">
                    <span className="text-slate-400">Classified Species:</span>
                    <span className="text-white italic underline decoration-teal-500/50 decoration-2">
                      {result.species}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Severity Level</div>
                  <div className={`text-xs font-black tracking-wide ${severity.text} mt-1.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg`}>
                    {severity.label}
                  </div>
                </div>
              </div>

              {/* Density Bar and Confidence Indicator Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Parasite Density */}
                <div className="bg-slate-900/20 border border-slate-800/60 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Parasite Density</span>
                  <div className="my-1.5 flex items-baseline space-x-1">
                    <span className="text-xl font-mono font-black text-white">
                      {isPositive ? result.density.toLocaleString() : '0'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">parasites/µL</span>
                  </div>
                  {/* Gauge bar */}
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full ${severity.color}`} 
                      style={{ width: `${Math.min(100, (result.density / 35000) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* AI Confidence Meter */}
                <div className="bg-slate-900/20 border border-slate-800/60 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inference Confidence</span>
                  <div className="my-1.5 flex items-baseline space-x-1">
                    <span className="text-xl font-mono font-black text-teal-400">
                      {(result.confidenceScore * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">confidence</span>
                  </div>
                  {/* Confidence progress */}
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="h-full bg-teal-400" 
                      style={{ width: `${result.confidenceScore * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Microscopic Findings Text */}
          <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-800/60 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-800/40">
              <ClipboardList className="h-3.5 w-3.5 text-teal-400" />
              <span>Microscopist Clinical Analysis Observations</span>
              <span className="text-[9px] text-slate-500 font-mono ml-auto">
                Engine: {source === 'gemini_3.5_flash' ? '🔴 Live Server Gemini-3.5' : '🟢 Local Resilient Sandbox'}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-line">
              {result.clinicalNotes}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: WORKER SIGN-OFF & TREATMENT DECISION CONSOLE */}
      {record.workerConfirmed === null ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-teal-400" />
              <h3 className="text-md font-semibold text-white tracking-tight">Chief Lab Technician Review & Treatment Sign-off</h3>
            </div>
            {technician && (
              <div className="flex items-center space-x-2 bg-teal-500/10 border border-teal-500/30 px-3 py-1 rounded-lg text-[11px] font-mono text-teal-300">
                <Award className="h-3.5 w-3.5 text-teal-400" />
                <span>Authorized Signer: <strong className="text-white">{technician.name}</strong> ({technician.licenseNumber})</span>
              </div>
            )}
          </div>

          {/* Action selection */}
          <div className="grid grid-cols-2 gap-4">
            <button
              id="action-confirm-btn"
              onClick={() => setWorkerAction('confirm')}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                workerAction === 'confirm'
                  ? 'bg-teal-950/20 border-teal-500 text-teal-200 shadow-md shadow-teal-500/5'
                  : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold uppercase tracking-wider">Confirm Diagnosis</span>
                <CheckCircle2 className={`h-4.5 w-4.5 ${workerAction === 'confirm' ? 'text-teal-400' : 'text-slate-600'}`} />
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Authorize analysis findings and initiate standard WHO treatment regimen immediately.</p>
            </button>

            <button
              id="action-flag-btn"
              onClick={() => setWorkerAction('flag')}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                workerAction === 'flag'
                  ? 'bg-rose-950/20 border-rose-500 text-rose-200 shadow-md shadow-rose-500/5'
                  : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold uppercase tracking-wider">Flag for Review</span>
                <AlertTriangle className={`h-4.5 w-4.5 ${workerAction === 'flag' ? 'text-rose-400' : 'text-slate-600'}`} />
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Flag slide for secondary manual examination by laboratory expert due to diagnostic doubt.</p>
            </button>
          </div>

          {/* Treatment Details if confirmed */}
          {workerAction === 'confirm' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <Heart className="h-4 w-4 text-rose-400 animate-pulse" />
                  <span>WHO Standard Treatment Protocol</span>
                </div>
                <span className="bg-teal-500/10 text-teal-300 text-[9px] font-bold px-2 py-0.5 rounded border border-teal-500/20 uppercase">
                  Regimen Assistant Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select Prescription Drug */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Prescribed Antimalarial Agent</label>
                  <select
                    id="treatment-drug-select"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                    value={selectedDrug}
                    onChange={e => setSelectedDrug(e.target.value)}
                  >
                    {isPositive ? (
                      WHO_TREATMENT_GUIDELINES[result.species]?.drugs.map((drug, idx) => (
                        <option key={idx} value={drug}>{drug}</option>
                      )) || <option value="Oral Chloroquine">Oral Chloroquine</option>
                    ) : (
                      <option value="No antimalarials required">No antimalarials required</option>
                    )}
                  </select>
                </div>

                {/* Weight Context Info */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5 flex items-center space-x-3 text-xs">
                  <Info className="h-5 w-5 text-teal-400 shrink-0" />
                  <div className="text-[11px] text-slate-400 leading-snug">
                    <span className="text-white font-semibold">Weight Context: </span>
                    Patient body weight is <span className="text-teal-300 font-bold">{patient.weight}kg</span>. 
                    The drug schedule has been auto-calibrated to pediatric/adult limits.
                  </div>
                </div>
              </div>

              {/* Dosage Guideline Schedule Display */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Calibrated Dosing Schedule:</div>
                <p className="text-xs text-white leading-normal font-mono">{dosageSchedule}</p>
                {warningMsg && (
                  <div className="text-[10px] text-yellow-500/90 font-mono mt-1 pt-1.5 border-t border-slate-800/60 flex items-start space-x-1.5">
                    <span className="font-bold shrink-0">⚠️ WARNING:</span>
                    <span>{warningMsg}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Clinician Review Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Clinician Sign-off Review Notes (Optional)</label>
            <textarea
              id="clinical-review-notes"
              rows={2}
              placeholder="e.g. Initiated standard dosing. Advised clinical follow-up in 24 hours. Normal liver/kidney profiles expected."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition-colors placeholder-slate-600 font-mono"
              value={customNotes}
              onChange={e => setCustomNotes(e.target.value)}
            />
          </div>

          {/* Action Trigger Button */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <div className="text-[10px] font-mono text-slate-500 flex items-center space-x-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${networkStatus === 'online' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
              <span>
                {networkStatus === 'online' 
                  ? 'Cloud Synced Mode: Authorizing triggers immediate upload' 
                  : 'Offline Field Mode: Authorizing saves scan in Local Queue'}
              </span>
            </div>
            
            <button
              id="authorize-and-sign-btn"
              onClick={handleAuthorize}
              disabled={isSyncing}
              className={`px-6 py-2.5 rounded-lg font-bold text-xs tracking-wide shadow-lg cursor-pointer ${
                workerAction === 'confirm'
                  ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 hover:shadow-teal-500/10'
                  : 'bg-rose-500 hover:bg-rose-400 text-slate-950 hover:shadow-rose-500/10'
              } transition-all`}
            >
              {isSyncing ? 'Synchronizing Case...' : 'Authorize & Sign Case Report'}
            </button>
          </div>
        </div>
      ) : (
        /* Signoff Completed Status Card */
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg border ${record.workerConfirmed ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-tight">Case Authorized & Signed Off</h4>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Regimen prescribed: <span className="text-slate-200">{record.treatmentRegimen}</span>
              </p>
              {(record.technician || technician) && (
                <p className="text-[11px] text-teal-400 font-mono mt-1 flex items-center space-x-1.5">
                  <Award className="h-3.5 w-3.5" />
                  <span>
                    Authenticated by: <strong>{(record.technician || technician)?.name}</strong> ({(record.technician || technician)?.licenseNumber}) - {(record.technician || technician)?.facility}
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`text-[10px] font-mono px-2.5 py-1 rounded border ${
              record.synced 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
            }`}>
              {record.synced ? '● SYNCED TO SURVEILLANCE' : '◷ LOCAL QUEUE (PENDING SYNC)'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
