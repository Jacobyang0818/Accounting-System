import { useEffect, useState } from 'react';
import api from '../api/client';
import { Trash2, Plus, Pencil, Check, X, Download } from 'lucide-react';

async function downloadXlsx(endpoint: string, filename: string) {
  try {
    const res = await api.get(endpoint, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a'); a.href = url;
    a.setAttribute('download', filename); document.body.appendChild(a); a.click();
    setTimeout(() => { window.URL.revokeObjectURL(url); a.remove(); }, 100);
  } catch (e: any) {
    const msg = e.response?.data ? await e.response.data.text?.() : e.message;
    alert('匯出失敗：' + (msg || e.message));
  }
}

type ImportDictItem = { id: number; category: string; value: string };
type Vendor = { id: number; name: string; tax_id: string; address: string; phone: string; bank_name: string; branch_name: string; bank_account: string };
type AccountGroup = { id: number; name: string; color_code: string };

const emptyVendor = { name: '', tax_id: '', address: '', phone: '', bank_name: '', branch_name: '', bank_account: '' };

export default function MasterData() {
  const [tab, setTab] = useState<'vendors' | 'import-dict' | 'account-groups'>('vendors');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [importDict, setImportDict] = useState<ImportDictItem[]>([]);
  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([]);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  // new entry forms
  const [newVendor, setNewVendor] = useState({ ...emptyVendor });
  const [newAccSubj, setNewAccSubj] = useState('');
  const [newTransBasis, setNewTransBasis] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#ffffff');

  // inline edit state
  const [editingVendorId, setEditingVendorId] = useState<number | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [editingDictId, setEditingDictId] = useState<number | null>(null);
  const [editingDictValue, setEditingDictValue] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editingGroup, setEditingGroup] = useState<AccountGroup | null>(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [v, d, ag] = await Promise.all([api.get('/vendors'), api.get('/import-dict'), api.get('/account-groups')]);
    setVendors(v.data); setImportDict(d.data); setAccountGroups(ag.data);
  }

  function flash(m: string, err = false) { setMsg(m); setIsError(err); setTimeout(() => setMsg(''), 3000); }

  // ─── Vendor CRUD ───
  async function addVendor() {
    if (!newVendor.name) { flash('廠商名稱為必填', true); return; }
    try { await api.post('/vendors', newVendor); setNewVendor({ ...emptyVendor }); flash('廠商已新增'); loadAll(); }
    catch (e: any) { flash(e.response?.data?.detail || '新增失敗', true); }
  }
  async function saveVendor() {
    if (!editingVendor) return;
    try { await api.put(`/vendors/${editingVendor.id}`, editingVendor); setEditingVendorId(null); flash('廠商已更新'); loadAll(); }
    catch (e: any) { flash(e.response?.data?.detail || '更新失敗', true); }
  }
  async function deleteVendor(id: number) {
    if (!confirm('確定刪除此廠商？')) return;
    await api.delete(`/vendors/${id}`); flash('廠商已刪除'); loadAll();
  }

  // ─── Import Dict CRUD ───
  async function addAccSubj() {
    if (!newAccSubj) { flash('請填入會計科目', true); return; }
    try { await api.post('/import-dict', { category: 'accounting_subj', value: newAccSubj }); setNewAccSubj(''); flash('新增成功'); loadAll(); }
    catch (e: any) { flash(e.response?.data?.detail || '新增失敗', true); }
  }
  async function addTransBasis() {
    if (!newTransBasis) { flash('請填入出入帳依據', true); return; }
    try { await api.post('/import-dict', { category: 'transaction_basis', value: newTransBasis }); setNewTransBasis(''); flash('新增成功'); loadAll(); }
    catch (e: any) { flash(e.response?.data?.detail || '新增失敗', true); }
  }
  async function saveDict(item: ImportDictItem) {
    try { await api.put(`/import-dict/${item.id}`, { category: item.category, value: editingDictValue }); setEditingDictId(null); flash('已更新'); loadAll(); }
    catch (e: any) { flash(e.response?.data?.detail || '更新失敗', true); }
  }
  async function deleteDict(id: number) {
    if (!confirm('確定刪除此項目？')) return;
    await api.delete(`/import-dict/${id}`); flash('項目已刪除'); loadAll();
  }

  // ─── Account Group CRUD ───
  async function addAccountGroup() {
    if (!newGroupName) { flash('請填入寶號名稱', true); return; }
    try { await api.post('/account-groups', { name: newGroupName, color_code: newGroupColor }); setNewGroupName(''); setNewGroupColor('#ffffff'); flash('寶號已新增'); loadAll(); }
    catch (e: any) { flash(e.response?.data?.detail || '新增失敗', true); }
  }
  async function saveGroup() {
    if (!editingGroup) return;
    try { await api.put(`/account-groups/${editingGroup.id}`, { name: editingGroup.name, color_code: editingGroup.color_code }); setEditingGroupId(null); flash('寶號已更新'); loadAll(); }
    catch (e: any) { flash(e.response?.data?.detail || '更新失敗', true); }
  }
  async function deleteGroup(id: number) {
    if (!confirm('確定刪除此寶號？')) return;
    await api.delete(`/account-groups/${id}`); flash('寶號已刪除'); loadAll();
  }

  const accSubjItems = importDict.filter(i => i.category === 'accounting_subj');
  const transBasisItems = importDict.filter(i => i.category === 'transaction_basis');
  const inputCls = 'border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500 w-full bg-white dark:bg-slate-700 text-slate-900 dark:text-white';
  const btnEdit = 'p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300';
  const btnDel = 'p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300';
  const btnSave = 'p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300';
  const btnCancel = 'p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300';

  const tabs = [
    { key: 'vendors', label: `廠商資料 (${vendors.length})` },
    { key: 'import-dict', label: `匯入字典 (${importDict.length})` },
    { key: 'account-groups', label: `歸帳寶號 (${accountGroups.length})` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">基礎資料管理</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">查看、新增、修改及刪除各類基礎資料。</p>
      </div>

      {msg && <div className={`p-3 rounded-md text-sm font-medium ${isError ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>{msg}</div>}

      <div className="border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <nav className="-mb-px flex gap-6">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}>
              {t.label}
            </button>
          ))}
        </nav>
        <button
          onClick={() => {
            const today = new Date().toISOString().slice(0,10).replace(/-/g,'');
            const map: Record<string,[string,string]> = {
              'vendors': ['/vendors/export', `廠商資料_${today}.xlsx`],
              'import-dict': ['/import-dict/export', `匯入資料_${today}.xlsx`],
              'account-groups': ['/account-groups/export', `寶號資料_${today}.xlsx`],
            };
            const [ep, name] = map[tab];
            downloadXlsx(ep, name);
          }}
          className="mb-1 inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm"
        >
          <Download size={14} /> 匯出 xlsx
        </button>
      </div>

      {/* ─────────────── Vendors ─────────────── */}
      {tab === 'vendors' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-4 border dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1"><Plus size={14} />新增廠商</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <input placeholder="廠商名稱 *" value={newVendor.name} onChange={e => setNewVendor({ ...newVendor, name: e.target.value })} className={inputCls} />
              <input placeholder="統一編號" value={newVendor.tax_id} onChange={e => setNewVendor({ ...newVendor, tax_id: e.target.value })} className={inputCls} />
              <input placeholder="地址" value={newVendor.address} onChange={e => setNewVendor({ ...newVendor, address: e.target.value })} className={inputCls} />
              <input placeholder="電話" value={newVendor.phone} onChange={e => setNewVendor({ ...newVendor, phone: e.target.value })} className={inputCls} />
              <input placeholder="銀行名稱" value={newVendor.bank_name} onChange={e => setNewVendor({ ...newVendor, bank_name: e.target.value })} className={inputCls} />
              <input placeholder="分行名稱" value={newVendor.branch_name} onChange={e => setNewVendor({ ...newVendor, branch_name: e.target.value })} className={inputCls} />
              <input placeholder="匯款帳號" value={newVendor.bank_account} onChange={e => setNewVendor({ ...newVendor, bank_account: e.target.value })} className={inputCls} />
              <button onClick={addVendor} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 flex items-center gap-1 justify-center"><Plus size={13} />新增</button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden border dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
                <tr>{['廠商名稱', '統一編號', '地址', '電話', '銀行', '分行', '匯款帳號', ''].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-900">
                {vendors.map(v => {
                  const isEditing = editingVendorId === v.id;
                  const ev = editingVendor;
                  return (
                    <tr key={v.id} className={isEditing ? 'bg-blue-50 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}>
                      {isEditing && ev ? (
                        <>
                          <td className="px-3 py-1"><input value={ev.name} onChange={e => setEditingVendor({ ...ev, name: e.target.value })} className={inputCls} /></td>
                          <td className="px-3 py-1"><input value={ev.tax_id} onChange={e => setEditingVendor({ ...ev, tax_id: e.target.value })} className={inputCls} /></td>
                          <td className="px-3 py-1"><input value={ev.address} onChange={e => setEditingVendor({ ...ev, address: e.target.value })} className={inputCls} /></td>
                          <td className="px-3 py-1"><input value={ev.phone} onChange={e => setEditingVendor({ ...ev, phone: e.target.value })} className={inputCls} /></td>
                          <td className="px-3 py-1"><input value={ev.bank_name} onChange={e => setEditingVendor({ ...ev, bank_name: e.target.value })} className={inputCls} /></td>
                          <td className="px-3 py-1"><input value={ev.branch_name} onChange={e => setEditingVendor({ ...ev, branch_name: e.target.value })} className={inputCls} /></td>
                          <td className="px-3 py-1"><input value={ev.bank_account} onChange={e => setEditingVendor({ ...ev, bank_account: e.target.value })} className={inputCls} /></td>
                          <td className="px-3 py-1 flex gap-1">
                            <button onClick={saveVendor} className={btnSave}><Check size={15} /></button>
                            <button onClick={() => setEditingVendorId(null)} className={btnCancel}><X size={15} /></button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{v.name}</td>
                          <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{v.tax_id}</td>
                          <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{v.address}</td>
                          <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{v.phone}</td>
                          <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{v.bank_name}</td>
                          <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{v.branch_name}</td>
                          <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{v.bank_account}</td>
                          <td className="px-3 py-2 flex gap-1">
                            <button onClick={() => { setEditingVendorId(v.id); setEditingVendor({ ...v }); }} className={btnEdit}><Pencil size={14} /></button>
                            <button onClick={() => deleteVendor(v.id)} className={btnDel}><Trash2 size={14} /></button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
                {vendors.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">無廠商資料</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────── Import Dict ─────────────── */}
      {tab === 'import-dict' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { items: accSubjItems, label: '會計科目', addVal: newAccSubj, setAddVal: setNewAccSubj, onAdd: addAccSubj },
            { items: transBasisItems, label: '出/入帳依據', addVal: newTransBasis, setAddVal: setNewTransBasis, onAdd: addTransBasis },
          ].map(({ items, label, addVal, setAddVal, onAdd }) => (
            <div key={label} className="space-y-3">
              <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-4 border dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1"><Plus size={14} />新增{label}</h3>
                <div className="flex gap-2">
                  <input placeholder={`${label}名稱`} value={addVal} onChange={e => setAddVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && onAdd()} className={`flex-1 ${inputCls}`} />
                  <button onClick={onAdd} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"><Plus size={13} /></button>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden border dark:border-slate-700">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300">{label}</div>
                <table className="min-w-full text-sm divide-y divide-slate-100 dark:divide-slate-700/50">
                  <tbody className="bg-white dark:bg-slate-900">
                    {items.map(i => {
                      const isEditing = editingDictId === i.id;
                      return (
                        <tr key={i.id} className={isEditing ? 'bg-blue-50 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}>
                          <td className="px-4 py-2 text-slate-800 dark:text-slate-200">
                            {isEditing
                              ? <input value={editingDictValue} onChange={e => setEditingDictValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveDict(i)} className={inputCls} autoFocus />
                              : i.value}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {isEditing ? (
                              <div className="flex gap-1 justify-end">
                                <button onClick={() => saveDict(i)} className={btnSave}><Check size={14} /></button>
                                <button onClick={() => setEditingDictId(null)} className={btnCancel}><X size={14} /></button>
                              </div>
                            ) : (
                              <div className="flex gap-1 justify-end">
                                <button onClick={() => { setEditingDictId(i.id); setEditingDictValue(i.value); }} className={btnEdit}><Pencil size={13} /></button>
                                <button onClick={() => deleteDict(i.id)} className={btnDel}><Trash2 size={13} /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {items.length === 0 && <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">無{label}</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─────────────── Account Groups ─────────────── */}
      {tab === 'account-groups' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-4 border dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1"><Plus size={14} />新增歸帳寶號</h3>
            <div className="flex gap-3 items-center flex-wrap">
              <input placeholder="寶號名稱 *" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className={`flex-1 min-w-48 ${inputCls}`} />
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600 dark:text-slate-400">顏色</label>
                <input type="color" value={newGroupColor} onChange={e => setNewGroupColor(e.target.value)} className="h-9 w-14 rounded border border-slate-300 dark:border-slate-600 p-0.5 cursor-pointer bg-white dark:bg-slate-700" />
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{newGroupColor}</span>
              </div>
              <button onClick={addAccountGroup} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 flex items-center gap-1"><Plus size={13} />新增</button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden border dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
                <tr>{['寶號名稱', '色號', '顏色預覽', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-900">
                {accountGroups.map(ag => {
                  const isEditing = editingGroupId === ag.id;
                  const eg = editingGroup;
                  return (
                    <tr key={ag.id} className={isEditing ? 'bg-blue-50 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors'}>
                      <td className="px-4 py-2">
                        {isEditing && eg
                          ? <input value={eg.name} onChange={e => setEditingGroup({ ...eg, name: e.target.value })} className={inputCls} autoFocus />
                          : <span className="font-medium text-slate-900 dark:text-slate-100">{ag.name}</span>}
                      </td>
                      <td className="px-4 py-2">
                        {isEditing && eg
                          ? <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{eg.color_code}</span>
                          : <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">{ag.color_code}</span>}
                      </td>
                      <td className="px-4 py-2">
                        {isEditing && eg ? (
                          <div className="flex items-center gap-2">
                            <input type="color" value={eg.color_code} onChange={e => setEditingGroup({ ...eg, color_code: e.target.value })} className="h-8 w-12 rounded border border-slate-300 dark:border-slate-600 p-0.5 cursor-pointer bg-white dark:bg-slate-700" />
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{eg.color_code}</span>
                          </div>
                        ) : (
                          <div className="w-16 h-6 rounded border border-slate-200 dark:border-slate-700" style={{ backgroundColor: ag.color_code }} />
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button onClick={saveGroup} className={btnSave}><Check size={15} /></button>
                            <button onClick={() => setEditingGroupId(null)} className={btnCancel}><X size={15} /></button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <button onClick={() => { setEditingGroupId(ag.id); setEditingGroup({ ...ag }); }} className={btnEdit}><Pencil size={14} /></button>
                            <button onClick={() => deleteGroup(ag.id)} className={btnDel}><Trash2 size={14} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {accountGroups.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">無歸帳寶號</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
