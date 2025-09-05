import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// --- Helper Functions ---
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

const getWeekRange = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  // For Sunday-based weeks: Sunday (0) to Saturday (6)
  const startOfWeek = new Date(d);
  startOfWeek.setDate(d.getDate() - day); // Go back to Sunday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
  return {
    start: startOfWeek.toISOString().slice(0, 10),
    end: endOfWeek.toISOString().slice(0, 10),
    sunday: startOfWeek.toISOString().slice(0, 10)
  };
};

const getAttendeeSum = (report, yohoeInfo) => {
    if (!report || !yohoeInfo) return 0;
    // 총 수 = 기본 리더 수 + 학사양 수 + 재학생양 수 + 신입생 수 - 불참리더 수
    return (yohoeInfo.leader_count || 0) + (report.attended_graduates_count || 0) + (report.attended_students_count || 0) + (report.attended_freshmen_count || 0) - (report.absent_leaders_count || 0);
};

const getYangSum = (report) => {
    if (!report) return 0;
    // 양 수 = 학사양 수 + 재학생양 수 + 신입생 수
    return (report.attended_graduates_count || 0) + (report.attended_students_count || 0) + (report.attended_freshmen_count || 0);
}

// --- Sub-components ---
// Mobile Card Component
const MobileCard = ({ item }) => {
    const { yohoeInfo, currentWeekReport, previousWeekReport } = item;
    
    return (
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-slate-800">{yohoeInfo.name}</h3>
                <div className="text-right text-sm text-slate-600">
                    <div>목자: {yohoeInfo.shepherd}</div>
                    <div>리더 {yohoeInfo.leader_count}명</div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-slate-700 border-b border-slate-200 pb-1">금주</h4>
                    <div className="text-sm space-y-1">
                        <div className="flex justify-between"><span>총계:</span> <span className="font-medium">{getAttendeeSum(currentWeekReport, yohoeInfo)}</span></div>
                        <div className="flex justify-between"><span>1대1:</span> <span className="font-medium">{currentWeekReport?.one_to_one_count || 0}</span></div>
                        <div className="flex justify-between"><span>참석리더:</span> <span className="font-medium">{currentWeekReport?.attended_leaders_count || 0}</span></div>
                        <div className="flex justify-between"><span>불참리더:</span> <span className="font-medium text-red-600">{currentWeekReport?.absent_leaders_count || 0}</span></div>
                        <div className="flex justify-between"><span>양:</span> <span className="font-medium">{getYangSum(currentWeekReport)}</span></div>
                        <div className="flex justify-between text-xs"><span>신입생:</span> <span className="font-medium">{currentWeekReport?.attended_freshmen_count || 0}</span></div>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-slate-700 border-b border-slate-200 pb-1">지난주</h4>
                    <div className="text-sm space-y-1">
                        <div className="flex justify-between"><span>총계:</span> <span className="font-medium">{getAttendeeSum(previousWeekReport, yohoeInfo)}</span></div>
                        <div className="flex justify-between"><span>1대1:</span> <span className="font-medium">{previousWeekReport?.one_to_one_count || 0}</span></div>
                        <div className="flex justify-between"><span>참석리더:</span> <span className="font-medium">{previousWeekReport?.attended_leaders_count || 0}</span></div>
                        <div className="flex justify-between"><span>불참리더:</span> <span className="font-medium text-red-600">{previousWeekReport?.absent_leaders_count || 0}</span></div>
                        <div className="flex justify-between"><span>양:</span> <span className="font-medium">{getYangSum(previousWeekReport)}</span></div>
                        <div className="flex justify-between text-xs"><span>신입생:</span> <span className="font-medium">{previousWeekReport?.attended_freshmen_count || 0}</span></div>
                    </div>
                </div>
            </div>
            
            <div className="border-t border-slate-200 pt-3">
                <h4 className="font-semibold text-sm text-slate-700 mb-2">명단</h4>
                <div className="space-y-1 text-sm">
                    <div><span className="font-medium text-blue-600">학사양:</span> {currentWeekReport?.attended_graduates_names || '-'}</div>
                    <div><span className="font-medium text-green-600">재학생양:</span> {currentWeekReport?.attended_students_names || '-'}</div>
                    <div><span className="font-medium text-purple-600">신입생:</span> {currentWeekReport?.attended_freshmen_names || '-'}</div>
                    <div><span className="font-medium text-red-600">불참리더:</span> <span className="text-red-600">{currentWeekReport?.absent_leaders_names || '-'}</span></div>
                </div>
            </div>
        </div>
    );
};

