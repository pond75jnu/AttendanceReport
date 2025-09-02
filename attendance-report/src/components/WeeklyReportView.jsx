import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// --- Helper Functions ---
const getWeekRange = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(d.setDate(diff));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  return {
    start: startOfWeek.toISOString().slice(0, 10),
    end: endOfWeek.toISOString().slice(0, 10),
  };
};

const getAttendeeSum = (report) => {
    if (!report) return 0;
    return (report.attended_leaders_count || 0) + (report.attended_graduates_count || 0) + (report.attended_students_count || 0) + (report.attended_freshmen_count || 0);
};

const getYangSum = (report) => {
    if (!report) return 0;
    return (report.attended_graduates_count || 0) + (report.attended_students_count || 0);
}

// --- Sub-components ---
const ReportRow = ({ item }) => {
    const { yohoeInfo, currentWeekReport, previousWeekReport } = item;
    return (
        <tr className="border-b border-black text-center">
            <td className="border-r border-black p-2 align-top">
                <div className="font-bold text-lg">{yohoeInfo.name}</div>
                <div className="text-sm">({yohoeInfo.shepherd})</div>
                <div className="text-sm">리더{yohoeInfo.leader_count}명</div>
            </td>
            <td className="border-r border-black align-top">
                <table className="w-full h-full">
                    <tbody>
                        <tr className="border-b border-black">
                            <td className="p-1 w-1/5 border-r border-black">금주</td>
                            <td className="p-1 w-1/5 border-r border-black">{getAttendeeSum(currentWeekReport)}</td>
                            <td className="p-1 w-1/5 border-r border-black">{currentWeekReport?.one_to_one_count || 0}</td>
                            <td className="p-1 w-1/5 border-r border-black">{getYangSum(currentWeekReport)}</td>
                            <td className="p-1 w-1/5">{currentWeekReport?.attended_freshmen_count || 0}</td>
                        </tr>
                        <tr>
                            <td className="p-1 border-r border-black">지난주</td>
                            <td className="p-1 border-r border-black">{getAttendeeSum(previousWeekReport)}</td>
                            <td className="p-1 border-r border-black">{previousWeekReport?.one_to_one_count || 0}</td>
                            <td className="p-1 border-r border-black">{getYangSum(previousWeekReport)}</td>
                            <td className="p-1">{previousWeekReport?.attended_freshmen_count || 0}</td>
                        </tr>
                    </tbody>
                </table>
            </td>
            <td className="p-2 align-top w-1/2 text-left">
                <div className="grid grid-cols-5 gap-1 text-sm">
                    <div className="font-bold">학사양:</div><div className="col-span-4">{currentWeekReport?.attended_graduates_names}</div>
                    <div className="font-bold">재학생양:</div><div className="col-span-4">{currentWeekReport?.attended_students_names}</div>
                    <div className="font-bold">신입생:</div><div className="col-span-4">{currentWeekReport?.attended_freshmen_names}</div>
                    <div className="font-bold text-red-600">불참리더:</div><div className="col-span-4 text-red-600">{currentWeekReport?.absent_leaders_names}</div>
                </div>
            </td>
        </tr>
    );
};

