import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const WeeklyThemeModal = ({ isOpen, onClose, weekDate, onThemeUpdated }) => {
  const [theme, setTheme] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 주일 날짜를 계산하는 함수
  const getSundayOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diff = day; // How many days to go back to Sunday
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - diff);

    // 로컬 시간대로 날짜 문자열 생성
    const year = sunday.getFullYear();
    const month = String(sunday.getMonth() + 1).padStart(2, '0');
    const dayStr = String(sunday.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const fetchWeeklyTheme = useCallback(async () => {
    setLoading(true);
    try {
      const sunday = getSundayOfWeek(weekDate);
      console.log('Fetching theme for week date:', weekDate, 'Sunday:', sunday);

      const { data, error } = await supabase
        .from('weekly_themes')
        .select('theme')
        .eq('week_date', sunday)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching weekly theme:', error);
        setTheme(''); // 기본값으로 설정
      } else if (data) {
        console.log('Found theme:', data.theme);
        setTheme(data.theme);
      } else {
        console.log('No theme found for this week, using empty string');
        setTheme(''); // 데이터가 없으면 빈 문자열
      }
    } catch (error) {
      console.error('Error:', error);
      setTheme('');
    } finally {
      setLoading(false);
    }
  }, [weekDate]);

  useEffect(() => {
    if (isOpen && weekDate) {
      fetchWeeklyTheme();
    }
  }, [isOpen, weekDate, fetchWeeklyTheme]);

  const handleSave = async () => {
    if (!theme.trim()) {
      alert('말씀 주제를 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const sunday = getSundayOfWeek(weekDate);
      console.log('Saving theme for week date:', weekDate, 'Sunday:', sunday, 'Theme:', theme.trim());

      const { error } = await supabase
        .from('weekly_themes')
        .upsert({
          week_date: sunday,
          theme: theme.trim()
        }, {
          onConflict: 'week_date'
        });

      if (error) {
        console.error('Error saving weekly theme:', error);
        alert('말씀 주제 저장 중 오류가 발생했습니다.');
      } else {
        console.log('Theme saved successfully');
        onThemeUpdated && onThemeUpdated();
        onClose();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('말씀 주제 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setTheme('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">📖 주간 말씀 주제 편집</h2>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-1">편집할 주일</p>
            <p className="text-lg font-bold text-blue-900">
              {(() => {
                const sunday = new Date(getSundayOfWeek(weekDate));
                return `${sunday.getFullYear()}년 ${sunday.getMonth() + 1}월 ${sunday.getDate()}일 주일`;
              })()}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              이 주일의 말씀 주제를 편집합니다
            </p>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="text-slate-600">로딩 중...</div>
            </div>
          ) : (
            <div className="mb-6">
              <label htmlFor="theme" className="block text-sm font-medium text-slate-700 mb-2">
                말씀 주제
              </label>
              <input
                type="text"
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="예: 피로 세우는 언약"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={100}
              />
              <p className="text-xs text-slate-500 mt-1">
                최대 100자까지 입력할 수 있습니다.
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              disabled={saving}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading || !theme.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyThemeModal;