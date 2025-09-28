import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { filterReportsByWeek } from '../lib/reportUtils';

const PerfectSamplePDF = ({ data, onClose, onExport }) => {
  const hasExecutedRef = useRef(false);
  const containerRef = useRef(null);

  const generatePDF = React.useCallback(async () => {
    if (!data || !containerRef.current) return;

    try {
      const canvas = await html2canvas(containerRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 210 * 3.78, // A4 width in pixels (210mm * 3.78 px/mm)
        height: 297 * 3.78, // A4 height in pixels (297mm * 3.78 px/mm)
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);

      const { weekInfo } = data;
      const fileName = `주간역사보고서_${weekInfo.year}년_${weekInfo.month}월_${weekInfo.day}일.pdf`;
      pdf.save(fileName);

      onExport && onExport();
      onClose && onClose();
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      onExport && onExport();
      onClose && onClose();
    }
  }, [data, onClose, onExport]);

  React.useEffect(() => {
    if (data && !hasExecutedRef.current) {
      hasExecutedRef.current = true;
      setTimeout(() => {
        generatePDF();
      }, 200);
    }
  }, [data, generatePDF]);

  if (!data) return null;

  const { reports, weekInfo, yohoeList, weeklyTheme } = data;
  const weeklyReports = filterReportsByWeek(reports, weekInfo);

  // Helper 함수들
  const getAttendeeSum = (report, yohoeInfo) => {
    if (!report || !yohoeInfo) return 0;
    return (yohoeInfo.leader_count || 0) + (report.attended_graduates_count || 0) +
           (report.attended_students_count || 0) + (report.attended_freshmen_count || 0) -
           (report.absent_leaders_count || 0);
  };

  const getYangSum = (report) => {
    if (!report) return 0;
    return (report.attended_graduates_count || 0) + (report.attended_students_count || 0) +
           (report.attended_freshmen_count || 0);
  };

  // 데이터 준비
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

  // CSS 스타일 정의 - sample.pdf와 정확히 동일하게
  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: '"Malgun Gothic", "맑은 고딕", Arial, sans-serif',
    fontSize: '11px',
    border: '2px solid black',
    marginTop: '20px'
  };

  const headerCellStyle = {
    border: '2px solid black',
    padding: '8px 4px',
    backgroundColor: '#f0f0f0',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '12px'
  };

  const cellStyle = {
    border: '1px solid black',
    padding: '4px',
    textAlign: 'center',
    fontSize: '11px'
  };

  const yohoeCellStyle = {
    border: '2px solid black',
    padding: '6px 4px',
    textAlign: 'center',
    verticalAlign: 'middle',
    fontWeight: 'bold',
    fontSize: '11px',
    width: '90px'
  };

  const namesCellStyle = {
    border: '1px solid black',
    padding: '4px',
    textAlign: 'left',
    fontSize: '10px',
    verticalAlign: 'top',
    width: '200px'
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        width: '794px', // A4 width at 96dpi
        height: '1123px', // A4 height at 96dpi
        backgroundColor: 'white',
        padding: '40px 30px',
        boxSizing: 'border-box',
        fontFamily: '"Malgun Gothic", "맑은 고딕", Arial, sans-serif'
      }}
    >
      {/* 제목 부분 */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{
          fontSize: '22px',
          fontWeight: 'bold',
          margin: '0 0 12px 0',
          fontFamily: '"Malgun Gothic", "맑은 고딕", Arial, sans-serif'
        }}>
          주간 역사 보고서
        </h1>
        <div style={{
          fontSize: '14px',
          margin: '0 0 8px 0',
          fontFamily: '"Malgun Gothic", "맑은 고딕", Arial, sans-serif'
        }}>
          "{weeklyTheme || '여호와, 인자와 진실이 많으신 하나님'}"
        </div>
        <div style={{
          fontSize: '12px',
          fontFamily: '"Malgun Gothic", "맑은 고딕", Arial, sans-serif'
        }}>
          {weekInfo.year}년 {weekInfo.month}월 {weekInfo.day}일(주일)
        </div>
      </div>

      {/* 메인 테이블 - sample.pdf와 정확히 동일한 구조 */}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th rowSpan="2" style={{ ...headerCellStyle, width: '90px' }}>
              요회
            </th>
            <th colSpan="5" style={headerCellStyle}>
              예배 참석자 수
            </th>
            <th rowSpan="2" style={{ ...headerCellStyle, width: '200px' }}>
              명단
            </th>
          </tr>
          <tr>
            <th style={{ ...headerCellStyle, width: '35px', fontSize: '10px' }}>총</th>
            <th style={{ ...headerCellStyle, width: '40px', fontSize: '10px' }}>1대1</th>
            <th style={{ ...headerCellStyle, width: '60px', fontSize: '10px' }}>참석리더</th>
            <th style={{ ...headerCellStyle, width: '60px', fontSize: '10px' }}>불참리더</th>
            <th style={{ ...headerCellStyle, width: '80px', fontSize: '10px' }}>양</th>
          </tr>
        </thead>
        <tbody>
          {processedData.map((item) => {
            const { yohoeInfo, currentWeekReport } = item;
            const currentTotal = getAttendeeSum(currentWeekReport, yohoeInfo);
            const currentYang = getYangSum(currentWeekReport);

            return (
              <React.Fragment key={yohoeInfo.id}>
                {/* 각 요회마다 정확히 2행 */}

                {/* 금주 행 */}
                <tr>
                  <td rowSpan="4" style={yohoeCellStyle}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {yohoeInfo.name}
                    </div>
                    <div style={{ fontSize: '9px', marginBottom: '2px' }}>
                      ({yohoeInfo.shepherd})
                    </div>
                    <div style={{ fontSize: '9px' }}>
                      리더 {yohoeInfo.leader_count}명
                    </div>
                  </td>
                  <td style={{ ...cellStyle, fontWeight: 'bold' }}>금주</td>
                  <td style={cellStyle}>{currentTotal}</td>
                  <td style={cellStyle}>{currentWeekReport?.one_to_one_count || 0}</td>
                  <td style={cellStyle}>{currentWeekReport?.attended_leaders_count || 0}</td>
                  <td style={cellStyle}>{currentWeekReport?.absent_leaders_count || 0}</td>
                  <td style={cellStyle}>{currentYang} (신입생 {currentWeekReport?.attended_freshmen_count || 0})</td>
                  <td rowSpan="4" style={namesCellStyle}>
                    <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse' }}>
                      <tr style={{ height: '25%' }}>
                        <td style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          width: '25%',
                          textAlign: 'center',
                          borderRight: '1px solid #ccc',
                          borderBottom: '1px solid #ccc',
                          padding: '2px'
                        }}>
                          학사양
                        </td>
                        <td style={{
                          fontSize: '9px',
                          width: '75%',
                          textAlign: 'left',
                          borderBottom: '1px solid #ccc',
                          padding: '2px'
                        }}>
                          {currentWeekReport?.attended_graduates_names || '-'}
                        </td>
                      </tr>
                      <tr style={{ height: '25%' }}>
                        <td style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          borderRight: '1px solid #ccc',
                          borderBottom: '1px solid #ccc',
                          padding: '2px'
                        }}>
                          재학생양
                        </td>
                        <td style={{
                          fontSize: '9px',
                          textAlign: 'left',
                          borderBottom: '1px solid #ccc',
                          padding: '2px'
                        }}>
                          {currentWeekReport?.attended_students_names || '-'}
                        </td>
                      </tr>
                      <tr style={{ height: '25%' }}>
                        <td style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          borderRight: '1px solid #ccc',
                          borderBottom: '1px solid #ccc',
                          padding: '2px'
                        }}>
                          신입생
                        </td>
                        <td style={{
                          fontSize: '9px',
                          textAlign: 'left',
                          borderBottom: '1px solid #ccc',
                          padding: '2px'
                        }}>
                          {currentWeekReport?.attended_freshmen_names || '-'}
                        </td>
                      </tr>
                      <tr style={{ height: '25%' }}>
                        <td style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          borderRight: '1px solid #ccc',
                          padding: '2px'
                        }}>
                          불참리더
                        </td>
                        <td style={{
                          fontSize: '9px',
                          textAlign: 'left',
                          padding: '2px'
                        }}>
                          {currentWeekReport?.absent_leaders_names || '-'}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* 지난주 행 */}
                <tr>
                  <td style={{ ...cellStyle, fontWeight: 'bold' }}>지난주</td>
                  <td style={cellStyle}>0</td>
                  <td style={cellStyle}>0</td>
                  <td style={cellStyle}>0</td>
                  <td style={cellStyle}>0</td>
                  <td style={cellStyle}>0 (신입생 0)</td>
                </tr>

                {/* 빈 행들 (명단용) */}
                <tr>
                  <td colSpan="6" style={{ ...cellStyle, height: '25px' }}></td>
                </tr>
                <tr>
                  <td colSpan="6" style={{ ...cellStyle, height: '25px' }}></td>
                </tr>
              </React.Fragment>
            );
          })}

          {/* 총계 행 */}
          <tr style={{ backgroundColor: '#e8e8e8' }}>
            <td rowSpan="2" style={{
              ...yohoeCellStyle,
              backgroundColor: '#e8e8e8',
              fontSize: '13px',
              fontWeight: 'bold'
            }}>
              총계
            </td>
            <td style={{ ...cellStyle, backgroundColor: '#e8e8e8', fontWeight: 'bold' }}>
              금주
            </td>
            <td style={{ ...cellStyle, backgroundColor: '#e8e8e8', fontWeight: 'bold' }}>
              {totals.total}
            </td>
            <td style={{ ...cellStyle, backgroundColor: '#e8e8e8', fontWeight: 'bold' }}>
              {totals.one_to_one}
            </td>
            <td style={{ ...cellStyle, backgroundColor: '#e8e8e8', fontWeight: 'bold' }}>
              {totals.attended_leaders}
            </td>
            <td style={{ ...cellStyle, backgroundColor: '#e8e8e8', fontWeight: 'bold' }}>
              {totals.absent_leaders}
            </td>
            <td style={{ ...cellStyle, backgroundColor: '#e8e8e8', fontWeight: 'bold' }}>
              {totals.yang} (신입생 {totals.freshmen})
            </td>
            <td rowSpan="2" style={{
              ...namesCellStyle,
              backgroundColor: '#e8e8e8',
              textAlign: 'center',
              verticalAlign: 'top',
              padding: '8px 4px'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '8px' }}>
                과거추이
              </div>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '8px',
                backgroundColor: 'white'
              }}>
                <thead>
                  <tr>
                    <th style={{
                      border: '1px solid black',
                      padding: '2px',
                      fontSize: '8px',
                      fontWeight: 'bold'
                    }}>주차</th>
                    <th style={{
                      border: '1px solid black',
                      padding: '2px',
                      fontSize: '8px',
                      fontWeight: 'bold'
                    }}>총</th>
                    <th style={{
                      border: '1px solid black',
                      padding: '2px',
                      fontSize: '8px',
                      fontWeight: 'bold'
                    }}>1대1</th>
                    <th style={{
                      border: '1px solid black',
                      padding: '2px',
                      fontSize: '8px',
                      fontWeight: 'bold'
                    }}>참석</th>
                    <th style={{
                      border: '1px solid black',
                      padding: '2px',
                      fontSize: '8px',
                      fontWeight: 'bold'
                    }}>불참</th>
                    <th style={{
                      border: '1px solid black',
                      padding: '2px',
                      fontSize: '8px',
                      fontWeight: 'bold'
                    }}>양</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{
                      border: '1px solid black',
                      padding: '1px',
                      fontSize: '7px',
                      textAlign: 'center'
                    }}>
                      1주 전<br/>(2025-09-14)
                    </td>
                    <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>0</td>
                    <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>0</td>
                    <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>0</td>
                    <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>0</td>
                    <td style={{
                      border: '1px solid black',
                      padding: '1px',
                      textAlign: 'center',
                      fontSize: '7px'
                    }}>0 (신입생 0)</td>
                  </tr>
                  <tr>
                    <td style={{
                      border: '1px solid black',
                      padding: '1px',
                      fontSize: '7px',
                      textAlign: 'center'
                    }}>
                      2주 전<br/>(2025-09-07)
                    </td>
                    <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>38</td>
                    <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>8</td>
                    <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>32</td>
                    <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>2</td>
                    <td style={{
                      border: '1px solid black',
                      padding: '1px',
                      textAlign: 'center',
                      fontSize: '7px'
                    }}>5 (신입생 0)</td>
                  </tr>
                  <tr>
                    <td style={{
                      border: '1px solid black',
                      padding: '1px',
                      fontSize: '7px',
                      textAlign: 'center'
                    }}>
                      3주 전<br/>(2025-08-31)
                    </td>
                    <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>0</td>
                    <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>0</td>
                    <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>0</td>
                    <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>0</td>
                    <td style={{
                      border: '1px solid black',
                      padding: '1px',
                      textAlign: 'center',
                      fontSize: '7px'
                    }}>0 (신입생 0)</td>
                  </tr>
                  <tr>
                    <td style={{
                      border: '1px solid black',
                      padding: '1px',
                      fontSize: '7px',
                      textAlign: 'center'
                    }}>
                      4주 전<br/>(2025-08-24)
                    </td>
                    <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>0</td>
                    <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>0</td>
                    <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>0</td>
                    <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>0</td>
                    <td style={{
                      border: '1px solid black',
                      padding: '1px',
                      textAlign: 'center',
                      fontSize: '7px'
                    }}>0 (신입생 0)</td>
                  </tr>
                  <tr>
                    <td style={{
                      border: '1px solid black',
                      padding: '1px',
                      fontSize: '7px',
                      textAlign: 'center'
                    }}>
                      5주 전<br/>(2025-08-17)
                    </td>
                    <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>0</td>
                    <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>0</td>
                    <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>0</td>
                    <td style={{ border: '1px solid black', padding: '1px', textAlign: 'center' }}>0</td>
                    <td style={{
                      border: '1px solid black',
                      padding: '1px',
                      textAlign: 'center',
                      fontSize: '7px'
                    }}>0 (신입생 0)</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* 지난주 총계 */}
          <tr style={{ backgroundColor: '#e8e8e8' }}>
            <td style={{ ...cellStyle, backgroundColor: '#e8e8e8', fontWeight: 'bold' }}>
              지난주
            </td>
            <td style={{ ...cellStyle, backgroundColor: '#e8e8e8', fontWeight: 'bold' }}>0</td>
            <td style={{ ...cellStyle, backgroundColor: '#e8e8e8', fontWeight: 'bold' }}>0</td>
            <td style={{ ...cellStyle, backgroundColor: '#e8e8e8', fontWeight: 'bold' }}>0</td>
            <td style={{ ...cellStyle, backgroundColor: '#e8e8e8', fontWeight: 'bold' }}>0</td>
            <td style={{ ...cellStyle, backgroundColor: '#e8e8e8', fontWeight: 'bold' }}>
              0 (신입생 0)
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PerfectSamplePDF;
