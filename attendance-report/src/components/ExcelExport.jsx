import React, { useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';

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

      const { reports, weekInfo, yohoeList, weeklyTheme } = data;

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

      // 템플릿의 특정 셀에 데이터 입력
      // 날짜 업데이트 (A1 셀)
      worksheet['A1'] = { t: 's', v: `${weekInfo.year}년 ${weekInfo.month}월 ${weekInfo.day}일(주일)` };

      // 주제 업데이트 (A4 셀)
      worksheet['A4'] = { t: 's', v: `"${weeklyTheme || '-'}"` };

      // 각 요회 데이터 입력 (시작 행: 7)
      let currentRow = 7;
      processedData.forEach((item) => {
        const { yohoeInfo, currentWeekReport } = item;
        const totalAttendees = getAttendeeSum(currentWeekReport, yohoeInfo);
        const yangSum = getYangSum(currentWeekReport);

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
        worksheet[XLSX.utils.encode_cell({ r: lastWeekRow, c: 2 })] = { t: 'n', v: 0 };
        worksheet[XLSX.utils.encode_cell({ r: lastWeekRow, c: 3 })] = { t: 'n', v: 0 };
        worksheet[XLSX.utils.encode_cell({ r: lastWeekRow, c: 4 })] = { t: 'n', v: 0 };
        worksheet[XLSX.utils.encode_cell({ r: lastWeekRow, c: 5 })] = { t: 'n', v: 0 };
        worksheet[XLSX.utils.encode_cell({ r: lastWeekRow, c: 6 })] = { t: 's', v: '0 (신입생 0)' };
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
      worksheet[XLSX.utils.encode_cell({ r: totalRow, c: 2 })] = { t: 'n', v: totals.total };
      worksheet[XLSX.utils.encode_cell({ r: totalRow, c: 3 })] = { t: 'n', v: totals.one_to_one };
      worksheet[XLSX.utils.encode_cell({ r: totalRow, c: 4 })] = { t: 'n', v: totals.attended_leaders };
      worksheet[XLSX.utils.encode_cell({ r: totalRow, c: 5 })] = { t: 'n', v: totals.absent_leaders };
      worksheet[XLSX.utils.encode_cell({ r: totalRow, c: 6 })] = { t: 's', v: `${totals.yang} (신입생 ${totals.freshmen})` };

      // 지난주 총계 행
      const lastWeekTotalRow = totalRow + 1;
      worksheet[XLSX.utils.encode_cell({ r: lastWeekTotalRow, c: 1 })] = { t: 's', v: '지난주' };
      worksheet[XLSX.utils.encode_cell({ r: lastWeekTotalRow, c: 2 })] = { t: 'n', v: 0 };
      worksheet[XLSX.utils.encode_cell({ r: lastWeekTotalRow, c: 3 })] = { t: 'n', v: 0 };
      worksheet[XLSX.utils.encode_cell({ r: lastWeekTotalRow, c: 4 })] = { t: 'n', v: 0 };
      worksheet[XLSX.utils.encode_cell({ r: lastWeekTotalRow, c: 5 })] = { t: 'n', v: 0 };
      worksheet[XLSX.utils.encode_cell({ r: lastWeekTotalRow, c: 6 })] = { t: 's', v: '0 (신입생 0)' };

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