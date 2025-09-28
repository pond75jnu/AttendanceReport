import React, { useRef } from 'react';
import { filterReportsByWeek } from '../lib/reportUtils';

const PixelPerfectReport = ({ data, onClose, onExport }) => {
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
              margin: 15mm;
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
            padding: 25px;
            line-height: 1.2;
          }

          .header {
            text-align: center;
            margin-bottom: 20px;
          }

          .header h1 {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 8px;
            letter-spacing: 1px;
          }

          .header .theme {
            font-size: 13px;
            margin-bottom: 5px;
          }

          .header .date {
            font-size: 11px;
          }

          .main-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid black;
            font-size: 11px;
          }

          .main-table th {
            border: 2px solid black;
            background-color: #f0f0f0;
            text-align: center;
            font-weight: bold;
            padding: 6px 4px;
            vertical-align: middle;
          }

          .main-table td {
            border: 1px solid black;
            text-align: center;
            vertical-align: middle;
            padding: 3px 2px;
          }

          /* 헤더 스타일 */
          .yohoe-header {
            width: 80px;
            font-size: 12px;
          }

          .attendance-header {
            font-size: 11px;
          }

          .names-header {
            width: 220px;
            font-size: 12px;
          }

          /* 하위 헤더 스타일 */
          .sub-header-total { width: 28px; font-size: 10px; }
          .sub-header-oneone { width: 35px; font-size: 10px; }
          .sub-header-attend { width: 48px; font-size: 10px; }
          .sub-header-absent { width: 48px; font-size: 10px; }
          .sub-header-yang { width: 70px; font-size: 10px; }

          /* 요회명 셀 */
          .yohoe-cell {
            width: 80px;
            font-weight: bold;
            font-size: 11px;
            text-align: center;
            vertical-align: middle;
            border-right: 2px solid black;
            padding: 8px 4px;
          }

          .yohoe-name {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 3px;
          }

          .yohoe-shepherd {
            font-size: 9px;
            margin-bottom: 2px;
          }

          .yohoe-leader {
            font-size: 9px;
          }

          /* 주차 라벨 */
          .week-label {
            font-weight: bold;
            font-size: 10px;
            width: 32px;
            background-color: #f8f8f8;
          }

          /* 숫자 셀 */
          .number-cell {
            font-size: 11px;
            text-align: center;
          }

          /* 명단 셀 */
          .names-cell {
            width: 220px;
            border-left: 2px solid black;
            padding: 0;
            vertical-align: top;
          }

          .names-container {
            display: flex;
            flex-direction: column;
            height: 100%;
          }

          .names-row {
            display: flex;
            height: 50%;
            border-bottom: 1px solid #ccc;
          }

          .names-row:last-child {
            border-bottom: none;
          }

          .names-label {
            width: 60px;
            background-color: #fafafa;
            border-right: 1px solid #ccc;
            text-align: center;
            font-weight: bold;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2px;
          }

          .names-content {
            flex: 1;
            text-align: left;
            font-size: 10px;
            padding: 3px 5px;
            display: flex;
            align-items: center;
            word-break: break-all;
          }

          /* 총계 행 */
          .totals-row {
            background-color: #e8e8e8;
            font-weight: bold;
          }

          .totals-row td {
            border: 1px solid black;
          }

          .totals-cell {
            font-weight: bold;
            font-size: 11px;
            border-right: 2px solid black;
            border-left: 2px solid black;
          }

          /* 과거추이 */
          .history-cell {
            width: 220px;
            padding: 8px;
            text-align: center;
            vertical-align: top;
            border-left: 2px solid black;
          }

          .history-title {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 6px;
          }

          .history-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
            background: white;
            border: 1px solid black;
          }

          .history-table th,
          .history-table td {
            border: 1px solid black;
            padding: 2px 1px;
            text-align: center;
          }

          .history-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            font-size: 8px;
          }

          .history-week {
            font-size: 7px;
            line-height: 1.1;
            width: 45px;
          }

          .history-number {
            font-size: 8px;
            width: 25px;
          }

          .history-yang {
            font-size: 7px;
            width: 55px;
          }

          .print-button {
            margin: 20px auto;
            text-align: center;
          }

          .print-button button {
            padding: 12px 24px;
            font-size: 16px;
            font-weight: bold;
            margin: 0 8px;
            border: none;
            border-radius: 5px;
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
        <!-- 제목 부분 -->
        <div class="header">
          <h1>주간 역사 보고서</h1>
          <div class="theme">"${weeklyTheme || '여호와, 인자와 진실이 많으신 하나님'}"</div>
          <div class="date">${weekInfo.year}년 ${weekInfo.month}월 ${weekInfo.day}일(주일)</div>
        </div>

        <!-- 메인 테이블 -->
        <table class="main-table">
          <thead>
            <tr>
              <th rowspan="2" class="yohoe-header">요회</th>
              <th colspan="5" class="attendance-header">예배 참석자 수</th>
              <th rowspan="2" class="names-header">명단</th>
            </tr>
            <tr>
              <th class="sub-header-total">총</th>
              <th class="sub-header-oneone">1대1</th>
              <th class="sub-header-attend">참석리더</th>
              <th class="sub-header-absent">불참리더</th>
              <th class="sub-header-yang">양</th>
            </tr>
          </thead>
          <tbody>
            ${processedData.map(item => {
              const { yohoeInfo, currentWeekReport } = item;
              const currentTotal = getAttendeeSum(currentWeekReport, yohoeInfo);
              const currentYang = getYangSum(currentWeekReport);

              return `
                <!-- 각 요회마다 정확히 2행 -->
                <tr>
                  <td rowspan="2" class="yohoe-cell">
                    <div class="yohoe-name">${yohoeInfo.name}</div>
                    <div class="yohoe-shepherd">(${yohoeInfo.shepherd})</div>
                    <div class="yohoe-leader">리더 ${yohoeInfo.leader_count}명</div>
                  </td>
                  <td class="week-label">금주</td>
                  <td class="number-cell">${currentTotal}</td>
                  <td class="number-cell">${currentWeekReport?.one_to_one_count || 0}</td>
                  <td class="number-cell">${currentWeekReport?.attended_leaders_count || 0}</td>
                  <td class="number-cell">${currentWeekReport?.absent_leaders_count || 0}</td>
                  <td class="number-cell">${currentYang} (신입생 ${currentWeekReport?.attended_freshmen_count || 0})</td>
                  <td rowspan="2" class="names-cell">
                    <div class="names-container">
                      <div class="names-row">
                        <div class="names-label">학사양</div>
                        <div class="names-content">${currentWeekReport?.attended_graduates_names || '-'}</div>
                      </div>
                      <div class="names-row" style="display: flex;">
                        <div style="display: flex; flex-direction: column; width: 50%;">
                          <div style="display: flex; height: 50%; border-bottom: 1px solid #ccc;">
                            <div class="names-label" style="width: 120px;">재학생양</div>
                            <div class="names-content" style="width: calc(100% - 120px);">${currentWeekReport?.attended_students_names || '-'}</div>
                          </div>
                          <div style="display: flex; height: 50%;">
                            <div class="names-label" style="width: 120px;">신입생</div>
                            <div class="names-content" style="width: calc(100% - 120px);">${currentWeekReport?.attended_freshmen_names || '-'}</div>
                          </div>
                        </div>
                        <div style="display: flex; width: 50%; border-left: 1px solid #ccc;">
                          <div class="names-label" style="width: 120px;">불참리더</div>
                          <div class="names-content" style="width: calc(100% - 120px);">${currentWeekReport?.absent_leaders_names || '-'}</div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="week-label">지난주</td>
                  <td class="number-cell">0</td>
                  <td class="number-cell">0</td>
                  <td class="number-cell">0</td>
                  <td class="number-cell">0</td>
                  <td class="number-cell">0 (신입생 0)</td>
                </tr>
              `;
            }).join('')}

            <!-- 총계 행 -->
            <tr class="totals-row">
              <td rowspan="2" class="totals-cell">총계</td>
              <td class="week-label">금주</td>
              <td class="number-cell">${totals.total}</td>
              <td class="number-cell">${totals.one_to_one}</td>
              <td class="number-cell">${totals.attended_leaders}</td>
              <td class="number-cell">${totals.absent_leaders}</td>
              <td class="number-cell">${totals.yang} (신입생 ${totals.freshmen})</td>
              <td rowspan="2" class="history-cell">
                <div class="history-title">과거추이</div>
                <table class="history-table">
                  <thead>
                    <tr>
                      <th class="history-week">주차</th>
                      <th class="history-number">총</th>
                      <th class="history-number">1대1</th>
                      <th class="history-number">참석</th>
                      <th class="history-number">불참</th>
                      <th class="history-yang">양</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="history-week">1주 전<br>(2025-09-14)</td>
                      <td class="history-number">0</td>
                      <td class="history-number">0</td>
                      <td class="history-number">0</td>
                      <td class="history-number">0</td>
                      <td class="history-yang">0 (신입생 0)</td>
                    </tr>
                    <tr>
                      <td class="history-week">2주 전<br>(2025-09-07)</td>
                      <td class="history-number">38</td>
                      <td class="history-number">8</td>
                      <td class="history-number">32</td>
                      <td class="history-number">2</td>
                      <td class="history-yang">5 (신입생 0)</td>
                    </tr>
                    <tr>
                      <td class="history-week">3주 전<br>(2025-08-31)</td>
                      <td class="history-number">0</td>
                      <td class="history-number">0</td>
                      <td class="history-number">0</td>
                      <td class="history-number">0</td>
                      <td class="history-yang">0 (신입생 0)</td>
                    </tr>
                    <tr>
                      <td class="history-week">4주 전<br>(2025-08-24)</td>
                      <td class="history-number">0</td>
                      <td class="history-number">0</td>
                      <td class="history-number">0</td>
                      <td class="history-number">0</td>
                      <td class="history-yang">0 (신입생 0)</td>
                    </tr>
                    <tr>
                      <td class="history-week">5주 전<br>(2025-08-17)</td>
                      <td class="history-number">0</td>
                      <td class="history-number">0</td>
                      <td class="history-number">0</td>
                      <td class="history-number">0</td>
                      <td class="history-yang">0 (신입생 0)</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr class="totals-row">
              <td class="week-label">지난주</td>
              <td class="number-cell">0</td>
              <td class="number-cell">0</td>
              <td class="number-cell">0</td>
              <td class="number-cell">0</td>
              <td class="number-cell">0 (신입생 0)</td>
            </tr>
          </tbody>
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

export default PixelPerfectReport;
