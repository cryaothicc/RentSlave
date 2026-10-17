import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
} from 'recharts';
import { AlertTriangle, ChevronRight } from 'lucide-react';

// --- Formatting ---
const formatPHP = (val: number) => {
  if (val === undefined || val === null || isNaN(val)) return '₱0';
  const absVal = Math.abs(val);
  const formatted = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(absVal);
  return val < 0 ? `-${formatted}` : formatted;
};

const formatCompactPHP = (val: number) => {
  if (val === undefined || val === null || isNaN(val)) return '₱0';
  const absVal = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (absVal >= 1000000) return `${sign}₱${(absVal / 1000000).toFixed(2)}M`;
  if (absVal >= 1000) return `${sign}₱${(absVal / 1000).toFixed(0)}k`;
  return formatPHP(val);
};

// --- Data ---
const FINANCING_MODES = {
  pagibig: {
    id: 'pagibig',
    name: 'Pag-IBIG',
    sub: 'Up to ₱6M • 6.25%',
    defaultRate: 6.25,
    defaultTerm: 25,
    defaultDP: 15,
  },
  bank: {
    id: 'bank',
    name: 'Commercial Bank',
    sub: 'BDO / BPI / Metrobank • 7.5%',
    defaultRate: 7.5,
    defaultTerm: 20,
    defaultDP: 20,
  },
  inhouse: {
    id: 'inhouse',
    name: 'In-House Developer',
    sub: '12%–16% • Fast Approval',
    defaultRate: 13.5,
    defaultTerm: 10,
    defaultDP: 10,
  },
} as const;

type FinancingKey = keyof typeof FINANCING_MODES;

interface Params {
  financingType: FinancingKey;
  homePrice: number;
  downPaymentPct: number;
  dpScheduleMonths: number;
  mortgageRate: number;
  loanTerm: number;
  duesMode: 'sqm' | 'flat';
  floorAreaSqm: number;
  duesPerSqm: number;
  hoaMonthlyFlat: number;
  hoaEscalationRate: number;
  rptEffectiveRate: number;
  mriFireRatePerThousand: number;
  maintenanceRate: number;
  appreciationRate: number;
  taxSubsidyRate: number;
  buyingClosingCostsPct: number;
  sellingClosingCostsPct: number;
  includeSellingCosts: boolean;
  monthlyRent: number;
  rentIncreaseRate: number;
  investmentPreset: string;
  investmentReturnRate: number;
}

const PH_PRESETS: Record<string, Params & { name: string }> = {
  metroCondo: {
    name: 'Metro Manila 1BR Condo',
    financingType: 'bank',
    homePrice: 6800000,
    downPaymentPct: 20,
    dpScheduleMonths: 0,
    mortgageRate: 7.5,
    loanTerm: 20,
    duesMode: 'sqm',
    floorAreaSqm: 36,
    duesPerSqm: 120,
    hoaMonthlyFlat: 4320,
    hoaEscalationRate: 4.0,
    rptEffectiveRate: 0.65,
    mriFireRatePerThousand: 0.42,
    maintenanceRate: 0.5,
    appreciationRate: 4.5,
    taxSubsidyRate: 0,
    buyingClosingCostsPct: 4.0,
    sellingClosingCostsPct: 10.0,
    includeSellingCosts: true,
    monthlyRent: 26000,
    rentIncreaseRate: 4.0,
    investmentPreset: 'mp2',
    investmentReturnRate: 7.0,
  },
  calabarzonHouse: {
    name: 'CALABARZON House & Lot',
    financingType: 'pagibig',
    homePrice: 3600000,
    downPaymentPct: 15,
    dpScheduleMonths: 0,
    mortgageRate: 6.25,
    loanTerm: 25,
    duesMode: 'flat',
    floorAreaSqm: 85,
    duesPerSqm: 25,
    hoaMonthlyFlat: 1500,
    hoaEscalationRate: 3.0,
    rptEffectiveRate: 0.5,
    mriFireRatePerThousand: 0.38,
    maintenanceRate: 0.8,
    appreciationRate: 5.5,
    taxSubsidyRate: 0,
    buyingClosingCostsPct: 3.5,
    sellingClosingCostsPct: 9.0,
    includeSellingCosts: true,
    monthlyRent: 15500,
    rentIncreaseRate: 4.5,
    investmentPreset: 'mp2',
    investmentReturnRate: 7.0,
  },
  preSellingCondo: {
    name: 'Pre-Selling Condo (24-mo DP)',
    financingType: 'bank',
    homePrice: 4800000,
    downPaymentPct: 20,
    dpScheduleMonths: 24,
    mortgageRate: 7.75,
    loanTerm: 20,
    duesMode: 'sqm',
    floorAreaSqm: 28,
    duesPerSqm: 105,
    hoaMonthlyFlat: 2940,
    hoaEscalationRate: 4.0,
    rptEffectiveRate: 0.6,
    mriFireRatePerThousand: 0.42,
    maintenanceRate: 0.5,
    appreciationRate: 4.8,
    taxSubsidyRate: 0,
    buyingClosingCostsPct: 4.5,
    sellingClosingCostsPct: 10.0,
    includeSellingCosts: true,
    monthlyRent: 18500,
    rentIncreaseRate: 4.0,
    investmentPreset: 'equities',
    investmentReturnRate: 8.0,
  },
};

