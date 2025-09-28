import React from 'react';

// PDF 전용 주간보고서 컴포넌트
const PDFReportView = ({ data, date, weeklyTheme }) => {
  // Helper Functions (기존과 동일)
  const getAttendeeSum = (report, yohoeInfo) => {
    if (!report || !yohoeInfo) return 0;
    return (yohoeInfo.leader_count || 0) + (report.attended_graduates_count || 0) + (report.attended_students_count || 0) + (report.attended_freshmen_count || 0) - (report.absent_leaders_count || 0);
  };

  const getYangSum = (report) => {
    if (!report) return 0;
    return (report.attended_graduates_count || 0) + (report.attended_students_count || 0) + (report.attended_freshmen_count || 0);
  };

  const getSundayOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day;
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - diff);

    const year = sunday.getFullYear();
    const month = String(sunday.getMonth() + 1).padStart(2, '0');
    const dayStr = String(sunday.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  // 총계 계산
  const totals = data.reduce((acc, item) => {
    if(item.currentWeekReport) {
      acc.current.total += getAttendeeSum(item.currentWeekReport, item.yohoeInfo);
      acc.current.one_to_one += item.currentWeekReport.one_to_one_count || 0;
      acc.current.attended_leaders += item.currentWeekReport.attended_leaders_count || 0;
      acc.current.absent_leaders += item.currentWeekReport.absent_leaders_count || 0;
      acc.current.yang += getYangSum(item.currentWeekReport);
      acc.current.shin += item.currentWeekReport.attended_freshmen_count || 0;
    }
    if(item.previousWeekReport) {
      acc.previous.total += getAttendeeSum(item.previousWeekReport, item.yohoeInfo);
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
    <html>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>주간 역사 보고서</title>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Noto Sans KR', sans-serif;
            font-size: 16px;
            line-height: 1.4;
            color: #000;
            background: white;
            margin: 0;
            padding: 10mm;
          }

          .container {
            width: 100%;
            max-width: 100%;
          }

          .header {
            text-align: center;
            margin-bottom: 20px;
          }

          .header h1 {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 8px;
          }

          .header .theme {
            font-size: 18px;
            margin-bottom: 8px;
          }

          .header .date {
            font-size: 16px;
            color: #666;
          }

          .report-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            table-layout: fixed;
          }

          .report-table th,
          .report-table td {
            border: 1px solid #000;
            padding: 12px 8px;
            text-align: center;
            vertical-align: middle;
            font-size: 18px;
          }

          .report-table th {
            background-color: #f5f5f5;
            font-weight: bold;
            font-size: 20px;
          }

          /* 메인 컬럼 너비 설정 */
          .col-yohoe {
            width: 22%;
          }

          .col-attendance {
            width: 43%;
          }

          .col-names {
            width: 35%;
          }

          /* 내부 테이블 */
          .inner-table {
            width: 100%;
            height: 100%;
            border-collapse: collapse;
          }

          .inner-table td,
          .inner-table th {
            border: 1px solid #000;
            padding: 8px 4px;
            text-align: center;
            vertical-align: middle;
            font-size: 18px;
          }

          .inner-table th {
            background-color: #f0f0f0;
            font-size: 16px;
            font-weight: bold;
          }

          /* 내부 테이블 컬럼 너비 */
          .inner-col-empty { width: 15%; }
          .inner-col-total { width: 18%; }
          .inner-col-one { width: 16%; }
          .inner-col-attend { width: 17%; }
          .inner-col-absent { width: 17%; }
          .inner-col-yang { width: 17%; }

          .yohoe-info {
            text-align: center;
          }

          .yohoe-name {
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 4px;
          }

          .yohoe-details {
            font-size: 14px;
            color: #333;
          }

          .names-section {
            text-align: left;
            padding: 8px;
          }

          .name-category {
            margin-bottom: 8px;
            font-size: 16px;
          }

          .category-label {
            font-weight: bold;
            color: #333;
            margin-right: 8px;
          }

          .totals-row {
            background-color: #e8e8e8;
            font-weight: bold;
          }

          .totals-row td {
            font-size: 18px;
          }

          .week-label {
            background-color: #f0f0f0;
            font-weight: bold;
            font-size: 16px;
          }

          .current-week {
            background-color: #e3f2fd;
          }

          .previous-week {
            background-color: #f5f5f5;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          {/* Header */}
          <div className="header">
            <h1>📋 주간 역사 보고서</h1>
            <div className="theme">"{weeklyTheme}"</div>
            <div className="date">
              {(() => {
                const sunday = new Date(getSundayOfWeek(date));
                return `${sunday.getFullYear()}년 ${sunday.getMonth() + 1}월 ${sunday.getDate()}일(주일)`;
              })()}
            </div>
          </div>

          {/* Report Table */}
          <table className="report-table">
            <thead>
              <tr>
                <th className="col-yohoe">요회</th>
                <th className="col-attendance">예배 참석자 수</th>
                <th className="col-names">명단</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => {
                const { yohoeInfo, currentWeekReport, previousWeekReport } = item;

                return (
                  <tr key={yohoeInfo.id}>
                    <td className="col-yohoe">
                      <div className="yohoe-info">
                        <div className="yohoe-name">{yohoeInfo.name}</div>
                        <div className="yohoe-details">
                          ({yohoeInfo.shepherd})
                          <br />
                          리더 {yohoeInfo.leader_count}명
                        </div>
                      </div>
                    </td>

                    <td className="col-attendance">
                      <table className="inner-table">
                        <thead>
                          <tr>
                            <th className="inner-col-empty"></th>
                            <th className="inner-col-total">총</th>
                            <th className="inner-col-one">1대1</th>
                            <th className="inner-col-attend">참석리더</th>
                            <th className="inner-col-absent">불참리더</th>
                            <th className="inner-col-yang">양</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="current-week">
                            <td className="week-label">금주</td>
                            <td>{getAttendeeSum(currentWeekReport, yohoeInfo)}</td>
                            <td>{currentWeekReport?.one_to_one_count || 0}</td>
                            <td>{currentWeekReport?.attended_leaders_count || 0}</td>
                            <td>{currentWeekReport?.absent_leaders_count || 0}</td>
                            <td>{getYangSum(currentWeekReport)} (신입생 {currentWeekReport?.attended_freshmen_count || 0})</td>
                          </tr>
                          <tr className="previous-week">
                            <td className="week-label">지난주</td>
                            <td>{getAttendeeSum(previousWeekReport, yohoeInfo)}</td>
                            <td>{previousWeekReport?.one_to_one_count || 0}</td>
                            <td>{previousWeekReport?.attended_leaders_count || 0}</td>
                            <td>{previousWeekReport?.absent_leaders_count || 0}</td>
                            <td>{getYangSum(previousWeekReport)} (신입생 {previousWeekReport?.attended_freshmen_count || 0})</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>

                    <td className="col-names">
                      <div className="names-section">
                        <div className="name-category">
                          <span className="category-label">학사양:</span>
                          {currentWeekReport?.attended_graduates_names || '-'}
                        </div>
                        <div className="name-category">
                          <span className="category-label">재학생양:</span>
                          {currentWeekReport?.attended_students_names || '-'}
                        </div>
                        <div className="name-category">
                          <span className="category-label">신입생:</span>
                          {currentWeekReport?.attended_freshmen_names || '-'}
                        </div>
                        <div className="name-category">
                          <span className="category-label">불참리더:</span>
                          {currentWeekReport?.absent_leaders_names || '-'}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* 총계 행 */}
              <tr className="totals-row">
                <td>총계</td>
                <td>
                  <table className="inner-table">
                    <tbody>
                      <tr className="current-week">
                        <td className="week-label">금주</td>
                        <td>{totals.current.total}</td>
                        <td>{totals.current.one_to_one}</td>
                        <td>{totals.current.attended_leaders}</td>
                        <td>{totals.current.absent_leaders}</td>
                        <td>{totals.current.yang} (신입생 {totals.current.shin})</td>
                      </tr>
                      <tr className="previous-week">
                        <td className="week-label">지난주</td>
                        <td>{totals.previous.total}</td>
                        <td>{totals.previous.one_to_one}</td>
                        <td>{totals.previous.attended_leaders}</td>
                        <td>{totals.previous.absent_leaders}</td>
                        <td>{totals.previous.yang} (신입생 {totals.previous.shin})</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  );
};

export default PDFReportView;