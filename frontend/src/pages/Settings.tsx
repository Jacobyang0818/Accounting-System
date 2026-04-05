import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../api/client';

export default function Settings() {
  const [importTarget, setImportTarget] = useState<string>('vendors');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');

  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  function flash(msg: string, err = false) {
    setMessage(msg); setIsError(err);
    setTimeout(() => setMessage(''), 4000);
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const formData = new FormData();
    formData.append('file', acceptedFiles[0]);
    try {
      flash('上傳中…');
      const res = await api.post(`/import/${importTarget}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      flash('✅ ' + (res.data.message || '匯入成功'));
    } catch (e: any) {
      flash('❌ ' + (e.response?.data?.detail || '匯入失敗'), true);
    }
  }, [importTarget]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
  });

  async function handleClearAll() {
    try {
      await api.delete('/clear-all', { data: { confirm: '確定刪除資料庫' } });
      flash('✅ 所有資料已清空');
      setShowClearModal(false);
      setClearConfirmText('');
    } catch (e: any) {
      flash('❌ ' + (e.response?.data?.detail || '清空失敗'), true);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdLoading(true);
    try {
      await api.post('/auth/change-password', { old_password: oldPwd, new_password: newPwd });
      flash('✅ 密碼修改成功！');
      setOldPwd(''); setNewPwd('');
    } catch (err: any) {
      flash('❌ ' + (err.response?.data?.detail || '密碼修改失敗'), true);
    } finally {
      setPwdLoading(false);
    }
  }

  const importOptions = [
    { value: 'vendors', label: '廠商資料' },
    { value: 'account-groups', label: '寶號資料' },
    { value: 'import-dict', label: '匯入資料（會計科目 / 出入帳依據）' },
    { value: 'ledgers', label: '總帳' },
  ];

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">設定</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">批次匯入資料與系統管理。</p>
        <p className="mt-1 text-slate-400 dark:text-slate-500 text-xs">提示：歸帳寶號顏色可在「基礎資料」頁面修改。</p>
      </div>

      {message && (
        <div className={`p-4 rounded-md text-sm font-medium ${isError ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
          {message}
        </div>
      )}

      {/* Import */}
      <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 border dark:border-slate-700 transition-colors">
        <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">批次匯入資料（Excel）</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">建議匯入順序：寶號資料 → 廠商資料 → 匯入資料 → 總帳</p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">選擇目標資料表</label>
          <select
            value={importTarget}
            onChange={(e) => setImportTarget(e.target.value)}
            className="block pl-3 pr-10 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          >
            {importOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div
          {...getRootProps()}
          className={`mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-colors ${isDragActive ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/50'}`}
        >
          <div className="space-y-2 text-center">
            <input {...getInputProps()} />
            <svg className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm text-slate-600 dark:text-slate-400">{isDragActive ? '放開以上傳' : <><span className="text-blue-600 dark:text-blue-400 font-medium">點擊選擇檔案</span> 或拖曳至此</>}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">僅支援 .xlsx 格式</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 border dark:border-slate-700 transition-colors">
        <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">修改管理員密碼</h2>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">舊密碼 / 臨時密碼</label>
            <input 
              type={showPwd ? 'text' : 'password'} 
              required value={oldPwd} onChange={e => setOldPwd(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">新密碼</label>
            <input 
              type={showPwd ? 'text' : 'password'} 
              required value={newPwd} onChange={e => setNewPwd(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
              <input type="checkbox" checked={showPwd} onChange={e => setShowPwd(e.target.checked)} className="mr-2 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:bg-slate-700" />
              顯示密碼
            </label>
            <button 
              type="submit" disabled={pwdLoading || !oldPwd || !newPwd}
              className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white text-sm font-medium rounded-md hover:bg-slate-900 dark:hover:bg-slate-600 disabled:opacity-50 transition"
            >
              {pwdLoading ? '處理中...' : '儲存新密碼'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 border border-red-200 dark:border-red-900/50 transition-colors">
        <h2 className="text-lg font-medium text-red-600 dark:text-red-500 mb-2">危險區域</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">清空資料庫會刪除所有總帳、廠商、寶號及字典資料，且無法復原。</p>
        <button
          onClick={() => setShowClearModal(true)}
          className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white text-sm font-medium rounded-md hover:bg-red-700 dark:hover:bg-red-600 shadow-sm transition"
        >
          🗑️ 清空資料庫
        </button>
      </div>

      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 border dark:border-slate-700">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-500 mb-2">⚠️ 確認清空資料庫</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">此操作會刪除所有資料且<strong>無法復原</strong>。請輸入確認文字：</p>
            <div className="bg-slate-100 dark:bg-slate-900 rounded px-3 py-1.5 font-mono text-sm text-center mb-3 text-slate-800 dark:text-slate-200 border dark:border-slate-700">確定刪除資料庫</div>
            <input
              type="text"
              value={clearConfirmText}
              onChange={e => setClearConfirmText(e.target.value)}
              placeholder="請在此輸入確認文字"
              className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm mb-4 focus:ring-red-400 focus:border-red-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowClearModal(false); setClearConfirmText(''); }} className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-50 dark:hover:bg-slate-700">取消</button>
              <button
                onClick={handleClearAll}
                disabled={clearConfirmText !== '確定刪除資料庫'}
                className={`px-4 py-2 text-sm text-white rounded transition ${clearConfirmText === '確定刪除資料庫' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300 dark:bg-red-900/50 cursor-not-allowed text-white/70'}`}
              >確定清空</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
