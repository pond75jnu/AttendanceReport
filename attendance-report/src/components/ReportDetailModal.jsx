import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const ReportDetailModal = ({ isOpen, onClose, reportId, onReportUpdated }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedReport, setEditedReport] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && reportId) {
      fetchReportDetail();
    }
  }, [isOpen, reportId]);

  const fetchReportDetail = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          yohoe (
            name,
            shepherd,
            leader_count
          )
        `)
        .eq('id', reportId)
        .single();

      if (error) throw error;
      setReport(data);
      setEditedReport(data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedReport({ ...report });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedReport({ ...report });
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .update({
          attended_leaders_count: editedReport.attended_leaders_count,
          absent_leaders_count: editedReport.absent_leaders_count,
          attended_graduates_count: editedReport.attended_graduates_count,
          attended_students_count: editedReport.attended_students_count,
          attended_freshmen_count: editedReport.attended_freshmen_count,
          one_to_one_count: editedReport.one_to_one_count,
          attended_graduates_names: editedReport.attended_graduates_names,
          attended_students_names: editedReport.attended_students_names,
          attended_freshmen_names: editedReport.attended_freshmen_names,
          absent_leaders_names: editedReport.absent_leaders_names
        })
        .eq('id', reportId)
        .select(`
          *,
          yohoe (
            name,
            shepherd,
            leader_count
          )
        `)
        .single();

      if (error) throw error;
      
      setReport(data);
      setEditedReport(data);
      setIsEditing(false);
      
      if (onReportUpdated) {
        onReportUpdated(data);
      }
      
      alert('보고서가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('Error updating report:', error);
      alert('보고서 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedReport(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeleteReport = async () => {
    if (!report) return;
    
    const isConfirmed = window.confirm(
      `정말로 이 보고서를 삭제하시겠습니까?\n\n요회: ${report.yohoe?.name}\n날짜: ${report.report_date}\n\n이 작업은 되돌릴 수 없습니다.`
    );
    
    if (!isConfirmed) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
      
      alert('보고서가 성공적으로 삭제되었습니다.');
      
      if (onReportUpdated) {
        onReportUpdated();
      }
      
      onClose();
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('보고서 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">
              {isEditing ? '✏️ 보고서 수정' : '📋 보고서 상세보기'}
            </h2>
            <div className="flex items-center space-x-2">
              {!isEditing && report && (
                <>
                  <button
                    onClick={handleDeleteReport}
                    disabled={deleting}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {deleting && (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    )}
                    {deleting ? '삭제 중...' : '삭제'}
                  </button>
                  <button
                    onClick={handleEditClick}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    수정
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-slate-600">로딩 중...</span>
            </div>
          ) : report ? (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-800 mb-3">기본 정보</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">보고서 날짜:</span>
                    <span className="ml-2 font-medium">{report.report_date}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">요회명:</span>
                    <span className="ml-2 font-medium">{report.yohoe?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">요회목자:</span>
                    <span className="ml-2 font-medium">{report.yohoe?.shepherd}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">총 리더 수:</span>
                    <span className="ml-2 font-medium">{report.yohoe?.leader_count}명</span>
                  </div>
                </div>
              </div>

              {/* 참석 현황 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-800 mb-3">참석 현황</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">참석 리더 수:</span>
                    {isEditing ? (
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="0"
                        value={editedReport.attended_leaders_count || 0}
                        onChange={(e) => handleInputChange('attended_leaders_count', parseInt(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                        className="ml-2 w-16 px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <span className="ml-2 font-medium text-green-600">{report.attended_leaders_count || 0}명</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-600">불참 리더 수:</span>
                    {isEditing ? (
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="0"
                        value={editedReport.absent_leaders_count || 0}
                        onChange={(e) => handleInputChange('absent_leaders_count', parseInt(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                        className="ml-2 w-16 px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <span className="ml-2 font-medium text-red-600">{report.absent_leaders_count || 0}명</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-600">학사양 참석 수:</span>
                    {isEditing ? (
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="0"
                        value={editedReport.attended_graduates_count || 0}
                        onChange={(e) => handleInputChange('attended_graduates_count', parseInt(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                        className="ml-2 w-16 px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <span className="ml-2 font-medium">{report.attended_graduates_count || 0}명</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-600">재학생양 참석 수:</span>
                    {isEditing ? (
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="0"
                        value={editedReport.attended_students_count || 0}
                        onChange={(e) => handleInputChange('attended_students_count', parseInt(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                        className="ml-2 w-16 px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <span className="ml-2 font-medium">{report.attended_students_count || 0}명</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-600">신입생양 참석 수:</span>
                    {isEditing ? (
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="0"
                        value={editedReport.attended_freshmen_count || 0}
                        onChange={(e) => handleInputChange('attended_freshmen_count', parseInt(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                        className="ml-2 w-16 px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <span className="ml-2 font-medium">{report.attended_freshmen_count || 0}명</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-600">1대1 수:</span>
                    {isEditing ? (
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="0"
                        value={editedReport.one_to_one_count || 0}
                        onChange={(e) => handleInputChange('one_to_one_count', parseInt(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                        className="ml-2 w-16 px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <span className="ml-2 font-medium text-purple-600">{report.one_to_one_count || 0}건</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 명단 정보 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800">참석자 명단</h3>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">학사양</h4>
                  {isEditing ? (
                    <textarea
                      value={editedReport.attended_graduates_names || ''}
                      onChange={(e) => handleInputChange('attended_graduates_names', e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                      rows="2"
                      placeholder="참석자 명단을 입력하세요"
                    />
                  ) : (
                    <p className="text-sm text-slate-700">
                      {report.attended_graduates_names || '없음'}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">재학생양</h4>
                  {isEditing ? (
                    <textarea
                      value={editedReport.attended_students_names || ''}
                      onChange={(e) => handleInputChange('attended_students_names', e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                      rows="2"
                      placeholder="참석자 명단을 입력하세요"
                    />
                  ) : (
                    <p className="text-sm text-slate-700">
                      {report.attended_students_names || '없음'}
                    </p>
                  )}
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 mb-2">신입생양</h4>
                  {isEditing ? (
                    <textarea
                      value={editedReport.attended_freshmen_names || ''}
                      onChange={(e) => handleInputChange('attended_freshmen_names', e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                      rows="2"
                      placeholder="참석자 명단을 입력하세요"
                    />
                  ) : (
                    <p className="text-sm text-slate-700">
                      {report.attended_freshmen_names || '없음'}
                    </p>
                  )}
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">불참 리더</h4>
                  {isEditing ? (
                    <textarea
                      value={editedReport.absent_leaders_names || ''}
                      onChange={(e) => handleInputChange('absent_leaders_names', e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                      rows="2"
                      placeholder="불참 리더 명단을 입력하세요"
                    />
                  ) : (
                    <p className="text-sm text-slate-700">
                      {report.absent_leaders_names || '없음'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              보고서 정보를 불러올 수 없습니다.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 rounded-b-xl">
          <div className="flex justify-end space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {saving && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {saving ? '저장 중...' : '저장'}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                닫기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetailModal;