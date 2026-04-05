import { useEffect, useState } from 'react';
import Select from 'react-select';
import api from '../api/client';
import { Download, Filter } from 'lucide-react';

type SummaryRow = {
  accounting_subj_id: number | null;
  accounting_subj_label: string;
  total_expense: number;
  total_income: number;
  total_payment: number;
};

export default function Report() {
  const [data, setData] = useState<SummaryRow[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [options, setOptions] = useState<{
    accountGroups: { value: number, label: string }[];
    vendors: { value: number, label: string }[];
  }>({ accountGroups: [], vendors: [] });

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterGroups, setFilterGroups] = useState<any[]>([]);
  const [filterVendors, setFilterVendors] = useState<any[]>([]);

  useEffect(() => { loadOptions(); }, []);
  useEffect(() => { fetchReport(); }, [startDate, endDate, filterGroups, filterVendors]);

  async function loadOptions() {
    const [ag, v] = await Promise.all([
      api.get('/options/account-groups'),
      api.get('/options/vendors'),
    ]);
    setOptions({
      accountGroups: ag.data.map((i: any) => ({ value: i.id, label: i.name })),
      vendors: v.data.map((i: any) => ({ value: i.id, label: i.name })),
    });
  }

  function buildParams() {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    filterGroups.forEach((g: any) => params.append('account_group_ids', g.value));
    filterVendors.forEach((v: any) => params.append('vendor_ids', v.value));
    return params;
  }

  async function fetchReport() {
    const res = await api.get(`/reports/summary?${buildParams().toString()}`);
    setData(res.data);
  }

  function allOpt(opts: any[]) { return [{ value: '__all__', label: '【全選】' }, ...opts]; }
  function handleMultiChange(setter: any, all: any[], selected: any[]) {
    setter(selected.some((s: any) => s.value === '__all__') ? all : selected);
  }

  async function exportReport() {
    const res = await api.get(`/reports/summary/export?${buildParams().toString()}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a'); a.href = url;
    a.setAttribute('download', `報表摘要_${new Date().toISOString().slice(0, 10)}.xlsx`);
    document.body.appendChild(a); a.click(); a.remove();
  }

  /** Open Dashboard in a new tab pre-filtered by current params + the specific accounting_subj */
  function openDrillthrough(row: SummaryRow) {
    const params = buildParams();
    if (row.accounting_subj_id) {
      params.append('accounting_subj_ids', String(row.accounting_subj_id));
    }
    window.open(`/?${params.toString()}`, '_blank');
  }

  const totalExpense = data.reduce((s, r) => s + r.total_expense, 0);
  const totalIncome = data.reduce((s, r) => s + r.total_income, 0);
  const totalPayment = data.reduce((s, r) => s + r.total_payment, 0);
  const fmt = (n: number) => n.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">報表</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">按會計科目彙總支出、收入及已請款未收付金額。點擊金額數字可查看明細。</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm">
            <Filter className="mr-2 h-4 w-4" /> 篩選
          </button>
          <button onClick={exportReport} className="inline-flex items-center px-3 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-sm">
            <Download className="mr-2 h-4 w-4" /> 匯出報表
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-slate-800 p-4 shadow rounded-lg space-y-3 border dark:border-slate-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">開始日期</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">結束日期</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-700 dark:text-white" />
            </div>
            <div className="react-select-dark">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">歸帳寶號</label>
              <Select isMulti options={allOpt(options.accountGroups)} value={filterGroups}
                onChange={(s: any) => handleMultiChange(setFilterGroups, options.accountGroups, s || [])}
                placeholder="全部" className="text-sm my-react-select-container" classNamePrefix="my-react-select" />
            </div>
            <div className="react-select-dark">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">廠商</label>
              <Select isMulti options={allOpt(options.vendors)} value={filterVendors}
                onChange={(s: any) => handleMultiChange(setFilterVendors, options.vendors, s || [])}
                placeholder="全部" className="text-sm my-react-select-container" classNamePrefix="my-react-select" />
            </div>
          </div>
          <button onClick={() => { setStartDate(''); setEndDate(''); setFilterGroups([]); setFilterVendors([]); }} className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 underline">清除篩選</button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase">會計科目</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase">支出金額</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase">收入金額</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase">已請款未收付</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-900">
            {data.map((row, i) => (
              <tr key={i} className={`${i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/50'} hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}>
                <td className="px-6 py-3 text-slate-800 dark:text-slate-200">{row.accounting_subj_label}</td>
                <td className="px-6 py-3 text-right tabular-nums">
                  <button onClick={() => openDrillthrough(row)} className="text-blue-600 hover:underline hover:text-blue-800 font-medium">
                    {fmt(row.total_expense)}
                  </button>
                </td>
                <td className="px-6 py-3 text-right tabular-nums">
                  <button onClick={() => openDrillthrough(row)} className="text-blue-600 hover:underline hover:text-blue-800 font-medium">
                    {fmt(row.total_income)}
                  </button>
                </td>
                <td className="px-6 py-3 text-right tabular-nums">
                  <button onClick={() => openDrillthrough(row)} className="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                    {fmt(row.total_payment)}
                  </button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">尚無資料</td></tr>
            )}
          </tbody>
          {data.length > 0 && (
            <tfoot className="bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-600">
              <tr>
                <td className="px-6 py-3 font-bold text-slate-900 dark:text-white">合計</td>
                <td className="px-6 py-3 text-right font-bold text-slate-900 dark:text-white tabular-nums">{fmt(totalExpense)}</td>
                <td className="px-6 py-3 text-right font-bold text-slate-900 dark:text-white tabular-nums">{fmt(totalIncome)}</td>
                <td className="px-6 py-3 text-right font-bold text-slate-900 dark:text-white tabular-nums">{fmt(totalPayment)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
