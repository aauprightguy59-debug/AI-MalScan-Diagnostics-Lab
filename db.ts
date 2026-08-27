import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import type { DiagnosticRecord, LabStaffAccount } from './src/types.js';

const dataDir = path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'aimalscan.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    deviceId TEXT,
    patient TEXT NOT NULL,
    result TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    workerConfirmed INTEGER,
    treatmentRegimen TEXT,
    notes TEXT,
    synced INTEGER NOT NULL DEFAULT 0,
    imageKey TEXT,
    technician TEXT
  );

  CREATE TABLE IF NOT EXISTS lab_staff_accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    licenseNumber TEXT NOT NULL,
    facility TEXT NOT NULL,
    role TEXT NOT NULL,
    password TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    loginTime TEXT NOT NULL
  );
`);

export function normalizeLabStaffAccount(row: any): LabStaffAccount {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    licenseNumber: row.licenseNumber,
    facility: row.facility,
    role: row.role,
    password: row.password,
    createdAt: row.createdAt,
    loginTime: row.loginTime
  };
}

export function seedDefaultStaffAccounts() {
  const count = db.prepare(`
    SELECT COUNT(*) as count
    FROM lab_staff_accounts
  `).get().count;

  if (count > 0) return;

  const defaultAccount: LabStaffAccount = {
    id: 'tech-demo-001',
    name: 'Dr. Emmanuel Orkaa, MLS',
    title: 'Chief Medical Laboratory Scientist',
    licenseNumber: 'MLS-GBK-2026-088',
    facility: 'JADSL ICT Unit Community Center Lab - Gboko',
    role: 'Chief Lab Technician',
    password: 'SCAN01',
    createdAt: new Date().toISOString(),
    loginTime: new Date().toISOString()
  };

  const stmt = db.prepare(`
    INSERT INTO lab_staff_accounts (
      id,
      name,
      title,
      licenseNumber,
      facility,
      role,
      password,
      createdAt,
      loginTime
    ) VALUES (
      @id,
      @name,
      @title,
      @licenseNumber,
      @facility,
      @role,
      @password,
      @createdAt,
      @loginTime
    )
  `);

  stmt.run(defaultAccount);
}

export function getAllStaffAccounts(): LabStaffAccount[] {
  const rows = db.prepare(`
    SELECT *
    FROM lab_staff_accounts
    ORDER BY createdAt DESC
  `).all();

  return rows.map(normalizeLabStaffAccount);
}

export function getStaffAccountByCredentials(facility: string, name: string, password: string): LabStaffAccount | null {
  const row = db.prepare(`
    SELECT *
    FROM lab_staff_accounts
    WHERE LOWER(facility) = LOWER(?)
      AND LOWER(name) = LOWER(?)
      AND password = ?
  `).get(facility.trim(), name.trim(), password);

  return row ? normalizeLabStaffAccount(row) : null;
}

export function createStaffAccount(account: LabStaffAccount) {
  const stmt = db.prepare(`
    INSERT INTO lab_staff_accounts (
      id,
      name,
      title,
      licenseNumber,
      facility,
      role,
      password,
      createdAt,
      loginTime
    ) VALUES (
      @id,
      @name,
      @title,
      @licenseNumber,
      @facility,
      @role,
      @password,
      @createdAt,
      @loginTime
    )
  `);

  stmt.run(account);
  return account;
}

export function findStaffAccountByFacilityAndName(facility: string, name: string): LabStaffAccount | null {
  const row = db.prepare(`
    SELECT *
    FROM lab_staff_accounts
    WHERE LOWER(facility) = LOWER(?)
      AND LOWER(name) = LOWER(?)
  `).get(facility.trim(), name.trim());

  return row ? normalizeLabStaffAccount(row) : null;
}

export function normalizeRow(row: any): DiagnosticRecord {
  return {
    id: row.id,
    deviceId: row.deviceId,
    patient: JSON.parse(row.patient),
    result: JSON.parse(row.result),
    timestamp: row.timestamp,
    workerConfirmed: row.workerConfirmed === null ? null : row.workerConfirmed === 1,
    treatmentRegimen: row.treatmentRegimen,
    notes: row.notes || '',
    synced: row.synced === 1,
    imageKey: row.imageKey || '',
    technician: row.technician ? JSON.parse(row.technician) : undefined
  };
}

export function upsertRecord(record: DiagnosticRecord) {
  const stmt = db.prepare(`
    INSERT INTO records (
      id,
      deviceId,
      patient,
      result,
      timestamp,
      workerConfirmed,
      treatmentRegimen,
      notes,
      synced,
      imageKey,
      technician
    ) VALUES (
      @id,
      @deviceId,
      @patient,
      @result,
      @timestamp,
      @workerConfirmed,
      @treatmentRegimen,
      @notes,
      @synced,
      @imageKey,
      @technician
    )
    ON CONFLICT(id) DO UPDATE SET
      deviceId = excluded.deviceId,
      patient = excluded.patient,
      result = excluded.result,
      timestamp = excluded.timestamp,
      workerConfirmed = excluded.workerConfirmed,
      treatmentRegimen = excluded.treatmentRegimen,
      notes = excluded.notes,
      synced = excluded.synced,
      imageKey = excluded.imageKey,
      technician = excluded.technician
  `);

  stmt.run({
    id: record.id,
    deviceId: record.deviceId,
    patient: JSON.stringify(record.patient),
    result: JSON.stringify(record.result),
    timestamp: record.timestamp,
    workerConfirmed: record.workerConfirmed === null ? null : record.workerConfirmed ? 1 : 0,
    treatmentRegimen: record.treatmentRegimen,
    notes: record.notes,
    synced: record.synced ? 1 : 0,
    imageKey: record.imageKey,
    technician: record.technician ? JSON.stringify(record.technician) : null
  });
}

export function getAllRecords(): DiagnosticRecord[] {
  const rows = db.prepare(`
    SELECT *
    FROM records
    ORDER BY timestamp DESC
  `).all();

  return rows.map(normalizeRow);
}

export function getRecordById(id: string): DiagnosticRecord | null {
  const row = db.prepare(`
    SELECT *
    FROM records
    WHERE id = ?
  `).get(id);

  return row ? normalizeRow(row) : null;
}

export default db;