const INVESTMENT_BENCHMARKS = [
  { id: 'digibank', label: 'Digital Bank / TD', rate: 4.5 },
  { id: 'mp2', label: 'Pag-IBIG MP2 (tax-free)', rate: 7.0 },
  { id: 'equities', label: 'PSEi / S&P 500 Feeder', rate: 8.5 },
];

// --- Slider ---
interface SliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  hint?: string;
}

const Slider = ({ label, value, onChange, min, max, step = 1, prefix = '', suffix = '', hint = '' }: SliderProps) => (
  <div className="py-3 border-b border-zinc-800 last:border-0">
    <div className="flex justify-between items-center mb-2">
      <span className="text-xs text-zinc-400">{label}</span>
      <div className="flex items-center gap-1">
        {prefix && <span className="text-xs text-zinc-500">{prefix}</span>}
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v); }}
          className="w-20 text-right bg-transparent text-sm font-semibold text-white focus:outline-none"
        />
        {suffix && <span className="text-xs text-zinc-500">{suffix}</span>}
      </div>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-px bg-zinc-700 appearance-none cursor-pointer accent-white"
    />
    {hint && <div className="text-[11px] text-zinc-500 mt-1">{hint}</div>}
  </div>
);

// --- Section header ---
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3 mt-1">{children}</div>
);