const ReportRow = ({ item }) => {
    const { yohoeInfo, currentWeekReport, previousWeekReport } = item;
    
    return (
        <tr className="border-b border-black text-center">
            <td className="border-r border-black p-2 align-top" style={{width: 'calc(15% - 5%)'}}>
                <div className="font-bold text-lg">{yohoeInfo.name}</div>
                <div className="text-sm">({yohoeInfo.shepherd})</div>
                <div className="text-sm">리더{yohoeInfo.leader_count}명</div>
            </td>
            <td className="border-r border-black align-top" style={{width: 'calc(30% + 20px - 5%)'}}>
                <table className="w-full h-full">
                    <tbody>
                        <tr className="border-b border-black">
                            <td className="p-1 border-r border-black" style={{width: '16.67%'}}>금주</td>
                            <td className="p-1 border-r border-black" style={{width: '16.67%'}}>{getAttendeeSum(currentWeekReport, yohoeInfo)}</td>
                            <td className="p-1 border-r border-black" style={{width: '16.67%'}}>{currentWeekReport?.one_to_one_count || 0}</td>
                            <td className="p-1 border-r border-black" style={{width: '16.67%'}}>{currentWeekReport?.attended_leaders_count || 0}</td>
                            <td className="p-1 border-r border-black text-red-600" style={{width: '16.67%'}}>{currentWeekReport?.absent_leaders_count || 0}</td>
                            <td className="p-1 text-xs" style={{width: '16.67%'}}>{getYangSum(currentWeekReport)} (신입생 {currentWeekReport?.attended_freshmen_count || 0})</td>
                        </tr>
                        <tr>
                            <td className="p-1 border-r border-black">지난주</td>
                            <td className="p-1 border-r border-black">{getAttendeeSum(previousWeekReport, yohoeInfo)}</td>
                            <td className="p-1 border-r border-black">{previousWeekReport?.one_to_one_count || 0}</td>
                            <td className="p-1 border-r border-black">{previousWeekReport?.attended_leaders_count || 0}</td>
                            <td className="p-1 border-r border-black text-red-600">{previousWeekReport?.absent_leaders_count || 0}</td>
                            <td className="p-1 text-xs">{getYangSum(previousWeekReport)} (신입생 {previousWeekReport?.attended_freshmen_count || 0})</td>
                        </tr>
                    </tbody>
                </table>
            </td>
            <td className="p-2 align-top text-left" style={{width: 'calc(55% - 20px + 5% + 5%)'}}>
                <div className="space-y-1 text-sm">
                    <div><span className="font-bold">학사양:</span> {currentWeekReport?.attended_graduates_names}</div>
                    <div><span className="font-bold">재학생양:</span> {currentWeekReport?.attended_students_names}</div>
                    <div><span className="font-bold">신입생:</span> {currentWeekReport?.attended_freshmen_names}</div>
                    <div><span className="font-bold text-red-600">불참리더:</span> <span className="text-red-600">{currentWeekReport?.absent_leaders_names}</span></div>
                </div>
            </td>
        </tr>
    );
};

