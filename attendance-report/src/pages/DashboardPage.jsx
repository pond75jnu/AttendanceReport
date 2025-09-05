import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import YohoeModal from '../components/YohoeModal';
import WeeklyReportView from '../components/WeeklyReportView';
import DashboardChart from '../components/DashboardChart'; // Import the chart component

const DashboardPage = () => {
  const [yohoes, setYohoes] = useState([]);
  const [reports, setReports] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYohoe, setEditingYohoe] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 9;
  const navigate = useNavigate();

  useEffect(() => {
    fetchYohoes();
    fetchReports();
  }, [refreshKey]);
  
  useEffect(() => {
    const handleFocus = () => {
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchYohoes = async () => {
    const { data, error } = await supabase.from('yohoe').select('*').order('order_num', { ascending: true, nullsFirst: false }).order('created_at');
    if (error) console.error('Error fetching yohoes:', error);
    else setYohoes(data);
  };

  const fetchReports = async () => {
    // Fetch last 5 weeks of reports for the chart
    const date = new Date();
    date.setDate(date.getDate() - 35);
    const { data, error } = await supabase.from('reports').select('*, yohoe(name)').gte('report_date', date.toISOString().slice(0,10)).order('report_date', { ascending: false });
    if (error) console.error('Error fetching reports:', error);
    else setReports(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleOpenAddModal = () => {
    setEditingYohoe(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (yohoe) => {
    setEditingYohoe(yohoe);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingYohoe(null);
  };

  // 요회 배열을 order_num과 created_at으로 정렬하는 함수
  const sortYohoes = (yohoesArray) => {
    return [...yohoesArray].sort((a, b) => {
      // order_num 비교 (null/undefined는 맨 뒤로)
      if (a.order_num == null && b.order_num == null) {
        // 둘 다 null이면 created_at으로 비교
        return new Date(a.created_at) - new Date(b.created_at);
      }
      if (a.order_num == null) return 1; // a가 null이면 뒤로
      if (b.order_num == null) return -1; // b가 null이면 뒤로
      
      // 둘 다 값이 있으면 order_num으로 비교
      if (a.order_num !== b.order_num) {
        return a.order_num - b.order_num;
      }
      
      // order_num이 같으면 created_at으로 비교
      return new Date(a.created_at) - new Date(b.created_at);
    });
  };

  const handleYohoeAdded = (newYohoe) => {
    // 새 요회를 추가한 후 정렬
    const updatedYohoes = [...yohoes, newYohoe];
    setYohoes(sortYohoes(updatedYohoes));
  };

  const handleYohoeUpdated = (updatedYohoe) => {
    // 업데이트된 요회로 배열을 갱신한 후 정렬
    const updatedYohoes = yohoes.map(yohoe => yohoe.id === updatedYohoe.id ? updatedYohoe : yohoe);
    setYohoes(sortYohoes(updatedYohoes));
  };

  const handleDeleteYohoe = async (yohoeId) => {
    if (window.confirm('정말로 이 요회를 삭제하시겠습니까? 보고서 데이터도 함께 삭제됩니다.')) {
      const { error } = await supabase.from('yohoe').delete().match({ id: yohoeId });
      if (error) {
        console.error('Error deleting yohoe:', error);
        alert('요회 삭제 중 오류가 발생했습니다.');
      } else {
        setYohoes(yohoes.filter((yohoe) => yohoe.id !== yohoeId));
        fetchReports();
      }
    }
  };

  // 페이징 계산
  const totalPages = Math.ceil(reports.length / reportsPerPage);
  const startIndex = (currentPage - 1) * reportsPerPage;
  const endIndex = startIndex + reportsPerPage;
  const currentReports = reports.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center space-x-2 mt-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          이전
        </button>
        
        {[...Array(totalPages)].map((_, index) => {
          const page = index + 1;
          return (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                currentPage === page
                  ? 'text-blue-600 bg-blue-50 border border-blue-300'
                  : 'text-slate-500 bg-white border border-slate-300 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          );
        })}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header - Mobile Optimized */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-800 truncate">📊 대시보드</h1>
              <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">교회 주간 보고서 관리 시스템</p>
            </div>
            <div className="flex items-center gap-2">
              <Link 
                to="/profile" 
                className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                title="비밀번호 변경"
              >
                <span className="hidden sm:inline">비밀번호 변경</span>
                <span className="sm:hidden">⚙️</span>
              </Link>
              <button 
                onClick={handleLogout} 
                className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                title="로그아웃"
              >
                <span className="hidden sm:inline">로그아웃</span>
                <span className="sm:hidden">🚪</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 space-y-4 sm:space-y-6">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-3 sm:p-4 rounded-xl text-white shadow-lg">
            <div className="text-xs sm:text-sm opacity-90">전체 요회</div>
            <div className="text-lg sm:text-2xl font-bold">{yohoes.length}개</div>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 sm:p-4 rounded-xl text-white shadow-lg">
            <div className="text-xs sm:text-sm opacity-90">이번 주 보고서</div>
            <div className="text-lg sm:text-2xl font-bold">{reports.length}건</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link 
            to="/report/new" 
            className="flex items-center justify-center px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg"
          >
            📝 주간 보고서 작성
          </Link>
          <button 
            onClick={handleOpenAddModal} 
            className="flex items-center justify-center px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-700 rounded-xl hover:from-violet-700 hover:to-violet-800 transition-all duration-200 shadow-lg"
          >
            ➕ 새 요회 추가
          </button>
        </div>

        {/* Weekly Report Section */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-3 sm:p-5 border-b border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
              📊 금주 참석자 현황
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">이번 주 요회별 참석자 및 비교 현황</p>
          </div>
          <div className="p-0">
            <div className="overflow-x-auto">
              <WeeklyReportView key={refreshKey} date={new Date()} />
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-3 sm:p-5 border-b border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
              📈 참석자 추이
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">최근 5주간 전체 참석자 현황 그래프</p>
          </div>
          <div className="p-3 sm:p-5">
            <div className="bg-slate-50 rounded-xl p-3 sm:p-4">
              <DashboardChart reports={reports} />
            </div>
          </div>
        </div>

        {/* Reports List Section - Mobile Optimized */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-3 sm:p-5 border-b border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
              📋 전체 보고서 목록
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">작성된 모든 주간 보고서 목록</p>
          </div>
          
          {/* Mobile Card Layout */}
          <div className="sm:hidden">
            {currentReports.length > 0 ? (
              <div>
                <div className="divide-y divide-slate-100">
                  {currentReports.map((report) => (
                    <div key={report.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 text-sm">{report.report_date}</div>
                          <div className="text-xs text-slate-600 mt-1">{report.yohoe?.name || 'N/A'}</div>
                        </div>
                        <Link 
                          to={`/report/${report.id}`} 
                          className="ml-3 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          보기
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                {renderPagination()}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="text-slate-400 mb-2">📄</div>
                <div className="text-sm text-slate-600">아직 작성된 보고서가 없습니다</div>
              </div>
            )}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden sm:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">주일날짜</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">요회명</th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {currentReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{report.report_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{report.yohoe?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          to={`/report/${report.id}`} 
                          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          상세보기
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination()}
          </div>
        </div>

        {/* Yohoe Management Section - Mobile Optimized */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-3 sm:p-5 border-b border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
              🏛️ 요회 관리
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">요회 정보 추가, 수정, 삭제</p>
          </div>
          
          {/* Mobile Card Layout */}
          <div className="sm:hidden">
            {yohoes.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {yohoes.map((yohoe) => (
                  <div key={yohoe.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {yohoe.order_num && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {yohoe.order_num}
                            </span>
                          )}
                          <div className="font-semibold text-slate-900 text-sm truncate">{yohoe.name}</div>
                        </div>
                        <div className="text-xs text-slate-600 mb-1">목자: {yohoe.shepherd}</div>
                        <div className="text-xs text-slate-500">리더 {yohoe.leader_count}명</div>
                      </div>
                      <div className="ml-3 flex flex-col gap-2 flex-shrink-0">
                        <button 
                          onClick={() => handleOpenEditModal(yohoe)} 
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          수정
                        </button>
                        <button 
                          onClick={() => handleDeleteYohoe(yohoe.id)} 
                          className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="text-slate-400 mb-2">🏛️</div>
                <div className="text-sm text-slate-600 mb-4">아직 등록된 요회가 없습니다</div>
                <button 
                  onClick={handleOpenAddModal} 
                  className="px-4 py-2 text-sm font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
                >
                  첫 번째 요회 추가하기
                </button>
              </div>
            )}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden sm:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">순서</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">요회명</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">요회목자</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">리더 수</th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {yohoes.map((yohoe) => (
                    <tr key={yohoe.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {yohoe.order_num ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {yohoe.order_num}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{yohoe.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{yohoe.shepherd}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{yohoe.leader_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            onClick={() => handleOpenEditModal(yohoe)} 
                            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                          >
                            수정
                          </button>
                          <button 
                            onClick={() => handleDeleteYohoe(yohoe.id)} 
                            className="text-red-600 hover:text-red-800 font-medium transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <YohoeModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onYohoeAdded={handleYohoeAdded}
        onYohoeUpdated={handleYohoeUpdated}
        yohoeToEdit={editingYohoe}
      />
    </div>
  );
};

export default DashboardPage;
