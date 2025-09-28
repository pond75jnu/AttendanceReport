import React, { useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { filterReportsByWeek } from '../lib/reportUtils';

const ExcelExport = ({ data, onClose, onExport }) => {
  const hasExecutedRef = useRef(false);
  const generateExcel = useCallback(async () => {
    if (!data) return;

    try {
      // sample.xlsx 템플릿 파일 로드
      const response = await fetch('/sample.xlsx');
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      // 첫 번째 워크시트 가져오기
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

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

      // WeeklyReportView와 동일한 계산 함수들
      const getAttendeeSum = (report, yohoeInfo) => {
        if (!report || !yohoeInfo) return 0;
        return (yohoeInfo.leader_count || 0) + (report.attended_graduates_count || 0) + (report.attended_students_count || 0) + (report.attended_freshmen_count || 0) - (report.absent_leaders_count || 0);
      };

      const getYangSum = (report) => {
        if (!report) return 0;
        return (report.attended_graduates_count || 0) + (report.attended_students_count || 0) + (report.attended_freshmen_count || 0);
      };

      // 데이터 매핑
      const processedData = yohoeList.map(yohoe => {
        const currentWeekCandidates = currentWeekReports.filter(r => r.yohoe_id === yohoe.id);
        const previousWeekCandidates = previousWeekReports.filter(r => r.yohoe_id === yohoe.id);

        return {
          yohoeInfo: yohoe,
          currentWeekReport: pickLatestReport(currentWeekCandidates),
          previousWeekReport: pickLatestReport(previousWeekCandidates)
        };
      });

      // 총합 계산
      const totals = processedData.reduce((acc, item) => {
        if (item.currentWeekReport) {
          acc.current.total += getAttendeeSum(item.currentWeekReport, item.yohoeInfo);
          acc.current.one_to_one += item.currentWeekReport.one_to_one_count || 0;
          acc.current.attended_leaders += item.currentWeekReport.attended_leaders_count || 0;
          acc.current.absent_leaders += item.currentWeekReport.absent_leaders_count || 0;
          acc.current.yang += getYangSum(item.currentWeekReport);
          acc.current.freshmen += item.currentWeekReport.attended_freshmen_count || 0;
        }
        if (item.previousWeekReport) {
          acc.previous.total += getAttendeeSum(item.previousWeekReport, item.yohoeInfo);
          acc.previous.one_to_one += item.previousWeekReport.one_to_one_count || 0;
          acc.previous.attended_leaders += item.previousWeekReport.attended_leaders_count || 0;
          acc.previous.absent_leaders += item.previousWeekReport.absent_leaders_count || 0;
          acc.previous.yang += getYangSum(item.previousWeekReport);
          acc.previous.freshmen += item.previousWeekReport.attended_freshmen_count || 0;
        }
        return acc;
      }, {
        current: { total: 0, one_to_one: 0, attended_leaders: 0, absent_leaders: 0, yang: 0, freshmen: 0 },
        previous: { total: 0, one_to_one: 0, attended_leaders: 0, absent_leaders: 0, yang: 0, freshmen: 0 }
      });

      // 템플릿의 특정 셀에 데이터 입력
      // 날짜 업데이트 (A1 셀)
      worksheet['A1'] = { t: 's', v: `${weekInfo.year}년 ${weekInfo.month}월 ${weekInfo.day}일(주일)` };

      // 주제 업데이트 (A4 셀)
      worksheet['A4'] = { t: 's', v: `"${weeklyTheme || '-'}"` };

      // 각 요회 데이터 입력 (시작 행: 7)
      let currentRow = 7;
      processedData.forEach((item) => {
        const { yohoeInfo, currentWeekReport, previousWeekReport } = item;
        const totalAttendees = getAttendeeSum(currentWeekReport, yohoeInfo);
        const yangSum = getYangSum(currentWeekReport);
        const previousTotal = getAttendeeSum(previousWeekReport, yohoeInfo);
        const previousYang = getYangSum(previousWeekReport);

        // 요회명 (A열, 3행에 걸쳐 병합된 셀)
        const yohoeCell = XLSX.utils.encode_cell({ r: currentRow, c: 0 });
        worksheet[yohoeCell] = { t: 's', v: yohoeInfo.name };

        // 금주 데이터
        const thisWeekRow = currentRow;
        worksheet[XLSX.utils.encode_cell({ r: thisWeekRow, c: 1 })] = { t: 's', v: '금주' };
        worksheet[XLSX.utils.encode_cell({ r: thisWeekRow, c: 2 })] = { t: 'n', v: totalAttendees };
        worksheet[XLSX.utils.encode_cell({ r: thisWeekRow, c: 3 })] = { t: 'n', v: currentWeekReport?.one_to_one_count || 0 };
        worksheet[XLSX.utils.encode_cell({ r: thisWeekRow, c: 4 })] = { t: 'n', v: currentWeekReport?.attended_leaders_count || 0 };
        worksheet[XLSX.utils.encode_cell({ r: thisWeekRow, c: 5 })] = { t: 'n', v: currentWeekReport?.absent_leaders_count || 0 };
        worksheet[XLSX.utils.encode_cell({ r: thisWeekRow, c: 6 })] = { t: 's', v: `${yangSum} (신입생 ${currentWeekReport?.attended_freshmen_count || 0})` };
        worksheet[XLSX.utils.encode_cell({ r: thisWeekRow, c: 7 })] = { t: 's', v: '학사양' };
        worksheet[XLSX.utils.encode_cell({ r: thisWeekRow, c: 8 })] = { t: 's', v: currentWeekReport?.attended_graduates_names || '-' };

        // 지난주 데이터 (목자명 포함)
        const lastWeekRow = currentRow + 1;
        worksheet[XLSX.utils.encode_cell({ r: lastWeekRow, c: 1 })] = { t: 's', v: '지난주' };
        worksheet[XLSX.utils.encode_cell({ r: lastWeekRow, c: 2 })] = { t: 'n', v: previousTotal };
        worksheet[XLSX.utils.encode_cell({ r: lastWeekRow, c: 3 })] = { t: 'n', v: previousWeekReport?.one_to_one_count || 0 };
        worksheet[XLSX.utils.encode_cell({ r: lastWeekRow, c: 4 })] = { t: 'n', v: previousWeekReport?.attended_leaders_count || 0 };
        worksheet[XLSX.utils.encode_cell({ r: lastWeekRow, c: 5 })] = { t: 'n', v: previousWeekReport?.absent_leaders_count || 0 };
        worksheet[XLSX.utils.encode_cell({ r: lastWeekRow, c: 6 })] = { t: 's', v: `${previousYang} (신입생 ${previousWeekReport?.attended_freshmen_count || 0})` };
        worksheet[XLSX.utils.encode_cell({ r: lastWeekRow, c: 7 })] = { t: 's', v: '재학생양' };
        worksheet[XLSX.utils.encode_cell({ r: lastWeekRow, c: 8 })] = { t: 's', v: currentWeekReport?.attended_students_names || '-' };

        // 리더 정보 행
        const leaderRow = currentRow + 2;
        worksheet[XLSX.utils.encode_cell({ r: leaderRow, c: 0 })] = { t: 's', v: `리더 ${yohoeInfo.leader_count}명` };
        worksheet[XLSX.utils.encode_cell({ r: leaderRow, c: 7 })] = { t: 's', v: '신입생' };
        worksheet[XLSX.utils.encode_cell({ r: leaderRow, c: 8 })] = { t: 's', v: currentWeekReport?.attended_freshmen_names || '-' };

        // 목자명 행
        const shepherdRow = currentRow + 3;
        worksheet[XLSX.utils.encode_cell({ r: shepherdRow, c: 0 })] = { t: 's', v: `(${yohoeInfo.shepherd})` };
        worksheet[XLSX.utils.encode_cell({ r: shepherdRow, c: 7 })] = { t: 's', v: '불참리더' };
        worksheet[XLSX.utils.encode_cell({ r: shepherdRow, c: 8 })] = { t: 's', v: currentWeekReport?.absent_leaders_names || '-' };

        currentRow += 4;
      });

      // 총계 행 업데이트
      const totalRow = currentRow + 1;
      worksheet[XLSX.utils.encode_cell({ r: totalRow, c: 0 })] = { t: 's', v: '총계' };
      worksheet[XLSX.utils.encode_cell({ r: totalRow, c: 1 })] = { t: 's', v: '금주' };
      worksheet[XLSX.utils.encode_cell({ r: totalRow, c: 2 })] = { t: 'n', v: totals.current.total };
      worksheet[XLSX.utils.encode_cell({ r: totalRow, c: 3 })] = { t: 'n', v: totals.current.one_to_one };
      worksheet[XLSX.utils.encode_cell({ r: totalRow, c: 4 })] = { t: 'n', v: totals.current.attended_leaders };
      worksheet[XLSX.utils.encode_cell({ r: totalRow, c: 5 })] = { t: 'n', v: totals.current.absent_leaders };
      worksheet[XLSX.utils.encode_cell({ r: totalRow, c: 6 })] = { t: 's', v: `${totals.current.yang} (신입생 ${totals.current.freshmen})` };

      // 지난주 총계 행
      const lastWeekTotalRow = totalRow + 1;
      worksheet[XLSX.utils.encode_cell({ r: lastWeekTotalRow, c: 1 })] = { t: 's', v: '지난주' };
      worksheet[XLSX.utils.encode_cell({ r: lastWeekTotalRow, c: 2 })] = { t: 'n', v: totals.previous.total };
      worksheet[XLSX.utils.encode_cell({ r: lastWeekTotalRow, c: 3 })] = { t: 'n', v: totals.previous.one_to_one };
      worksheet[XLSX.utils.encode_cell({ r: lastWeekTotalRow, c: 4 })] = { t: 'n', v: totals.previous.attended_leaders };
      worksheet[XLSX.utils.encode_cell({ r: lastWeekTotalRow, c: 5 })] = { t: 'n', v: totals.previous.absent_leaders };
      worksheet[XLSX.utils.encode_cell({ r: lastWeekTotalRow, c: 6 })] = { t: 's', v: `${totals.previous.yang} (신입생 ${totals.previous.freshmen})` };

      // 파일 다운로드
      const fileName = `주간역사보고서_${weekInfo.year}년_${weekInfo.month}월_${weekInfo.day}일.xlsx`;
      XLSX.writeFile(workbook, fileName);

      // 콜백 호출
      onExport && onExport();
      onClose && onClose();
    } catch (error) {
      console.error('Excel 템플릿 로드 오류:', error);
      // 콜백 호출
      onExport && onExport();
      onClose && onClose();
    }
  }, [data, onClose, onExport]);

  // 컴포넌트가 마운트되면 바로 엑셀 생성 (중복 실행 방지)
  React.useEffect(() => {
    if (data && !hasExecutedRef.current) {
      hasExecutedRef.current = true;
      generateExcel();
    }
  }, [data, generateExcel]); // data와 generateExcel 함수가 변경될 때만 실행

  return null; // UI 없이 백그라운드에서 실행
};

export default ExcelExport;