const TotalsRow = ({ data, historicalData }) => {
    const totals = data.reduce((acc, item) => {
        if(item.currentWeekReport) {
            acc.current.total += getAttendeeSum(item.currentWeekReport, item.yohoeInfo);
            acc.current.one_to_one += item.currentWeekReport.one_to_one_count || 0;
            acc.current.attended_leaders += item.currentWeekReport.attended_leaders_count || 0;
            acc.current.absent_leaders += item.currentWeekReport.absent_leaders_count || 0;
            acc.current.yang += getYangSum(item.currentWeekReport);
            acc.current.shin += item.currentWeekReport.attended_freshmen_count || 0;
        }
        if(item.previousWeekReport) {
            acc.previous.total += getAttendeeSum(item.previousWeekReport, item.yohoeInfo);
            acc.previous.one_to_one += item.previousWeekReport.one_to_one_count || 0;
            acc.previous.attended_leaders += item.previousWeekReport.attended_leaders_count || 0;
            acc.previous.absent_leaders += item.previousWeekReport.absent_leaders_count || 0;
            acc.previous.yang += getYangSum(item.previousWeekReport);
            acc.previous.shin += item.previousWeekReport.attended_freshmen_count || 0;
        }
        return acc;
    }, { 
        current: { total: 0, one_to_one: 0, attended_leaders: 0, absent_leaders: 0, yang: 0, shin: 0 },
        previous: { total: 0, one_to_one: 0, attended_leaders: 0, absent_leaders: 0, yang: 0, shin: 0 },
    });

    return (
        <tr className="border-b-2 border-black text-center font-bold">
            <td className="border-r border-black p-2 align-top" style={{width: 'calc(15% - 5%)'}}>총</td>
            <td className="border-r border-black align-top" style={{width: 'calc(30% + 20px - 5%)'}}>
                <table className="w-full h-full">
                    <tbody>
                        <tr className="border-b border-black">
                            <td className="p-1 border-r border-black" style={{width: '16.67%'}}>금주</td>
                            <td className="p-1 border-r border-black" style={{width: '16.67%'}}>{totals.current.total}</td>
                            <td className="p-1 border-r border-black" style={{width: '16.67%'}}>{totals.current.one_to_one}</td>
                            <td className="p-1 border-r border-black" style={{width: '16.67%'}}>{totals.current.attended_leaders}</td>
                            <td className="p-1 border-r border-black text-red-600" style={{width: '16.67%'}}>{totals.current.absent_leaders}</td>
                            <td className="p-1 text-xs" style={{width: '16.67%'}}>{totals.current.yang} (신입생 {totals.current.shin})</td>
                        </tr>
                        <tr>
                            <td className="p-1 border-r border-black">지난주</td>
                            <td className="p-1 border-r border-black">{totals.previous.total}</td>
                            <td className="p-1 border-r border-black">{totals.previous.one_to_one}</td>
                            <td className="p-1 border-r border-black">{totals.previous.attended_leaders}</td>
                            <td className="p-1 border-r border-black text-red-600">{totals.previous.absent_leaders}</td>
                            <td className="p-1 text-xs">{totals.previous.yang} (신입생 {totals.previous.shin})</td>
                        </tr>
                    </tbody>
                </table>
            </td>
            <td className="p-2 align-top text-left" style={{width: 'calc(55% - 20px + 5% + 5%)'}}>
                <HistoricalSummary historicalData={historicalData} />
            </td>
        </tr>
    )
}