const TotalsRow = ({ data, historicalData }) => {
    const totals = data.reduce((acc, item) => {
        if(item.currentWeekReport) {
            acc.current.total += getAttendeeSum(item.currentWeekReport);
            acc.current.one_to_one += item.currentWeekReport.one_to_one_count || 0;
            acc.current.yang += getYangSum(item.currentWeekReport);
            acc.current.shin += item.currentWeekReport.attended_freshmen_count || 0;
        }
        if(item.previousWeekReport) {
            acc.previous.total += getAttendeeSum(item.previousWeekReport);
            acc.previous.one_to_one += item.previousWeekReport.one_to_one_count || 0;
            acc.previous.yang += getYangSum(item.previousWeekReport);
            acc.previous.shin += item.previousWeekReport.attended_freshmen_count || 0;
        }
        return acc;
    }, { 
        current: { total: 0, one_to_one: 0, yang: 0, shin: 0 },
        previous: { total: 0, one_to_one: 0, yang: 0, shin: 0 },
    });

    return (
        <tr className="border-b-2 border-black text-center font-bold">
            <td className="border-r border-black p-2 align-top">총</td>
            <td className="border-r border-black align-top">
                <table className="w-full h-full">
                    <tbody>
                        <tr className="border-b border-black">
                            <td className="p-1 w-1/5 border-r border-black">금주</td>
                            <td className="p-1 w-1/5 border-r border-black">{totals.current.total}</td>
                            <td className="p-1 w-1/5 border-r border-black">{totals.current.one_to_one}</td>
                            <td className="p-1 w-1/5 border-r border-black">{totals.current.yang}</td>
                            <td className="p-1 w-1/5">{totals.current.shin}</td>
                        </tr>
                        <tr>
                            <td className="p-1 border-r border-black">지난주</td>
                            <td className="p-1 border-r border-black">{totals.previous.total}</td>
                            <td className="p-1 border-r border-black">{totals.previous.one_to_one}</td>
                            <td className="p-1 border-r border-black">{totals.previous.yang}</td>
                            <td className="p-1">{totals.previous.shin}</td>
                        </tr>
                    </tbody>
                </table>
            </td>
            <td className="p-2 align-top w-1/2 text-left">
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
                        <td className="p-1 w-1/4 font-bold">{index + 2}주전</td>
                        <td className="p-1 w-1/4">{week.total}</td>
                        <td className="p-1 w-1/4">{week.one_to_one}</td>
                        <td className="p-1 w-1/4">{week.yang}</td>
                        <td className="p-1 w-1/4">{week.shin}</td>
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

  useEffect(() => {
    const fetchAndProcessData = async () => {
        setLoading(true);
        
        const weeks = [...Array(4)].map((_, i) => {
            const d = new Date(date);
            d.setDate(date.getDate() - (i * 7));
            return getWeekRange(d);
        });

        const { data: yohoes, error: yohoesError } = await supabase.from('yohoes').select('*').order('created_at');
        if (yohoesError) { console.error(yohoesError); setLoading(false); return; }

        const { data: reports, error: reportsError } = await supabase.from('reports').select('*').gte('report_date', weeks[3].start).lte('report_date', weeks[0].end);
        if (reportsError) { console.error(reportsError); setLoading(false); return; }

        const processed = yohoes.map(yohoe => ({
            yohoeInfo: yohoe,
            currentWeekReport: reports.find(r => r.yohoe_id === yohoe.id && r.report_date >= weeks[0].start && r.report_date <= weeks[0].end) || null,
            previousWeekReport: reports.find(r => r.yohoe_id === yohoe.id && r.report_date >= weeks[1].start && r.report_date <= weeks[1].end) || null,
        }));

        const historical = weeks.slice(2).map(week => {
            const weekReports = reports.filter(r => r.report_date >= week.start && r.report_date <= week.end);
            return weekReports.reduce((acc, report) => {
                acc.total += getAttendeeSum(report);
                acc.one_to_one += report.one_to_one_count || 0;
                acc.yang += getYangSum(report);
                acc.shin += report.attended_freshmen_count || 0;
                return acc;
            }, { total: 0, one_to_one: 0, yang: 0, shin: 0 });
        });

        setProcessedData(processed);
        setHistoricalData(historical);
        setLoading(false);
    };

    fetchAndProcessData();
  }, [date]);

  if (loading) {
    return <div className="text-center p-4">Loading report...</div>;
  }

  return (
    <div className="p-4 bg-white font-serif border-2 border-black">
        <div className="text-center mb-4">
            <h1 className="text-3xl font-bold">주간 역사 보고서</h1>
            <p className="text-lg">"피로 세우는 언약"</p>
            <div className="flex justify-between text-sm px-4 pt-2">
                <span>{`${date.getFullYear()}년 ${date.getMonth() + 1}월`}</span>
                <span>{date.toLocaleDateString()}</span>
            </div>
        </div>

        <table className="w-full border-collapse border-2 border-black">
            <thead>
                <tr className="border-2 border-black bg-gray-100 text-center font-bold">
                    <th className="border-r border-black p-2 w-1/6">요회</th>
                    <th className="border-r border-black p-2 w-1/3">
                        <div>예배 참석자 수</div>
                        <div className="grid grid-cols-5 text-xs font-normal">
                           <div className="border-r border-t-2 border-black h-full"></div>
                           <div className="border-r border-t-2 border-black">총</div>
                           <div className="border-r border-t-2 border-black">1대1</div>
                           <div className="border-r border-t-2 border-black">양</div>
                           <div className="border-t-2 border-black">신</div>
                        </div>
                    </th>
                    <th className="p-2 w-1/2">명단</th>
                </tr>
            </thead>
            <tbody>
                {processedData.map(item => <ReportRow key={item.yohoeInfo.id} item={item} />)}
                <TotalsRow data={processedData} historicalData={historicalData} />
            </tbody>
        </table>
    </div>
  );
};

export default WeeklyReportView;
