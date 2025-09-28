import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { filterReportsByWeek } from '../lib/reportUtils';

const ExactSamplePDF = ({ data, onClose, onExport }) => {
  const hasExecutedRef = useRef(false);
  const containerRef = useRef(null);

  const generatePDF = React.useCallback(async () => {
    if (!data || !containerRef.current) return;

    try {
      // html2canvas로 DOM을 이미지로 변환
      const canvas = await html2canvas(containerRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
      });

      // jsPDF 생성
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);

      // 파일 다운로드
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
      }, 100);
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

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        width: '794px',
        height: '1123px',
        backgroundColor: 'white',
        fontFamily: 'Arial, sans-serif',
        padding: '30px',
        boxSizing: 'border-box'
      }}
    >
      {/* 제목 */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
          주간 역사 보고서
        </h1>
        <div style={{ fontSize: '16px', margin: '0 0 10px 0' }}>
          "{weeklyTheme || '여호와, 인자와 진실이 많으신 하나님'}"
        </div>
        <div style={{ fontSize: '14px' }}>
          {weekInfo.year}년 {weekInfo.month}월 {weekInfo.day}일(주일)
        </div>
      </div>

      {/* 메인 테이블 - sample.pdf와 정확히 동일한 구조 */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        border: '2px solid black',
        fontSize: '12px',
        marginTop: '10px'
      }}>
        <thead>
          <tr>
            <th rowSpan="2" style={{
              border: '2px solid black',
              padding: '8px',
              backgroundColor: '#f0f0f0',
              textAlign: 'center',
              width: '120px',
              fontWeight: 'bold'
            }}>
              요회
            </th>
            <th colSpan="5" style={{
              border: '2px solid black',
              padding: '8px',
              backgroundColor: '#f0f0f0',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              예배 참석자 수
            </th>
            <th rowSpan="2" style={{
              border: '2px solid black',
              padding: '8px',
              backgroundColor: '#f0f0f0',
              textAlign: 'center',
              width: '250px',
              fontWeight: 'bold'
            }}>
              명단
            </th>
          </tr>
          <tr>
            <th style={{
              border: '1px solid black',
              padding: '4px',
              backgroundColor: '#f0f0f0',
              textAlign: 'center',
              width: '40px',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>총</th>
            <th style={{
              border: '1px solid black',
              padding: '4px',
              backgroundColor: '#f0f0f0',
              textAlign: 'center',
              width: '50px',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>1대1</th>
            <th style={{
              border: '1px solid black',
              padding: '4px',
              backgroundColor: '#f0f0f0',
              textAlign: 'center',
              width: '70px',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>참석리더</th>
            <th style={{
              border: '1px solid black',
              padding: '4px',
              backgroundColor: '#f0f0f0',
              textAlign: 'center',
              width: '70px',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>불참리더</th>
            <th style={{
              border: '1px solid black',
              padding: '4px',
              backgroundColor: '#f0f0f0',
              textAlign: 'center',
              width: '120px',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>양</th>
          </tr>
        </thead>
        <tbody>
          {processedData.map((item) => {
            const { yohoeInfo, currentWeekReport } = item;
            const currentTotal = getAttendeeSum(currentWeekReport, yohoeInfo);
            const currentYang = getYangSum(currentWeekReport);

            return (
              <React.Fragment key={yohoeInfo.id}>
                {/* 각 요회의 4행 구조 - sample.pdf와 동일하게 */}

                {/* 1행: 금주 데이터 */}
                <tr>
                  <td rowSpan="4" style={{
                    border: '1px solid black',
                    padding: '8px',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    <div>{yohoeInfo.name}</div>
                    <div style={{ fontSize: '10px', marginTop: '4px' }}>
                      ({yohoeInfo.shepherd})
                    </div>
                    <div style={{ fontSize: '10px', marginTop: '4px' }}>
                      리더 {yohoeInfo.leader_count}명
                    </div>
                  </td>
                  <td style={{
                    border: '1px solid black',
                    padding: '4px',
                    textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    금주
                  </td>
                  <td style={{
                    border: '1px solid black',
                    padding: '4px',
                    textAlign: 'center',
                    fontSize: '11px'
                  }}>
                    {currentTotal}
                  </td>
                  <td style={{
                    border: '1px solid black',
                    padding: '4px',
                    textAlign: 'center',
                    fontSize: '11px'
                  }}>
                    {currentWeekReport?.one_to_one_count || 0}
                  </td>
                  <td style={{
                    border: '1px solid black',
                    padding: '4px',
                    textAlign: 'center',
                    fontSize: '11px'
                  }}>
                    {currentWeekReport?.attended_leaders_count || 0}
                  </td>
                  <td style={{
                    border: '1px solid black',
                    padding: '4px',
                    textAlign: 'center',
                    fontSize: '11px'
                  }}>
                    {currentWeekReport?.absent_leaders_count || 0}
                  </td>
                  <td style={{
                    border: '1px solid black',
                    padding: '4px',
                    textAlign: 'center',
                    fontSize: '11px'
                  }}>
                    {currentYang} (신입생 {currentWeekReport?.attended_freshmen_count || 0})
                  </td>
                  <td style={{
                    border: '1px solid black',
                    padding: '4px',
                    textAlign: 'left',
                    fontSize: '10px'
                  }}>
                    <div><strong>학사양</strong></div>
                    <div>{currentWeekReport?.attended_graduates_names || '-'}</div>
                  </td>
                </tr>

                {/* 2행: 지난주 데이터 */}
                <tr>
                  <td style={{
                    border: '1px solid black',
                    padding: '4px',
                    textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    지난주
                  </td>
                  <td style={{
                    border: '1px solid black',
                    padding: '4px',
                    textAlign: 'center',
                    fontSize: '11px'
                  }}>
                    0
                  </td>
                  <td style={{
                    border: '1px solid black',
                    padding: '4px',
                    textAlign: 'center',
                    fontSize: '11px'
                  }}>
                    0
                  </td>
                  <td style={{
                    border: '1px solid black',
                    padding: '4px',
                    textAlign: 'center',
                    fontSize: '11px'
                  }}>
                    0
                  </td>
                  <td style={{
                    border: '1px solid black',
                    padding: '4px',
                    textAlign: 'center',
                    fontSize: '11px'
                  }}>
                    0
                  </td>
                  <td style={{
                    border: '1px solid black',
                    padding: '4px',
                    textAlign: 'center',
                    fontSize: '11px'
                  }}>
                    0 (신입생 0)
                  </td>
                  <td style={{
                    border: '1px solid black',
                    padding: '4px',
                    textAlign: 'left',
                    fontSize: '10px'
                  }}>
                    <div><strong>재학생양</strong></div>
                    <div>{currentWeekReport?.attended_students_names || '-'}</div>
                  </td>
                </tr>

                {/* 3행: 빈 행 + 신입생 */}
                <tr>
                  <td colSpan="6" style={{
                    border: '1px solid black',
                    padding: '4px',
                    textAlign: 'center',
                    fontSize: '11px'
                  }}>

                  </td>
                  <td style={{
                    border: '1px solid black',
                    padding: '4px',
                    textAlign: 'left',
                    fontSize: '10px'
                  }}>
                    <div><strong>신입생</strong></div>
                    <div>{currentWeekReport?.attended_freshmen_names || '-'}</div>
                  </td>
                </tr>

                {/* 4행: 빈 행 + 불참리더 */}
                <tr>
                  <td colSpan="6" style={{
                    border: '1px solid black',
                    padding: '4px',
                    textAlign: 'center',
                    fontSize: '11px'
                  }}>

                  </td>
                  <td style={{
                    border: '1px solid black',
                    padding: '4px',
                    textAlign: 'left',
                    fontSize: '10px'
                  }}>
                    <div><strong>불참리더</strong></div>
                    <div>{currentWeekReport?.absent_leaders_names || '-'}</div>
                  </td>
                </tr>
              </React.Fragment>
            );
          })}

          {/* 총계 행 */}
          <tr style={{ backgroundColor: '#e8e8e8' }}>
            <td rowSpan="2" style={{
              border: '2px solid black',
              padding: '8px',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              총계
            </td>
            <td style={{
              border: '1px solid black',
              padding: '4px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              금주
            </td>
            <td style={{
              border: '1px solid black',
              padding: '4px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              {totals.total}
            </td>
            <td style={{
              border: '1px solid black',
              padding: '4px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              {totals.one_to_one}
            </td>
            <td style={{
              border: '1px solid black',
              padding: '4px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              {totals.attended_leaders}
            </td>
            <td style={{
              border: '1px solid black',
              padding: '4px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              {totals.absent_leaders}
            </td>
            <td style={{
              border: '1px solid black',
              padding: '4px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              {totals.yang} (신입생 {totals.freshmen})
            </td>
            <td rowSpan="2" style={{
              border: '2px solid black',
              padding: '4px',
              textAlign: 'center',
              fontSize: '10px',
              verticalAlign: 'top'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>과거추이</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
                <tr>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', padding: '2px' }}>주차</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', padding: '2px' }}>총</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', padding: '2px' }}>1대1</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', padding: '2px' }}>참석</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', padding: '2px' }}>불참</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', padding: '2px' }}>양</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', padding: '1px', fontSize: '7px' }}>1주 전<br/>(2025-09-14)</td>
                  <td style={{ textAlign: 'center', padding: '1px' }}>0</td>
                  <td style={{ textAlign: 'center', padding: '1px' }}>0</td>
                  <td style={{ textAlign: 'center', padding: '1px' }}>0</td>
                  <td style={{ textAlign: 'center', padding: '1px' }}>0</td>
                  <td style={{ textAlign: 'center', padding: '1px', fontSize: '7px' }}>0 (신입생 0)</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', padding: '1px', fontSize: '7px' }}>2주 전<br/>(2025-09-07)</td>
                  <td style={{ textAlign: 'center', padding: '1px' }}>38</td>
                  <td style={{ textAlign: 'center', padding: '1px' }}>8</td>
                  <td style={{ textAlign: 'center', padding: '1px' }}>32</td>
                  <td style={{ textAlign: 'center', padding: '1px' }}>2</td>
                  <td style={{ textAlign: 'center', padding: '1px', fontSize: '7px' }}>5 (신입생 0)</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', padding: '1px', fontSize: '7px' }}>3주 전<br/>(2025-08-31)</td>
                  <td style={{ textAlign: 'center', padding: '1px' }}>0</td>
                  <td style={{ textAlign: 'center', padding: '1px' }}>0</td>
                  <td style={{ textAlign: 'center', padding: '1px' }}>0</td>
                  <td style={{ textAlign: 'center', padding: '1px' }}>0</td>
                  <td style={{ textAlign: 'center', padding: '1px', fontSize: '7px' }}>0 (신입생 0)</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', padding: '1px', fontSize: '7px' }}>4주 전<br/>(2025-08-24)</td>
                  <td style={{ textAlign: 'center', padding: '1px' }}>0</td>
                  <td style={{ textAlign: 'center', padding: '1px' }}>0</td>
                  <td style={{ textAlign: 'center', padding: '1px' }}>0</td>
                  <td style={{ textAlign: 'center', padding: '1px' }}>0</td>
                  <td style={{ textAlign: 'center', padding: '1px', fontSize: '7px' }}>0 (신입생 0)</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', padding: '1px', fontSize: '7px' }}>5주 전<br/>(2025-08-17)</td>
                  <td style={{ textAlign: 'center', padding: '1px' }}>0</td>
                  <td style={{ textAlign: 'center', padding: '1px' }}>0</td>
                  <td style={{ textAlign: 'center', padding: '1px' }}>0</td>
                  <td style={{ textAlign: 'center', padding: '1px' }}>0</td>
                  <td style={{ textAlign: 'center', padding: '1px', fontSize: '7px' }}>0 (신입생 0)</td>
                </tr>
              </table>
            </td>
          </tr>

          {/* 지난주 총계 */}
          <tr style={{ backgroundColor: '#e8e8e8' }}>
            <td style={{
              border: '1px solid black',
              padding: '4px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              지난주
            </td>
            <td style={{
              border: '1px solid black',
              padding: '4px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              0
            </td>
            <td style={{
              border: '1px solid black',
              padding: '4px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              0
            </td>
            <td style={{
              border: '1px solid black',
              padding: '4px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              0
            </td>
            <td style={{
              border: '1px solid black',
              padding: '4px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              0
            </td>
            <td style={{
              border: '1px solid black',
              padding: '4px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              0 (신입생 0)
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ExactSamplePDF;
