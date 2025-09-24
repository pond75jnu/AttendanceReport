import React, { useRef } from 'react';

const ExactGridReport = ({ data, onClose, onExport }) => {
  const hasExecutedRef = useRef(false);

  const handlePrint = React.useCallback(() => {
    if (!data) return;

    const printWindow = window.open('', '_blank', 'width=794,height=1123');

    const { reports, weekInfo, yohoeList, weeklyTheme } = data;

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
      const currentWeekReport = reports.find(r => r.yohoe_id === yohoe.id);
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
        <title>주간 역사 보고서</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 10mm;
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
            font-size: 11px;
            background: white;
            padding: 15px;
            line-height: 1.0;
          }

          .header {
            text-align: center;
            margin-bottom: 12px;
          }

          .header h1 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 4px;
            letter-spacing: 0.5px;
          }

          .header .theme {
            font-size: 11px;
            margin-bottom: 3px;
          }

          .header .date {
            font-size: 10px;
          }

          /* 정확한 13x44 격자 테이블 */
          .exact-grid {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            table-layout: fixed;
            border: 2px solid black;
          }

          /* 13개 열 정확한 너비 */
          .exact-grid colgroup col:nth-child(1) { width: 7.69%; }   /* 1칸 */
          .exact-grid colgroup col:nth-child(2) { width: 7.69%; }   /* 2칸 */
          .exact-grid colgroup col:nth-child(3) { width: 7.69%; }   /* 3칸 */
          .exact-grid colgroup col:nth-child(4) { width: 7.69%; }   /* 4칸 */
          .exact-grid colgroup col:nth-child(5) { width: 7.69%; }   /* 5칸 */
          .exact-grid colgroup col:nth-child(6) { width: 7.69%; }   /* 6칸 */
          .exact-grid colgroup col:nth-child(7) { width: 7.69%; }   /* 7칸 */
          .exact-grid colgroup col:nth-child(8) { width: 7.69%; }   /* 8칸 */
          .exact-grid colgroup col:nth-child(9) { width: 7.69%; }   /* 9칸 */
          .exact-grid colgroup col:nth-child(10) { width: 7.69%; }  /* 10칸 */
          .exact-grid colgroup col:nth-child(11) { width: 7.69%; }  /* 11칸 */
          .exact-grid colgroup col:nth-child(12) { width: 7.69%; }  /* 12칸 */
          .exact-grid colgroup col:nth-child(13) { width: 7.69%; }  /* 13칸 */

          .exact-grid td, .exact-grid th {
            border: 1px solid black;
            text-align: center;
            vertical-align: middle;
            padding: 1px;
            height: 16px;
            font-size: 8px;
          }

          .exact-grid th {
            background-color: #f0f0f0;
            font-weight: bold;
            font-size: 9px;
            border: 1px solid black;
          }

          /* 요회명 셀 */
          .yohoe-cell {
            font-weight: bold;
            font-size: 8px;
            text-align: center;
            vertical-align: middle;
            padding: 2px;
            line-height: 1.1;
          }

          /* 주차 라벨 */
          .week-label {
            font-weight: bold;
            font-size: 8px;
            background-color: #f8f8f8;
          }

          /* 숫자 셀 */
          .number-cell {
            font-size: 8px;
            text-align: center;
          }

          /* 명단 셀 */
          .names-cell {
            font-size: 7px;
            text-align: left;
            padding: 1px 2px;
            word-break: break-all;
            line-height: 1.0;
          }

          /* 총계 행 */
          .totals-row {
            background-color: #e8e8e8;
            font-weight: bold;
          }

          .totals-cell {
            font-weight: bold;
            font-size: 9px;
          }

          /* 과거추이 헤더 */
          .history-header {
            font-weight: bold;
            font-size: 8px;
            background-color: #f0f0f0;
          }

          /* 과거추이 셀 */
          .history-cell {
            font-size: 6px;
            text-align: center;
            line-height: 1.0;
            padding: 1px;
          }

          .print-button {
            margin: 10px auto;
            text-align: center;
          }

          .print-button button {
            padding: 8px 16px;
            font-size: 12px;
            font-weight: bold;
            margin: 0 5px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
          }

          .print-btn {
            background: #007bff;
            color: white;
          }

          .close-btn {
            background: #6c757d;
            color: white;
          }

          @media print {
            .print-button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <!-- 제목 -->
        <div class="header">
          <h1>주간 역사 보고서</h1>
          <div class="theme">"${weeklyTheme || '여호와, 인자와 진실이 많으신 하나님'}"</div>
          <div class="date">${weekInfo.year}년 ${weekInfo.month}월 ${weekInfo.day}일(주일)</div>
        </div>

        <!-- 정확한 13x44 격자 테이블 -->
        <table class="exact-grid">
          <colgroup>
            <col><col><col><col><col><col><col><col><col><col><col><col><col>
          </colgroup>

          <!-- 헤더 1행: 요회(1칸) + 예배참석자수(6칸병합) + 명단(6칸병합) -->
          <tr>
            <th rowspan="2">요회</th>
            <th colspan="6">예배 참석자 수</th>
            <th colspan="6">명단</th>
          </tr>

          <!-- 헤더 2행: 세부 항목들 -->
          <tr>
            <th>총</th>
            <th>1대1</th>
            <th>참석리더</th>
            <th>불참리더</th>
            <th colspan="2">양</th>
            <th>학사양</th>
            <th>재학생양</th>
            <th>신입생</th>
            <th colspan="2">불참리더</th>
          </tr>

          ${processedData.map(item => {
            const { yohoeInfo, currentWeekReport } = item;
            const currentTotal = getAttendeeSum(currentWeekReport, yohoeInfo);
            const currentYang = getYangSum(currentWeekReport);

            return `
              <!-- 각 요회마다 4행 -->
              <!-- 1행: 요회명(4행병합) + 금주 데이터 + 명단 첫 줄 -->
              <tr>
                <td rowspan="4" class="yohoe-cell">
                  ${yohoeInfo.name}<br>
                  (${yohoeInfo.shepherd})<br>
                  리더 ${yohoeInfo.leader_count}명
                </td>
                <td class="week-label">금주</td>
                <td class="number-cell">${currentTotal}</td>
                <td class="number-cell">${currentWeekReport?.one_to_one_count || 0}</td>
                <td class="number-cell">${currentWeekReport?.attended_leaders_count || 0}</td>
                <td class="number-cell">${currentWeekReport?.absent_leaders_count || 0}</td>
                <td colspan="2" class="number-cell">${currentYang} (신입생 ${currentWeekReport?.attended_freshmen_count || 0})</td>
                <td class="names-cell">${currentWeekReport?.attended_graduates_names || '-'}</td>
                <td colspan="5" class="names-cell">${currentWeekReport?.attended_students_names || '-'}</td>
              </tr>

              <!-- 2행: 지난주 데이터 + 명단 둘째 줄 -->
              <tr>
                <td class="week-label">지난주</td>
                <td class="number-cell">0</td>
                <td class="number-cell">0</td>
                <td class="number-cell">0</td>
                <td class="number-cell">0</td>
                <td colspan="2" class="number-cell">0 (신입생 0)</td>
                <td class="names-cell">-</td>
                <td colspan="5" class="names-cell">${currentWeekReport?.attended_freshmen_names || '-'}</td>
              </tr>

              <!-- 3행: 빈 행 + 명단 셋째 줄 -->
              <tr>
                <td colspan="6"></td>
                <td class="names-cell">-</td>
                <td colspan="5" class="names-cell">${currentWeekReport?.absent_leaders_names || '-'}</td>
              </tr>

              <!-- 4행: 맨 아래행 (예배참석자수 6칸병합) + 명단 넷째 줄 -->
              <tr>
                <td colspan="6"></td>
                <td class="names-cell">-</td>
                <td colspan="5" class="names-cell">-</td>
              </tr>
            `;
          }).join('')}

          <!-- 총계 영역 (6행) -->

          <!-- 총계 1행: 총계헤더(6행병합) + 과거추이헤더(6칸병합) -->
          <tr class="totals-row">
            <td rowspan="6" class="totals-cell">총계</td>
            <td class="week-label">금주</td>
            <td class="number-cell">${totals.total}</td>
            <td class="number-cell">${totals.one_to_one}</td>
            <td class="number-cell">${totals.attended_leaders}</td>
            <td class="number-cell">${totals.absent_leaders}</td>
            <td colspan="2" class="number-cell">${totals.yang} (신입생 ${totals.freshmen})</td>
            <td colspan="6" class="history-header">과거추이</td>
          </tr>

          <!-- 총계 2행 -->
          <tr class="totals-row">
            <td class="week-label">지난주</td>
            <td class="number-cell">0</td>
            <td class="number-cell">0</td>
            <td class="number-cell">0</td>
            <td class="number-cell">0</td>
            <td colspan="2" class="number-cell">0 (신입생 0)</td>
            <td class="history-cell">주차</td>
            <td class="history-cell">총</td>
            <td class="history-cell">1대1</td>
            <td class="history-cell">참석</td>
            <td class="history-cell">불참</td>
            <td class="history-cell">양</td>
          </tr>

          <!-- 총계 3행: 예배참석자수(6칸병합) + 과거추이 데이터 -->
          <tr class="totals-row">
            <td colspan="6"></td>
            <td class="history-cell">1주 전<br>(2025-09-14)</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0 (신입생 0)</td>
          </tr>

          <!-- 총계 4행: 예배참석자수(6칸병합) + 과거추이 데이터 -->
          <tr class="totals-row">
            <td colspan="6"></td>
            <td class="history-cell">2주 전<br>(2025-09-07)</td>
            <td class="history-cell">38</td>
            <td class="history-cell">8</td>
            <td class="history-cell">32</td>
            <td class="history-cell">2</td>
            <td class="history-cell">5 (신입생 0)</td>
          </tr>

          <!-- 총계 5행: 예배참석자수(6칸병합) + 과거추이 데이터 -->
          <tr class="totals-row">
            <td colspan="6"></td>
            <td class="history-cell">3주 전<br>(2025-08-31)</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0 (신입생 0)</td>
          </tr>

          <!-- 총계 6행: 예배참석자수(6칸병합) + 과거추이 데이터 -->
          <tr class="totals-row">
            <td colspan="6"></td>
            <td class="history-cell">4주 전<br>(2025-08-24)</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0 (신입생 0)</td>
          </tr>

          <!-- 총계 7행: 예배참석자수(6칸병합) + 과거추이 데이터 -->
          <tr class="totals-row">
            <td colspan="6"></td>
            <td class="history-cell">5주 전<br>(2025-08-17)</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0</td>
            <td class="history-cell">0 (신입생 0)</td>
          </tr>
        </table>

        <div class="print-button">
          <button class="print-btn" onclick="window.print()">🖨️ PDF로 인쇄하기</button>
          <button class="close-btn" onclick="window.close()">❌ 닫기</button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    onExport && onExport();
    onClose && onClose();
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

export default ExactGridReport;