import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const ReportDetailPage = () => {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const fetchReport = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*, yohoe(name)')
        .eq('id', reportId)
        .single();

      if (error) {
        console.error('Error fetching report:', error);
        setLoading(false);
      } else {
        setReport(data);
        setEditData({
          attended_leaders_count: data.attended_leaders_count || 0,
          attended_leaders_names: data.attended_leaders_names || '',
          absent_leaders_count: data.absent_leaders_count || 0,
          absent_leaders_names: data.absent_leaders_names || '',
          attended_graduates_count: data.attended_graduates_count || 0,
          attended_graduates_names: data.attended_graduates_names || '',
          attended_students_count: data.attended_students_count || 0,
          attended_students_names: data.attended_students_names || '',
          attended_freshmen_count: data.attended_freshmen_count || 0,
          attended_freshmen_names: data.attended_freshmen_names || '',
          attended_others_count: data.attended_others_count || 0,
          attended_others_names: data.attended_others_names || '',
          one_to_one_count: data.one_to_one_count || 0
        });
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  const handlePrint = () => {
    window.print();
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field, value) => {
    // Prevent page scroll on state update
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    setEditData(prev => ({
      ...prev,
      [field]: field.includes('count') ? (value === '' ? '' : parseInt(value) || 0) : value
    }));
    
    // Restore scroll position after state update
    setTimeout(() => {
      window.scrollTo(0, currentScrollTop);
    }, 0);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('reports')
        .update(editData)
        .eq('id', reportId);

      if (error) {
        console.error('Error updating report:', error);
        alert('보고서 수정 중 오류가 발생했습니다.');
      } else {
        setReport({ ...report, ...editData });
        setIsEditing(false);
        alert('보고서가 성공적으로 수정되었습니다.');
      }
    } catch (error) {
      console.error('Error saving report:', error);
      alert('보고서 저장 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!report) {
    return <div>보고서를 찾을 수 없습니다.</div>;
  }

  const DetailItem = React.memo(({ label, value, field, countField, nameField }) => (
    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
      <dt className="text-sm font-medium text-gray-900">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
        {isEditing ? (
          field === 'one_to_one' ? (
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={editData.one_to_one_count || ''}
              onChange={(e) => handleInputChange('one_to_one_count', e.target.value)}
              onFocus={(e) => e.target.select()}
              className="block w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              min="0"
              placeholder="0"
            />
          ) : field ? (
            <div className="space-y-3">
              {countField && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">참석자 수</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editData[countField] || ''}
                    onChange={(e) => handleInputChange(countField, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="block w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    min="0"
                    placeholder="0"
                  />
                </div>
              )}
              {nameField && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">이름</label>
                  <textarea
                    value={editData[nameField]}
                    onChange={(e) => handleInputChange(nameField, e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="이름을 입력하세요 (여러명인 경우 쉼표로 구분)"
                    rows="2"
                  />
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-900">{value || '-'}</span>
          )
        ) : (
          <span className="text-gray-900">{value || '-'}</span>
        )}
      </dd>
    </div>
  ));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow print:shadow-none">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">보고서 상세 정보</h1>
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {report.report_date}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {report.yohoe.name} 요회
              </span>
            </div>
          </div>
          <div className="print:hidden flex flex-col sm:flex-row gap-2">
            <Link to="/" className="inline-flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
              ← 대시보드로 돌아가기
            </Link>
            {isEditing ? (
              <>
                <button onClick={handleSave} className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                  ✓ 저장
                </button>
                <button onClick={handleEditToggle} className="inline-flex items-center justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                  ✕ 취소
                </button>
              </>
            ) : (
              <>
                <button onClick={handleEditToggle} className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                  ✏️ 수정
                </button>
                <button onClick={handlePrint} className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                  🖨️ 출력
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">참석 현황</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">주간보고서 세부 정보입니다.</p>
          </div>
          <div className="border-t border-gray-200">
            <dl className="divide-y divide-gray-200">
              <DetailItem 
                label="리더 참석" 
                value={`${report.attended_leaders_count || 0}명 - ${report.attended_leaders_names || ''}`} 
                field="leaders"
                countField="attended_leaders_count"
                nameField="attended_leaders_names"
              />
              <DetailItem 
                label="리더 불참" 
                value={`${report.absent_leaders_count || 0}명 - ${report.absent_leaders_names || ''}`} 
                field="absent_leaders"
                countField="absent_leaders_count"
                nameField="absent_leaders_names"
              />
              <DetailItem 
                label="학사양 참석" 
                value={`${report.attended_graduates_count || 0}명 - ${report.attended_graduates_names || ''}`} 
                field="graduates"
                countField="attended_graduates_count"
                nameField="attended_graduates_names"
              />
              <DetailItem 
                label="재학생양 참석" 
                value={`${report.attended_students_count || 0}명 - ${report.attended_students_names || ''}`} 
                field="students"
                countField="attended_students_count"
                nameField="attended_students_names"
              />
              <DetailItem
                label="신입생양 참석"
                value={`${report.attended_freshmen_count || 0}명 - ${report.attended_freshmen_names || ''}`}
                field="freshmen"
                countField="attended_freshmen_count"
                nameField="attended_freshmen_names"
              />
              <DetailItem
                label="기타 참석 (선교사, 외지학생 등)"
                value={`${report.attended_others_count || 0}명 - ${report.attended_others_names || ''}`}
                field="others"
                countField="attended_others_count"
                nameField="attended_others_names"
              />
              <DetailItem
                label="1대1 수"
                value={report.one_to_one_count}
                field="one_to_one"
              />
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportDetailPage;