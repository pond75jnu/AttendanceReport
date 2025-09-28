import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import YohoeModal from '../components/YohoeModal';
import ReportDetailModal from '../components/ReportDetailModal';
import WeeklyReportView from '../components/WeeklyReportView';
import DashboardChart from '../components/DashboardChart'; // Import the chart component
import PDFPrintView from '../components/PDFPrintView';
import Exact13x53Grid from '../components/Exact13x53Grid';

const DashboardPage = () => {
  const [yohoes, setYohoes] = useState([]);
  const [reports, setReports] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYohoe, setEditingYohoe] = useState(null);
  const [isReportDetailModalOpen, setIsReportDetailModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPDFPrint, setShowPDFPrint] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [showSamplePDFExport, setShowSamplePDFExport] = useState(false);
  const [samplePDFData, setSamplePDFData] = useState(null);
  const [selectedWeekDate, setSelectedWeekDate] = useState(new Date());
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [isYohoeExpanded, setIsYohoeExpanded] = useState(false);
  const [isReportsExpanded, setIsReportsExpanded] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const reportsPerPage = 9;
  const navigate = useNavigate();
  const reportRef = useRef(null);
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

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollToTop(scrollTop > 300); // 300px 이상 스크롤되면 버튼 표시
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    const { data, error } = await supabase
      .from('reports')
      .select('*, yohoe(name, order_num)')
      .gte('report_date', date.toISOString().slice(0,10));
    
    if (error) {
      console.error('Error fetching reports:', error);
    } else {
      // 클라이언트 측에서 정렬: report_date DESC, yohoe.order_num ASC
      const sortedReports = data.sort((a, b) => {
        // 1. report_date를 먼저 비교 (DESC - 최신순)
        const dateComparison = new Date(b.report_date) - new Date(a.report_date);
        if (dateComparison !== 0) {
          return dateComparison;
        }
        
        // 2. 같은 날짜면 yohoe.order_num으로 비교 (ASC)
        const aOrderNum = a.yohoe?.order_num;
        const bOrderNum = b.yohoe?.order_num;
        
        // order_num이 null인 경우 뒤로 보내기
        if (aOrderNum == null && bOrderNum == null) return 0;
        if (aOrderNum == null) return 1;
        if (bOrderNum == null) return -1;
        
        return aOrderNum - bOrderNum;
      });
      
      setReports(sortedReports);
    }
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

  const handleOpenReportDetail = (reportId) => {
    setSelectedReportId(reportId);
    setIsReportDetailModalOpen(true);
  };

  const handleCloseReportDetail = () => {
    setIsReportDetailModalOpen(false);
    setSelectedReportId(null);
  };

  const handleResetToCurrentWeek = () => {
    setSelectedWeekDate(new Date());
    setShowSamplePDFExport(false);
    setSamplePDFData(null);
    setShowPDFPrint(false);
    setPdfData(null);
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

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // 사용하지 않는 기존 PDF 함수 (주석 처리)
  /*
  const handlePrintPDF = async () => {
    // 현재 주간 보고서 데이터 수집
    const currentDate = new Date(selectedWeekDate);
    const sunday = new Date(currentDate);
    sunday.setDate(currentDate.getDate() - currentDate.getDay());

    // 날짜 문자열 생성 (YYYY-MM-DD 형식)
    const sundayStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;

    // 주간 말씀 주제 가져오기
    let weeklyTheme = '-';
    try {
      const { data: themeData, error } = await supabase
        .from('weekly_themes')
        .select('theme')
        .eq('week_date', sundayStr)
        .single();

      if (themeData && !error) {
        weeklyTheme = themeData.theme;
      }
    } catch (error) {
      console.log('주간 말씀 주제를 가져올 수 없습니다:', error);
    }

    const weekInfo = {
      year: sunday.getFullYear(),
      month: sunday.getMonth() + 1,
      day: sunday.getDate(),
      weekNumber: Math.ceil(sunday.getDate() / 7)
    };

    // 현재 페이지에 표시된 보고서 데이터와 요회 데이터를 PDF 컴포넌트에 전달
    const weeklyReports = filterReportsByWeek(reports, weekInfo);

    const data = {
      reports: weeklyReports,
      weekInfo,
      yohoeList: yohoes || [],
      weeklyTheme
    };

    setPdfData(data);
    setShowPDFPrint(true);
  };
  */

  const handleExportSamplePDF = async () => {
    // 현재 주간 보고서 데이터 수집
    const currentDate = new Date(selectedWeekDate);
    const sunday = new Date(currentDate);
    sunday.setDate(currentDate.getDate() - currentDate.getDay());

    // 날짜 문자열 생성 (YYYY-MM-DD 형식)
    const sundayStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;

    // 주간 말씀 주제 가져오기
    let weeklyTheme = '-';
    try {
      const { data: themeData, error } = await supabase
        .from('weekly_themes')
        .select('theme')
        .eq('week_date', sundayStr)
        .single();

      if (themeData && !error) {
        weeklyTheme = themeData.theme;
      }
    } catch (error) {
      console.log('주간 말씀 주제를 가져올 수 없습니다:', error);
    }

    const weekInfo = {
      year: sunday.getFullYear(),
      month: sunday.getMonth() + 1,
      day: sunday.getDate(),
      weekNumber: Math.ceil(sunday.getDate() / 7)
    };

    // 현재 페이지에 표시된 보고서 데이터와 요회 데이터를 엑셀 컴포넌트에 전달
    try {
      const data = {
        reports: reports || [],
        weekInfo,
        yohoeList: yohoes || [],
        weeklyTheme
      };
      setSamplePDFData(data);
      setShowSamplePDFExport(true);
    } catch (error) {
      console.error('보고서 데이터를 준비하는 중 오류가 발생했습니다:', error);
      alert('보고서를 생성하는 중 문제가 발생했습니다. 다시 시도해주세요.');
    }
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
              <h1 className="text-lg sm:text-2xl font-bold text-slate-800 truncate">
                <button
                  type="button"
                  onClick={handleResetToCurrentWeek}
                  className="inline-flex items-center gap-1 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 transition-colors"
                  title="현재 주간 보고서로 이동"
                >
                  <span aria-hidden="true">📊</span>
                  <span>UBF 광주3부 주간현황</span>
                </button>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">교회 주간 보고서 관리 시스템</p>
            </div>
            <div className="flex items-center gap-2">
              <Link 
                to="/profile" 
                className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                title="비밀번호 변경"
                style={{ display: 'none' }}
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
        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link 
            to="/report/new" 
            className="flex items-center justify-center px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg"
          >
            📝 주간 보고서 작성
          </Link>
          {/* 기존 PDF 출력 버튼 숨김 */}
          {/* <button
            onClick={handlePrintPDF}
            disabled={showPDFPrint}
            className="flex items-center justify-center px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showPDFPrint ? '📄 생성 중...' : '🖨️ PDF 출력'}
          </button> */}
          <button
            onClick={handleExportSamplePDF}
            disabled={showSamplePDFExport}
            className="flex items-center justify-center px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showSamplePDFExport ? '🖨️ 생성 중...' : '🖨️ 보고서 인쇄'}
          </button>
        </div>

        {/* Weekly Report Section */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-0">
            <div className="overflow-x-auto" ref={reportRef}>
              <WeeklyReportView
                key={refreshKey}
                date={selectedWeekDate}
                onWeekChange={setSelectedWeekDate}
              />
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-3 sm:p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                  📈 참석자 추이
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">최근 5주간 전체 참석자 현황 그래프</p>
              </div>
              <button
                onClick={() => setIsChartExpanded(!isChartExpanded)}
                className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2"
              >
                {isChartExpanded ? (
                  <>
                    <span>닫기</span>
                    <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                ) : (
                  <>
                    <span>보기</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
          {isChartExpanded && (
            <div className="p-3 sm:p-5">
              <div className="bg-slate-50 rounded-xl p-3 sm:p-4">
                <DashboardChart reports={reports} />
              </div>
            </div>
          )}
        </div>

        {/* Reports List Section - Mobile Optimized */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-3 sm:p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                  📋 요회별 입력 목록
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">요회별 주간보고서 입력 목록</p>
              </div>
              <button
                onClick={() => setIsReportsExpanded(!isReportsExpanded)}
                className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2"
              >
                {isReportsExpanded ? (
                  <>
                    <span>닫기</span>
                    <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                ) : (
                  <>
                    <span>보기</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {isReportsExpanded && (
            <>
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
                        <button 
                          onClick={() => handleOpenReportDetail(report.id)}
                          className="ml-3 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          보기
                        </button>
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
                        <button 
                          onClick={() => handleOpenReportDetail(report.id)}
                          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          상세보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination()}
          </div>
            </>
          )}
        </div>

        {/* Yohoe Management Section - Mobile Optimized */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-3 sm:p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                  🏛️ 요회 관리
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">요회 정보 추가, 수정, 삭제</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsYohoeExpanded(!isYohoeExpanded)}
                  className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2"
                >
                  {isYohoeExpanded ? (
                    <>
                      <span>닫기</span>
                      <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>보기</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
                {isYohoeExpanded && (
                  <button 
                    onClick={handleOpenAddModal} 
                    className="flex items-center justify-center px-3 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-700 rounded-lg hover:from-violet-700 hover:to-violet-800 transition-all duration-200 shadow-md"
                  >
                    <span className="hidden sm:inline">➕ 새 요회 추가</span>
                    <span className="sm:hidden">➕</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {isYohoeExpanded && (
            <>
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
            </>
          )}
        </div>
        
        {/* 모바일 전용: 맨 아래 여백 (플로팅 버튼과 겹치지 않도록) */}
        <div className="h-20 sm:hidden" aria-hidden="true"></div>
      </main>

      <YohoeModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onYohoeAdded={handleYohoeAdded}
        onYohoeUpdated={handleYohoeUpdated}
        yohoeToEdit={editingYohoe}
      />

      <ReportDetailModal 
        isOpen={isReportDetailModalOpen}
        onClose={handleCloseReportDetail}
        reportId={selectedReportId}
        onReportUpdated={() => fetchReports()}
      />

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          aria-label="맨 위로 이동"
        >
          <svg 
            className="w-6 h-6 transform group-hover:scale-110 transition-transform duration-200" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        </button>
      )}

      {/* PDF Print View */}
      {showPDFPrint && (
        <PDFPrintView
          data={pdfData}
          onClose={() => {
            setShowPDFPrint(false);
            setPdfData(null);
          }}
          onPrint={() => {
            setShowPDFPrint(false);
            setPdfData(null);
          }}
        />
      )}

      {/* Sample PDF Export */}
      {showSamplePDFExport && (
        <Exact13x53Grid
          data={samplePDFData}
          onClose={() => {
            setShowSamplePDFExport(false);
            setSamplePDFData(null);
          }}
          onExport={() => {
            setShowSamplePDFExport(false);
            setSamplePDFData(null);
          }}
        />
      )}
    </div>
  );
};

export default DashboardPage;
