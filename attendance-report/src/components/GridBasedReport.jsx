import React, { useRef } from 'react';
import { filterReportsByWeek } from '../lib/reportUtils';

const GridBasedReport = ({ data, onClose, onExport }) => {
  const hasExecutedRef = useRef(false);

  const handlePrint = React.useCallback(() => {
    if (!data) return;

    const printWindow = window.open('', '_blank', 'width=794,height=1123');

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
              margin: 12mm;
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
            padding: 20px;
            line-height: 1.1;
          }

          .header {
            text-align: center;
            margin-bottom: 15px;
          }

          .header h1 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 6px;
            letter-spacing: 0.5px;
          }

          .header .theme {
            font-size: 12px;
            margin-bottom: 4px;
          }

          .header .date {
            font-size: 10px;
          }

          /* 13×44 격자 테이블 */
          .grid-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            table-layout: fixed;
          }

          /* 13개 열 너비 정의 */
          .grid-table colgroup col:nth-child(1) { width: 7%; }   /* 요회 */
          .grid-table colgroup col:nth-child(2) { width: 5%; }   /* 총 */
          .grid-table colgroup col:nth-child(3) { width: 6%; }   /* 1대1 */
          .grid-table colgroup col:nth-child(4) { width: 8%; }   /* 참석리더 */
          .grid-table colgroup col:nth-child(5) { width: 8%; }   /* 불참리더 */
          .grid-table colgroup col:nth-child(6) { width: 10%; }  /* 양 */
          .grid-table colgroup col:nth-child(7) { width: 14%; }  /* 학사양 */
          .grid-table colgroup col:nth-child(8) { width: 14%; }  /* 재학생양 */
          .grid-table colgroup col:nth-child(9) { width: 14%; }  /* 신입생 */
          .grid-table colgroup col:nth-child(10) { width: 14%; } /* 불참리더 */

          .grid-table td, .grid-table th {
            border: 1px solid black;
            text-align: center;
            vertical-align: middle;
            padding: 2px 1px;
            height: 18px;
          }

          .grid-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            font-size: 10px;
          }

          /* 메인 헤더 */
          .main-header {
            font-size: 11px;
            font-weight: bold;
            border: 2px solid black;
          }

          /* 요회명 셀 */
          .yohoe-name {
            font-weight: bold;
            font-size: 10px;
            border-left: 2px solid black;
            border-right: 2px solid black;
            text-align: center;
            vertical-align: middle;
            writing-mode: vertical-lr;
            text-orientation: mixed;
          }

          /* 주차 라벨 */
          .week-label {
            font-weight: bold;
            font-size: 9px;
            background-color: #f8f8f8;
          }

          /* 숫자 셀 */
          .number-cell {
            font-size: 9px;
            text-align: center;
          }

          /* 명단 셀 */
          .names-cell {
            font-size: 8px;
            text-align: left;
            padding: 1px 3px;
            word-break: break-all;
            line-height: 1.1;
          }

          /* 총계 행 */
          .totals-row {
            background-color: #e8e8e8;
            font-weight: bold;
          }

          .totals-cell {
            font-weight: bold;
            border-left: 2px solid black;
            border-right: 2px solid black;
          }

          /* 과거추이 */
          .history-cell {
            font-size: 7px;
            padding: 2px;
            text-align: center;
            line-height: 1.0;
          }

          .print-button {
            margin: 15px auto;
            text-align: center;
          }

          .print-button button {
            padding: 10px 20px;
            font-size: 14px;
            font-weight: bold;
            margin: 0 8px;
            border: none;
            border-radius: 4px;
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

        <!-- 13×44 격자 테이블 -->
        <table class="grid-table">
          <colgroup>
            <col><col><col><col><col><col><col><col><col><col>
          </colgroup>

          <!-- 헤더 (2행) -->
          <tr>
            <th rowspan="2" class="main-header">요회</th>
            <th colspan="5" class="main-header">예배 참석자 수</th>
            <th colspan="4" class="main-header">명단</th>
          </tr>
          <tr>
            <th class="main-header">총</th>
            <th class="main-header">1대1</th>
            <th class="main-header">참석리더</th>
            <th class="main-header">불참리더</th>
            <th class="main-header">양</th>
            <th class="main-header">학사양</th>
            <th class="main-header">재학생양</th>
            <th class="main-header">신입생</th>
            <th class="main-header">불참리더</th>
          </tr>

          ${processedData.map(item => {
            const { yohoeInfo, currentWeekReport } = item;
            const currentTotal = getAttendeeSum(currentWeekReport, yohoeInfo);
            const currentYang = getYangSum(currentWeekReport);

            return `
              <!-- 각 요회마다 4행 -->
              <tr>
                <td rowspan="4" class="yohoe-name">
                  ${yohoeInfo.name}<br>
                  (${yohoeInfo.shepherd})<br>
                  리더 ${yohoeInfo.leader_count}명
                </td>
                <td class="week-label">금주</td>
                <td class="number-cell">${currentTotal}</td>
                <td class="number-cell">${currentWeekReport?.one_to_one_count || 0}</td>
                <td class="number-cell">${currentWeekReport?.attended_leaders_count || 0}</td>
                <td class="number-cell">${currentWeekReport?.absent_leaders_count || 0}</td>
                <td class="number-cell">${currentYang} (신입생 ${currentWeekReport?.attended_freshmen_count || 0})</td>
                <td class="names-cell">${currentWeekReport?.attended_graduates_names || '-'}</td>
                <td rowspan="4" class="names-cell">${currentWeekReport?.attended_students_names || '-'}</td>
                <td rowspan="4" class="names-cell">${currentWeekReport?.attended_freshmen_names || '-'}</td>
                <td rowspan="4" class="names-cell">${currentWeekReport?.absent_leaders_names || '-'}</td>
              </tr>
              <tr>
                <td class="week-label">지난주</td>
                <td class="number-cell">0</td>
                <td class="number-cell">0</td>
                <td class="number-cell">0</td>
                <td class="number-cell">0</td>
                <td class="number-cell">0 (신입생 0)</td>
                <td class="names-cell">-</td>
              </tr>
              <tr>
                <td colspan="7"></td>
              </tr>
              <tr>
                <td colspan="7"></td>
              </tr>
            `;
          }).join('')}

          <!-- 총계 (2행) -->
          <tr class="totals-row">
            <td rowspan="2" class="totals-cell">총계</td>
            <td class="week-label">금주</td>
            <td class="number-cell">${totals.total}</td>
            <td class="number-cell">${totals.one_to_one}</td>
            <td class="number-cell">${totals.attended_leaders}</td>
            <td class="number-cell">${totals.absent_leaders}</td>
            <td class="number-cell">${totals.yang} (신입생 ${totals.freshmen})</td>
            <td rowspan="2" class="history-cell">
              <strong>과거추이</strong><br>
              <table style="width:100%; font-size:6px; border-collapse:collapse; margin-top:2px;">
                <tr style="border:1px solid black;">
                  <th style="border:1px solid black; padding:1px;">주차</th>
                  <th style="border:1px solid black; padding:1px;">총</th>
                  <th style="border:1px solid black; padding:1px;">1대1</th>
                  <th style="border:1px solid black; padding:1px;">참석</th>
                  <th style="border:1px solid black; padding:1px;">불참</th>
                  <th style="border:1px solid black; padding:1px;">양</th>
                </tr>
                <tr>
                  <td style="border:1px solid black; padding:1px; font-size:5px;">1주 전<br>(2025-09-14)</td>
                  <td style="border:1px solid black; padding:1px;">0</td>
                  <td style="border:1px solid black; padding:1px;">0</td>
                  <td style="border:1px solid black; padding:1px;">0</td>
                  <td style="border:1px solid black; padding:1px;">0</td>
                  <td style="border:1px solid black; padding:1px; font-size:5px;">0 (신입생 0)</td>
                </tr>
                <tr>
                  <td style="border:1px solid black; padding:1px; font-size:5px;">2주 전<br>(2025-09-07)</td>
                  <td style="border:1px solid black; padding:1px;">38</td>
                  <td style="border:1px solid black; padding:1px;">8</td>
                  <td style="border:1px solid black; padding:1px;">32</td>
                  <td style="border:1px solid black; padding:1px;">2</td>
                  <td style="border:1px solid black; padding:1px; font-size:5px;">5 (신입생 0)</td>
                </tr>
                <tr>
                  <td style="border:1px solid black; padding:1px; font-size:5px;">3주 전<br>(2025-08-31)</td>
                  <td style="border:1px solid black; padding:1px;">0</td>
                  <td style="border:1px solid black; padding:1px;">0</td>
                  <td style="border:1px solid black; padding:1px;">0</td>
                  <td style="border:1px solid black; padding:1px;">0</td>
                  <td style="border:1px solid black; padding:1px; font-size:5px;">0 (신입생 0)</td>
                </tr>
                <tr>
                  <td style="border:1px solid black; padding:1px; font-size:5px;">4주 전<br>(2025-08-24)</td>
                  <td style="border:1px solid black; padding:1px;">0</td>
                  <td style="border:1px solid black; padding:1px;">0</td>
                  <td style="border:1px solid black; padding:1px;">0</td>
                  <td style="border:1px solid black; padding:1px;">0</td>
                  <td style="border:1px solid black; padding:1px; font-size:5px;">0 (신입생 0)</td>
                </tr>
                <tr>
                  <td style="border:1px solid black; padding:1px; font-size:5px;">5주 전<br>(2025-08-17)</td>
                  <td style="border:1px solid black; padding:1px;">0</td>
                  <td style="border:1px solid black; padding:1px;">0</td>
                  <td style="border:1px solid black; padding:1px;">0</td>
                  <td style="border:1px solid black; padding:1px;">0</td>
                  <td style="border:1px solid black; padding:1px; font-size:5px;">0 (신입생 0)</td>
                </tr>
              </table>
            </td>
            <td class="names-cell">-</td>
            <td class="names-cell">-</td>
          </tr>
          <tr class="totals-row">
            <td class="week-label">지난주</td>
            <td class="number-cell">0</td>
            <td class="number-cell">0</td>
            <td class="number-cell">0</td>
            <td class="number-cell">0</td>
            <td class="number-cell">0 (신입생 0)</td>
            <td class="names-cell">-</td>
            <td class="names-cell">-</td>
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

export default GridBasedReport;
