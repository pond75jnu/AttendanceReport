import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import ReportDetailModal from './ReportDetailModal';
import YohoeModal from './YohoeModal';
import WeeklyThemeModal from './WeeklyThemeModal';
import {
  getWeekRangeKST,
  getSundayOfWeekKST,
  addDaysToKSTDate,
  formatDateToKSTString,
  formatKSTDateHuman,
  createDateFromKSTString,
  getKSTDateParts,
} from '../lib/dateUtils';

// --- Helper Functions ---

const getAttendeeSum = (report) => {
    if (!report) return 0;
    // 총 수 = 참석 리더 수 + 학사양 수 + 재학생양 수 + 신입생 수 + 기타 수
    return (report.attended_leaders_count || 0) + (report.attended_graduates_count || 0) + (report.attended_students_count || 0) + (report.attended_freshmen_count || 0) + (report.attended_others_count || 0);
};

const getYangSum = (report) => {
    if (!report) return 0;
    // 양 수 = 학사양 수 + 재학생양 수 + 신입생 수
    return (report.attended_graduates_count || 0) + (report.attended_students_count || 0) + (report.attended_freshmen_count || 0);
}

// --- Sub-components ---
// Mobile Card Component
const MobileCard = ({ item, onEditClick, onYohoeEditClick, currentWeekLabel, previousWeekLabel }) => {
    const { yohoeInfo, currentWeekReport, previousWeekReport } = item;

    return (
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <button
                    onClick={() => onYohoeEditClick(yohoeInfo)}
                    className="group flex items-center gap-2 font-bold text-lg text-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 px-3 py-2 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md text-left"
                    data-print-yohoe="true"
                    title="클릭하여 요회 정보 수정"
                >
                    <span>{yohoeInfo.name}</span>
                    <svg className="w-4 h-4 text-blue-600 group-hover:text-blue-700 opacity-60 group-hover:opacity-100 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-print-hide="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </button>
                <div className="text-right text-sm text-slate-600">
                    <div>목자: {yohoeInfo.shepherd}</div>
                    <div>리더 {yohoeInfo.leader_count}명</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-slate-700 border-b border-slate-200 pb-1">{currentWeekLabel}</h4>
                    <div className="text-sm space-y-1">
                        <div className="flex justify-between"><span>총계:</span> <span className="font-medium">{getAttendeeSum(currentWeekReport)}</span></div>
                        <div className="flex justify-between"><span>1대1:</span> <span className="font-medium">{currentWeekReport?.one_to_one_count || 0}</span></div>
                        <div className="flex justify-between"><span>참석리더:</span> <span className="font-medium">{currentWeekReport?.attended_leaders_count || 0}</span></div>
                        <div className="flex justify-between"><span>불참리더:</span> <span className="font-medium text-red-600">{currentWeekReport?.absent_leaders_count || 0}</span></div>
                        <div className="flex justify-between"><span>양:</span> <span className="font-medium">{getYangSum(currentWeekReport)}</span></div>
                        <div className="flex justify-between text-xs"><span>신입생:</span> <span className="font-medium">{currentWeekReport?.attended_freshmen_count || 0}</span></div>
                        <div className="flex justify-between text-xs"><span>기타:</span> <span className="font-medium">{currentWeekReport?.attended_others_count || 0}</span></div>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-slate-700 border-b border-slate-200 pb-1">{previousWeekLabel}</h4>
                    <div className="text-sm space-y-1">
                        <div className="flex justify-between"><span>총계:</span> <span className="font-medium">{getAttendeeSum(previousWeekReport)}</span></div>
                        <div className="flex justify-between"><span>1대1:</span> <span className="font-medium">{previousWeekReport?.one_to_one_count || 0}</span></div>
                        <div className="flex justify-between"><span>참석리더:</span> <span className="font-medium">{previousWeekReport?.attended_leaders_count || 0}</span></div>
                        <div className="flex justify-between"><span>불참리더:</span> <span className="font-medium text-red-600">{previousWeekReport?.absent_leaders_count || 0}</span></div>
                        <div className="flex justify-between"><span>양:</span> <span className="font-medium">{getYangSum(previousWeekReport)}</span></div>
                        <div className="flex justify-between text-xs"><span>신입생:</span> <span className="font-medium">{previousWeekReport?.attended_freshmen_count || 0}</span></div>
                        <div className="flex justify-between text-xs"><span>기타:</span> <span className="font-medium">{previousWeekReport?.attended_others_count || 0}</span></div>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-200 pt-3">
                <h4 className="font-semibold text-sm text-slate-700 mb-2">명단</h4>
                <div className="space-y-1 text-sm">
                    <div><span className="font-medium text-blue-600">학사양:</span> {currentWeekReport?.attended_graduates_names || '-'}</div>
                    <div><span className="font-medium text-green-600">재학생양:</span> {currentWeekReport?.attended_students_names || '-'}</div>
                    <div><span className="font-medium text-purple-600">신입생:</span> {currentWeekReport?.attended_freshmen_names || '-'}</div>
                    <div><span className="font-medium text-yellow-600">기타:</span> {currentWeekReport?.attended_others_names || '-'}</div>
                    <div className="flex items-center justify-between">
                        <div><span className="font-medium text-red-600">불참리더:</span> <span className="text-red-600">{currentWeekReport?.absent_leaders_names || '-'}</span></div>
                        <button
                            onClick={() => onEditClick({ yohoe: yohoeInfo, report: currentWeekReport })}
                            className="ml-2 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors whitespace-nowrap"
                            data-print-hide="true"
                        >
                            수정
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ReportRow = ({ item, onEditClick, onYohoeEditClick, currentWeekDate, previousWeekDate }) => {
    const { yohoeInfo, currentWeekReport, previousWeekReport } = item;

    return (
        <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors text-center">
            <td className="border-l border-r border-slate-300 p-3 align-top bg-slate-25" style={{width: '14%'}}>
                <button
                    onClick={() => onYohoeEditClick(yohoeInfo)}
                    className="group w-full flex items-center justify-center gap-1.5 font-bold text-sm text-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 px-2 py-1.5 rounded-md border border-blue-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md mb-2"
                    data-print-yohoe="true"
                    title="클릭하여 요회 정보 수정"
                >
                    <span>{yohoeInfo.name}</span>
                    <svg className="w-3.5 h-3.5 text-blue-600 group-hover:text-blue-700 opacity-60 group-hover:opacity-100 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-print-hide="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </button>
                <div className="text-xs text-slate-600 mt-1">({yohoeInfo.shepherd})</div>
                <div className="text-xs text-slate-600">리더 {yohoeInfo.leader_count}명</div>
            </td>
            <td className="border-r border-slate-300 align-top" style={{width: '40%'}}>
                <table className="w-full h-full">
                    <thead>
                        <tr className="bg-slate-50 text-xs font-medium border-b border-slate-200">
                            <td className="border-r border-slate-200 p-2 text-center bg-slate-100" style={{width: '12%'}}></td>
                            <td className="border-r border-slate-200 p-2 text-center" style={{width: '16%'}}>총</td>
                            <td className="border-r border-slate-200 p-2 text-center" style={{width: '16%'}}>1대1</td>
                            <td className="border-r border-slate-200 p-2 text-center" style={{width: '16%'}}>참석리더</td>
                            <td className="border-r border-slate-200 p-2 text-center text-red-600" style={{width: '16%'}}>불참리더</td>
                            <td className="p-2 text-center" style={{width: '24%'}}>양</td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-slate-200">
                            <td className="p-2 border-r border-slate-200 bg-blue-50 text-xs font-medium text-slate-700" style={{width: '12%'}}>
                              <div>금주</div>
                              <div className="text-[10px] text-slate-500">({currentWeekDate})</div>
                            </td>
                            <td className="p-2 border-r border-slate-200 font-semibold text-slate-800" style={{width: '16%'}}>{getAttendeeSum(currentWeekReport)}</td>
                            <td className="p-2 border-r border-slate-200 text-slate-700" style={{width: '16%'}}>{currentWeekReport?.one_to_one_count || 0}</td>
                            <td className="p-2 border-r border-slate-200 text-slate-700" style={{width: '16%'}}>{currentWeekReport?.attended_leaders_count || 0}</td>
                            <td className="p-2 border-r border-slate-200 text-red-600 font-medium" style={{width: '16%'}}>{currentWeekReport?.absent_leaders_count || 0}</td>
                            <td className="p-2 text-xs text-slate-700" style={{width: '24%'}}>{getYangSum(currentWeekReport)} <span className="text-xs text-slate-500">(신입생 {currentWeekReport?.attended_freshmen_count || 0})</span></td>
                        </tr>
                        <tr className="border-b border-slate-200">
                            <td className="p-2 border-r border-slate-200 bg-slate-50 text-xs font-medium text-slate-600" style={{width: '12%'}}>
                              <div>지난주</div>
                              <div className="text-[10px] text-slate-400">({previousWeekDate})</div>
                            </td>
                            <td className="p-2 border-r border-slate-200 text-slate-600" style={{width: '16%'}}>{getAttendeeSum(previousWeekReport)}</td>
                            <td className="p-2 border-r border-slate-200 text-slate-600" style={{width: '16%'}}>{previousWeekReport?.one_to_one_count || 0}</td>
                            <td className="p-2 border-r border-slate-200 text-slate-600" style={{width: '16%'}}>{previousWeekReport?.attended_leaders_count || 0}</td>
                            <td className="p-2 border-r border-slate-200 text-red-500" style={{width: '16%'}}>{previousWeekReport?.absent_leaders_count || 0}</td>
                            <td className="p-2 text-xs text-slate-600" style={{width: '24%'}}>{getYangSum(previousWeekReport)} <span className="text-xs text-slate-500">(신입생 {previousWeekReport?.attended_freshmen_count || 0})</span></td>
                        </tr>
                    </tbody>
                </table>
            </td>
            <td className="border-l border-r border-slate-300 p-3 align-top text-left" style={{width: '48%'}}>
                <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                        <span className="inline-block w-16 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">학사양</span>
                        <span className="text-slate-700 flex-1">{currentWeekReport?.attended_graduates_names || '-'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="inline-block w-16 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">재학생양</span>
                        <span className="text-slate-700 flex-1">{currentWeekReport?.attended_students_names || '-'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="inline-block w-16 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded">신입생</span>
                        <span className="text-slate-700 flex-1">{currentWeekReport?.attended_freshmen_names || '-'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="inline-block w-16 text-xs font-semibold text-yellow-700 bg-yellow-50 px-2 py-1 rounded">기타</span>
                        <span className="text-slate-700 flex-1">{currentWeekReport?.attended_others_names || '-'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="inline-block w-16 text-xs font-semibold text-red-700 bg-red-50 px-2 py-1 rounded">불참리더</span>
                        <span className="text-red-600 flex-1">{currentWeekReport?.absent_leaders_names || '-'}</span>
                    </div>
                    <div className="flex justify-end mt-3" data-print-hide="true">
                        <button
                            onClick={() => onEditClick({ yohoe: yohoeInfo, report: currentWeekReport })}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                            data-print-hide="true"
                        >
                            수정
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    );
};

const TotalsRow = ({ data, historicalData, currentWeekDate, previousWeekDate }) => {
    const totals = data.reduce((acc, item) => {
        if(item.currentWeekReport) {
            acc.current.total += getAttendeeSum(item.currentWeekReport);
            acc.current.one_to_one += item.currentWeekReport.one_to_one_count || 0;
            acc.current.attended_leaders += item.currentWeekReport.attended_leaders_count || 0;
            acc.current.absent_leaders += item.currentWeekReport.absent_leaders_count || 0;
            acc.current.yang += getYangSum(item.currentWeekReport);
            acc.current.shin += item.currentWeekReport.attended_freshmen_count || 0;
            acc.current.others += item.currentWeekReport.attended_others_count || 0;
        }
        if(item.previousWeekReport) {
            acc.previous.total += getAttendeeSum(item.previousWeekReport);
            acc.previous.one_to_one += item.previousWeekReport.one_to_one_count || 0;
            acc.previous.attended_leaders += item.previousWeekReport.attended_leaders_count || 0;
            acc.previous.absent_leaders += item.previousWeekReport.absent_leaders_count || 0;
            acc.previous.yang += getYangSum(item.previousWeekReport);
            acc.previous.shin += item.previousWeekReport.attended_freshmen_count || 0;
            acc.previous.others += item.previousWeekReport.attended_others_count || 0;
        }
        return acc;
    }, {
        current: { total: 0, one_to_one: 0, attended_leaders: 0, absent_leaders: 0, yang: 0, shin: 0, others: 0 },
        previous: { total: 0, one_to_one: 0, attended_leaders: 0, absent_leaders: 0, yang: 0, shin: 0, others: 0 },
    });

    return (
        <tr className="border-t-2 border-b-2 border-slate-400 bg-gradient-to-r from-slate-100 to-slate-200 text-center font-bold">
            <td className="border-l border-r border-slate-300 p-3 align-top bg-slate-200" style={{width: '14%'}}>
                <div className="text-base font-bold text-slate-800">총계</div>
            </td>
            <td className="border-r border-slate-300 align-top" style={{width: '40%'}}>
                <table className="w-full h-full">
                    <thead>
                        <tr className="bg-slate-100 text-xs font-bold border-b border-slate-300">
                            <td className="border-r border-slate-300 p-2 text-center bg-slate-200" style={{width: '12%'}}></td>
                            <td className="border-r border-slate-300 p-2 text-center" style={{width: '16%'}}>총</td>
                            <td className="border-r border-slate-300 p-2 text-center" style={{width: '16%'}}>1대1</td>
                            <td className="border-r border-slate-300 p-2 text-center" style={{width: '16%'}}>참석리더</td>
                            <td className="border-r border-slate-300 p-2 text-center text-red-600" style={{width: '16%'}}>불참리더</td>
                            <td className="p-2 text-center" style={{width: '24%'}}>양</td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-slate-300">
                            <td className="p-2 border-r border-slate-300 bg-blue-100 text-xs font-bold text-slate-800" style={{width: '12%'}}>
                              <div>금주</div>
                              <div className="text-[10px] font-medium text-slate-600">({currentWeekDate})</div>
                            </td>
                            <td className="p-2 border-r border-slate-300 font-bold text-lg text-slate-900 bg-blue-50" style={{width: '16%'}}>{totals.current.total}</td>
                            <td className="p-2 border-r border-slate-300 font-semibold text-slate-800" style={{width: '16%'}}>{totals.current.one_to_one}</td>
                            <td className="p-2 border-r border-slate-300 font-semibold text-slate-800" style={{width: '16%'}}>{totals.current.attended_leaders}</td>
                            <td className="p-2 border-r border-slate-300 text-red-600 font-bold" style={{width: '16%'}}>{totals.current.absent_leaders}</td>
                            <td className="p-2 text-xs font-semibold text-slate-800" style={{width: '24%'}}>{totals.current.yang} <span className="text-xs text-slate-600">(신입생 {totals.current.shin})</span></td>
                        </tr>
                        <tr className="border-b border-slate-300">
                            <td className="p-2 border-r border-slate-300 bg-slate-100 text-xs font-bold text-slate-700" style={{width: '12%'}}>
                              <div>지난주</div>
                              <div className="text-[10px] font-medium text-slate-500">({previousWeekDate})</div>
                            </td>
                            <td className="p-2 border-r border-slate-300 font-semibold text-slate-700" style={{width: '16%'}}>{totals.previous.total}</td>
                            <td className="p-2 border-r border-slate-300 text-slate-700" style={{width: '16%'}}>{totals.previous.one_to_one}</td>
                            <td className="p-2 border-r border-slate-300 text-slate-700" style={{width: '16%'}}>{totals.previous.attended_leaders}</td>
                            <td className="p-2 border-r border-slate-300 text-red-500 font-medium" style={{width: '16%'}}>{totals.previous.absent_leaders}</td>
                            <td className="p-2 text-xs text-slate-700" style={{width: '24%'}}>{totals.previous.yang} <span className="text-xs text-slate-600">(신입생 {totals.previous.shin})</span></td>
                        </tr>
                    </tbody>
                </table>
            </td>
            <td className="border-l border-r border-slate-300 p-3 align-top text-left bg-slate-50" style={{width: '48%'}}>
                <div className="text-sm font-bold text-slate-800 mb-2">📊 과거 추이</div>
                <div className="bg-white rounded border border-slate-200 p-2">
                    <HistoricalSummary historicalData={historicalData} />
                </div>
            </td>
        </tr>
    )
}

const HistoricalSummary = ({ historicalData }) => {
    return (
        <table className="w-full text-center text-xs">
            <thead>
                <tr className="bg-slate-100 text-slate-700 font-medium">
                    <td className="p-1 border-r border-slate-200" style={{width: '28%'}}>주차</td>
                    <td className="p-1 border-r border-slate-200" style={{width: '12%'}}>총</td>
                    <td className="p-1 border-r border-slate-200" style={{width: '12%'}}>1대1</td>
                    <td className="p-1 border-r border-slate-200" style={{width: '12%'}}>참석</td>
                    <td className="p-1 border-r border-slate-200" style={{width: '12%'}}>불참</td>
                    <td className="p-1" style={{width: '24%'}}>양</td>
                </tr>
            </thead>
            <tbody>
                {historicalData.map((week, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-1 border-r border-slate-200 font-medium text-slate-700" style={{width: '28%'}}>{week.weekNumber}주 전({week.date})</td>
                        <td className="p-1 border-r border-slate-200 font-semibold text-slate-800" style={{width: '12%'}}>{week.total}</td>
                        <td className="p-1 border-r border-slate-200 text-slate-700" style={{width: '12%'}}>{week.one_to_one}</td>
                        <td className="p-1 border-r border-slate-200 text-slate-700" style={{width: '12%'}}>{week.attended_leaders}</td>
                        <td className="p-1 border-r border-slate-200 text-red-500 font-medium" style={{width: '12%'}}>{week.absent_leaders}</td>
                        <td className="p-1 text-slate-700" style={{width: '24%'}}>{week.yang} <span className="text-slate-500">(신입생 {week.shin})</span></td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

const WeeklyReportView = ({ date, onWeekChange }) => {
  const [processedData, setProcessedData] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [currentViewDate, setCurrentViewDate] = useState(date);
  const [isReportDetailModalOpen, setIsReportDetailModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [selectedYohoeForReport, setSelectedYohoeForReport] = useState(null);
  const [selectedReportDate, setSelectedReportDate] = useState(null);
  const [isYohoeModalOpen, setIsYohoeModalOpen] = useState(false);
  const [editingYohoe, setEditingYohoe] = useState(null);
  const [weeklyTheme, setWeeklyTheme] = useState('-');
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [quickIndexYohoeId, setQuickIndexYohoeId] = useState('');
  const yohoeCardRefs = useRef({});

  useEffect(() => {
    if (!date) return;

    const incomingString = formatDateToKSTString(date);
    const parsedIncoming = createDateFromKSTString(incomingString);
    if (!parsedIncoming) return;

    setCurrentViewDate((prev) => {
      if (!prev) {
        return parsedIncoming;
      }

      const prevString = formatDateToKSTString(prev);
      return prevString === incomingString ? prev : parsedIncoming;
    });
  }, [date]);

  useEffect(() => {
    if (typeof onWeekChange === 'function') {
      onWeekChange(new Date(currentViewDate));
    }
  }, [currentViewDate, onWeekChange]);

  // Modal handlers
  const handleOpenReportDetail = ({ report, yohoe }) => {
    const fallbackSunday = getSundayOfWeekKST(currentViewDate || new Date());
    setSelectedReportId(report?.id || null);
    setSelectedYohoeForReport(yohoe || null);
    setSelectedReportDate(report?.report_date || fallbackSunday);
    setIsReportDetailModalOpen(true);
  };

  const handleCloseReportDetail = () => {
    setIsReportDetailModalOpen(false);
    setSelectedReportId(null);
    setSelectedYohoeForReport(null);
    setSelectedReportDate(null);
  };

  // Yohoe Modal handlers
  const handleOpenYohoeEdit = (yohoe) => {
    setEditingYohoe(yohoe);
    setIsYohoeModalOpen(true);
  };

  const handleCloseYohoeModal = () => {
    setIsYohoeModalOpen(false);
    setEditingYohoe(null);
  };

  const handleYohoeUpdated = () => {
    // Re-fetch data when yohoe is updated
    handleReportUpdated();
  };

  // Weekly Theme Modal handlers
  const handleOpenThemeModal = () => {
    setIsThemeModalOpen(true);
  };

  const handleCloseThemeModal = () => {
    setIsThemeModalOpen(false);
  };

  const handleThemeUpdated = () => {
    // 말씀 주제가 업데이트된 후 해당 주의 데이터를 새로 가져오기
    fetchWeeklyTheme();
    console.log('Weekly theme updated for date:', currentViewDate);
  };

  // 주간 말씀 주제를 가져오는 함수
  const fetchWeeklyTheme = useCallback(async () => {
    try {
      const sunday = getSundayOfWeekKST(currentViewDate);
      console.log('WeeklyReportView - Fetching theme for currentViewDate:', currentViewDate, 'Sunday:', sunday);

      const { data, error } = await supabase
        .from('weekly_themes')
        .select('theme')
        .eq('week_date', sunday)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching weekly theme:', error);
        setWeeklyTheme('-'); // 기본값으로 설정
      } else if (data) {
        console.log('WeeklyReportView - Found theme:', data.theme);
        setWeeklyTheme(data.theme);
      } else {
        console.log('WeeklyReportView - No theme found, using default');
        setWeeklyTheme('-'); // 데이터가 없으면 기본값
      }
    } catch (error) {
      console.error('Error:', error);
      setWeeklyTheme('-'); // 오류 시 기본값
    }
  }, [currentViewDate]);

  const handleReportUpdated = () => {
    // Re-fetch data when report is updated
    const fetchAndProcessData = async () => {
        setLoading(true);
        
        const weeks = [...Array(6)].map((_, i) => {
            const targetDate = addDaysToKSTDate(currentViewDate, -(i * 7));
            return getWeekRangeKST(targetDate);
        });

        // 두 쿼리가 서로 독립적이므로 병렬 실행으로 성능 최적화
        const [yohoesResult, reportsResult] = await Promise.all([
          supabase.from('yohoe').select('*').order('order_num', { ascending: true, nullsFirst: false }).order('created_at'),
          supabase.from('reports').select('*').gte('report_date', weeks[5].start).lte('report_date', weeks[0].end)
        ]);

        const { data: yohoes, error: yohoesError } = yohoesResult;
        const { data: reports, error: reportsError } = reportsResult;

        if (yohoesError || reportsError) {
          if (yohoesError) console.error(yohoesError);
          if (reportsError) console.error(reportsError);
          setLoading(false);
          return;
        }

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

        // 1주전부터 5주전까지의 데이터 계산
        const historical = [weeks[1], weeks[2], weeks[3], weeks[4], weeks[5]].map((week, index) => {
            const weekReports = reports.filter(r => r.report_date >= week.start && r.report_date <= week.end);
            const weekData = weekReports.reduce((acc, report) => {
                acc.total += getAttendeeSum(report);
                acc.one_to_one += report.one_to_one_count || 0;
                acc.attended_leaders += report.attended_leaders_count || 0;
                acc.absent_leaders += report.absent_leaders_count || 0;
                acc.yang += getYangSum(report);
                acc.shin += report.attended_freshmen_count || 0;
                return acc;
            }, { total: 0, one_to_one: 0, attended_leaders: 0, absent_leaders: 0, yang: 0, shin: 0 });
            
            // 주차별 날짜 정보 추가
            return {
                ...weekData,
                weekNumber: index + 1,
                date: week.sunday // 해당 주의 일요일 날짜
            };
        });

        setProcessedData(processed);
        setHistoricalData(historical);
        setLoading(false);
    };
    
    fetchAndProcessData();
  };

  useEffect(() => {
    const fetchAndProcessData = async () => {
        setLoading(true);

        const weeks = [...Array(6)].map((_, i) => {
            const targetDate = addDaysToKSTDate(currentViewDate, -(i * 7));
            return getWeekRangeKST(targetDate);
        });

        // 두 쿼리가 서로 독립적이므로 병렬 실행으로 성능 최적화
        const [yohoesResult, reportsResult] = await Promise.all([
          supabase.from('yohoe').select('*').order('order_num', { ascending: true, nullsFirst: false }).order('created_at'),
          supabase.from('reports').select('*').gte('report_date', weeks[5].start).lte('report_date', weeks[0].end)
        ]);

        const { data: yohoes, error: yohoesError } = yohoesResult;
        const { data: reports, error: reportsError } = reportsResult;

        if (yohoesError || reportsError) {
          if (yohoesError) console.error(yohoesError);
          if (reportsError) console.error(reportsError);
          setLoading(false);
          return;
        }

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

        // 1주전부터 5주전까지의 데이터 계산
        const historical = [weeks[1], weeks[2], weeks[3], weeks[4], weeks[5]].map((week, index) => {
            const weekReports = reports.filter(r => r.report_date >= week.start && r.report_date <= week.end);
            const weekData = weekReports.reduce((acc, report) => {
                acc.total += getAttendeeSum(report);
                acc.one_to_one += report.one_to_one_count || 0;
                acc.attended_leaders += report.attended_leaders_count || 0;
                acc.absent_leaders += report.absent_leaders_count || 0;
                acc.yang += getYangSum(report);
                acc.shin += report.attended_freshmen_count || 0;
                return acc;
            }, { total: 0, one_to_one: 0, attended_leaders: 0, absent_leaders: 0, yang: 0, shin: 0 });

            // 주차별 날짜 정보 추가
            return {
                ...weekData,
                weekNumber: index + 1,
                date: week.sunday // 해당 주의 일요일 날짜
            };
        });

        setProcessedData(processed);
        setHistoricalData(historical);
        setLoading(false);
    };

    // fetchAndProcessData와 fetchWeeklyTheme도 독립적이므로 병렬 실행
    Promise.all([fetchAndProcessData(), fetchWeeklyTheme()]);
  }, [currentViewDate, fetchWeeklyTheme]);

  // PDF 출력용 스타일 동적 추가
  useEffect(() => {

    // PDF 출력용 스타일 동적 추가
    const printStyle = document.createElement('style');
    printStyle.id = 'pdf-print-style';
    printStyle.innerHTML = `
      @media print {
        [data-print-hide="true"] {
          display: none !important;
          visibility: hidden !important;
          height: 0px !important;
          width: 0px !important;
          margin: 0px !important;
          padding: 0px !important;
          border: none !important;
          overflow: hidden !important;
          opacity: 0 !important;
          position: absolute !important;
          left: -9999px !important;
          top: -9999px !important;
        }
        
        [data-print-yohoe="true"] {
          all: unset !important;
          display: inline-block !important;
          background: none !important;
          background-color: transparent !important;
          background-image: none !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
          color: #000000 !important;
          font-weight: bold !important;
          cursor: default !important;
          text-decoration: none !important;
          outline: none !important;
          transform: none !important;
          transition: none !important;
          filter: none !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          appearance: none !important;
        }
        
        .calendar-container {
          display: none !important;
        }
        
        svg {
          display: none !important;
        }
      }
    `;
    
    if (!document.getElementById('pdf-print-style')) {
      document.head.appendChild(printStyle);
    }
    
    return () => {
      const existingStyle = document.getElementById('pdf-print-style');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

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
  const MiniCalendar = ({ viewDate }) => {
    const [currentMonth, setCurrentMonth] = useState(() => formatDateToKSTString(viewDate));

    useEffect(() => {
      setCurrentMonth(formatDateToKSTString(viewDate));
    }, [viewDate]);

    const getDaysInMonth = (monthStr) => {
      const parts = getKSTDateParts(monthStr);
      if (!parts) {
        return { days: [], currentMonthValue: null };
      }
      const firstDayStr = `${parts.year}-${String(parts.month).padStart(2, '0')}-01`;
      const { start: calendarStart } = getWeekRangeKST(firstDayStr);
      const days = [...Array(42)].map((_, idx) => addDaysToKSTDate(calendarStart, idx));
      return { days, currentMonthValue: parts.month };
    };

    const { days, currentMonthValue } = getDaysInMonth(currentMonth);
    const todayStr = formatDateToKSTString();
    const selectedStr = formatDateToKSTString(viewDate);

    const isDateAvailable = (dateStr) => {
      const parts = getKSTDateParts(dateStr);
      if (!parts) return false;
      const dayOfWeek = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
      return dayOfWeek === 0 && availableDates.includes(dateStr);
    };

    const handleDateClick = (dateStr) => {
      const parsed = createDateFromKSTString(dateStr);
      if (parsed) {
        setCurrentViewDate(parsed);
        setShowCalendar(false);
      }
    };

    const changeMonth = (offset) => {
      const parts = getKSTDateParts(currentMonth);
      if (!parts) return;
      let year = parts.year;
      let month = parts.month + offset;
      while (month < 1) {
        month += 12;
        year -= 1;
      }
      while (month > 12) {
        month -= 12;
        year += 1;
      }
      const nextMonthStr = `${year}-${String(month).padStart(2, '0')}-01`;
      setCurrentMonth(nextMonthStr);
    };

    const monthLabelParts = getKSTDateParts(currentMonth);

    return (
      <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50 w-80">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => changeMonth(-1)}
            className="p-1 hover:bg-slate-100 rounded"
          >
            ◀
          </button>
          <h3 className="font-semibold">
            {monthLabelParts ? `${monthLabelParts.year}년 ${monthLabelParts.month}월` : ''}
          </h3>
          <button 
            onClick={() => changeMonth(1)}
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
          {days.map((dayStr, index) => {
            const parts = getKSTDateParts(dayStr);
            const isCurrentMonthDay = parts?.month === currentMonthValue;
            const isAvailable = isDateAvailable(dayStr);
            const isToday = dayStr === todayStr;
            const isSelected = dayStr === selectedStr;

            let buttonClasses = 'p-2 text-xs rounded transition-all cursor-pointer ';

            if (isSelected) {
              buttonClasses += isAvailable
                ? 'bg-blue-700 text-white ring-2 ring-blue-300 font-semibold '
                : 'bg-white text-slate-700 ring-2 ring-blue-500 font-semibold ';
            } else if (isToday) {
              buttonClasses += isAvailable
                ? 'bg-blue-500 text-white font-semibold hover:bg-blue-600 shadow-md '
                : 'bg-white text-slate-700 ring-2 ring-blue-500 hover:bg-slate-50 ';
            } else if (isAvailable) {
              buttonClasses += 'bg-blue-500 text-white font-semibold hover:bg-blue-600 shadow-md ';
            } else {
              buttonClasses += isCurrentMonthDay
                ? 'text-slate-700 hover:bg-slate-100 '
                : 'text-slate-300 hover:bg-slate-100 ';
            }

            return (
              <button
                key={index}
                onClick={() => handleDateClick(dayStr)}
                className={buttonClasses.trim()}
              >
                {parts?.day ?? ''}
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

  // 금주/지난주 날짜 레이블 계산
  const currentWeekSunday = getSundayOfWeekKST(currentViewDate);
  const previousWeekSunday = getSundayOfWeekKST(addDaysToKSTDate(currentViewDate, -7));

  const currentWeekParts = getKSTDateParts(currentWeekSunday);
  const previousWeekParts = getKSTDateParts(previousWeekSunday);

  // 모바일용 레이블 (간결하게)
  const currentWeekLabel = currentWeekParts ? `금주(${currentWeekParts.month}/${currentWeekParts.day})` : '금주';
  const previousWeekLabel = previousWeekParts ? `지난주(${previousWeekParts.month}/${previousWeekParts.day})` : '지난주';

  // 데스크톱용 날짜 (테이블 셀에 별도 표시)
  const currentWeekDate = currentWeekParts ? `${currentWeekParts.month}/${currentWeekParts.day}` : '';
  const previousWeekDate = previousWeekParts ? `${previousWeekParts.month}/${previousWeekParts.day}` : '';

  const handleQuickIndexChange = (event) => {
    const yohoeId = event.target.value;
    const target = yohoeCardRefs.current[yohoeId];

    setQuickIndexYohoeId(yohoeId);

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  // Mobile Summary Component
  const MobileSummary = () => {
    const totals = processedData.reduce((acc, item) => {
      if(item.currentWeekReport) {
        acc.current.total += getAttendeeSum(item.currentWeekReport);
        acc.current.one_to_one += item.currentWeekReport.one_to_one_count || 0;
        acc.current.attended_leaders += item.currentWeekReport.attended_leaders_count || 0;
        acc.current.absent_leaders += item.currentWeekReport.absent_leaders_count || 0;
        acc.current.yang += getYangSum(item.currentWeekReport);
        acc.current.shin += item.currentWeekReport.attended_freshmen_count || 0;
      }
      if(item.previousWeekReport) {
        acc.previous.total += getAttendeeSum(item.previousWeekReport);
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
            <h4 className="font-semibold text-sm border-b border-blue-300 pb-1 text-blue-100">{currentWeekLabel}</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span>총계:</span> <span className="font-bold">{totals.current.total}</span></div>
              <div className="flex justify-between"><span>1대1:</span> <span className="font-bold">{totals.current.one_to_one}</span></div>
              <div className="flex justify-between"><span>참석리더:</span> <span className="font-bold">{totals.current.attended_leaders}</span></div>
              <div className="flex justify-between"><span>불참리더:</span> <span className="font-bold text-red-200">{totals.current.absent_leaders}</span></div>
              <div className="flex justify-between"><span>양:</span> <span className="font-bold">{totals.current.yang}</span></div>
              <div className="flex justify-between text-xs"><span>신입생:</span> <span className="font-bold">{totals.current.shin}</span></div>
              <div className="flex justify-between text-xs"><span>기타:</span> <span className="font-bold">{processedData.reduce((sum, item) => sum + (item.currentWeekReport?.attended_others_count || 0), 0)}</span></div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm border-b border-blue-300 pb-1 text-blue-100">{previousWeekLabel}</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span>총계:</span> <span className="font-bold">{totals.previous.total}</span></div>
              <div className="flex justify-between"><span>1대1:</span> <span className="font-bold">{totals.previous.one_to_one}</span></div>
              <div className="flex justify-between"><span>참석리더:</span> <span className="font-bold">{totals.previous.attended_leaders}</span></div>
              <div className="flex justify-between"><span>불참리더:</span> <span className="font-bold text-red-200">{totals.previous.absent_leaders}</span></div>
              <div className="flex justify-between"><span>양:</span> <span className="font-bold">{totals.previous.yang}</span></div>
              <div className="flex justify-between text-xs"><span>신입생:</span> <span className="font-bold">{totals.previous.shin}</span></div>
              <div className="flex justify-between text-xs"><span>기타:</span> <span className="font-bold">{processedData.reduce((sum, item) => sum + (item.previousWeekReport?.attended_others_count || 0), 0)}</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6 p-3 sm:p-4 mt-2.5">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h1 className="text-xl sm:text-3xl font-bold text-slate-800">📋 주간 역사 보고서</h1>
          <button
            onClick={handleOpenThemeModal}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="말씀 주제 편집"
            data-print-hide="true"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        <p className="text-sm sm:text-lg text-slate-600 mb-3">"{weeklyTheme}"</p>
        <div className="flex justify-between items-center text-xs sm:text-sm text-slate-500 px-2 sm:px-4 relative">
          <span>{`${formatKSTDateHuman(getSundayOfWeekKST(currentViewDate))}(주일)`}</span>
          <div className="relative calendar-container">
            <button 
              onClick={() => setShowCalendar(!showCalendar)}
              className="px-3 py-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium print:hidden calendar-button no-print"
            >
              📅 과거 기록보기
            </button>
            {showCalendar && <MiniCalendar viewDate={currentViewDate} />}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="sm:hidden px-3">
        <MobileSummary />
        {processedData.length > 1 && (
          <div className="sticky top-2 z-30 mb-3 rounded-xl border border-blue-100 bg-white/95 p-2 shadow-md backdrop-blur print:hidden">
            <label className="mb-1 block text-[11px] font-semibold text-slate-500" htmlFor="mobile-yohoe-jump">
              요회 바로가기
            </label>
            <select
              id="mobile-yohoe-jump"
              value={quickIndexYohoeId}
              onChange={handleQuickIndexChange}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">이동할 요회를 선택하세요</option>
              {processedData.map((item, index) => (
                <option key={item.yohoeInfo.id} value={item.yohoeInfo.id}>
                  {index + 1}. {item.yohoeInfo.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-4">
          {processedData.map((item) => (
            <div
              key={item.yohoeInfo.id}
              ref={(element) => {
                if (element) {
                  yohoeCardRefs.current[item.yohoeInfo.id] = element;
                } else {
                  delete yohoeCardRefs.current[item.yohoeInfo.id];
                }
              }}
              className="scroll-mt-24"
            >
              <MobileCard
                item={item}
                onEditClick={handleOpenReportDetail}
                onYohoeEditClick={handleOpenYohoeEdit}
                currentWeekLabel={currentWeekLabel}
                previousWeekLabel={previousWeekLabel}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block p-6 bg-white rounded-xl shadow-lg border border-slate-200">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-slate-100 text-center font-bold text-slate-800">
              <th className="border border-slate-300 p-3 rounded-tl-lg" style={{width: '14%'}}>
                <div className="text-sm font-semibold">요회</div>
              </th>
              <th className="border-t border-r border-b border-slate-300 p-3" style={{width: '40%'}}>
                <div className="text-sm font-semibold">예배 참석자 수</div>
              </th>
              <th className="border border-slate-300 p-3 rounded-tr-lg" style={{width: '48%'}}>
                <div className="text-sm font-semibold">명단</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {processedData.map(item => (
              <ReportRow
                key={item.yohoeInfo.id}
                item={item}
                onEditClick={handleOpenReportDetail}
                onYohoeEditClick={handleOpenYohoeEdit}
                currentWeekDate={currentWeekDate}
                previousWeekDate={previousWeekDate}
              />
            ))}
            <TotalsRow
              data={processedData}
              historicalData={historicalData}
              currentWeekDate={currentWeekDate}
              previousWeekDate={previousWeekDate}
            />
          </tbody>
        </table>
      </div>

      {/* Report Detail Modal */}
      <ReportDetailModal 
        isOpen={isReportDetailModalOpen}
        onClose={handleCloseReportDetail}
        reportId={selectedReportId}
        onReportUpdated={handleReportUpdated}
        yohoeInfo={selectedYohoeForReport}
        reportDate={selectedReportDate}
      />

      {/* Yohoe Modal */}
      <YohoeModal
        isOpen={isYohoeModalOpen}
        onClose={handleCloseYohoeModal}
        onYohoeUpdated={handleYohoeUpdated}
        yohoeToEdit={editingYohoe}
      />

      {/* Weekly Theme Modal */}
      <WeeklyThemeModal
        isOpen={isThemeModalOpen}
        onClose={handleCloseThemeModal}
        weekDate={currentViewDate}
        onThemeUpdated={handleThemeUpdated}
      />
    </div>
  );
};

export default WeeklyReportView;
