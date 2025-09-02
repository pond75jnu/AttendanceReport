import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const ReportPage = () => {
  const [yohoes, setYohoes] = useState([]);
  const [report, setReport] = useState({
    report_date: new Date().toISOString().slice(0, 10),
    yohoe_id: '',
    attended_leaders_count: '',
    attended_leaders_names: '',
    absent_leaders_count: '',
    absent_leaders_names: '',
    attended_graduates_count: '',
    attended_graduates_names: '',
    attended_students_count: '',
    attended_students_names: '',
    attended_freshmen_count: '',
    attended_freshmen_names: '',
    one_to_one_count: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchYohoes = async () => {
      const { data, error } = await supabase.from('yohoes').select('id, name');
      if (error) {
        console.error('Error fetching yohoes:', error);
      } else {
        setYohoes(data);
      }
    };
    fetchYohoes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setReport(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('reports').insert([report]);
    if (error) {
      console.error('Error creating report:', error);
      alert('보고서 저장 중 오류가 발생했습니다.');
    } else {
      alert('보고서가 성공적으로 저장되었습니다.');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">주간 보고서 작성</h1>
        </div>
      </div>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
            <div className="space-y-8 divide-y divide-gray-200 sm:space-y-5">
              <div className="pt-8 space-y-6 sm:pt-10 sm:space-y-5">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">기본 정보</h3>
                </div>
                <div className="space-y-6 sm:space-y-5">
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                    <label htmlFor="report_date" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">보고일</label>
                    <div className="mt-1 sm:mt-0 sm:col-span-2">
                      <input type="date" name="report_date" id="report_date" value={report.report_date} onChange={handleChange} className="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md" required />
                    </div>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                    <label htmlFor="yohoe_id" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">요회</label>
                    <div className="mt-1 sm:mt-0 sm:col-span-2">
                      <select id="yohoe_id" name="yohoe_id" value={report.yohoe_id} onChange={handleChange} className="max-w-lg block focus:ring-indigo-500 focus:border-indigo-500 w-full shadow-sm sm:max-w-xs sm:text-sm border-gray-300 rounded-md" required>
                        <option value="">요회를 선택하세요</option>
                        {yohoes.map(yohoe => (
                          <option key={yohoe.id} value={yohoe.id}>{yohoe.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendee Sections */}
              <div className="pt-8 space-y-6 sm:pt-10 sm:space-y-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">참석 현황</h3>
                {/* Leaders */}
                <div className="space-y-2 sm:space-y-1 border-t border-gray-200 pt-5">
                    <h4 className="text-md font-medium text-gray-800">리더</h4>
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center">
                        <input type="number" name="attended_leaders_count" placeholder="참석 수" value={report.attended_leaders_count} onChange={handleChange} className="sm:col-span-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md" />
                        <input type="text" name="attended_leaders_names" placeholder="참석자 이름" value={report.attended_leaders_names} onChange={handleChange} className="sm:col-span-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md" />
                    </div>
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center">
                        <input type="number" name="absent_leaders_count" placeholder="불참 수" value={report.absent_leaders_count} onChange={handleChange} className="sm:col-span-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md" />
                        <input type="text" name="absent_leaders_names" placeholder="불참자 이름" value={report.absent_leaders_names} onChange={handleChange} className="sm:col-span-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md" />
                    </div>
                </div>
                {/* Graduates */}
                <div className="space-y-2 sm:space-y-1 border-t border-gray-200 pt-5">
                    <h4 className="text-md font-medium text-gray-800">학사양</h4>
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center">
                        <input type="number" name="attended_graduates_count" placeholder="참석 수" value={report.attended_graduates_count} onChange={handleChange} className="sm:col-span-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md" />
                        <input type="text" name="attended_graduates_names" placeholder="참석자 이름" value={report.attended_graduates_names} onChange={handleChange} className="sm:col-span-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md" />
                    </div>
                </div>
                {/* Students */}
                <div className="space-y-2 sm:space-y-1 border-t border-gray-200 pt-5">
                    <h4 className="text-md font-medium text-gray-800">재학생양</h4>
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center">
                        <input type="number" name="attended_students_count" placeholder="참석 수" value={report.attended_students_count} onChange={handleChange} className="sm:col-span-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md" />
                        <input type="text" name="attended_students_names" placeholder="참석자 이름" value={report.attended_students_names} onChange={handleChange} className="sm:col-span-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md" />
                    </div>
                </div>
                {/* Freshmen */}
                <div className="space-y-2 sm:space-y-1 border-t border-gray-200 pt-5">
                    <h4 className="text-md font-medium text-gray-800">신입생양</h4>
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center">
                        <input type="number" name="attended_freshmen_count" placeholder="참석 수" value={report.attended_freshmen_count} onChange={handleChange} className="sm:col-span-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md" />
                        <input type="text" name="attended_freshmen_names" placeholder="참석자 이름" value={report.attended_freshmen_names} onChange={handleChange} className="sm:col-span-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md" />
                    </div>
                </div>
                {/* One-to-one */}
                <div className="space-y-2 sm:space-y-1 border-t border-gray-200 pt-5">
                    <h4 className="text-md font-medium text-gray-800">1대1</h4>
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center">
                        <input type="number" name="one_to_one_count" placeholder="1대1 수" value={report.one_to_one_count} onChange={handleChange} className="sm:col-span-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md" />
                    </div>
                </div>
              </div>
            </div>

            <div className="pt-5">
              <div className="flex justify-end">
                <button type="button" onClick={() => navigate('/')} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">취소</button>
                <button type="submit" className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">저장</button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ReportPage;