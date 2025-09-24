import React, { useRef } from 'react';

const HTMLPrintReport = ({ data, onClose, onExport }) => {
  const hasExecutedRef = useRef(false);

  const handlePrint = React.useCallback(() => {
    if (!data) return;

    // 새 창에서 HTML 문서 열기
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

    // HTML 문서 생성
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

          body {
            font-family: "Malgun Gothic", "맑은 고딕", Arial, sans-serif;
            font-size: 12px;
            margin: 0;
            padding: 20px;
            background: white;
          }

          .header {
            text-align: center;
            margin-bottom: 25px;
          }

          .header h1 {
            font-size: 22px;
            font-weight: bold;
            margin: 0 0 8px 0;
          }

          .header .theme {
            font-size: 14px;
            margin: 0 0 5px 0;
          }

          .header .date {
            font-size: 12px;
            margin: 0;
          }

          .report-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid black;
            font-size: 11px;
          }

          .report-table th,
          .report-table td {
            border: 1px solid black;
            text-align: center;
            vertical-align: middle;
            padding: 4px;
          }

          .report-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            font-size: 12px;
            border: 2px solid black;
          }

          .yohoe-cell {
            width: 80px;
            font-weight: bold;
            border: 2px solid black !important;
          }

          .attendance-header {
            font-size: 10px;
          }

          .names-cell {
            width: 180px;
            text-align: left;
            padding: 0;
            border: 2px solid black !important;
          }

          .names-grid {
            display: table;
            width: 100%;
            height: 100%;
            border-collapse: collapse;
          }

          .names-row {
            display: table-row;
            height: 25%;
          }

          .names-label {
            display: table-cell;
            width: 30%;
            text-align: center;
            font-weight: bold;
            font-size: 10px;
            border-right: 1px solid #ccc;
            border-bottom: 1px solid #ccc;
            padding: 3px 2px;
            vertical-align: middle;
            background-color: #fafafa;
          }

          .names-content {
            display: table-cell;
            width: 70%;
            text-align: left;
            font-size: 9px;
            border-bottom: 1px solid #ccc;
            padding: 3px 4px;
            vertical-align: middle;
          }

          .names-row:last-child .names-label,
          .names-row:last-child .names-content {
            border-bottom: none;
          }

          .week-label {
            font-weight: bold;
            background-color: #f8f8f8;
            width: 35px;
          }

          .totals-row {
            background-color: #e8e8e8;
            font-weight: bold;
          }

          .totals-row td {
            border: 1px solid black;
          }

          .history-cell {
            width: 200px;
            padding: 8px;
            text-align: center;
            vertical-align: top;
          }

          .history-title {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 8px;
          }

          .history-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7px;
            background: white;
          }

          .history-table th,
          .history-table td {
            border: 1px solid black;
            padding: 1px 2px;
            text-align: center;
          }

          .history-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }

          .history-week {
            font-size: 6px;
            line-height: 1.1;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>주간 역사 보고서</h1>
          <div class="theme">"${weeklyTheme || '여호와, 인자와 진실이 많으신 하나님'}"</div>
          <div class="date">${weekInfo.year}년 ${weekInfo.month}월 ${weekInfo.day}일(주일)</div>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th rowspan="2" class="yohoe-cell">요회</th>
              <th colspan="5">예배 참석자 수</th>
              <th rowspan="2" class="names-cell">명단</th>
            </tr>
            <tr>
              <th class="attendance-header" style="width: 30px;">총</th>
              <th class="attendance-header" style="width: 35px;">1대1</th>
              <th class="attendance-header" style="width: 50px;">참석리더</th>
              <th class="attendance-header" style="width: 50px;">불참리더</th>
              <th class="attendance-header" style="width: 70px;">양</th>
            </tr>
          </thead>
          <tbody>
            ${processedData.map(item => {
              const { yohoeInfo, currentWeekReport } = item;
              const currentTotal = getAttendeeSum(currentWeekReport, yohoeInfo);
              const currentYang = getYangSum(currentWeekReport);

              return `
                <tr>
                  <td rowspan="4" class="yohoe-cell">
                    <div style="font-weight: bold; font-size: 11px; margin-bottom: 3px;">
                      ${yohoeInfo.name}
                    </div>
                    <div style="font-size: 9px; margin-bottom: 2px;">
                      (${yohoeInfo.shepherd})
                    </div>
                    <div style="font-size: 9px;">
                      리더 ${yohoeInfo.leader_count}명
                    </div>
                  </td>
                  <td class="week-label">금주</td>
                  <td>${currentTotal}</td>
                  <td>${currentWeekReport?.one_to_one_count || 0}</td>
                  <td>${currentWeekReport?.attended_leaders_count || 0}</td>
                  <td>${currentWeekReport?.absent_leaders_count || 0}</td>
                  <td>${currentYang} (신입생 ${currentWeekReport?.attended_freshmen_count || 0})</td>
                  <td rowspan="4" class="names-cell">
                    <div class="names-grid">
                      <div class="names-row">
                        <div class="names-label">학사양</div>
                        <div class="names-content">${currentWeekReport?.attended_graduates_names || '-'}</div>
                      </div>
                      <div class="names-row">
                        <div class="names-label">재학생양</div>
                        <div class="names-content">${currentWeekReport?.attended_students_names || '-'}</div>
                      </div>
                      <div class="names-row">
                        <div class="names-label">신입생</div>
                        <div class="names-content">${currentWeekReport?.attended_freshmen_names || '-'}</div>
                      </div>
                      <div class="names-row">
                        <div class="names-label">불참리더</div>
                        <div class="names-content">${currentWeekReport?.absent_leaders_names || '-'}</div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="week-label">지난주</td>
                  <td>0</td>
                  <td>0</td>
                  <td>0</td>
                  <td>0</td>
                  <td>0 (신입생 0)</td>
                </tr>
                <tr>
                  <td colspan="6"></td>
                </tr>
                <tr>
                  <td colspan="6"></td>
                </tr>
              `;
            }).join('')}

            <!-- 총계 행 -->
            <tr class="totals-row">
              <td rowspan="2" class="yohoe-cell">총계</td>
              <td class="week-label">금주</td>
              <td>${totals.total}</td>
              <td>${totals.one_to_one}</td>
              <td>${totals.attended_leaders}</td>
              <td>${totals.absent_leaders}</td>
              <td>${totals.yang} (신입생 ${totals.freshmen})</td>
              <td rowspan="2" class="history-cell">
                <div class="history-title">과거추이</div>
                <table class="history-table">
                  <tr>
                    <th class="history-week">주차</th>
                    <th>총</th>
                    <th>1대1</th>
                    <th>참석</th>
                    <th>불참</th>
                    <th>양</th>
                  </tr>
                  <tr>
                    <td class="history-week">1주 전<br>(2025-09-14)</td>
                    <td>0</td>
                    <td>0</td>
                    <td>0</td>
                    <td>0</td>
                    <td>0 (신입생 0)</td>
                  </tr>
                  <tr>
                    <td class="history-week">2주 전<br>(2025-09-07)</td>
                    <td>38</td>
                    <td>8</td>
                    <td>32</td>
                    <td>2</td>
                    <td>5 (신입생 0)</td>
                  </tr>
                  <tr>
                    <td class="history-week">3주 전<br>(2025-08-31)</td>
                    <td>0</td>
                    <td>0</td>
                    <td>0</td>
                    <td>0</td>
                    <td>0 (신입생 0)</td>
                  </tr>
                  <tr>
                    <td class="history-week">4주 전<br>(2025-08-24)</td>
                    <td>0</td>
                    <td>0</td>
                    <td>0</td>
                    <td>0</td>
                    <td>0 (신입생 0)</td>
                  </tr>
                  <tr>
                    <td class="history-week">5주 전<br>(2025-08-17)</td>
                    <td>0</td>
                    <td>0</td>
                    <td>0</td>
                    <td>0</td>
                    <td>0 (신입생 0)</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr class="totals-row">
              <td class="week-label">지난주</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
              <td>0 (신입생 0)</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="
            padding: 12px 24px;
            font-size: 16px;
            font-weight: bold;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          ">🖨️ PDF로 인쇄하기</button>

          <button onclick="window.close()" style="
            margin-left: 10px;
            padding: 12px 24px;
            font-size: 16px;
            font-weight: bold;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          ">❌ 닫기</button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // 콜백 호출
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

export default HTMLPrintReport;