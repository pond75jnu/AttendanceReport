import React, { useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { filterReportsByWeek } from '../lib/reportUtils';

const PDFPrintView = ({ data, onClose, onPrint }) => {
  const printRef = useRef(null);

  const generatePDF = useCallback(async () => {
    if (!printRef.current) return;

    try {
      // 약간의 지연으로 DOM 렌더링 완료 대기
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width at 96 DPI
        height: 1123, // A4 height at 96 DPI
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `주간보고서_${data.weekInfo.year}년_${data.weekInfo.month}월_${data.weekInfo.day}일.pdf`;
      pdf.save(fileName);

      onPrint && onPrint();
      onClose && onClose();
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 생성 중 오류가 발생했습니다.');
      onClose && onClose();
    }
  }, [data, onClose, onPrint]);

  useEffect(() => {
    // iframe이 로드된 후 PDF 생성 시작 (한 번만 실행)
    if (data && printRef.current) {
      const timer = setTimeout(() => {
        generatePDF();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [data, generatePDF]);  // 필요한 의존성 추가

  if (!data) return null;

  const { reports, weekInfo, yohoeList, weeklyTheme } = data;
  const weeklyReports = filterReportsByWeek(reports, weekInfo);

  // WeeklyReportView와 동일한 계산 함수들
  const getAttendeeSum = (report, yohoeInfo) => {
    if (!report || !yohoeInfo) return 0;
    return (yohoeInfo.leader_count || 0) + (report.attended_graduates_count || 0) + (report.attended_students_count || 0) + (report.attended_freshmen_count || 0) - (report.absent_leaders_count || 0);
  };

  const getYangSum = (report) => {
    if (!report) return 0;
    return (report.attended_graduates_count || 0) + (report.attended_students_count || 0) + (report.attended_freshmen_count || 0);
  };

  // 데이터 매핑 - 각 요회별로 현재 주 보고서 찾기
  const processedData = yohoeList.map(yohoe => {
    const currentWeekReport = weeklyReports.find(r => r.yohoe_id === yohoe.id);
    return {
      yohoeInfo: yohoe,
      currentWeekReport: currentWeekReport || null
    };
  });

  // 총합 계산
  const totals = processedData.reduce((acc, item) => {
    if (item.currentWeekReport) {
      acc.total += getAttendeeSum(item.currentWeekReport, item.yohoeInfo);
      acc.one_to_one += item.currentWeekReport.one_to_one_count || 0;
      acc.attended_leaders += item.currentWeekReport.attended_leaders_count || 0;
      acc.absent_leaders += item.currentWeekReport.absent_leaders_count || 0;
      acc.yang += getYangSum(item.currentWeekReport);
      acc.freshmen += item.currentWeekReport.attended_freshmen_count || 0;
    }
    return acc;
  }, {
    total: 0,
    one_to_one: 0,
    attended_leaders: 0,
    absent_leaders: 0,
    yang: 0,
    freshmen: 0
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full overflow-auto">
        <div
          ref={printRef}
          className="w-full bg-white"
          style={{
            width: '794px',
            minHeight: '1123px',
            margin: '0 auto',
            padding: '40px',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            lineHeight: '1.4'
          }}
        >
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-4" style={{ color: '#000000' }}>주간 역사 보고서</h1>
            <p className="text-lg mb-4" style={{ color: '#000000' }}>"{weeklyTheme || '-'}"</p>
            <div className="flex justify-between items-center text-base">
              <div style={{ color: '#000000' }}>{weekInfo.year}년 {weekInfo.month}월 {weekInfo.day}일(주일)</div>
              <div></div>
            </div>
          </div>

          {/* 메인 테이블 */}
          <table className="w-full border-collapse text-sm" style={{ border: '3px solid #000000' }}>
            <thead>
              <tr>
                <th className="px-2 py-1 bg-gray-100 text-center" style={{ width: '12%', color: '#000000', border: '1px solid #000000' }}>요회</th>
                <th className="px-2 py-1 bg-gray-100 text-center" style={{ width: '50%', color: '#000000', border: '1px solid #000000' }}>예배 참석자 수</th>
                <th className="px-2 py-1 bg-gray-100 text-center" style={{ width: '38%', color: '#000000', border: '1px solid #000000' }}>명단</th>
              </tr>
            </thead>
            <tbody>
              {processedData.map((item) => {
                const { yohoeInfo, currentWeekReport } = item;
                const totalAttendees = getAttendeeSum(currentWeekReport, yohoeInfo);
                const yangSum = getYangSum(currentWeekReport);

                return (
                  <React.Fragment key={yohoeInfo.id}>
                    {/* 각 요회는 2행으로 구성: 금주 + 지난주 */}
                    <tr className="border-b border-black">
                      {/* 요회 정보 - 2행에 걸쳐 표시 */}
                      <td className="px-2 py-2 text-center align-middle" rowSpan={2} style={{ verticalAlign: 'middle', border: '1px solid #000000' }}>
                        <div className="font-bold text-sm" style={{ color: '#000000' }}>{yohoeInfo.name}</div>
                        <div className="text-xs mt-1" style={{ color: '#000000' }}>({yohoeInfo.shepherd})</div>
                        <div className="text-xs" style={{ color: '#000000' }}>리더 {yohoeInfo.leader_count}명</div>
                      </td>

                      {/* 금주 데이터 */}
                      <td style={{ border: '1px solid #000000' }}>
                        <table className="w-full border-collapse">
                          <tr>
                            <td className="p-1 text-center text-xs bg-blue-50" style={{width: '12%', color: '#000000', borderRight: '1px solid #000000'}}>금주</td>
                            <td className="p-1 text-center text-xs" style={{width: '15%', color: '#000000', borderRight: '1px solid #000000'}}>총</td>
                            <td className="p-1 text-center text-xs" style={{width: '15%', color: '#000000', borderRight: '1px solid #000000'}}>1대1</td>
                            <td className="p-1 text-center text-xs" style={{width: '15%', color: '#000000', borderRight: '1px solid #000000'}}>참석리더</td>
                            <td className="p-1 text-center text-xs" style={{width: '15%', color: '#000000', borderRight: '1px solid #000000'}}>불참리더</td>
                            <td className="p-1 text-center text-xs" style={{width: '28%', color: '#000000'}}>양</td>
                          </tr>
                          <tr>
                            <td className="p-1 text-center text-xs bg-blue-50" style={{ color: '#000000', borderRight: '1px solid #000000' }}></td>
                            <td className="p-1 text-center font-bold" style={{ color: '#000000', borderRight: '1px solid #000000' }}>{totalAttendees}</td>
                            <td className="p-1 text-center" style={{ color: '#000000', borderRight: '1px solid #000000' }}>{currentWeekReport?.one_to_one_count || 0}</td>
                            <td className="p-1 text-center" style={{ color: '#000000', borderRight: '1px solid #000000' }}>{currentWeekReport?.attended_leaders_count || 0}</td>
                            <td className="p-1 text-center" style={{ color: '#000000', borderRight: '1px solid #000000' }}>{currentWeekReport?.absent_leaders_count || 0}</td>
                            <td className="p-1 text-center" style={{ color: '#000000' }}>
                              {yangSum} (신입생 {currentWeekReport?.attended_freshmen_count || 0})
                            </td>
                          </tr>
                        </table>
                      </td>

                      {/* 명단 - 2행에 걸쳐 표시 */}
                      <td className="px-2 py-2 align-top text-left" rowSpan={2} style={{ border: '1px solid #000000' }}>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-start gap-1">
                            <span className="inline-block w-12 text-xs font-semibold" style={{ color: '#000000' }}>학사양</span>
                            <span className="flex-1" style={{ color: '#000000' }}>{currentWeekReport?.attended_graduates_names || '-'}</span>
                          </div>
                          <div className="flex items-start gap-1">
                            <span className="inline-block w-12 text-xs font-semibold" style={{ color: '#000000' }}>재학생양</span>
                            <span className="flex-1" style={{ color: '#000000' }}>{currentWeekReport?.attended_students_names || '-'}</span>
                          </div>
                          <div className="flex items-start gap-1">
                            <span className="inline-block w-12 text-xs font-semibold" style={{ color: '#000000' }}>신입생</span>
                            <span className="flex-1" style={{ color: '#000000' }}>{currentWeekReport?.attended_freshmen_names || '-'}</span>
                          </div>
                          <div className="flex items-start gap-1">
                            <span className="inline-block w-12 text-xs font-semibold" style={{ color: '#000000' }}>불참리더</span>
                            <span className="flex-1" style={{ color: '#000000' }}>{currentWeekReport?.absent_leaders_names || '-'}</span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* 지난주 데이터 */}
                    <tr>
                      <td style={{ border: '1px solid #000000' }}>
                        <table className="w-full border-collapse">
                          <tr>
                            <td className="p-1 text-center text-xs bg-gray-50" style={{width: '12%', color: '#000000', borderRight: '1px solid #000000'}}>지난주</td>
                            <td className="p-1 text-center text-xs" style={{width: '15%', color: '#000000', borderRight: '1px solid #000000'}}>총</td>
                            <td className="p-1 text-center text-xs" style={{width: '15%', color: '#000000', borderRight: '1px solid #000000'}}>1대1</td>
                            <td className="p-1 text-center text-xs" style={{width: '15%', color: '#000000', borderRight: '1px solid #000000'}}>참석리더</td>
                            <td className="p-1 text-center text-xs" style={{width: '15%', color: '#000000', borderRight: '1px solid #000000'}}>불참리더</td>
                            <td className="p-1 text-center text-xs" style={{width: '28%', color: '#000000'}}>양</td>
                          </tr>
                          <tr>
                            <td className="p-1 text-center text-xs bg-gray-50" style={{ color: '#000000', borderRight: '1px solid #000000' }}></td>
                            <td className="p-1 text-center" style={{ color: '#000000', borderRight: '1px solid #000000' }}>0</td>
                            <td className="p-1 text-center" style={{ color: '#000000', borderRight: '1px solid #000000' }}>0</td>
                            <td className="p-1 text-center" style={{ color: '#000000', borderRight: '1px solid #000000' }}>0</td>
                            <td className="p-1 text-center" style={{ color: '#000000', borderRight: '1px solid #000000' }}>0</td>
                            <td className="p-1 text-center" style={{ color: '#000000' }}>
                              0 (신입생 0)
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}

              {/* 총합 행 */}
              <tr className="bg-gray-100 font-bold">
                <td className="px-2 py-2 text-center" style={{ color: '#000000', border: '1px solid #000000' }}>총계</td>
                <td style={{ border: '1px solid #000000' }}>
                  <table className="w-full border-collapse">
                    <tr>
                      <td className="p-1 text-center text-xs bg-gray-50" style={{width: '12%', color: '#000000', borderRight: '1px solid #000000'}}>금주</td>
                      <td className="p-1 text-center font-bold" style={{width: '15%', color: '#000000', borderRight: '1px solid #000000'}}>{totals.total}</td>
                      <td className="p-1 text-center font-bold" style={{width: '15%', color: '#000000', borderRight: '1px solid #000000'}}>{totals.one_to_one}</td>
                      <td className="p-1 text-center font-bold" style={{width: '15%', color: '#000000', borderRight: '1px solid #000000'}}>{totals.attended_leaders}</td>
                      <td className="p-1 text-center font-bold" style={{width: '15%', color: '#000000', borderRight: '1px solid #000000'}}>{totals.absent_leaders}</td>
                      <td className="p-1 text-center font-bold" style={{width: '28%', color: '#000000'}}>
                        {totals.yang} (신입생 {totals.freshmen})
                      </td>
                    </tr>
                    <tr>
                      <td className="p-1 text-center text-xs bg-gray-50" style={{ color: '#000000', borderRight: '1px solid #000000' }}>지난주</td>
                      <td className="p-1 text-center" style={{ color: '#000000', borderRight: '1px solid #000000' }}>0</td>
                      <td className="p-1 text-center" style={{ color: '#000000', borderRight: '1px solid #000000' }}>0</td>
                      <td className="p-1 text-center" style={{ color: '#000000', borderRight: '1px solid #000000' }}>0</td>
                      <td className="p-1 text-center" style={{ color: '#000000', borderRight: '1px solid #000000' }}>0</td>
                      <td className="p-1 text-center" style={{ color: '#000000' }}>
                        0 (신입생 0)
                      </td>
                    </tr>
                  </table>
                </td>
                <td className="px-2 py-2 text-center" style={{ color: '#000000', border: '1px solid #000000' }}>
                  <div className="text-xs">
                    <div className="mb-1 font-bold">과거추이</div>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr>
                          <th className="p-1" style={{ color: '#000000', border: '1px solid #000000' }}>주차</th>
                          <th className="p-1" style={{ color: '#000000', border: '1px solid #000000' }}>총</th>
                          <th className="p-1" style={{ color: '#000000', border: '1px solid #000000' }}>1대1</th>
                          <th className="p-1" style={{ color: '#000000', border: '1px solid #000000' }}>참석</th>
                          <th className="p-1" style={{ color: '#000000', border: '1px solid #000000' }}>불참</th>
                          <th className="p-1" style={{ color: '#000000', border: '1px solid #000000' }}>양</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4, 5].map((week) => (
                          <tr key={week}>
                            <td className="p-1 text-center" style={{ color: '#000000', border: '1px solid #000000' }}>{week}주 전</td>
                            <td className="p-1 text-center" style={{ color: '#000000', border: '1px solid #000000' }}>0</td>
                            <td className="p-1 text-center" style={{ color: '#000000', border: '1px solid #000000' }}>0</td>
                            <td className="p-1 text-center" style={{ color: '#000000', border: '1px solid #000000' }}>0</td>
                            <td className="p-1 text-center" style={{ color: '#000000', border: '1px solid #000000' }}>0</td>
                            <td className="p-1 text-center" style={{ color: '#000000', border: '1px solid #000000' }}>0</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PDFPrintView;
