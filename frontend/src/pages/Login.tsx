import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function Login() {
  const [isInit, setIsInit] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkInit() {
      try {
        const res = await api.get('/auth/check-init');
        setIsInit(res.data.initialized);
      } catch (err) {
        setIsInit(true); // default to login if check fails
      }
    }
    checkInit();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isInit === false) {
        // Register first admin
        await api.post('/auth/init', { email, password });
        alert('註冊成功！請重新登入。');
        setIsInit(true);
        setPassword('');
      } else {
        // Login
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);
        
        const res = await api.post('/auth/login', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        localStorage.setItem('token', res.data.access_token);
        window.location.href = '/'; // hard reload to reset state and interceptors
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || '發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  if (isInit === null) return <div className="h-screen flex text-slate-500 items-center justify-center">載入中...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
          {isInit ? '登入帳號' : '首次設定管理員'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          歡迎使用會計系統
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
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email 信箱</label>
              <div className="mt-1">
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">密碼</label>
              <div className="mt-1">
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} 
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
            </div>

            {isInit && (
              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <button type="button" onClick={() => navigate('/reset-password')} className="font-medium text-blue-600 hover:text-blue-500">
                    忘記密碼？
                  </button>
                </div>
              </div>
            )}

            <div>
              <button disabled={loading} type="submit" 
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                {loading ? '處理中...' : (isInit ? '登入' : '設定為管理員')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
