import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

// Helper function to get the Sunday date for the current week
const getSundayOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = day; // How many days to go back to Sunday
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - diff);
  return sunday.toISOString().slice(0, 10);
};

const ReportPage = () => {
  const [yohoes, setYohoes] = useState([]);
  const [report, setReport] = useState({
    report_date: getSundayOfWeek(),
    yohoe_id: '',
    attended_leaders_count: 0,
    attended_leaders_names: '',
    absent_leaders_count: 0,
    absent_leaders_names: '',
    attended_graduates_count: 0,
    attended_graduates_names: '',
    attended_students_count: 0,
    attended_students_names: '',
    attended_freshmen_count: 0,
    attended_freshmen_names: '',
    one_to_one_count: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchYohoes = async () => {
      const { data, error } = await supabase.from('yohoe').select('id, name');
      if (error) {
        console.error('Error fetching yohoes:', error);
      } else {
        setYohoes(data);
      }
    };
    fetchYohoes();
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'number' ? (value === '' ? 0 : parseInt(value)) : value;
    setReport(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting report data:', report);
    
    const sundayDate = getSundayOfWeek();
    const reportWithSundayDate = {
      ...report,
      report_date: sundayDate
    };
    
    try {
      // First, delete any existing reports for this yohoe and Sunday date
      const { error: deleteError } = await supabase
        .from('reports')
        .delete()
        .match({ 
          yohoe_id: report.yohoe_id, 
          report_date: sundayDate 
        });
      
      if (deleteError) {
        console.error('Error deleting existing reports:', deleteError);
      }
      
      // Then insert the new report
      const { data, error: insertError } = await supabase
        .from('reports')
        .insert([reportWithSundayDate]);
      
      if (insertError) {
        console.error('Error creating report:', insertError);
        alert(`보고서 저장 중 오류가 발생했습니다: ${insertError.message}`);
      } else {
        console.log('Report created successfully:', data);
        alert(`${new Date(sundayDate).getFullYear()}년 ${new Date(sundayDate).getMonth() + 1}월 ${new Date(sundayDate).getDate()}일(주일) 보고서가 성공적으로 저장되었습니다.`);
        navigate('/');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('예상치 못한 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-indigo-100">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">주간 보고서 작성</h1>
              <p className="mt-2 text-sm text-gray-600">교회 소그룹 출석 현황을 기록해주세요</p>
            </div>
            <div className="hidden sm:block">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                기본 정보
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="report_date" className="block text-sm font-medium text-gray-700">
                    주일 <span className="text-red-500">*</span>
                  </label>
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-700">
                    {(() => {
                      const sunday = new Date(getSundayOfWeek());
                      return `${sunday.getFullYear()}년 ${sunday.getMonth() + 1}월 ${sunday.getDate()}일(주일)`;
                    })()}
                  </div>
                  <input 
                    type="hidden" 
                    name="report_date" 
                    value={report.report_date} 
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="yohoe_id" className="block text-sm font-medium text-gray-700">
                    요회 <span className="text-red-500">*</span>
                  </label>
                  <select 
                    id="yohoe_id" 
                    name="yohoe_id" 
                    value={report.yohoe_id} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-sm bg-white" 
                    required
                  >
                    <option value="">요회를 선택하세요</option>
                    {yohoes.map(yohoe => (
                      <option key={yohoe.id} value={yohoe.id}>{yohoe.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                참석 현황
              </h3>
            </div>
            <div className="p-6 space-y-8">
              
              {/* Leaders */}
              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-800 flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  리더
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">참석자 수</label>
                    <input 
                      type="number" 
                      name="attended_leaders_count" 
                      placeholder="0" 
                      min="0" 
                      value={report.attended_leaders_count} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">참석자 이름</label>
                    <input 
                      type="text" 
                      name="attended_leaders_names" 
                      placeholder="홍길동, 김철수, ..." 
                      value={report.attended_leaders_names} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">불참자 수</label>
                    <input 
                      type="number" 
                      name="absent_leaders_count" 
                      placeholder="0" 
                      min="0" 
                      value={report.absent_leaders_count} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">불참자 이름</label>
                    <input 
                      type="text" 
                      name="absent_leaders_names" 
                      placeholder="이영희, 박영수, ..." 
                      value={report.absent_leaders_names} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-sm" 
                    />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Graduates */}
              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-800 flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                  학사양
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">참석자 수</label>
                    <input 
                      type="number" 
                      name="attended_graduates_count" 
                      placeholder="0" 
                      min="0" 
                      value={report.attended_graduates_count} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">참석자 이름</label>
                    <input 
                      type="text" 
                      name="attended_graduates_names" 
                      placeholder="홍길동, 김철수, ..." 
                      value={report.attended_graduates_names} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-sm" 
                    />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Students */}
              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-800 flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  재학생양
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">참석자 수</label>
                    <input 
                      type="number" 
                      name="attended_students_count" 
                      placeholder="0" 
                      min="0" 
                      value={report.attended_students_count} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">참석자 이름</label>
                    <input 
                      type="text" 
                      name="attended_students_names" 
                      placeholder="홍길동, 김철수, ..." 
                      value={report.attended_students_names} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-sm" 
                    />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Freshmen */}
              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-800 flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                  신입생양
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">참석자 수</label>
                    <input 
                      type="number" 
                      name="attended_freshmen_count" 
                      placeholder="0" 
                      min="0" 
                      value={report.attended_freshmen_count} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">참석자 이름</label>
                    <input 
                      type="text" 
                      name="attended_freshmen_names" 
                      placeholder="홍길동, 김철수, ..." 
                      value={report.attended_freshmen_names} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-sm" 
                    />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* One-to-one */}
              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-800 flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  1대1
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">1대1 수</label>
                    <input 
                      type="number" 
                      name="one_to_one_count" 
                      placeholder="0" 
                      min="0" 
                      value={report.one_to_one_count} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-sm" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-end">
            <button 
              type="button" 
              onClick={() => navigate('/')} 
              className="order-2 sm:order-1 px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              취소
            </button>
            <button 
              type="submit" 
              className="order-1 sm:order-2 sm:ml-3 px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              저장하기
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default ReportPage;