const HistoricalSummary = ({ historicalData }) => {
    return (
        <table className="w-full text-center text-sm">
            <tbody>
                {historicalData.map((week, index) => (
                    <tr key={index}>
                        <td className="p-1 font-bold" style={{width: '16.67%'}}>{index + 2}주전</td>
                        <td className="p-1" style={{width: '16.67%'}}>{week.total}</td>
                        <td className="p-1" style={{width: '16.67%'}}>{week.one_to_one}</td>
                        <td className="p-1" style={{width: '16.67%'}}>{week.attended_leaders}</td>
                        <td className="p-1 text-red-600" style={{width: '16.67%'}}>{week.absent_leaders}</td>
                        <td className="p-1 text-xs" style={{width: '16.67%'}}>{week.yang} (신입생 {week.shin})</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

const WeeklyReportView = ({ date }) => {
  const [processedData, setProcessedData] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [currentViewDate, setCurrentViewDate] = useState(date);

  useEffect(() => {
    const fetchAndProcessData = async () => {
        setLoading(true);
        
        const weeks = [...Array(4)].map((_, i) => {
            const d = new Date(currentViewDate);
            d.setDate(currentViewDate.getDate() - (i * 7));
            return getWeekRange(d);
        });

        const { data: yohoes, error: yohoesError } = await supabase.from('yohoe').select('*').order('order_num', { ascending: true, nullsFirst: false }).order('created_at');
        if (yohoesError) { console.error(yohoesError); setLoading(false); return; }

        const { data: reports, error: reportsError } = await supabase.from('reports').select('*').gte('report_date', weeks[3].start).lte('report_date', weeks[0].end);
        if (reportsError) { console.error(reportsError); setLoading(false); return; }

        const processed = yohoes.map(yohoe => {
            // Get the latest report for current week
            const currentWeekReports = reports.filter(r => r.yohoe_id === yohoe.id && r.report_date >= weeks[0].start && r.report_date <= weeks[0].end);
            const currentWeekReport = currentWeekReports.length > 0 
                ? currentWeekReports.sort((a, b) => new Date(b.report_date) - new Date(a.report_date))[0] 
                : null;
            
            // Get the latest report for previous week
            const previousWeekReports = reports.filter(r => r.yohoe_id === yohoe.id && r.report_date >= weeks[1].start && r.report_date <= weeks[1].end);
            const previousWeekReport = previousWeekReports.length > 0 
                ? previousWeekReports.sort((a, b) => new Date(b.report_date) - new Date(a.report_date))[0] 
                : null;
            
            return {
                yohoeInfo: yohoe,
                currentWeekReport,
                previousWeekReport,
            };
        });

        const historical = weeks.slice(2).map(week => {
            const weekReports = reports.filter(r => r.report_date >= week.start && r.report_date <= week.end);
            return weekReports.reduce((acc, report) => {
                const yohoeInfo = yohoes.find(y => y.id === report.yohoe_id);
                acc.total += getAttendeeSum(report, yohoeInfo);
                acc.one_to_one += report.one_to_one_count || 0;
                acc.attended_leaders += report.attended_leaders_count || 0;
                acc.absent_leaders += report.absent_leaders_count || 0;
                acc.yang += getYangSum(report);
                acc.shin += report.attended_freshmen_count || 0;
                return acc;
            }, { total: 0, one_to_one: 0, attended_leaders: 0, absent_leaders: 0, yang: 0, shin: 0 });
        });

        setProcessedData(processed);
        setHistoricalData(historical);
        setLoading(false);
    };

    fetchAndProcessData();
  }, [currentViewDate]);

  useEffect(() => {
    // 사용 가능한 날짜들을 가져오는 함수
    const fetchAvailableDates = async () => {
      const { data: reports, error } = await supabase
        .from('reports')
        .select('report_date')
        .order('report_date', { ascending: false });
      
      if (!error && reports) {
        const dates = [...new Set(reports.map(r => r.report_date))];
        setAvailableDates(dates);
      }
    };
    
    fetchAvailableDates();
  }, []);

  // 캘린더 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCalendar && !event.target.closest('.calendar-container')) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  // 미니 캘린더 컴포넌트
  const MiniCalendar = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    const getDaysInMonth = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay()); // 주의 시작(일요일)부터

      const days = [];
      const current = new Date(startDate);
      
      for (let i = 0; i < 42; i++) { // 6주 * 7일
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      
      return { days, firstDay: firstDay.getMonth(), lastDay: lastDay.getMonth() };
    };

    const { days, firstDay } = getDaysInMonth(currentMonth);
    
    const isDateAvailable = (date) => {
      // 로컬 시간대로 날짜 문자열 생성 (YYYY-MM-DD)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const isSunday = date.getDay() === 0; // 0 = Sunday
      return isSunday && availableDates.includes(dateStr);
    };

    const handleDateClick = (date) => {
      setCurrentViewDate(date);
      setShowCalendar(false);
    };

    return (
      <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50 w-80">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="p-1 hover:bg-slate-100 rounded"
          >
            ◀
          </button>
          <h3 className="font-semibold">
            {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
          </h3>
          <button 
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="p-1 hover:bg-slate-100 rounded"
          >
            ▶
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-slate-500 p-1">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === firstDay;
            const isAvailable = isDateAvailable(day);
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = day.toDateString() === currentViewDate.toDateString();
            
            // 스타일링 로직 개선
            let buttonClasses = 'p-2 text-xs rounded transition-all cursor-pointer ';
            
            // 선택된 날짜가 최우선
            if (isSelected) {
              if (isAvailable) {
                // 선택된 날짜 + 보고서 있음: 더 진한 파란색
                buttonClasses += 'bg-blue-700 text-white ring-2 ring-blue-300 font-semibold ';
              } else {
                // 선택된 날짜 + 보고서 없음: 흰색 배경 + 파란 테두리
                buttonClasses += 'bg-white text-slate-700 ring-2 ring-blue-500 font-semibold ';
              }
            }
            // 현재 날짜 (선택되지 않은 경우)
            else if (isToday) {
              if (isAvailable) {
                // 현재 날짜 + 보고서 있음: 파란색 배경
                buttonClasses += 'bg-blue-500 text-white font-semibold hover:bg-blue-600 shadow-md ';
              } else {
                // 현재 날짜 + 보고서 없음: 흰색 배경 + 파란 테두리
                buttonClasses += 'bg-white text-slate-700 ring-2 ring-blue-500 hover:bg-slate-50 ';
              }
            }
            // 일반 날짜
            else {
              if (isAvailable) {
                // 보고서가 있는 날짜: 파란색 배경
                buttonClasses += 'bg-blue-500 text-white font-semibold hover:bg-blue-600 shadow-md ';
              } else {
                // 일반 날짜: 기본 스타일
                if (!isCurrentMonth) {
                  buttonClasses += 'text-slate-300 hover:bg-slate-100 ';
                } else {
                  buttonClasses += 'text-slate-700 hover:bg-slate-100 ';
                }
              }
            }
            
            return (
              <button
                key={index}
                onClick={() => handleDateClick(day)}
                className={buttonClasses.trim()}
                disabled={false}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
        
        <div className="mt-3 text-xs text-slate-500 border-t pt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>보고서 있음</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center p-4">Loading report...</div>;
  }

  // Mobile Summary Component
  const MobileSummary = () => {
    const totals = processedData.reduce((acc, item) => {
      if(item.currentWeekReport) {
        acc.current.total += getAttendeeSum(item.currentWeekReport, item.yohoeInfo);
        acc.current.one_to_one += item.currentWeekReport.one_to_one_count || 0;
        acc.current.attended_leaders += item.currentWeekReport.attended_leaders_count || 0;
        acc.current.absent_leaders += item.currentWeekReport.absent_leaders_count || 0;
        acc.current.yang += getYangSum(item.currentWeekReport);
        acc.current.shin += item.currentWeekReport.attended_freshmen_count || 0;
      }
      if(item.previousWeekReport) {
        acc.previous.total += getAttendeeSum(item.previousWeekReport, item.yohoeInfo);
        acc.previous.one_to_one += item.previousWeekReport.one_to_one_count || 0;
        acc.previous.attended_leaders += item.previousWeekReport.attended_leaders_count || 0;
        acc.previous.absent_leaders += item.previousWeekReport.absent_leaders_count || 0;
        acc.previous.yang += getYangSum(item.previousWeekReport);
        acc.previous.shin += item.previousWeekReport.attended_freshmen_count || 0;
      }
      return acc;
    }, { 
      current: { total: 0, one_to_one: 0, attended_leaders: 0, absent_leaders: 0, yang: 0, shin: 0 },
      previous: { total: 0, one_to_one: 0, attended_leaders: 0, absent_leaders: 0, yang: 0, shin: 0 },
    });

    return (
      <div className="sm:hidden bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 mb-4 text-white shadow-lg">
        <h3 className="font-bold text-lg mb-3 text-center">📊 주간 총계</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm border-b border-blue-300 pb-1 text-blue-100">금주</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span>총계:</span> <span className="font-bold">{totals.current.total}</span></div>
              <div className="flex justify-between"><span>1대1:</span> <span className="font-bold">{totals.current.one_to_one}</span></div>
              <div className="flex justify-between"><span>참석리더:</span> <span className="font-bold">{totals.current.attended_leaders}</span></div>
              <div className="flex justify-between"><span>불참리더:</span> <span className="font-bold text-red-200">{totals.current.absent_leaders}</span></div>
              <div className="flex justify-between"><span>양:</span> <span className="font-bold">{totals.current.yang}</span></div>
              <div className="flex justify-between text-xs"><span>신입생:</span> <span className="font-bold">{totals.current.shin}</span></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-sm border-b border-blue-300 pb-1 text-blue-100">지난주</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span>총계:</span> <span className="font-bold">{totals.previous.total}</span></div>
              <div className="flex justify-between"><span>1대1:</span> <span className="font-bold">{totals.previous.one_to_one}</span></div>
              <div className="flex justify-between"><span>참석리더:</span> <span className="font-bold">{totals.previous.attended_leaders}</span></div>
              <div className="flex justify-between"><span>불참리더:</span> <span className="font-bold text-red-200">{totals.previous.absent_leaders}</span></div>
              <div className="flex justify-between"><span>양:</span> <span className="font-bold">{totals.previous.yang}</span></div>
              <div className="flex justify-between text-xs"><span>신입생:</span> <span className="font-bold">{totals.previous.shin}</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6 p-3 sm:p-4">
        <h1 className="text-xl sm:text-3xl font-bold text-slate-800 mb-2">📋 주간 역사 보고서</h1>
        <p className="text-sm sm:text-lg text-slate-600 mb-3">"피로 세우는 언약"</p>
        <div className="flex justify-between items-center text-xs sm:text-sm text-slate-500 px-2 sm:px-4 relative">
          <span>{(() => {
            const sunday = new Date(getSundayOfWeek(currentViewDate));
            return `${sunday.getFullYear()}년 ${sunday.getMonth() + 1}월 ${sunday.getDate()}일(주일)`;
          })()}</span>
          <div className="relative calendar-container">
            <button 
              onClick={() => setShowCalendar(!showCalendar)}
              className="px-3 py-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium print:hidden"
            >
              📅 과거 기록보기
            </button>
            {showCalendar && <MiniCalendar />}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="sm:hidden px-3">
        <MobileSummary />
        <div className="space-y-0">
          {processedData.map(item => (
            <MobileCard key={item.yohoeInfo.id} item={item} />
          ))}
        </div>
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block p-4 font-serif border-2 border-black">
        <table className="w-full border-collapse border-2 border-black">
          <thead>
            <tr className="border-2 border-black bg-gray-100 text-center font-bold">
              <th className="border-r border-black p-2" style={{width: 'calc(15% - 5%)'}}>요회</th>
              <th className="border-r border-black p-2" style={{width: 'calc(30% + 20px - 5%)'}}>
                <div>예배 참석자 수</div>
                <div className="grid grid-cols-6 text-xs font-normal" style={{minHeight: '28px'}}>
                  <div className="border-r border-t-2 border-black h-full flex items-center justify-center"></div>
                  <div className="border-r border-t-2 border-black flex items-center justify-center">총</div>
                  <div className="border-r border-t-2 border-black flex items-center justify-center">1대1</div>
                  <div className="border-r border-t-2 border-black flex items-center justify-center">참석리더</div>
                  <div className="border-r border-t-2 border-black text-red-600 flex items-center justify-center">불참리더</div>
                  <div className="border-t-2 border-black flex items-center justify-center">양</div>
                </div>
              </th>
              <th className="p-2" style={{width: 'calc(55% - 20px + 5% + 5%)'}}>명단</th>
            </tr>
          </thead>
          <tbody>
            {processedData.map(item => (
              <ReportRow key={item.yohoeInfo.id} item={item} />
            ))}
            <TotalsRow data={processedData} historicalData={historicalData} />
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeeklyReportView;
