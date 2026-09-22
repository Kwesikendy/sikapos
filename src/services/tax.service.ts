import crypto from 'crypto';
import type Database from 'better-sqlite3';
import { getDb } from '../db/connection.ts';
import type { TaxProfile, TaxProfileType } from '../types/index.ts';

export interface TaxCalculationResult {
  subtotal: number;
  nhilAmount: number;
  getfundAmount: number;
  covidLevyAmount: number;
  vatAmount: number;
  totalTax: number;
  grandTotal: number;
  formattedSubtotal: string;
  formattedNhil: string;
  formattedGetfund: string;
  formattedVat: string;
  formattedTotalTax: string;
  formattedGrandTotal: string;
  effectiveTaxRatePercent: number;
  taxProfileName: string;
}

export class TaxService {
  private db: Database.Database;

  // Authoritative standard Ghana Revenue Authority rates
  public static readonly GRA_STANDARD_RATES = {
    vatRate: 15.0,
    nhilRate: 2.5,
    getfundRate: 2.5,
    covidLevyRate: 0.0 // Set to 0.0 in modern GRA schedule
  };

  constructor(customDb?: Database.Database) {
    this.db = customDb || getDb();
  }

  public static formatGhanaCurrency(amount: number): string {
    const formatted = new Intl.NumberFormat('en-GH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return `GH₵ ${formatted}`;
  }

  public getActiveTaxProfile(tenantId: string): TaxProfile {
    const row = this.db.prepare(`
      SELECT * FROM tax_profiles
      WHERE tenant_id = ? AND is_active = 1
      ORDER BY updated_at DESC
      LIMIT 1
    `).get(tenantId) as {
      id: string;
      tenant_id: string;
      name: string;
      tax_type: string;
      vat_rate: number;
      nhil_rate: number;
      getfund_rate: number;
      covid_levy_rate: number;
      is_active: number;
      created_at: string;
      updated_at: string;
    } | undefined;

    if (!row) {
      // Default fallback profile for new tenant
      return {
        id: 'default',
        tenant_id: tenantId,
        name: 'Standard GRA Tax (15% VAT + 2.5% NHIL + 2.5% GETFund)',
        tax_type: 'standard_gra',
        vat_rate: TaxService.GRA_STANDARD_RATES.vatRate,
        nhil_rate: TaxService.GRA_STANDARD_RATES.nhilRate,
        getfund_rate: TaxService.GRA_STANDARD_RATES.getfundRate,
        covid_levy_rate: TaxService.GRA_STANDARD_RATES.covidLevyRate,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    return {
      id: row.id,
      tenant_id: row.tenant_id,
      name: row.name,
      tax_type: row.tax_type as TaxProfileType,
      vat_rate: row.vat_rate,
      nhil_rate: row.nhil_rate,
      getfund_rate: row.getfund_rate,
      covid_levy_rate: row.covid_levy_rate,
      is_active: row.is_active === 1,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  public setTaxProfile(tenantId: string, params: {
    taxType: TaxProfileType;
    customVatRate?: number;
    customNhilRate?: number;
    customGetfundRate?: number;
  }): TaxProfile {
    // Deactivate previous active profiles for this tenant
    this.db.prepare(`
      UPDATE tax_profiles
      SET is_active = 0, updated_at = DATETIME('now')
      WHERE tenant_id = ?
    `).run(tenantId);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    let name = 'Ghana Standard VAT + Levies';
    let vatRate = TaxService.GRA_STANDARD_RATES.vatRate;
    let nhilRate = TaxService.GRA_STANDARD_RATES.nhilRate;
    let getfundRate = TaxService.GRA_STANDARD_RATES.getfundRate;
    let covidLevyRate = TaxService.GRA_STANDARD_RATES.covidLevyRate;

    if (params.taxType === 'not_registered') {
      name = 'Not VAT Registered (Exempt Retailer)';
      vatRate = 0;
      nhilRate = 0;
      getfundRate = 0;
      covidLevyRate = 0;
    } else if (params.taxType === 'custom') {
      name = 'Custom Tax Profile';
      vatRate = params.customVatRate ?? 0;
      nhilRate = params.customNhilRate ?? 0;
      getfundRate = params.customGetfundRate ?? 0;
      covidLevyRate = 0;
    }

    this.db.prepare(`
      INSERT INTO tax_profiles (id, tenant_id, name, tax_type, vat_rate, nhil_rate, getfund_rate, covid_levy_rate, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(id, tenantId, name, params.taxType, vatRate, nhilRate, getfundRate, covidLevyRate, now, now);

    return {
      id,
      tenant_id: tenantId,
      name,
      tax_type: params.taxType,
      vat_rate: vatRate,
      nhil_rate: nhilRate,
      getfund_rate: getfundRate,
      covid_levy_rate: covidLevyRate,
      is_active: true,
      created_at: now,
      updated_at: now
    };
  }

  public calculateTaxes(subtotal: number, profile: TaxProfile): TaxCalculationResult {
    const nhil = (subtotal * profile.nhil_rate) / 100;
    const getfund = (subtotal * profile.getfund_rate) / 100;
    const covid = (subtotal * profile.covid_levy_rate) / 100;

    // GRA standard rules: VAT is calculated on (Subtotal + NHIL + GETFund + COVID Levy)
    const taxableBaseForVat = subtotal + nhil + getfund + covid;
    const vat = (taxableBaseForVat * profile.vat_rate) / 100;

    const totalTax = nhil + getfund + covid + vat;
    const grandTotal = subtotal + totalTax;

    return {
      subtotal,
      nhilAmount: Number(nhil.toFixed(2)),
      getfundAmount: Number(getfund.toFixed(2)),
      covidLevyAmount: Number(covid.toFixed(2)),
      vatAmount: Number(vat.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
      formattedSubtotal: TaxService.formatGhanaCurrency(subtotal),
      formattedNhil: TaxService.formatGhanaCurrency(nhil),
      formattedGetfund: TaxService.formatGhanaCurrency(getfund),
      formattedVat: TaxService.formatGhanaCurrency(vat),
      formattedTotalTax: TaxService.formatGhanaCurrency(totalTax),
      formattedGrandTotal: TaxService.formatGhanaCurrency(grandTotal),
      effectiveTaxRatePercent: subtotal > 0 ? Number(((totalTax / subtotal) * 100).toFixed(2)) : 0,
      taxProfileName: profile.name
    };
  }
}
