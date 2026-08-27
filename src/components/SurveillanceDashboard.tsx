/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { 
  Search, ShieldAlert, Activity, FileText, CheckCircle, Database, Filter, ArrowUpRight, 
  MapPin, Clock, Info, X, Heart
} from 'lucide-react';
import { DiagnosticRecord } from '../types';

interface SurveillanceDashboardProps {
  records: DiagnosticRecord[];
}

export default function SurveillanceDashboard({ records }: SurveillanceDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState<DiagnosticRecord | null>(null);

  // 1. CALCULATE TOP-LEVEL KPIS
  const kpis = useMemo(() => {
    const total = records.length;
    const positiveRecords = records.filter(r => r.result.parasiteDetected);
    const positive = positiveRecords.length;
    const negative = total - positive;
    const positivityRate = total > 0 ? parseFloat(((positive / total) * 100).toFixed(1)) : 0;
    
    // Average parasite density among positive records
    const totalDensity = positiveRecords.reduce((sum, r) => sum + r.result.density, 0);
    const avgDensity = positive > 0 ? Math.round(totalDensity / positive) : 0;

    return { total, positive, negative, positivityRate, avgDensity };
  }, [records]);

  // 2. COMPUTE SPECIES DISTRIBUTION (for Pie Chart)
  const speciesData = useMemo(() => {
    const counts: Record<string, number> = {
      'Plasmodium falciparum': 0,
      'Plasmodium vivax': 0,
      'Plasmodium malariae': 0,
      'Plasmodium ovale': 0
    };

    records.forEach(r => {
      if (r.result.parasiteDetected && counts[r.result.species] !== undefined) {
        counts[r.result.species]++;
      }
    });

    const colors = ['#f43f5e', '#f59e0b', '#eab308', '#a855f7'];

    return Object.keys(counts)
      .map((key, i) => ({
        name: key.replace('Plasmodium ', 'P. '),
        value: counts[key],
        color: colors[i]
      }))
      .filter(item => item.value > 0);
  }, [records]);

  // 3. COMPUTE OUTBREAK TRENDS OVER PAST 30 DAYS (for Line Chart)
  const trendData = useMemo(() => {
    const dailyMap: Record<string, { date: string; Positive: number; Negative: number; timestamp: number }> = {};
    
    records.forEach(r => {
      const dateObj = new Date(r.timestamp);
      // Format as MM/DD
      const dateKey = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
      
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          date: dateKey,
          Positive: 0,
          Negative: 0,
          timestamp: dateObj.getTime()
        };
      }
      
      if (r.result.parasiteDetected) {
        dailyMap[dateKey].Positive++;
      } else {
        dailyMap[dateKey].Negative++;
      }
    });

    // Sort by timestamp ascending
    return Object.values(dailyMap)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-15); // Show last 15 days of activity for visual balance
  }, [records]);

  // 4. COMPUTE REGIONAL HOTSPOTS (Clinics risk levels)
  const hotspots = useMemo(() => {
    const clinics: Record<string, { total: number; positive: number }> = {};
    
    records.forEach(r => {
      const cId = r.patient.clinicId || 'Unknown Clinic';
      if (!clinics[cId]) {
        clinics[cId] = { total: 0, positive: 0 };
      }
      clinics[cId].total++;
      if (r.result.parasiteDetected) {
        clinics[cId].positive++;
      }
    });

    return Object.keys(clinics).map(name => {
      const clinic = clinics[name];
      const rate = clinic.total > 0 ? parseFloat(((clinic.positive / clinic.total) * 100).toFixed(1)) : 0;
      
      let riskTier: 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
      let riskColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      if (rate >= 40) {
        riskTier = 'HIGH';
        riskColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      } else if (rate >= 20) {
        riskTier = 'MODERATE';
        riskColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      }

      return { name, total: clinic.total, positive: clinic.positive, rate, riskTier, riskColor };
    }).sort((a, b) => b.rate - a.rate);
  }, [records]);

  // 5. LEDGER FILTERING & SEARCHING
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = 
        r.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.deviceId.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesSpecies = 
        speciesFilter === 'ALL' ||
        (speciesFilter === 'POSITIVE' && r.result.parasiteDetected) ||
        (speciesFilter === 'NEGATIVE' && !r.result.parasiteDetected) ||
        r.result.species === speciesFilter;

      return matchesSearch && matchesSpecies;
    });
  }, [records, searchTerm, speciesFilter]);

  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div id="surveillance-dashboard-root" className="space-y-6">
      
      {/* SECTION 1: TOP KEY INDICATORS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Diagnostic Scans</span>
            <div className="text-2xl font-black font-mono text-white">{kpis.total.toLocaleString()}</div>
            <div className="text-[9px] text-slate-500">Microscopes synced across clinics</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-teal-400 shadow-inner">
            <Database className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Surveillance Positivity</span>
            <div className="text-2xl font-black font-mono text-rose-400">{kpis.positivityRate}%</div>
            <div className="text-[9px] text-slate-500">{kpis.positive} infected / {kpis.negative} cleared</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-rose-400 shadow-inner">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Parasitemia Density</span>
            <div className="text-2xl font-black font-mono text-amber-400">{kpis.avgDensity.toLocaleString()}</div>
            <div className="text-[9px] text-slate-500">parasites/µL across active cases</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-amber-400 shadow-inner">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Outbreak Sites</span>
            <div className="text-2xl font-black font-mono text-white">
              {hotspots.filter(h => h.riskTier === 'HIGH').length} / {hotspots.length}
            </div>
            <div className="text-[9px] text-slate-500">High-risk clinics with positivity &gt; 40%</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-indigo-400 shadow-inner">
            <MapPin className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* SECTION 2: GRAPHICAL ANALYTICS PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Epidemic curves: Case Trend (Line chart) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Clock className="h-4 w-4 text-teal-400" />
              <span>30-Day Epidemic Trend Curves</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Cases aggregated daily</span>
          </div>

          <div className="h-64 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="Positive" stroke="#f43f5e" strokeWidth={3} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Negative" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                No historical trend data compiled.
              </div>
            )}
          </div>
        </div>

        {/* Species Distribution Chart (Pie chart) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Heart className="h-4 w-4 text-rose-500" />
              <span>Taxonomic Breakdown</span>
            </h3>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center">
            {speciesData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={speciesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {speciesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Central Ring Text */}
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Infections</span>
                  <span className="text-lg font-black font-mono text-white">{kpis.positive}</span>
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-500 font-mono">No infections detected.</div>
            )}
          </div>

          {/* Custom Legends list */}
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono pt-3 border-t border-slate-800">
            {speciesData.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-300 truncate">{item.name}</span>
                <span className="text-slate-500 ml-auto">({item.value})</span>
              </div>
            ))}
            {speciesData.length === 0 && (
              <div className="col-span-2 text-center text-slate-600">Surveillance database is clear</div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: HOTSPOT CLINICS & GENERAL LEDGER */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Outbreak Hotspots table */}
        <div className="xl:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-indigo-400" />
              <span>Clinic Hotspots Risk Register</span>
            </h3>
          </div>

          <div className="space-y-3">
            {hotspots.map((clinic, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800/60 rounded-xl p-3 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-200">{clinic.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Scanned: <span className="text-slate-300">{clinic.total}</span> | Positive: <span className="text-slate-300">{clinic.positive}</span>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end space-y-1.5">
                  <span className="text-xs font-mono font-black text-white">{clinic.rate}% rate</span>
                  <span className={`text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded border ${clinic.riskColor}`}>
                    {clinic.riskTier} RISK
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* General Case Ledger */}
        <div className="xl:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <FileText className="h-4 w-4 text-teal-400" />
              <span>National Outbreak Ledger</span>
            </h3>
            
            {/* Filters Row */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  id="ledger-search-input"
                  type="text"
                  placeholder="Search patient / device / UUID..."
                  className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-teal-500 w-44"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                id="ledger-species-filter"
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-teal-500"
                value={speciesFilter}
                onChange={e => setSpeciesFilter(e.target.value)}
              >
                <option value="ALL">All Species</option>
                <option value="POSITIVE">Positive Cases Only</option>
                <option value="NEGATIVE">Negative Controls Only</option>
                <option value="Plasmodium falciparum">P. falciparum</option>
                <option value="Plasmodium vivax">P. vivax</option>
                <option value="Plasmodium malariae">P. malariae</option>
              </select>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  <th className="py-2.5 px-3">Date/Time</th>
                  <th className="py-2.5 px-3">Clinic Site</th>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">Diagnosis Status</th>
                  <th className="py-2.5 px-3">Parasite Density</th>
                  <th className="py-2.5 px-3 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-[11px] font-mono text-slate-300">
                {filteredRecords.slice(0, 10).map((record) => {
                  const isPos = record.result.parasiteDetected;
                  return (
                    <tr id={`ledger-row-${record.id}`} key={record.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{formatDateTime(record.timestamp)}</td>
                      <td className="py-3 px-3 text-slate-200 font-semibold truncate max-w-[120px]">{record.patient.clinicId}</td>
                      <td className="py-3 px-3 text-white font-medium">{record.patient.name} ({record.patient.age}Y)</td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          isPos 
                            ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' 
                            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        }`}>
                          {isPos ? record.result.species.replace('Plasmodium ', 'P. ') : 'Negative'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-100">
                        {isPos ? `${record.result.density.toLocaleString()} / µL` : '0'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          id={`ledger-audit-btn-${record.id}`}
                          onClick={() => setSelectedRecord(record)}
                          className="p-1 text-teal-400 hover:text-teal-300 hover:bg-teal-500/5 rounded transition-all"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                      No matching records found in central surveillance database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredRecords.length > 10 && (
            <div className="text-[10px] text-slate-500 text-center pt-2 font-mono">
              Showing 10 most recent of {filteredRecords.length} synchronized outbreak records.
            </div>
          )}
        </div>
      </div>

      {/* HISTORIC RECORD MODAL (AUDIT VIEW) */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              id="close-audit-modal-btn"
              onClick={() => setSelectedRecord(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Database className="h-5 w-5 text-teal-400" />
              <h4 className="text-md font-bold text-white uppercase tracking-wider">Surveillance Case Audit File</h4>
            </div>

            {/* Read-only simplified diagnostic card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-[11px]">
              {/* Profile */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 space-y-2">
                <div className="text-[9px] font-bold text-slate-500 uppercase">Patient Profile</div>
                <div>Name: <span className="text-white font-bold">{selectedRecord.patient.name}</span></div>
                <div>Age: <span className="text-white">{selectedRecord.patient.age} Yrs</span></div>
                <div>Weight: <span className="text-white">{selectedRecord.patient.weight} kg</span></div>
                <div>Gender: <span className="text-white">{selectedRecord.patient.gender}</span></div>
                <div>Clinic: <span className="text-white">{selectedRecord.patient.clinicId}</span></div>
              </div>

              {/* Scan Info */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 space-y-2">
                <div className="text-[9px] font-bold text-slate-500 uppercase">Micro-Scan Information</div>
                <div>Record ID: <span className="text-slate-400">{selectedRecord.id}</span></div>
                <div>Device ID: <span className="text-slate-400">{selectedRecord.deviceId}</span></div>
                <div>Sign-off: <span className={selectedRecord.workerConfirmed ? 'text-teal-400' : 'text-rose-400'}>
                  {selectedRecord.workerConfirmed ? 'Approved / Signed' : 'Flagged for Audit'}
                </span></div>
                {selectedRecord.technician && (
                  <div className="pt-1 text-[10px] text-teal-300">
                    Chief Tech: <span className="text-white font-bold">{selectedRecord.technician.name}</span> ({selectedRecord.technician.licenseNumber})
                  </div>
                )}
              </div>

              {/* Diagnosis */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 space-y-2">
                <div className="text-[9px] font-bold text-slate-500 uppercase">AI Diagnosis Result</div>
                <div className="text-xs font-black text-rose-500">
                  {selectedRecord.result.parasiteDetected ? 'POSITIVE' : 'NEGATIVE'}
                </div>
                <div>Species: <span className="text-white italic">{selectedRecord.result.species}</span></div>
                <div>Density: <span className="text-white">{selectedRecord.result.density.toLocaleString()} / µL</span></div>
                <div>Confidence: <span className="text-teal-400">{(selectedRecord.result.confidenceScore * 100).toFixed(1)}%</span></div>
              </div>
            </div>

            {/* Prescribed and Notes */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 space-y-3 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[9px] mb-1">Prescribed Action / Drug:</span>
                <span className="text-teal-400 font-bold bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs">
                  {selectedRecord.treatmentRegimen || 'No prescription written'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800/50">
                <span className="text-slate-500 block uppercase font-bold text-[9px] mb-1">Microscopic & Case Notes:</span>
                <p className="text-slate-300 leading-relaxed leading-normal bg-slate-950 p-3 border border-slate-800 rounded whitespace-pre-line">
                  {selectedRecord.notes}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                id="audit-print-mock-btn"
                onClick={() => alert('Diagnostic sheet print instruction queued to clinic laboratory network.')}
                className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-mono font-bold text-xs px-4 py-2 rounded-lg transition-all"
              >
                Print Lab Sheet
              </button>
              <button
                id="audit-close-btn"
                onClick={() => setSelectedRecord(null)}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold font-mono text-xs px-5 py-2 rounded-lg transition-all"
              >
                Close Audit File
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