// --- Main ---
export default function App() {
  const [params, setParams] = useState<Params>(PH_PRESETS.metroCondo);
  const [activeChartTab, setActiveChartTab] = useState<'wealth' | 'unrecoverable' | 'cashflow' | 'equity'>('wealth');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedYear, setSelectedYear] = useState(10);

  const update = (key: keyof Params, value: unknown) =>
    setParams((prev) => ({ ...prev, [key]: value }));

  const applyPreset = (key: string) => setParams(PH_PRESETS[key]);

  const selectFinancing = (key: FinancingKey) => {
    const m = FINANCING_MODES[key];
    setParams((prev) => ({
      ...prev,
      financingType: key,
      mortgageRate: m.defaultRate,
      loanTerm: m.defaultTerm,
      downPaymentPct: m.defaultDP,
    }));
  };

  const sim = useMemo(() => {
    const {
      financingType, homePrice, downPaymentPct, dpScheduleMonths, mortgageRate, loanTerm,
      duesMode, floorAreaSqm, duesPerSqm, hoaMonthlyFlat, hoaEscalationRate,
      rptEffectiveRate, mriFireRatePerThousand, maintenanceRate, appreciationRate,
      taxSubsidyRate, buyingClosingCostsPct, sellingClosingCostsPct, includeSellingCosts,
      monthlyRent, rentIncreaseRate, investmentReturnRate,
    } = params;

    const totalDP = homePrice * (downPaymentPct / 100);
    const closingCosts = homePrice * (buyingClosingCostsPct / 100);
    const loanAmount = Math.max(0, homePrice - totalDP);
    const exceedsPagibigCap = financingType === 'pagibig' && loanAmount > 6000000;
    const isStretched = dpScheduleMonths > 0;
    const upfrontCash = isStretched ? 0 : totalDP + closingCosts;
    const monthlyStretchedDP = isStretched ? totalDP / dpScheduleMonths : 0;
    const monthlyRate = mortgageRate / 100 / 12;
    const totalPayments = loanTerm * 12;

    let monthlyPI = 0;
    if (loanAmount > 0) {
      monthlyPI = monthlyRate > 0
        ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))) / (Math.pow(1 + monthlyRate, totalPayments) - 1)
        : loanAmount / totalPayments;
    }

    const baseMonthlyDues = duesMode === 'sqm' ? floorAreaSqm * duesPerSqm : hoaMonthlyFlat;
    const monthlyInvRate = Math.pow(1 + investmentReturnRate / 100, 1 / 12) - 1;

    let renterPortfolio = upfrontCash;
    let buyerSidePortfolio = 0;
    let remainingBalance = loanAmount;
    let cumBuyerCashOut = upfrontCash;
    let cumRenterCashOut = 0;
    let cumBuyerUnrecoverable = isStretched ? 0 : closingCosts;
    let cumRenterUnrecoverable = 0;
    let cumTaxSavings = 0, cumInterest = 0, cumPrincipal = 0, cumRPT = 0, cumHOA = 0, cumMRI = 0;

    const effectiveSellPct = includeSellingCosts ? sellingClosingCostsPct : 0;
    const yearlyData: ReturnType<typeof buildRow>[] = [];

    function buildRow(year: number, data: Record<string, number>) { return { year, ...data }; }

    const y0SellCosts = homePrice * (effectiveSellPct / 100);
    const y0PaidEquity = isStretched ? 0 : totalDP;
    yearlyData.push(buildRow(0, {
      homeValue: Math.round(homePrice),
      loanBalance: Math.round(loanAmount),
      homeEquityGross: Math.round(y0PaidEquity),
      sellingCosts: Math.round(y0SellCosts),
      netHomeEquity: Math.round(y0PaidEquity - y0SellCosts),
      buyerSidePortfolio: 0,
      buyerNetWealth: Math.round(y0PaidEquity - y0SellCosts),
      renterNetWealth: Math.round(renterPortfolio),
      wealthAdvantageBuyer: Math.round(y0PaidEquity - y0SellCosts - renterPortfolio),
      annualMortgagePI: 0, annualInterest: 0, annualPrincipal: 0,
      annualRPT: 0, annualHOA: 0, annualMRIFire: 0, annualMaintenance: 0,
      annualTaxSavings: 0, annualBuyerNetOutflow: Math.round(upfrontCash), annualRenterOutflow: 0,
      monthlyBuyerAvg: Math.round(isStretched ? monthlyStretchedDP : monthlyPI + baseMonthlyDues + (homePrice * (rptEffectiveRate / 100)) / 12 + (loanAmount / 1000) * mriFireRatePerThousand),
      monthlyRenterAvg: Math.round(monthlyRent),
      cumulativeBuyerUnrecoverable: Math.round(cumBuyerUnrecoverable),
      cumulativeRenterUnrecoverable: 0,
      cumulativeBuyerCashOutflow: Math.round(upfrontCash),
      cumulativeRenterCashOutflow: 0,
      cumulativeTaxSavings: 0,
    }));

    let breakEvenYear: number | null = null;
    let paidDPSoFar = isStretched ? 0 : totalDP;

    for (let year = 1; year <= 10; year++) {
      const curHomeVal = homePrice * Math.pow(1 + appreciationRate / 100, year - 1);
      const endHomeVal = homePrice * Math.pow(1 + appreciationRate / 100, year);
      const curHOA = baseMonthlyDues * Math.pow(1 + hoaEscalationRate / 100, year - 1);
      const curMaint = (curHomeVal * (maintenanceRate / 100)) / 12;
      const curRPT = (curHomeVal * (rptEffectiveRate / 100)) / 12;
      const curRent = monthlyRent * Math.pow(1 + rentIncreaseRate / 100, year - 1);

      let yInt = 0, yPrin = 0, yRPT = 0, yHOA = 0, yMRI = 0, yMaint = 0, yTax = 0, yBuyer = 0, yRenter = 0;

      for (let m = 1; m <= 12; m++) {
        const gMonth = (year - 1) * 12 + m;
        const inStretch = isStretched && gMonth <= dpScheduleMonths;
        const isTurnover = isStretched && gMonth === dpScheduleMonths;
        let interest = 0, principal = 0, mri = 0, hoa = 0, rpt = 0, maint = 0, turnover = 0;

        if (inStretch) {
          principal = monthlyStretchedDP;
          paidDPSoFar += monthlyStretchedDP;
          if (isTurnover) turnover = closingCosts;
        } else {
          if (remainingBalance > 0) {
            interest = remainingBalance * monthlyRate;
            principal = Math.min(remainingBalance, monthlyPI - interest);
            remainingBalance = Math.max(0, remainingBalance - principal);
            mri = (remainingBalance / 1000) * mriFireRatePerThousand;
          }
          hoa = curHOA; rpt = curRPT; maint = curMaint;
        }

        const taxBenefit = (interest + rpt) * (taxSubsidyRate / 100);
        const buyerCost = principal + interest + rpt + hoa + mri + maint + turnover - taxBenefit;
        const renterCost = curRent;
        const buyerUnrecoverable = interest + rpt + hoa + mri + maint + turnover - taxBenefit;

        renterPortfolio *= 1 + monthlyInvRate;
        buyerSidePortfolio *= 1 + monthlyInvRate;
        const diff = buyerCost - renterCost;
        if (diff > 0) renterPortfolio += diff;
        else buyerSidePortfolio += Math.abs(diff);

        yInt += interest; yPrin += principal; yRPT += rpt; yHOA += hoa;
        yMRI += mri; yMaint += maint; yTax += taxBenefit;
        yBuyer += buyerCost; yRenter += renterCost;
        cumBuyerUnrecoverable += buyerUnrecoverable;
        cumRenterUnrecoverable += renterCost;
      }

      cumBuyerCashOut += yBuyer; cumRenterCashOut += yRenter;
      cumTaxSavings += yTax; cumInterest += yInt; cumPrincipal += yPrin;
      cumRPT += yRPT; cumHOA += yHOA; cumMRI += yMRI;

      const unpaidDP = Math.max(0, totalDP - paidDPSoFar);
      const grossEquity = endHomeVal - remainingBalance - unpaidDP;
      const sellCosts = endHomeVal * (effectiveSellPct / 100);
      const netEquity = grossEquity - sellCosts;
      const buyerWealth = netEquity + buyerSidePortfolio;
      const renterWealth = renterPortfolio;
      const advantage = buyerWealth - renterWealth;

      if (breakEvenYear === null && advantage >= 0) breakEvenYear = year;

      yearlyData.push(buildRow(year, {
        homeValue: Math.round(endHomeVal),
        loanBalance: Math.round(remainingBalance),
        homeEquityGross: Math.round(grossEquity),
        sellingCosts: Math.round(sellCosts),
        netHomeEquity: Math.round(netEquity),
        buyerSidePortfolio: Math.round(buyerSidePortfolio),
        buyerNetWealth: Math.round(buyerWealth),
        renterNetWealth: Math.round(renterWealth),
        wealthAdvantageBuyer: Math.round(advantage),
        annualMortgagePI: Math.round(yInt + yPrin),
        annualInterest: Math.round(yInt),
        annualPrincipal: Math.round(yPrin),
        annualRPT: Math.round(yRPT),
        annualHOA: Math.round(yHOA),
        annualMRIFire: Math.round(yMRI),
        annualMaintenance: Math.round(yMaint),
        annualTaxSavings: Math.round(yTax),
        annualBuyerNetOutflow: Math.round(yBuyer),
        annualRenterOutflow: Math.round(yRenter),
        monthlyBuyerAvg: Math.round(yBuyer / 12),
        monthlyRenterAvg: Math.round(yRenter / 12),
        cumulativeBuyerUnrecoverable: Math.round(cumBuyerUnrecoverable + sellCosts),
        cumulativeRenterUnrecoverable: Math.round(cumRenterUnrecoverable),
        cumulativeBuyerCashOutflow: Math.round(cumBuyerCashOut),
        cumulativeRenterCashOutflow: Math.round(cumRenterCashOut),
        cumulativeTaxSavings: Math.round(cumTaxSavings),
      }));
    }

    const year10 = yearlyData[10];
    const year1 = yearlyData[1];

    return {
      yearlyData, breakEvenYear, totalDP, closingCosts, upfrontCash,
      monthlyStretchedDP, loanAmount, monthlyPI, baseMonthlyDues, exceedsPagibigCap,
      year1, year10,
      summary: {
        winner: year10.buyerNetWealth >= year10.renterNetWealth ? 'BUY' : 'RENT',
        diff: Math.abs(year10.buyerNetWealth - year10.renterNetWealth),
        buyerWealth: year10.buyerNetWealth,
        renterWealth: year10.renterNetWealth,
        totalTaxSavings: Math.round(cumTaxSavings),
        totalInterest: Math.round(cumInterest),
        totalPrincipal: Math.round(cumPrincipal),
        totalHOA: Math.round(cumHOA),
        totalRPT: Math.round(cumRPT),
        totalMRI: Math.round(cumMRI),
      },
    };
  }, [params]);

  const inspected = sim.yearlyData[selectedYear] ?? sim.year10;

  const chartColors = { buyer: '#fff', renter: '#71717a', ref: '#52525b' };

  const tooltipStyle = {
    contentStyle: { backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', color: '#f4f4f5', fontSize: 12 },
    formatter: (value: number, name: string) => [formatPHP(value), name],
    labelFormatter: (label: number) => `Year ${label}`,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">

      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold text-white">🇵🇭 PH Rent vs. Buy — 10-Year Simulator</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Pag-IBIG · Bank · Condo Dues · Amilyar · MRI · CGT · MP2</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(PH_PRESETS).map(([key, preset]) => {
              const active = params.homePrice === preset.homePrice && params.monthlyRent === preset.monthlyRent && params.dpScheduleMonths === preset.dpScheduleMonths;
              return (
                <button key={key} onClick={() => applyPreset(key)}
                  className={`px-3 py-1.5 rounded text-xs transition-colors border ${active ? 'border-zinc-400 text-white bg-zinc-800' : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'}`}>
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:items-stretch">

          {/* ── LEFT PANEL ── */}
          <div className="lg:col-span-4 space-y-4">

            {/* Loan & Property */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <SectionLabel>Loan Type</SectionLabel>
              <div className="flex flex-col gap-1.5 mb-4">
                {(Object.values(FINANCING_MODES) as typeof FINANCING_MODES[FinancingKey][]).map((mode) => {
                  const active = params.financingType === mode.id;
                  return (
                    <button key={mode.id} onClick={() => selectFinancing(mode.id as FinancingKey)}
                      className={`text-left px-3 py-2 rounded border text-xs transition-colors ${active ? 'border-white text-white bg-zinc-800' : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'}`}>
                      <div className="font-medium">{mode.name}</div>
                      <div className="text-zinc-500 mt-0.5">{mode.sub}</div>
                    </button>
                  );
                })}
              </div>

              {sim.exceedsPagibigCap && (
                <div className="flex items-start gap-2 text-xs text-yellow-400 bg-yellow-950/30 border border-yellow-800/50 rounded p-2.5 mb-4">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Loan ({formatCompactPHP(sim.loanAmount)}) exceeds the Pag-IBIG ₱6M cap. Increase down payment or switch to a bank loan.</span>
                </div>
              )}

              <SectionLabel>Property</SectionLabel>
              <Slider label="Total Contract Price" value={params.homePrice} onChange={(v) => update('homePrice', v)} min={1000000} max={30000000} step={100000} prefix="₱" hint={`Loan: ${formatCompactPHP(sim.loanAmount)} · Monthly amort: ${formatCompactPHP(sim.monthlyPI)}`} />
              <Slider label="Down Payment" value={params.downPaymentPct} onChange={(v) => update('downPaymentPct', v)} min={5} max={50} suffix="%" hint={`${formatPHP(sim.totalDP)} total`} />

              <div className="py-3 border-b border-zinc-800">
                <div className="text-xs text-zinc-400 mb-2">DP Payment Term</div>
                <div className="flex gap-1.5">
                  {[{ mos: 0, label: 'Spot' }, { mos: 12, label: '12 mo' }, { mos: 24, label: '24 mo' }].map((item) => (
                    <button key={item.mos} onClick={() => update('dpScheduleMonths', item.mos)}
                      className={`flex-1 py-1.5 rounded text-xs font-medium border transition-colors ${params.dpScheduleMonths === item.mos ? 'border-white text-white bg-zinc-800' : 'border-zinc-700 text-zinc-400 hover:text-white'}`}>
                      {item.label}
                    </button>
                  ))}
                </div>
                {params.dpScheduleMonths > 0 && <div className="text-[11px] text-zinc-500 mt-1">{formatPHP(sim.monthlyStretchedDP)}/mo for {params.dpScheduleMonths} months</div>}
              </div>

              <Slider label="Interest Rate" value={params.mortgageRate} onChange={(v) => update('mortgageRate', v)} min={4.5} max={18.0} step={0.25} suffix="% p.a." hint={`10yr interest total: ${formatCompactPHP(sim.summary.totalInterest)}`} />

              <div className="py-3 border-b border-zinc-800">
                <div className="text-xs text-zinc-400 mb-2">Loan Term</div>
                <div className="flex gap-1.5">
                  {[10, 15, 20, 25, 30].map((t) => (
                    <button key={t} onClick={() => update('loanTerm', t)}
                      className={`flex-1 py-1.5 rounded text-xs font-medium border transition-colors ${params.loanTerm === t ? 'border-white text-white bg-zinc-800' : 'border-zinc-700 text-zinc-400 hover:text-white'}`}>
                      {t}y
                    </button>
                  ))}
                </div>
              </div>

              <Slider label="Annual Appreciation" value={params.appreciationRate} onChange={(v) => update('appreciationRate', v)} min={-2.0} max={12.0} step={0.25} suffix="%" hint={`Year 10 value: ${formatCompactPHP(sim.year10.homeValue)}`} />
            </div>

            {/* Fees */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <SectionLabel>Condo Dues, Amilyar & MRI</SectionLabel>

              <div className="py-3 border-b border-zinc-800">
                <div className="text-xs text-zinc-400 mb-2">Association Dues Mode</div>
                <div className="flex gap-1.5 mb-2">
                  {[{ v: 'sqm', label: 'Per sqm' }, { v: 'flat', label: 'Flat HOA' }].map((opt) => (
                    <button key={opt.v} onClick={() => update('duesMode', opt.v)}
                      className={`flex-1 py-1.5 rounded text-xs font-medium border transition-colors ${params.duesMode === opt.v ? 'border-white text-white bg-zinc-800' : 'border-zinc-700 text-zinc-400 hover:text-white'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {params.duesMode === 'sqm' ? (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      { label: 'Floor area (sqm)', key: 'floorAreaSqm' as keyof Params, min: 15, max: 500 },
                      { label: 'Rate per sqm (₱)', key: 'duesPerSqm' as keyof Params, min: 20, max: 300 },
                    ].map(({ label, key, min, max }) => (
                      <div key={key} className="bg-zinc-950 rounded border border-zinc-800 p-2">
                        <div className="text-[10px] text-zinc-500 uppercase">{label}</div>
                        <input type="number" value={params[key] as number} min={min} max={max}
                          onChange={(e) => update(key, Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none mt-0.5" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Slider label="Flat monthly HOA" value={params.hoaMonthlyFlat} onChange={(v) => update('hoaMonthlyFlat', v)} min={0} max={15000} step={250} prefix="₱" hint={`10yr total: ${formatCompactPHP(sim.summary.totalHOA)}`} />
                )}
                <div className="text-[11px] text-zinc-500 mt-2">Dues: {formatPHP(sim.baseMonthlyDues)}/mo</div>
              </div>

              <Slider label="Real Property Tax (Amilyar)" value={params.rptEffectiveRate} onChange={(v) => update('rptEffectiveRate', v)} min={0.1} max={2.0} step={0.05} suffix="% of value" hint={`Yr 1: ${formatPHP((params.homePrice * params.rptEffectiveRate) / 100 / 12)}/mo`} />
              <Slider label="MRI + Fire Insurance" value={params.mriFireRatePerThousand} onChange={(v) => update('mriFireRatePerThousand', v)} min={0.1} max={1.2} step={0.02} prefix="₱" suffix="/₱1k loan" hint={`Yr 1: ${formatPHP((sim.loanAmount / 1000) * params.mriFireRatePerThousand)}/mo`} />
              <Slider label="Tax / Housing Subsidy Shield" value={params.taxSubsidyRate} onChange={(v) => update('taxSubsidyRate', v)} min={0} max={35} suffix="%" hint="Set to 0 for regular salaried employees (BIR default)" />

              <button onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full mt-3 py-2 px-3 rounded border border-zinc-700 text-xs text-zinc-400 hover:text-white hover:border-zinc-500 flex items-center justify-between transition-colors">
                <span>Transfer Taxes, CGT & Maintenance</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
              </button>

              {showAdvanced && (
                <div className="mt-3 pt-3 border-t border-zinc-800 space-y-0">
                  <Slider label="Buyer Closing Costs (DST, Transfer, Reg)" value={params.buyingClosingCostsPct} onChange={(v) => update('buyingClosingCostsPct', v)} min={0} max={8} step={0.25} suffix="%" hint={formatPHP(sim.closingCosts)} />
                  <div className="py-3 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-zinc-300">Include 6% CGT + Broker in Year 10</div>
                      <div className="text-[11px] text-zinc-500">Toggle off if not planning to sell</div>
                    </div>
                    <input type="checkbox" checked={params.includeSellingCosts} onChange={(e) => update('includeSellingCosts', e.target.checked)} className="w-4 h-4 accent-white cursor-pointer" />
                  </div>
                  {params.includeSellingCosts && (
                    <Slider label="Selling Costs (CGT + Broker)" value={params.sellingClosingCostsPct} onChange={(v) => update('sellingClosingCostsPct', v)} min={6} max={12} step={0.5} suffix="%" hint={`Year 10 est: ${formatCompactPHP(sim.year10.sellingCosts)}`} />
                  )}
                  <Slider label="Annual Dues Escalation" value={params.hoaEscalationRate} onChange={(v) => update('hoaEscalationRate', v)} min={0} max={10} step={0.5} suffix="%" />
                  <Slider label="Repairs & Maintenance" value={params.maintenanceRate} onChange={(v) => update('maintenanceRate', v)} min={0.1} max={2.0} step={0.1} suffix="% of value/yr" />
                </div>
              )}
            </div>

            {/* Rent & Opportunity Cost */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <SectionLabel>Rent & Opportunity Cost</SectionLabel>
              <Slider label="Starting Monthly Rent" value={params.monthlyRent} onChange={(v) => update('monthlyRent', v)} min={5000} max={150000} step={1000} prefix="₱" hint={`Year 1: ${formatPHP(params.monthlyRent * 12)}/yr`} />
              <Slider label="Annual Rent Escalation" value={params.rentIncreaseRate} onChange={(v) => update('rentIncreaseRate', v)} min={0} max={10} step={0.5} suffix="%" hint={`Year 10: ${formatPHP(sim.year10.monthlyRenterAvg)}/mo`} />

              <div className="py-3 border-b border-zinc-800">
                <div className="text-xs text-zinc-400 mb-2">Investment Benchmark</div>
                <div className="flex flex-col gap-1.5">
                  {INVESTMENT_BENCHMARKS.map((b) => {
                    const active = Math.abs(params.investmentReturnRate - b.rate) < 0.01;
                    return (
                      <button key={b.id} onClick={() => update('investmentReturnRate', b.rate)}
                        className={`flex justify-between items-center px-3 py-2 rounded border text-xs transition-colors ${active ? 'border-white text-white bg-zinc-800' : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'}`}>
                        <span>{b.label}</span>
                        <span className="font-semibold">{b.rate}%</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <Slider label="Net Investment Return" value={params.investmentReturnRate} onChange={(v) => update('investmentReturnRate', v)} min={1} max={15} step={0.25} suffix="% p.a." hint="Compounded monthly" />
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="lg:col-span-8 flex flex-col gap-5">

            {/* Verdict */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1">10-Year Verdict</div>
                  <div className="text-2xl font-bold text-white">
                    {sim.summary.winner === 'BUY' ? 'Buying' : 'Renting'} builds{' '}
                    <span className={sim.summary.winner === 'BUY' ? 'text-white' : 'text-zinc-300'}>
                      {formatPHP(sim.summary.diff)}
                    </span>{' '}
                    more wealth over 10 years
                  </div>
                  <div className="text-sm text-zinc-500 mt-1">
                    {sim.breakEvenYear ? `Buying overtakes renting at Year ${sim.breakEvenYear}` : 'Renting stays ahead through Year 10'}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1">Break-Even</div>
                  <div className="text-3xl font-bold text-white">
                    {sim.breakEvenYear ? `Yr ${sim.breakEvenYear}` : '> 10 yrs'}
                  </div>
                  <div className="w-32 bg-zinc-800 h-1 rounded-full mt-2 ml-auto overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: sim.breakEvenYear ? `${Math.max(10, (11 - sim.breakEvenYear) * 10)}%` : '10%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                { label: 'Buyer Yr 10 Wealth', value: formatPHP(sim.year10.buyerNetWealth), sub: `Value ${formatCompactPHP(sim.year10.homeValue)} · Loan ${formatCompactPHP(sim.year10.loanBalance)}` },
                { label: 'Renter Yr 10 Portfolio', value: formatPHP(sim.year10.renterNetWealth), sub: `Day 1 cash: ${formatCompactPHP(sim.upfrontCash)} · ${params.investmentReturnRate}%/yr` },
                { label: '10yr Dues + RPT + MRI', value: formatPHP(sim.summary.totalHOA + sim.summary.totalRPT + sim.summary.totalMRI), sub: `Dues ${formatCompactPHP(sim.summary.totalHOA)} · RPT+MRI ${formatCompactPHP(sim.summary.totalRPT + sim.summary.totalMRI)}` },
                { label: '10yr Sunk: Buy vs Rent', value: `${formatCompactPHP(sim.year10.cumulativeBuyerUnrecoverable)} vs ${formatCompactPHP(sim.year10.cumulativeRenterUnrecoverable)}`, sub: `Interest ${formatCompactPHP(sim.summary.totalInterest)} · Tax shield ${formatCompactPHP(sim.summary.totalTaxSavings)}` },
              ].map((card) => (
                <div key={card.label} className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">{card.label}</div>
                  <div className="text-lg font-bold text-white leading-tight">{card.value}</div>
                  <div className="text-[11px] text-zinc-500 mt-1.5">{card.sub}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="text-sm font-semibold text-white">10-Year Trajectory</div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'wealth', label: 'Net Wealth' },
                    { id: 'unrecoverable', label: 'Sunk Costs' },
                    { id: 'cashflow', label: 'Monthly Outflow' },
                    { id: 'equity', label: 'Property & Loan' },
                  ].map((tab) => (
                    <button key={tab.id} onClick={() => setActiveChartTab(tab.id as typeof activeChartTab)}
                      className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${activeChartTab === tab.id ? 'border-zinc-400 text-white bg-zinc-800' : 'border-zinc-700 text-zinc-400 hover:text-white'}`}>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {activeChartTab === 'wealth' ? (
                    <AreaChart data={sim.yearlyData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="gBuyer" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fff" stopOpacity={0.12} />
                          <stop offset="95%" stopColor="#fff" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gRenter" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#71717a" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="year" tickFormatter={(v) => `Yr ${v}`} stroke="#52525b" fontSize={11} />
                      <YAxis tickFormatter={(v) => formatCompactPHP(v)} stroke="#52525b" fontSize={11} />
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} />
                      {sim.breakEvenYear && <ReferenceLine x={sim.breakEvenYear} stroke="#52525b" strokeDasharray="4 4" label={{ value: `Yr ${sim.breakEvenYear}`, position: 'top', fill: '#71717a', fontSize: 11 }} />}
                      <Area type="monotone" dataKey="buyerNetWealth" name="Buyer Net Wealth" stroke={chartColors.buyer} strokeWidth={2} fill="url(#gBuyer)" />
                      <Area type="monotone" dataKey="renterNetWealth" name="Renter Portfolio" stroke={chartColors.renter} strokeWidth={2} fill="url(#gRenter)" />
                    </AreaChart>
                  ) : activeChartTab === 'unrecoverable' ? (
                    <LineChart data={sim.yearlyData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="year" tickFormatter={(v) => `Yr ${v}`} stroke="#52525b" fontSize={11} />
                      <YAxis tickFormatter={(v) => formatCompactPHP(v)} stroke="#52525b" fontSize={11} />
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} />
                      <Line type="monotone" dataKey="cumulativeBuyerUnrecoverable" name="Buyer Sunk Costs" stroke={chartColors.buyer} strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="cumulativeRenterUnrecoverable" name="Renter Sunk Costs (Rent)" stroke={chartColors.renter} strokeWidth={2} dot={false} />
                    </LineChart>
                  ) : activeChartTab === 'cashflow' ? (
                    <BarChart data={sim.yearlyData.slice(1)} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="year" tickFormatter={(v) => `Yr ${v}`} stroke="#52525b" fontSize={11} />
                      <YAxis tickFormatter={(v) => formatCompactPHP(v)} stroke="#52525b" fontSize={11} />
                      <Tooltip {...tooltipStyle} formatter={(v: number, n: string) => [`${formatPHP(v)}/mo`, n]} labelFormatter={(l: number) => `Year ${l} Monthly Avg`} />
                      <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} />
                      <Bar dataKey="monthlyBuyerAvg" name="Buyer Monthly" fill={chartColors.buyer} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="monthlyRenterAvg" name="Renter Monthly" fill={chartColors.renter} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  ) : (
                    <AreaChart data={sim.yearlyData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="year" tickFormatter={(v) => `Yr ${v}`} stroke="#52525b" fontSize={11} />
                      <YAxis tickFormatter={(v) => formatCompactPHP(v)} stroke="#52525b" fontSize={11} />
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} />
                      <Area type="monotone" dataKey="homeValue" name="Property Value" stroke="#71717a" fill="#71717a" fillOpacity={0.1} strokeWidth={1.5} />
                      <Area type="monotone" dataKey="netHomeEquity" name="Net Equity" stroke={chartColors.buyer} fill={chartColors.buyer} fillOpacity={0.15} strokeWidth={2} />
                      <Area type="monotone" dataKey="loanBalance" name="Loan Balance" stroke="#52525b" fill="#52525b" fillOpacity={0.1} strokeWidth={1.5} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Year Inspector */}
              <div className="mt-5 pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-zinc-400">Year {selectedYear} breakdown</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5,6,7,8,9,10].map((yr) => (
                      <button key={yr} onClick={() => setSelectedYear(yr)}
                        className={`w-7 h-7 rounded text-xs font-medium transition-colors ${selectedYear === yr ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}>
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {[
                    { label: 'Principal / DP', value: formatPHP(inspected.annualPrincipal) },
                    { label: 'Loan Interest', value: formatPHP(inspected.annualInterest) },
                    { label: 'Condo / HOA', value: formatPHP(inspected.annualHOA) },
                    { label: 'Amilyar + MRI', value: formatPHP(inspected.annualRPT + inspected.annualMRIFire) },
                    { label: 'Buyer /mo avg', value: `${formatPHP(inspected.monthlyBuyerAvg)}/mo` },
                    { label: 'Renter /mo avg', value: `${formatPHP(inspected.monthlyRenterAvg)}/mo` },
                  ].map((item) => (
                    <div key={item.label} className="bg-zinc-950 rounded border border-zinc-800 p-2.5">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wide">{item.label}</div>
                      <div className="text-xs font-semibold text-white mt-1">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="text-sm font-semibold text-white">Year-by-Year Breakdown</div>
                <div className="text-xs text-zinc-500">
                  {params.dpScheduleMonths === 0
                    ? `Day 1 upfront: ${formatPHP(sim.upfrontCash)}`
                    : `Stretched DP: ${formatPHP(sim.monthlyStretchedDP)}/mo × ${params.dpScheduleMonths}`}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[11px] text-zinc-500 uppercase tracking-wider">
                      {['Year', 'Property Value', 'Loan Balance', 'Interest / Principal', 'Dues + RPT + MRI', 'Annual Rent', 'Buyer Wealth', 'Renter Portfolio', 'Net Advantage'].map((h) => (
                        <th key={h} className="py-3 px-4 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {sim.yearlyData.slice(1).map((row) => {
                      const isBreakEven = row.year === sim.breakEvenYear;
                      const buyerAhead = row.wealthAdvantageBuyer >= 0;
                      const isSelected = row.year === selectedYear;
                      return (
                        <tr key={row.year} onClick={() => setSelectedYear(row.year)}
                          className={`cursor-pointer transition-colors ${isSelected ? 'bg-zinc-800' : isBreakEven ? 'bg-zinc-800/40 hover:bg-zinc-800/70' : 'hover:bg-zinc-800/40'}`}>
                          <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                            <span>Yr {row.year}</span>
                            {isBreakEven && <span className="ml-1.5 text-[10px] text-zinc-400 border border-zinc-600 rounded px-1.5 py-0.5">break-even</span>}
                          </td>
                          <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">{formatPHP(row.homeValue)}</td>
                          <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">{formatPHP(row.loanBalance)}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-zinc-400">{formatCompactPHP(row.annualInterest)}</span>
                            <span className="text-zinc-700 mx-1">/</span>
                            <span className="text-zinc-300">{formatCompactPHP(row.annualPrincipal)}</span>
                          </td>
                          <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">{formatPHP(row.annualHOA + row.annualRPT + row.annualMRIFire)}</td>
                          <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">{formatPHP(row.annualRenterOutflow)}</td>
                          <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">{formatPHP(row.buyerNetWealth)}</td>
                          <td className="py-3 px-4 font-semibold text-zinc-400 whitespace-nowrap">{formatPHP(row.renterNetWealth)}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`text-xs font-semibold ${buyerAhead ? 'text-white' : 'text-zinc-400'}`}>
                              {buyerAhead ? 'Buy' : 'Rent'} +{formatCompactPHP(Math.abs(row.wealthAdvantageBuyer))}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* How This Works */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 flex-1 flex flex-col">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-4">How This Works</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-zinc-400 leading-relaxed flex-1">

                <div className="flex flex-col gap-4">
                  <div>
                    <div className="text-zinc-200 font-semibold mb-1">The core question</div>
                    <p>Should you buy a property or rent and invest the difference? This simulator runs a 10-year month-by-month model of both scenarios using real Philippine costs — then compares the net wealth of each path at every year.</p>
                  </div>

                  <div>
                    <div className="text-zinc-200 font-semibold mb-1">The buyer's path</div>
                    <p>The buyer pays a down payment and closing costs on Day 1 (or spreads the DP over 12–24 months for pre-selling). Every month they pay: mortgage amortization (principal + interest), condo dues or HOA, real property tax (Amilyar), MRI + fire insurance, and maintenance. Their net wealth is the property's market value minus the remaining loan balance minus estimated selling costs.</p>
                  </div>

                  <div>
                    <div className="text-zinc-200 font-semibold mb-1">The renter's path</div>
                    <p>The renter takes the exact same cash the buyer spent on Day 1 (down payment + closing costs) and invests it. Each month, if the buyer's total outflow is higher than the rent, that difference is also invested. The renter's net wealth is the compounding investment portfolio.</p>
                  </div>

                  <div>
                    <div className="text-zinc-200 font-semibold mb-1">What "break-even" means</div>
                    <p>The break-even year is when the buyer's net wealth first exceeds the renter's portfolio. Before that year, renting and investing wins. After it, buying wins. If no break-even is shown, the renter stays ahead through Year 10 under the current assumptions.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <div className="text-zinc-200 font-semibold mb-1">Philippine-specific costs modeled</div>
                    <ul className="space-y-2">
                      {[
                        ['Pag-IBIG / Bank / In-House', 'Three financing channels with realistic Philippine interest rates and caps (Pag-IBIG is capped at ₱6M).'],
                        ['Amilyar (RPT)', 'Real Property Tax billed annually by the LGU, typically 0.4%–0.8% of market value.'],
                        ['MRI + Fire Insurance', 'Mandatory Mortgage Redemption Insurance and fire insurance required by Pag-IBIG and banks, scaling down with the loan balance.'],
                        ['6% Capital Gains Tax', 'Paid by the seller upon sale. Included in Year 10 selling costs to show the true net equity.'],
                        ['Broker Commission', 'Typically 3%–5% on top of CGT, also deducted from selling proceeds.'],
                        ['Stretched DP', 'Pre-selling condos often let buyers pay the down payment in 12 or 24 monthly installments before the loan kicks in.'],
                      ].map(([term, desc]) => (
                        <li key={term} className="flex gap-2">
                          <span className="text-zinc-600 shrink-0">—</span>
                          <span><span className="text-zinc-300">{term}:</span> {desc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="text-zinc-200 font-semibold mb-1">Assumptions & limitations</div>
                    <p>All projections assume constant annual appreciation and rent escalation rates. Interest rates are fixed for the full term — repricing risk is not modeled. Tax rules are based on standard BIR guidelines for individual buyers. Results are estimates for comparison purposes only and should not be taken as financial advice.</p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-zinc-800">
                    <p className="text-zinc-600 text-[11px]">This tool is for educational and planning purposes only. Consult a licensed real estate broker, financial advisor, or Pag-IBIG/bank officer before making any property decisions.</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
