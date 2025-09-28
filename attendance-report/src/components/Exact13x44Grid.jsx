import React, { useRef } from 'react';
import { filterReportsByWeek } from '../lib/reportUtils';

const Exact13x44Grid = ({ data, onClose, onExport }) => {
  const hasExecutedRef = useRef(false);

  const handlePrint = React.useCallback(() => {
    if (!data) return;

    // 숨겨진 iframe 생성
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const { reports, weekInfo, yohoeList, weeklyTheme } = data;
    const weeklyReports = filterReportsByWeek(reports, weekInfo);

    // PDF 파일명 생성 (report_YYYYMMDD.pdf 형식)
    const formatDate = (year, month, day) => {
      const yyyy = year;
      const mm = String(month).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      return `${yyyy}${mm}${dd}`;
    };

    const pdfFileName = `report_${formatDate(weekInfo.year, weekInfo.month, weekInfo.day)}.pdf`;

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

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${pdfFileName}</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 8mm;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: "Malgun Gothic", "맑은 고딕", Arial, sans-serif;
            font-size: 12.1px;
            background: white;
            padding: 40px 10px 10px 10px;
            line-height: 1.0;
          }

          .header {
            text-align: center;
            margin-bottom: 8px;
          }

          .header .title {
            font-size: 16.9px;
            font-weight: bold;
            margin-bottom: 3px;
          }

          .header .theme {
            font-size: 12.1px;
            margin-bottom: 2px;
          }

          .header .date {
            font-size: 11px;
            text-align: right;
          }

          /* 정확한 13x44 격자 테이블 */
          .grid-13x44 {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.7px;
            table-layout: fixed;
            border: 2px solid black;
          }

          /* 13개 열 동일한 너비 */
          .grid-13x44 colgroup col {
            width: 7.69%;
          }

          .grid-13x44 td, .grid-13x44 th {
            border: 1px solid black;
            text-align: center;
            vertical-align: middle;
            padding: 1px;
            height: 18.6px;
            font-size: 9.4px;
            line-height: 1.0;
            white-space: nowrap;
          }

          .grid-13x44 th {
            background-color: #f0f0f0;
            font-weight: bold;
            font-size: 10.7px;
          }

          /* 요회명 셀 */
          .yohoe-cell {
            font-weight: bold;
            font-size: 9.4px;
            text-align: center;
            vertical-align: middle;
            padding: 1px;
            line-height: 1.1;
            white-space: nowrap;
          }

          /* 주차 라벨 */
          .week-label {
            font-weight: bold;
            font-size: 9.4px;
            background-color: #f8f8f8;
            white-space: nowrap;
          }

          /* 숫자 셀 */
          .number-cell {
            font-size: 9.4px;
            text-align: center;
            white-space: nowrap;
          }

          /* 명단 셀 */
          .names-cell {
            font-size: 8.0px;
            text-align: left;
            padding: 1px;
            line-height: 1.0;
            white-space: nowrap;
          }

          /* 총계 행 */
          .totals-row {
            background-color: #e8e8e8;
            font-weight: bold;
          }

          .totals-cell {
            font-weight: bold;
            font-size: 10.7px;
            white-space: nowrap;
          }

          /* 과거추이 헤더 */
          .history-header {
            font-weight: bold;
            font-size: 9.4px;
            background-color: #f0f0f0;
            white-space: nowrap;
          }

          /* 과거추이 셀 */
          .history-cell {
            font-size: 6.7px;
            text-align: center;
            line-height: 1.0;
            padding: 1px;
            white-space: nowrap;
          }

          /* 과거추이 날짜 스타일 */
          .history-date {
            font-size: 7px;
            letter-spacing: -0.5px;
            white-space: nowrap;
          }

          /* 총계 양 수 스타일 */
          .yang-count {
            letter-spacing: -0.5px;
            white-space: nowrap;
          }

        </style>
      </head>
      <body>
        <!-- 제목 -->
        <div class="header">
          <div class="title">주간 역사 보고서</div>
          <div class="theme">"${weeklyTheme || '여호와, 인자와 진실이 많으신 하나님'}"</div>
          <div class="date">${weekInfo.year}년 ${weekInfo.month}월 ${weekInfo.day}일(주일)</div>
        </div>

        <!-- 정확한 13x44 격자 테이블 -->
        <table class="grid-13x44">
          <colgroup>
            <col><col><col><col><col><col><col><col><col><col><col><col><col>
          </colgroup>

          <!-- 헤더 (1행): 요회(1칸) + 예배참석자수(6칸병합) + 명단(6칸병합) = 13칸 -->
          <tr>
            <th>요회</th>
            <th colspan="6">예배 참석자 수</th>
            <th colspan="6">명단</th>
          </tr>

          ${processedData.map(item => {
            const { yohoeInfo, currentWeekReport } = item;
            const currentTotal = getAttendeeSum(currentWeekReport, yohoeInfo);
            const currentYang = getYangSum(currentWeekReport);

            return `
              <!-- 각 요회마다 4행 -->
              <!-- 1행: 요회명(4행병합) + 예배참석자수 헤더(6칸) + 명단 첫번째 칸 + 나머지 5칸 병합 -->
              <tr>
                <td rowspan="4" class="yohoe-cell">
                  ${yohoeInfo.name}<br>
                  (${yohoeInfo.shepherd})<br>
                  리더 ${yohoeInfo.leader_count}명
                </td>
                <td class="week-label"></td>
                <td class="week-label">총</td>
                <td class="week-label">1대1</td>
                <td class="week-label">참석리더</td>
                <td class="week-label">불참리더</td>
                <td class="week-label">양</td>
                <td class="names-cell">학사양</td>
                <td colspan="5" class="names-cell">${currentWeekReport?.attended_graduates_names || '-'}</td>
              </tr>

              <!-- 2행: 금주 데이터 + 명단 -->
              <tr>
                <td class="week-label">금주</td>
                <td class="number-cell">${currentTotal}</td>
                <td class="number-cell">${currentWeekReport?.one_to_one_count || 0}</td>
                <td class="number-cell">${currentWeekReport?.attended_leaders_count || 0}</td>
                <td class="number-cell">${currentWeekReport?.absent_leaders_count || 0}</td>
                <td class="number-cell">${currentYang} (신입생 ${currentWeekReport?.attended_freshmen_count || 0})</td>
                <td class="names-cell">재학생양</td>
                <td colspan="5" class="names-cell">${currentWeekReport?.attended_students_names || '-'}</td>
              </tr>

              <!-- 3행: 지난주 데이터 + 명단 -->
              <tr>
                <td class="week-label">지난주</td>
                <td class="number-cell">0</td>
                <td class="number-cell">0</td>
                <td class="number-cell">0</td>
                <td class="number-cell">0</td>
                <td class="number-cell"><span class="yang-count">0 (신입생 0)</span></td>
                <td class="names-cell">신입생</td>
                <td colspan="5" class="names-cell">${currentWeekReport?.attended_freshmen_names || '-'}</td>
              </tr>

              <!-- 4행: 예배참석자수(6칸병합) + 명단 -->
              <tr>
                <td colspan="6"></td>
                <td class="names-cell">불참리더</td>
                <td colspan="5" class="names-cell">${currentWeekReport?.absent_leaders_names || '-'}</td>
              </tr>
            `;
          }).join('')}

          <!-- 총계 영역 (7행) -->

          <!-- 총계 1행: 총계헤더(7행병합) + 예배참석자수 헤더 + 과거추이 헤더(6칸병합) -->
          <tr class="totals-row">
            <td rowspan="7" class="totals-cell">총계</td>
            <td class="week-label"></td>
            <td class="week-label">총</td>
            <td class="week-label">1대1</td>
            <td class="week-label">참석리더</td>
            <td class="week-label">불참리더</td>
            <td class="week-label">양</td>
            <td colspan="6" class="history-header">과거추이</td>
          </tr>

          <!-- 총계 2행: 금주 총계 데이터 + 과거추이 헤더행 -->
          <tr class="totals-row">
            <td class="week-label">금주</td>
            <td class="number-cell">${totals.total}</td>
            <td class="number-cell">${totals.one_to_one}</td>
            <td class="number-cell">${totals.attended_leaders}</td>
            <td class="number-cell">${totals.absent_leaders}</td>
            <td class="number-cell"><span class="yang-count">${totals.yang} (신입생 ${totals.freshmen})</span></td>
            <td class="history-cell">주차</td>
            <td class="history-cell">총</td>
            <td class="history-cell">1대1</td>
            <td class="history-cell">참석</td>
            <td class="history-cell">불참</td>
            <td class="history-cell">양</td>
          </tr>

          <!-- 총계 3행: 지난주 총계 데이터 + 과거추이 1주 전 -->
          <tr class="totals-row">
            <td class="week-label">지난주</td>
            <td class="number-cell">0</td>
            <td class="number-cell">0</td>
            <td class="number-cell">0</td>
            <td class="number-cell">0</td>
            <td class="number-cell"><span class="yang-count">0 (신입생 0)</span></td>
            <td class="history-cell">1주 전<br><span class="history-date">(2025-09-14)</span></td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0 (신입생 0)</td>
          </tr>

          <!-- 총계 4-7행: 예배참석자수(6칸병합) + 과거추이 데이터 -->
          <tr class="totals-row">
            <td colspan="6"></td>
            <td class="history-cell">2주 전<br><span class="history-date">(2025-09-07)</span></td>
            <td class="history-cell">38</td>
            <td class="history-cell">8</td>
            <td class="history-cell">32</td>
            <td class="history-cell">2</td>
            <td class="history-cell">5 (신입생 0)</td>
          </tr>

          <tr class="totals-row">
            <td colspan="6"></td>
            <td class="history-cell">3주 전<br><span class="history-date">(2025-08-31)</span></td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0 (신입생 0)</td>
          </tr>

          <tr class="totals-row">
            <td colspan="6"></td>
            <td class="history-cell">4주 전<br><span class="history-date">(2025-08-24)</span></td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0 (신입생 0)</td>
          </tr>

          <tr class="totals-row">
            <td colspan="6"></td>
            <td class="history-cell">5주 전<br><span class="history-date">(2025-08-17)</span></td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0 (신입생 0)</td>
          </tr>
        </table>

      </body>
      </html>
    `;

    // iframe에 HTML 콘텐츠 작성
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    // iframe의 document.title을 직접 설정
    setTimeout(() => {
      if (iframe.contentWindow && iframe.contentWindow.document) {
        iframe.contentWindow.document.title = pdfFileName;
      }
    }, 100);

    // iframe 로드 완료 후 인쇄 실행
    iframe.onload = () => {
      try {
        // 약간의 지연 후 인쇄 실행 (브라우저가 완전히 렌더링할 시간 제공)
        setTimeout(() => {
          iframe.contentWindow.print();

          // 인쇄 대화상자가 닫힌 후 정리
          setTimeout(() => {
            try {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            } catch {
              console.log('iframe already removed');
            }
            onExport && onExport();
            onClose && onClose();
          }, 2000);
        }, 500);
      } catch (error) {
        console.error('Print failed:', error);
        try {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        } catch {
          console.log('iframe cleanup failed');
        }
        onExport && onExport();
        onClose && onClose();
      }
    };
  }, [data, onClose, onExport]);

  React.useEffect(() => {
    if (data && !hasExecutedRef.current) {
      hasExecutedRef.current = true;
      setTimeout(() => {
        handlePrint();
      }, 100);
    }
  }, [data, handlePrint]);

  return null;
};

export default Exact13x44Grid;
