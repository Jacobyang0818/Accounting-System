import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select';
import api from '../api/client';

type FormData = {
  date: string;
  account_group_id: number;
  accounting_subj: number;
  project_name: string;
  summary: string;
  expense_amt: number;
  income_amt: number;
  payment_status: string;
  voucher_no: string;
  vendor_id: number;
  transaction_basis: number;
  notes: string;
};

export default function QuickEntry() {
  const { register, handleSubmit, control, reset } = useForm<FormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      expense_amt: 0,
      income_amt: 0,
    }
  });

  const [options, setOptions] = useState<{
    accountGroups: { value: number, label: string }[],
    vendors: { value: number, label: string }[],
    accSubjects: { value: number, label: string }[],
    transBasis: { value: number, label: string }[]
  }>({ accountGroups: [], vendors: [], accSubjects: [], transBasis: [] });

  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    async function load() {
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
    }
    load();
  }, []);

  function flash(m: string, err = false) {
    setMsg(m); setIsError(err);
    setTimeout(() => setMsg(''), 3000);
  }

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        expense_amt: data.expense_amt ? Number(data.expense_amt) : 0,
        income_amt: data.income_amt ? Number(data.income_amt) : 0,
        payment_status: data.payment_status ? Number(data.payment_status) : null,
      };
      await api.post('/ledgers', payload);
      flash('✅ 總帳記錄已新增！');
      reset({ date: new Date().toISOString().split('T')[0], expense_amt: 0, income_amt: 0 });
    } catch (e: any) {
      let errMsg = '儲存失敗';
      if (e.response?.data?.detail) {
        const detail = e.response.data.detail;
        if (typeof detail === 'string') {
          errMsg = detail;
        } else if (Array.isArray(detail)) {
          errMsg = detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
        } else {
          errMsg = JSON.stringify(detail);
        }
      }
      flash('❌ ' + errMsg, true);
    }
  };

  const field = 'mt-1 block w-full rounded border border-slate-300 dark:border-slate-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white';
  const label = 'block text-sm font-medium text-slate-700 dark:text-slate-300';

  return (
    <div className="max-w-4xl mx-auto py-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">快速輸入</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">新增一筆總帳記錄</p>

      {msg && (
        <div className={`mb-4 p-3 rounded text-sm font-medium ${isError ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
          {msg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 space-y-5 border dark:border-slate-700">
        {/* Row 1: 歸帳寶號 + 日期 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="react-select-dark">
            <label className={label}>歸帳寶號</label>
            <Controller name="account_group_id" control={control}
              render={({ field: f }) => (
                <Select {...f} options={options.accountGroups} value={options.accountGroups.find(o => o.value === f.value)} onChange={(v: any) => f.onChange(v?.value)} className="mt-1 text-sm my-react-select-container" classNamePrefix="my-react-select" placeholder="選擇寶號" />
              )} />
          </div>
          <div>
            <label className={label}>日期</label>
            <input type="date" {...register('date', { required: true })} className={field} />
          </div>
        </div>

        {/* Row 2: 會計科目 + 工程名稱 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="react-select-dark">
            <label className={label}>會計科目</label>
            <Controller name="accounting_subj" control={control}
              render={({ field: f }) => (
                <Select {...f} options={options.accSubjects} value={options.accSubjects.find(o => o.value === f.value)} onChange={(v: any) => f.onChange(v?.value)} className="mt-1 text-sm my-react-select-container" classNamePrefix="my-react-select" placeholder="選擇科目" />
              )} />
          </div>
          <div>
            <label className={label}>工程名稱</label>
            <input type="text" {...register('project_name')} className={field} />
          </div>
        </div>

        {/* Row 3: 摘要 */}
        <div>
          <label className={label}>摘要</label>
          <input type="text" {...register('summary')} className={field} />
        </div>

        {/* Row 4: 支出金額 + 收入金額 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>支出金額</label>
            <input type="number" step="0.01" {...register('expense_amt')} className={field} />
          </div>
          <div>
            <label className={label}>收入金額</label>
            <input type="number" step="0.01" {...register('income_amt')} className={field} />
          </div>
        </div>

        {/* Row 5: 已請款未收付 + 憑證 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>已請款未收付</label>
            <input type="number" step="0.01" {...register('payment_status')} className={field} />
          </div>
          <div>
            <label className={label}>憑證</label>
            <input type="text" {...register('voucher_no')} className={field} />
          </div>
        </div>

        {/* Row 6: 廠商 + 出/入帳依據 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="react-select-dark">
            <label className={label}>廠商</label>
            <Controller name="vendor_id" control={control}
              render={({ field: f }) => (
                <Select {...f} options={options.vendors} value={options.vendors.find(o => o.value === f.value)} onChange={(v: any) => f.onChange(v?.value)} className="mt-1 text-sm my-react-select-container" classNamePrefix="my-react-select" placeholder="選擇廠商" />
              )} />
          </div>
          <div className="react-select-dark">
            <label className={label}>出/入帳依據</label>
            <Controller name="transaction_basis" control={control}
              render={({ field: f }) => (
                <Select {...f} options={options.transBasis} value={options.transBasis.find(o => o.value === f.value)} onChange={(v: any) => f.onChange(v?.value)} className="mt-1 text-sm my-react-select-container" classNamePrefix="my-react-select" placeholder="選擇依據" />
              )} />
          </div>
        </div>

        {/* Row 7: 備註 */}
        <div>
          <label className={label}>備註</label>
          <textarea {...register('notes')} rows={2} className={field} />
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 shadow-sm transition">
            儲存
          </button>
        </div>
      </form>
    </div>
  );
}
