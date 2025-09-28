import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { filterReportsByWeek } from '../lib/reportUtils';

const Exact13x53Grid = ({ data, onClose, onExport }) => {
  const hasExecutedRef = useRef(false);
  const isMountedRef = useRef(true);
  const isMobileDevice = React.useMemo(() => {
    if (typeof navigator === 'undefined') {
      return false;
    }
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
  }, []);
  const [mobilePreviewHtml, setMobilePreviewHtml] = React.useState('');
  const [mobilePdfFileName, setMobilePdfFileName] = React.useState('');
  const [isPrinting, setIsPrinting] = React.useState(false);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handlePrint = React.useCallback(async (mode = 'print') => {
    if (!data) return;

    const { reports = [], weekInfo, yohoeList = [], weeklyTheme } = data;

    const padTwoDigits = (value) => String(value).padStart(2, '0');
    const parseWeekInfoToDate = (info) => new Date(`${info.year}-${padTwoDigits(info.month)}-${padTwoDigits(info.day)}`);

    const currentSunday = parseWeekInfoToDate(weekInfo);
    const previousSunday = new Date(currentSunday);
    previousSunday.setDate(currentSunday.getDate() - 7);

    const previousWeekInfo = {
      year: previousSunday.getFullYear(),
      month: previousSunday.getMonth() + 1,
      day: previousSunday.getDate()
    };

    const currentWeekReports = filterReportsByWeek(reports, weekInfo);
    const previousWeekReports = filterReportsByWeek(reports, previousWeekInfo);

    const pickLatestReport = (candidates = []) => {
      if (!candidates.length) return null;
      return candidates.reduce((latest, report) => {
        const latestTime = new Date(latest.updated_at || latest.created_at || latest.report_date).getTime();
        const reportTime = new Date(report.updated_at || report.created_at || report.report_date).getTime();
        return reportTime > latestTime ? report : latest;
      });
    };

    // PDF 파일명 생성 (report_YYYYMMDD.pdf 형식)
    const formatDate = (year, month, day) => {
      const yyyy = year;
      const mm = String(month).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      return `${yyyy}${mm}${dd}`;
    };

    const formatTimestamp = (date) => {
      const yyyy = date.getFullYear();
      const mm = padTwoDigits(date.getMonth() + 1);
      const dd = padTwoDigits(date.getDate());
      const hh = padTwoDigits(date.getHours());
      const mi = padTwoDigits(date.getMinutes());
      const ss = padTwoDigits(date.getSeconds());
      return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
    };

    const timestamp = formatTimestamp(new Date());
    const pdfFileName = `report_${formatDate(weekInfo.year, weekInfo.month, weekInfo.day)}_${timestamp}.pdf`;
    const originalTitle = typeof document !== 'undefined' ? document.title : null;
    const restoreDocumentTitle = () => {
      if (typeof document !== 'undefined' && originalTitle !== null) {
        document.title = originalTitle;
      }
    };

    // Helper 함수들 (기타 포함)
    const getAttendeeSum = (report, yohoeInfo) => {
      if (!report || !yohoeInfo) return 0;
      return (yohoeInfo.leader_count || 0) + (report.attended_graduates_count || 0) +
             (report.attended_students_count || 0) + (report.attended_freshmen_count || 0) +
             (report.attended_others_count || 0) - (report.absent_leaders_count || 0);
    };

    const getYangSum = (report) => {
      if (!report) return 0;
      return (report.attended_graduates_count || 0) + (report.attended_students_count || 0) +
             (report.attended_freshmen_count || 0);
    };

    const yohoeMap = new Map(yohoeList.map(yohoe => [yohoe.id, yohoe]));

    // 데이터 준비
    const processedData = yohoeList.map(yohoe => {
      const currentWeekCandidates = currentWeekReports.filter(r => r.yohoe_id === yohoe.id);
      const previousWeekCandidates = previousWeekReports.filter(r => r.yohoe_id === yohoe.id);

      return {
        yohoeInfo: yohoe,
        currentWeekReport: pickLatestReport(currentWeekCandidates),
        previousWeekReport: pickLatestReport(previousWeekCandidates)
      };
    });

    // 총합 계산 (기타 포함)
    const totals = processedData.reduce((acc, item) => {
      if (item.currentWeekReport) {
        acc.current.total += getAttendeeSum(item.currentWeekReport, item.yohoeInfo);
        acc.current.one_to_one += item.currentWeekReport.one_to_one_count || 0;
        acc.current.attended_leaders += item.currentWeekReport.attended_leaders_count || 0;
        acc.current.absent_leaders += item.currentWeekReport.absent_leaders_count || 0;
        acc.current.yang += getYangSum(item.currentWeekReport);
        acc.current.freshmen += item.currentWeekReport.attended_freshmen_count || 0;
        acc.current.others += item.currentWeekReport.attended_others_count || 0;
      }
      if (item.previousWeekReport) {
        acc.previous.total += getAttendeeSum(item.previousWeekReport, item.yohoeInfo);
        acc.previous.one_to_one += item.previousWeekReport.one_to_one_count || 0;
        acc.previous.attended_leaders += item.previousWeekReport.attended_leaders_count || 0;
        acc.previous.absent_leaders += item.previousWeekReport.absent_leaders_count || 0;
        acc.previous.yang += getYangSum(item.previousWeekReport);
        acc.previous.freshmen += item.previousWeekReport.attended_freshmen_count || 0;
        acc.previous.others += item.previousWeekReport.attended_others_count || 0;
      }
      return acc;
    }, {
      current: { total: 0, one_to_one: 0, attended_leaders: 0, absent_leaders: 0, yang: 0, freshmen: 0, others: 0 },
      previous: { total: 0, one_to_one: 0, attended_leaders: 0, absent_leaders: 0, yang: 0, freshmen: 0, others: 0 }
    });

    const historicalData = Array.from({ length: 5 }, (_, index) => {
      const targetSunday = new Date(currentSunday);
      targetSunday.setDate(targetSunday.getDate() - ((index + 1) * 7));
      const saturday = new Date(targetSunday);
      saturday.setDate(saturday.getDate() + 6);

      const sundayKey = `${targetSunday.getFullYear()}-${padTwoDigits(targetSunday.getMonth() + 1)}-${padTwoDigits(targetSunday.getDate())}`;
      const saturdayKey = `${saturday.getFullYear()}-${padTwoDigits(saturday.getMonth() + 1)}-${padTwoDigits(saturday.getDate())}`;

      const weekReports = reports.filter(report => {
        const reportDate = (report?.report_date || '').slice(0, 10);
        return reportDate >= sundayKey && reportDate <= saturdayKey;
      });

      const summary = weekReports.reduce((acc, report) => {
        const yohoeInfo = yohoeMap.get(report.yohoe_id);
        acc.total += getAttendeeSum(report, yohoeInfo);
        acc.one_to_one += report.one_to_one_count || 0;
        acc.attended_leaders += report.attended_leaders_count || 0;
        acc.absent_leaders += report.absent_leaders_count || 0;
        acc.yang += getYangSum(report);
        acc.freshmen += report.attended_freshmen_count || 0;
        return acc;
      }, { total: 0, one_to_one: 0, attended_leaders: 0, absent_leaders: 0, yang: 0, freshmen: 0 });

      return {
        label: `${index + 1}주 전`,
        date: sundayKey,
        ...summary
      };
    });

    const lastWeekSummary = historicalData[0] || { label: '1주 전', date: '', total: 0, one_to_one: 0, attended_leaders: 0, absent_leaders: 0, yang: 0, freshmen: 0 };
    const additionalHistory = historicalData.slice(1);
    const currentWeekDisplay = `${currentSunday.getFullYear()}년 ${currentSunday.getMonth() + 1}월 ${currentSunday.getDate()}일(주일)`;

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
              margin: 6mm;
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
            font-size: 11.5px;
            background: white;
            padding: 28px 10px 10px 10px;
            line-height: 1.0;
          }

          .header {
            text-align: center;
            margin-bottom: 6px;
          }

          .header .title {
            font-size: 19px;
            font-weight: bold;
            margin-bottom: 2px;
          }

          .header .theme {
            font-size: 11.5px;
            margin-bottom: 1px;
          }

          .header .date {
            font-size: 10.5px;
            text-align: right;
          }

          /* 정확한 13x53 격자 테이블 */
          .grid-13x53 {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.2px;
            table-layout: fixed;
            border: 2px solid black;
          }

          /* 13개 열 개별 너비 조정 */
          .grid-13x53 colgroup col:nth-child(1) { width: 7.69%; } /* 요회 */
          .grid-13x53 colgroup col:nth-child(2) { width: 7.49%; } /* 금주/지난주 -2px */
          .grid-13x53 colgroup col:nth-child(3) { width: 7.49%; } /* 총 -2px */
          .grid-13x53 colgroup col:nth-child(4) { width: 7.49%; } /* 1대1 -2px */
          .grid-13x53 colgroup col:nth-child(5) { width: 7.49%; } /* 참석리더 -2px */
          .grid-13x53 colgroup col:nth-child(6) { width: 7.49%; } /* 불참리더 -2px */
          .grid-13x53 colgroup col:nth-child(7) { width: 8.79%; } /* 양 +10px */
          .grid-13x53 colgroup col:nth-child(8) { width: 7.69%; } /* 명단1 */
          .grid-13x53 colgroup col:nth-child(9) { width: 7.49%; } /* 명단2/과거추이총 -2px */
          .grid-13x53 colgroup col:nth-child(10) { width: 7.49%; } /* 명단3/과거추이1대1 -2px */
          .grid-13x53 colgroup col:nth-child(11) { width: 7.49%; } /* 명단4/과거추이참석 -2px */
          .grid-13x53 colgroup col:nth-child(12) { width: 7.49%; } /* 명단5/과거추이불참 -2px */
          .grid-13x53 colgroup col:nth-child(13) { width: 8.57%; } /* 명단6/과거추이양 +8px */

          .grid-13x53 td, .grid-13x53 th {
            border: 1px solid black;
            text-align: center;
            vertical-align: middle;
            padding: 0.5px;
            height: 16.8px;
            font-size: 9px;
            line-height: 1.0;
            white-space: nowrap;
          }

          .grid-13x53 th {
            background-color: #f0f0f0;
            font-weight: bold;
            font-size: 10.2px;
          }

          /* 요회명 셀 */
          .yohoe-cell {
            font-weight: bold;
            font-size: 8.5px;
            text-align: center;
            vertical-align: middle;
            padding: 0.5px;
            line-height: 1.1;
            white-space: nowrap;
          }

          /* 주차 라벨 */
          .week-label {
            font-weight: bold;
            font-size: 8.5px;
            background-color: #f8f8f8;
            white-space: nowrap;
          }

          /* 숫자 셀 */
          .number-cell {
            font-size: 8.5px;
            text-align: center;
            white-space: nowrap;
          }

          /* 명단 셀 */
          .names-cell {
            font-size: 7.5px;
            text-align: left !important;
            padding: 0.5px;
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
            font-size: 10.2px;
            white-space: nowrap;
          }

          /* 과거추이 헤더 */
          .history-header {
            font-weight: bold;
            font-size: 8.5px;
            background-color: #f0f0f0;
            white-space: nowrap;
          }

          /* 과거추이 셀 */
          .history-cell {
            font-size: 6.2px;
            text-align: center;
            line-height: 1.0;
            padding: 0.5px;
            white-space: nowrap;
          }

          /* 과거추이 날짜 스타일 */
          .history-date {
            font-size: 6.5px;
            letter-spacing: -0.5px;
            white-space: nowrap;
          }

          /* 총계 양 수 스타일 */
          .yang-count {
            letter-spacing: -0.5px;
            white-space: nowrap;
          }

          /* 불참리더 헤더 스타일 */
          .absent-leader-header {
            background-color: #ffe48a !important;
          }

          /* 불참리더 셀 스타일 */
          .absent-leader-cell {
            background-color: #fcecb3 !important;
          }

          /* 명단 제목 셀 (학사양, 재학생양 등) */
          .names-title-cell {
            font-size: 7.5px;
            text-align: center !important;
            padding: 0.5px;
            line-height: 1.0;
            white-space: nowrap;
          }

          /* 명단 데이터 셀 (실제 이름들) */
          .names-data-cell {
            font-size: 7.5px;
            text-align: left !important;
            padding: 0.5px 0.5px 0.5px 5px !important;
            line-height: 1.0;
            white-space: nowrap;
            letter-spacing: -0.7px;
          }

          /* 더 구체적인 명단 데이터 셀 스타일 */
          td.names-cell.names-data-cell {
            padding-left: 5px !important;
            text-align: left !important;
            letter-spacing: -0.7px !important;
          }

        </style>
      </head>
      <body>
        <!-- 제목 (상단 공간 제거) -->
        <div class="header">
          <div class="title">주간 역사 보고서</div>
          <div class="theme">"${weeklyTheme || '여호와, 인자와 진실이 많으신 하나님'}"</div>
          <div class="date">${currentWeekDisplay}</div>
        </div>

        <!-- 정확한 13x53 격자 테이블 -->
        <table class="grid-13x53">
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
            const { yohoeInfo, currentWeekReport, previousWeekReport } = item;
            const currentTotal = getAttendeeSum(currentWeekReport, yohoeInfo);
            const currentYang = getYangSum(currentWeekReport);
            const previousTotal = getAttendeeSum(previousWeekReport, yohoeInfo);
            const previousYang = getYangSum(previousWeekReport);
            const currentFreshmenNames = currentWeekReport?.attended_freshmen_names || '-';

            return `
              <!-- 각 요회마다 5행 (기타 추가로 1행 증가) -->
              <!-- 1행: 요회명(5행병합) + 예배참석자수 헤더(6칸) + 명단 첫번째 칸 + 나머지 5칸 병합 -->
              <tr>
                <td rowspan="5" class="yohoe-cell">
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
                <td class="names-cell names-title-cell">학사양</td>
                <td colspan="5" class="names-cell names-data-cell">${currentWeekReport?.attended_graduates_names || '-'}</td>
              </tr>

              <!-- 2행: 금주 데이터 + 명단 -->
              <tr>
                <td class="week-label">금주</td>
                <td class="number-cell">${currentTotal}</td>
                <td class="number-cell">${currentWeekReport?.one_to_one_count || 0}</td>
                <td class="number-cell">${currentWeekReport?.attended_leaders_count || 0}</td>
                <td class="number-cell">${currentWeekReport?.absent_leaders_count || 0}</td>
                <td class="number-cell">${currentYang} (신입생 ${currentWeekReport?.attended_freshmen_count || 0})</td>
                <td class="names-cell names-title-cell">재학생양</td>
                <td colspan="5" class="names-cell names-data-cell">${currentWeekReport?.attended_students_names || '-'}</td>
              </tr>

              <!-- 3행: 지난주 데이터 + 명단 -->
              <tr>
                <td class="week-label">지난주</td>
                <td class="number-cell">${previousTotal}</td>
                <td class="number-cell">${previousWeekReport?.one_to_one_count || 0}</td>
                <td class="number-cell">${previousWeekReport?.attended_leaders_count || 0}</td>
                <td class="number-cell">${previousWeekReport?.absent_leaders_count || 0}</td>
                <td class="number-cell"><span class="yang-count">${previousYang} (신입생 ${previousWeekReport?.attended_freshmen_count || 0})</span></td>
                <td class="names-cell names-title-cell">신입생</td>
                <td colspan="5" class="names-cell names-data-cell">${currentFreshmenNames}</td>
              </tr>

              <!-- 4행: 예배참석자수(6칸병합) + 기타 명단 (새로 추가) -->
              <tr>
                <td colspan="6"></td>
                <td class="names-cell names-title-cell">기타</td>
                <td colspan="5" class="names-cell names-data-cell">${currentWeekReport?.attended_others_names || '-'}</td>
              </tr>

              <!-- 5행: 예배참석자수(6칸병합) + 불참리더 명단 -->
              <tr>
                <td colspan="6"></td>
                <td class="names-cell names-title-cell absent-leader-header">불참리더</td>
                <td colspan="5" class="names-cell names-data-cell absent-leader-cell">${currentWeekReport?.absent_leaders_names || '-'}</td>
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
            <td class="number-cell">${totals.current.total}</td>
            <td class="number-cell">${totals.current.one_to_one}</td>
            <td class="number-cell">${totals.current.attended_leaders}</td>
            <td class="number-cell">${totals.current.absent_leaders}</td>
            <td class="number-cell"><span class="yang-count">${totals.current.yang} (신입생 ${totals.current.freshmen})</span></td>
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
            <td class="number-cell">${totals.previous.total}</td>
            <td class="number-cell">${totals.previous.one_to_one}</td>
            <td class="number-cell">${totals.previous.attended_leaders}</td>
            <td class="number-cell">${totals.previous.absent_leaders}</td>
            <td class="number-cell"><span class="yang-count">${totals.previous.yang} (신입생 ${totals.previous.freshmen})</span></td>
            <td class="history-cell">${lastWeekSummary.label}<br><span class="history-date">(${lastWeekSummary.date || '-'})</span></td>
            <td class="history-cell">${lastWeekSummary.total}</td>
            <td class="history-cell">${lastWeekSummary.one_to_one}</td>
            <td class="history-cell">${lastWeekSummary.attended_leaders}</td>
            <td class="history-cell">${lastWeekSummary.absent_leaders}</td>
            <td class="history-cell">${lastWeekSummary.yang} (신입생 ${lastWeekSummary.freshmen})</td>
          </tr>

          <!-- 총계 4-7행: 예배참석자수(6칸병합) + 과거추이 데이터 -->
          ${additionalHistory.map(week => `
          <tr class="totals-row">
            <td colspan="6"></td>
            <td class="history-cell">${week.label}<br><span class="history-date">(${week.date || '-'})</span></td>
            <td class="history-cell">${week.total}</td>
            <td class="history-cell">${week.one_to_one}</td>
            <td class="history-cell">${week.attended_leaders}</td>
            <td class="history-cell">${week.absent_leaders}</td>
            <td class="history-cell">${week.yang} (신입생 ${week.freshmen})</td>
          </tr>
          `).join('')}
        </table>

      </body>
      </html>
    `;
    if (mode === 'preview') {
      return { htmlContent, pdfFileName };
    }
    const isMobile = isMobileDevice;
    let callbacksTriggered = false;
    const triggerCallbacks = () => {
      if (callbacksTriggered) return;
      callbacksTriggered = true;
      onExport && onExport();
      onClose && onClose();
    };

    if (isMobile) {
      const parser = new DOMParser();
      const parsedDocument = parser.parseFromString(htmlContent, 'text/html');

      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '-9999px';
      container.style.width = '794px';
      container.style.background = '#ffffff';
      container.style.padding = '0';
      container.style.zIndex = '-1';

      const styleElements = Array.from(parsedDocument.head.querySelectorAll('style'));
      styleElements.forEach((styleEl) => {
        const styleTag = document.createElement('style');
        styleTag.textContent = styleEl.textContent;
        container.appendChild(styleTag);
      });

      const bodyFragment = document.createElement('div');
      Array.from(parsedDocument.body.children).forEach((child) => {
        bodyFragment.appendChild(child.cloneNode(true));
      });
      container.appendChild(bodyFragment);

      document.body.appendChild(container);

      try {
        await new Promise((resolve) => requestAnimationFrame(() => resolve()));

        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: container.offsetWidth,
          windowHeight: container.scrollHeight
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(pdfFileName);
        triggerCallbacks();
      } catch (error) {
        console.error('Mobile PDF export failed:', error);
        alert('모바일에서 PDF 저장 중 문제가 발생했습니다. 다시 시도해주세요.');
        triggerCallbacks();
      } finally {
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
        restoreDocumentTitle();
      }

      return;
    }

    if (typeof document !== 'undefined') {
      document.title = pdfFileName;
    }

    // 데스크톱 등 기타 환경에서는 iframe 사용 (기존 로직 유지)
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    setTimeout(() => {
      if (iframe.contentWindow && iframe.contentWindow.document) {
        iframe.contentWindow.document.title = pdfFileName;
      }
    }, 100);

    iframe.onload = () => {
      try {
        setTimeout(() => {
          iframe.contentWindow.print();

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
            restoreDocumentTitle();
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
        restoreDocumentTitle();
      }
    };
  }, [data, isMobileDevice, onClose, onExport]);

  const handleMobilePrint = React.useCallback(async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    try {
      await handlePrint();
    } finally {
      if (isMountedRef.current) {
        setIsPrinting(false);
      }
    }
  }, [handlePrint, isPrinting]);

  const handleMobileCancel = React.useCallback(() => {
    setMobilePreviewHtml('');
    setMobilePdfFileName('');
    onExport && onExport();
    onClose && onClose();
  }, [onClose, onExport]);

  React.useEffect(() => {
    if (!data || hasExecutedRef.current) {
      return;
    }

    if (isMobileDevice) {
      (async () => {
        const result = await handlePrint('preview');
        if (result && isMountedRef.current) {
          setMobilePreviewHtml(result.htmlContent);
          setMobilePdfFileName(result.pdfFileName);
          hasExecutedRef.current = true;
        }
      })();
    } else {
      hasExecutedRef.current = true;
      setTimeout(() => {
        handlePrint();
      }, 100);
    }
  }, [data, handlePrint, isMobileDevice]);

  if (isMobileDevice && mobilePreviewHtml) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
        <div className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">주간 보고서 미리보기</h2>
              <p className="text-xs text-slate-500">{mobilePdfFileName || 'report.pdf'}</p>
            </div>
            <button
              type="button"
              onClick={handleMobileCancel}
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="미리보기 닫기"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-hidden bg-slate-100">
            <iframe
              title="주간 보고서 미리보기"
              srcDoc={mobilePreviewHtml}
              style={{ width: '100%', height: '70vh', border: 'none', backgroundColor: '#ffffff' }}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
            <button
              type="button"
              onClick={handleMobileCancel}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleMobilePrint}
              disabled={isPrinting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {isPrinting ? '인쇄 준비 중...' : '인쇄'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Exact13x53Grid;
