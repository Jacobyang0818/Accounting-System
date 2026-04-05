import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/reset-password', { email });
      setMsg(res.data.message);
    } catch (err: any) {
      setError(err.response?.data?.detail || '發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
          忘記密碼
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          填寫您的管理員信箱，系統將發送一組新的臨時密碼給您。
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border dark:border-slate-700 transition-colors">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            {msg && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-md text-sm whitespace-pre-line">
                {msg}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email 信箱</label>
              <div className="mt-1">
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button type="button" onClick={() => navigate('/login')} className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
                返回登入
              </button>
              <button disabled={loading} type="submit" 
                className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                {loading ? '處理中...' : '重設密碼'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
