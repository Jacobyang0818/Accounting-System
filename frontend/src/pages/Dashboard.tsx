import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
} from '@tanstack/react-table';
import type { SortingState } from '@tanstack/react-table';
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select';
import api from '../api/client';
import { Download, Filter, Pencil, Trash2, X, Check } from 'lucide-react';

type LedgerRow = {
  id: number; date: string; account_group_id: number; voucher_no: string;
  accounting_subj: number; project_name: string; summary: string;
  expense_amt: number; income_amt: number; payment_status: string;
  receipt_no: string; vendor_id: number; transaction_basis: number; notes: string;
  account_group_color_code: string; vendor_name: string;
};

type Options = { accountGroups: any[]; vendors: any[]; accSubjects: any[]; transBasis: any[] };

export default function Dashboard() {
  const [data, setData] = useState<LedgerRow[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [options, setOptions] = useState<Options>({ accountGroups: [], vendors: [], accSubjects: [], transBasis: [] });

  // filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterGroups, setFilterGroups] = useState<any[]>([]);
  const [filterVendors, setFilterVendors] = useState<any[]>([]);
  const [filterAccSubj, setFilterAccSubj] = useState<any[]>([]);

  // edit/delete state
  const [editRow, setEditRow] = useState<LedgerRow | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { register, handleSubmit, control, reset } = useForm();

  const [searchParams] = useSearchParams();

  useEffect(() => { loadOptions(); }, []);

  // After options load, read URL params and set initial filters
  useEffect(() => {
    const sd = searchParams.get('start_date'); if (sd) setStartDate(sd);
    const ed = searchParams.get('end_date'); if (ed) setEndDate(ed);
    const agIds = searchParams.getAll('account_group_ids').map(Number);
    const asIds = searchParams.getAll('accounting_subj_ids').map(Number);
    const vIds = searchParams.getAll('vendor_ids').map(Number);
    if (agIds.length || asIds.length || vIds.length) {
      setShowFilters(true); // auto-show filter panel
      // We set raw IDs; labels will be resolved once options load
      if (agIds.length) setFilterGroups(agIds.map(id => ({ value: id, label: `ID:${id}` })));
      if (asIds.length) setFilterAccSubj(asIds.map(id => ({ value: id, label: `ID:${id}` })));
      if (vIds.length) setFilterVendors(vIds.map(id => ({ value: id, label: `ID:${id}` })));
    }
  }, []);

  useEffect(() => { fetchLedgers(); }, [startDate, endDate, filterGroups, filterVendors, filterAccSubj]);

  async function loadOptions() {
    try {
      const [ag, v, sub, tb] = await Promise.all([
        api.get('/options/account-groups'),
        api.get('/options/vendors'),
        api.get('/options/import-dict/accounting_subj'),
        api.get('/options/import-dict/transaction_basis'),
      ]);
      setOptions({
        accountGroups: ag.data.map((i: any) => ({ value: i.id, label: i.name })),
        vendors: v.data.map((i: any) => ({ value: i.id, label: i.name })),
        accSubjects: sub.data.map((i: any) => ({ value: i.id, label: i.value })),
        transBasis: tb.data.map((i: any) => ({ value: i.id, label: i.value })),
      });
      // Resolve labels for drill-through pre-filters once options are loaded
      const agIds = searchParams.getAll('account_group_ids').map(Number);
      const asIds = searchParams.getAll('accounting_subj_ids').map(Number);
      const vIds = searchParams.getAll('vendor_ids').map(Number);
      if (agIds.length) setFilterGroups(ag.data.filter((i: any) => agIds.includes(i.id)).map((i: any) => ({ value: i.id, label: i.name })));
      if (asIds.length) setFilterAccSubj(sub.data.filter((i: any) => asIds.includes(i.id)).map((i: any) => ({ value: i.id, label: i.value })));
      if (vIds.length) setFilterVendors(v.data.filter((i: any) => vIds.includes(i.id)).map((i: any) => ({ value: i.id, label: i.name })));
    } catch (e) { console.error(e); }
  }

  async function fetchLedgers() {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    filterGroups.forEach((g: any) => params.append('account_group_ids', g.value));
    filterAccSubj.forEach((s: any) => params.append('accounting_subj_ids', s.value));
    filterVendors.forEach((v: any) => params.append('vendor_ids', v.value));
    try { const res = await api.get(`/ledgers?${params.toString()}`); setData(res.data); }
    catch (e) { console.error(e); }
  }

  function openEdit(row: LedgerRow) {
    setEditRow(row);
    reset({
      date: row.date,
      account_group_id: row.account_group_id,
      voucher_no: row.voucher_no,
      accounting_subj: row.accounting_subj,
      project_name: row.project_name,
      summary: row.summary,
      expense_amt: row.expense_amt,
      income_amt: row.income_amt,
      payment_status: row.payment_status,
      receipt_no: row.receipt_no,
      vendor_id: row.vendor_id,
      transaction_basis: row.transaction_basis,
      notes: row.notes,
    });
  }

  async function saveEdit(formData: any) {
    if (!editRow) return;
    await api.put(`/ledgers/${editRow.id}`, formData);
    setEditRow(null);
    fetchLedgers();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await api.delete(`/ledgers/${deleteId}`);
    setDeleteId(null);
    fetchLedgers();
  }

  async function exportExcel() {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const res = await api.get(`/export/ledgers?${params.toString()}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ledgers_export.xlsx');
    document.body.appendChild(link); link.click(); link.remove();
  }

  const allGroupOpt = { value: '__all__', label: '【全選】' };
  const allVendorOpt = { value: '__all__', label: '【全選】' };
  const allAccSubjOpt = { value: '__all__', label: '【全選】' };

  const groupOpts = [allGroupOpt, ...options.accountGroups];
  const vendorOpts = [allVendorOpt, ...options.vendors];
  const accSubjOpts = [allAccSubjOpt, ...options.accSubjects];

  function handleMultiChange(setter: any, all: any[], selected: any[]) {
    const hasAll = selected.some((s: any) => s.value === '__all__');
    if (hasAll) setter(all);
    else setter(selected);
  }

  const columns = useMemo(() => [
    { id: 'actions', size: 60, header: '', cell: ({ row }: any) => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(row.original)} className="p-1 text-blue-500 hover:text-blue-700"><Pencil size={14} /></button>
        <button onClick={() => setDeleteId(row.original.id)} className="p-1 text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
      </div>
    )},
    { accessorKey: 'account_group_name', size: 90, header: '歸帳寶號', cell: ({ row }: any) => row.original.account_group_name || '' },
    { accessorKey: 'date', size: 85, header: '日期' },
    { accessorKey: 'accounting_subj_label', size: 105, header: '會計科目', cell: ({ row }: any) => row.original.accounting_subj_label || '' },
    { accessorKey: 'project_name', size: 105, header: '工程名稱' },
    { accessorKey: 'summary', size: 120, header: '摘要' },
    { accessorKey: 'expense_amt', size: 92, header: '支出金額' },
    { accessorKey: 'income_amt', size: 92, header: '收入金額' },
    { accessorKey: 'payment_status', size: 112, header: '已請款未收付' },
    { accessorKey: 'voucher_no', size: 75, header: '憑證' },
    { accessorKey: 'vendor_name', size: 90, header: '廠商' },
    { accessorKey: 'transaction_basis_label', size: 105, header: '出/入帳依據', cell: ({ row }: any) => row.original.transaction_basis_label || '' },
    { accessorKey: 'notes', size: 100, header: '備註' },
  ], []);

  const table = useReactTable({
    data, columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">總帳</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
              共 {data.length} 筆資料
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">管理所有總帳明細記錄</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm">
            <Filter className="mr-2 h-4 w-4" /> 篩選
          </button>
          <button onClick={exportExcel} className="inline-flex items-center px-3 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-sm">
            <Download className="mr-2 h-4 w-4" /> 匯出 Excel
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-800 p-4 shadow rounded-lg space-y-3 border dark:border-slate-700">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
              <Select isMulti options={groupOpts} value={filterGroups} onChange={(sel: any) => handleMultiChange(setFilterGroups, options.accountGroups, sel || [])} placeholder="全部" className="text-sm my-react-select-container" classNamePrefix="my-react-select" />
            </div>
            <div className="react-select-dark">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">廠商</label>
              <Select isMulti options={vendorOpts} value={filterVendors} onChange={(sel: any) => handleMultiChange(setFilterVendors, options.vendors, sel || [])} placeholder="全部" className="text-sm my-react-select-container" classNamePrefix="my-react-select" />
            </div>
            <div className="react-select-dark">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">會計科目</label>
              <Select isMulti options={accSubjOpts} value={filterAccSubj} onChange={(sel: any) => handleMultiChange(setFilterAccSubj, options.accSubjects, sel || [])} placeholder="全部" className="text-sm my-react-select-container" classNamePrefix="my-react-select" />
            </div>
          </div>
          <button onClick={() => { setStartDate(''); setEndDate(''); setFilterGroups([]); setFilterVendors([]); setFilterAccSubj([]); }} className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 underline">清除所有篩選</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed divide-y divide-slate-200 dark:divide-slate-700">
            <colgroup>
              {table.getAllColumns().map(col => (
                <col key={col.id} style={{ width: col.columnDef.size ?? 100 }} />
              ))}
            </colgroup>
            <thead className="bg-slate-50 dark:bg-slate-800">
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(h => (
                    <th key={h.id} onClick={h.column.getToggleSortingHandler()}
                      className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap overflow-hidden">
                      <div className="flex items-center gap-1">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {h.column.getIsSorted() === 'asc' ? '▲' : h.column.getIsSorted() === 'desc' ? '▼' : null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-900">
              {table.getRowModel().rows.map(row => {
                const color = row.original.account_group_color_code || '#ffffff';
                // Calculate if text should be light or dark based on background brightness
                const hex = color.replace('#', '');
                const r = parseInt(hex.substring(0, 2), 16) || 255;
                const g = parseInt(hex.substring(2, 4), 16) || 255;
                const b = parseInt(hex.substring(4, 6), 16) || 255;
                const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
                const textColor = yiq >= 128 ? 'text-slate-900' : 'text-slate-100';

                return (
                  <tr key={row.id} style={{ backgroundColor: color }} className="hover:brightness-95 dark:hover:brightness-110 transition-all">
                    {row.getVisibleCells().map(cell => {
                      const isActions = cell.column.id === 'actions';
                      const rawVal = isActions ? '' : String(cell.getValue() ?? '');
                      return (
                        <td key={cell.id} className={`px-3 py-2 text-sm ${isActions ? '' : textColor} overflow-hidden`} title={isActions ? undefined : rawVal}>
                          {isActions
                            ? <div className="flex gap-1 bg-white/80 dark:bg-slate-800/80 rounded px-1">{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
                            : <div className="truncate">{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
                          }
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr><td colSpan={columns.length} className="px-4 py-16 text-center text-slate-400 dark:text-slate-500">尚無資料</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editRow && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">編輯總帳記錄</h2>
              <button onClick={() => setEditRow(null)}><X className="h-5 w-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleSubmit(saveEdit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-slate-700">日期</label>
                  <input type="date" {...register('date')} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" /></div>
                <div><label className="text-sm font-medium text-slate-700">憑證</label>
                  <input type="text" {...register('voucher_no')} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" /></div>
                <div><label className="text-sm font-medium text-slate-700">歸帳寶號</label>
                  <Controller name="account_group_id" control={control} render={({ field }) => (
                    <Select {...field} options={options.accountGroups} value={options.accountGroups.find(o => o.value === field.value)} onChange={(v: any) => field.onChange(v?.value)} className="mt-1 text-sm" />
                  )} /></div>
                <div><label className="text-sm font-medium text-slate-700">廠商</label>
                  <Controller name="vendor_id" control={control} render={({ field }) => (
                    <Select {...field} options={options.vendors} value={options.vendors.find(o => o.value === field.value)} onChange={(v: any) => field.onChange(v?.value)} className="mt-1 text-sm" />
                  )} /></div>
                <div><label className="text-sm font-medium text-slate-700">會計科目</label>
                  <Controller name="accounting_subj" control={control} render={({ field }) => (
                    <Select {...field} options={options.accSubjects} value={options.accSubjects.find(o => o.value === field.value)} onChange={(v: any) => field.onChange(v?.value)} className="mt-1 text-sm" />
                  )} /></div>
                <div><label className="text-sm font-medium text-slate-700">出/入帳依據</label>
                  <Controller name="transaction_basis" control={control} render={({ field }) => (
                    <Select {...field} options={options.transBasis} value={options.transBasis.find(o => o.value === field.value)} onChange={(v: any) => field.onChange(v?.value)} className="mt-1 text-sm" />
                  )} /></div>
                <div><label className="text-sm font-medium text-slate-700">工程名稱</label>
                  <input type="text" {...register('project_name')} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" /></div>
                <div><label className="text-sm font-medium text-slate-700">摘要</label>
                  <input type="text" {...register('summary')} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" /></div>
                <div><label className="text-sm font-medium text-slate-700">支出金額</label>
                  <input type="number" step="0.01" {...register('expense_amt')} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" /></div>
                <div><label className="text-sm font-medium text-slate-700">收入金額</label>
                  <input type="number" step="0.01" {...register('income_amt')} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" /></div>
                <div><label className="text-sm font-medium text-slate-700">已請款未收付</label>
                  <input type="number" step="0.01" {...register('payment_status')} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" /></div>
                <div><label className="text-sm font-medium text-slate-700">備註</label>
                  <input type="text" {...register('notes')} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditRow(null)} className="px-4 py-2 text-sm border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50">取消</button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"><Check size={14} />儲存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">確認刪除</h3>
            <p className="text-sm text-slate-600 mb-4">確定要刪除這筆總帳記錄嗎？此動作無法復原。</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50">取消</button>
              <button onClick={confirmDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">確定刪除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
