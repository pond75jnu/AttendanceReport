import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ExcelToPDFExport = ({ data, onClose, onExport }) => {
  const hasExecutedRef = useRef(false);
  // const containerRef = useRef(null); // 사용하지 않음

  const generatePDF = React.useCallback(async () => {
    if (!data) return;

    try {
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

      // sample.xlsx 템플릿 로드 및 데이터 입력
      const response = await fetch('/sample.xlsx');
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // 데이터 입력 (기존 ExcelExport 로직과 동일)
      worksheet['A1'] = { t: 's', v: `${weekInfo.year}년 ${weekInfo.month}월 ${weekInfo.day}일(주일)` };
      worksheet['A4'] = { t: 's', v: `"${weeklyTheme || '-'}"` };

      let currentRow = 7;
      processedData.forEach((item) => {
        const { yohoeInfo, currentWeekReport } = item;
        const totalAttendees = getAttendeeSum(currentWeekReport, yohoeInfo);
        const yangSum = getYangSum(currentWeekReport);

        // 요회명
        const yohoeCell = XLSX.utils.encode_cell({ r: currentRow, c: 0 });
        worksheet[yohoeCell] = { t: 's', v: yohoeInfo.name };

        // 금주 데이터
        worksheet[XLSX.utils.encode_cell({ r: currentRow, c: 1 })] = { t: 's', v: '금주' };
        worksheet[XLSX.utils.encode_cell({ r: currentRow, c: 2 })] = { t: 'n', v: totalAttendees };
        worksheet[XLSX.utils.encode_cell({ r: currentRow, c: 3 })] = { t: 'n', v: currentWeekReport?.one_to_one_count || 0 };
        worksheet[XLSX.utils.encode_cell({ r: currentRow, c: 4 })] = { t: 'n', v: currentWeekReport?.attended_leaders_count || 0 };
        worksheet[XLSX.utils.encode_cell({ r: currentRow, c: 5 })] = { t: 'n', v: currentWeekReport?.absent_leaders_count || 0 };
        worksheet[XLSX.utils.encode_cell({ r: currentRow, c: 6 })] = { t: 's', v: `${yangSum} (신입생 ${currentWeekReport?.attended_freshmen_count || 0})` };
        worksheet[XLSX.utils.encode_cell({ r: currentRow, c: 7 })] = { t: 's', v: '학사양' };
        worksheet[XLSX.utils.encode_cell({ r: currentRow, c: 8 })] = { t: 's', v: currentWeekReport?.attended_graduates_names || '-' };

        // 지난주 데이터
        const lastWeekRow = currentRow + 1;
        worksheet[XLSX.utils.encode_cell({ r: lastWeekRow, c: 1 })] = { t: 's', v: '지난주' };
        worksheet[XLSX.utils.encode_cell({ r: lastWeekRow, c: 2 })] = { t: 'n', v: 0 };
        worksheet[XLSX.utils.encode_cell({ r: lastWeekRow, c: 3 })] = { t: 'n', v: 0 };
        worksheet[XLSX.utils.encode_cell({ r: lastWeekRow, c: 4 })] = { t: 'n', v: 0 };
        worksheet[XLSX.utils.encode_cell({ r: lastWeekRow, c: 5 })] = { t: 'n', v: 0 };
        worksheet[XLSX.utils.encode_cell({ r: lastWeekRow, c: 6 })] = { t: 's', v: '0 (신입생 0)' };
        worksheet[XLSX.utils.encode_cell({ r: lastWeekRow, c: 7 })] = { t: 's', v: '재학생양' };
        worksheet[XLSX.utils.encode_cell({ r: lastWeekRow, c: 8 })] = { t: 's', v: currentWeekReport?.attended_students_names || '-' };

        // 리더 정보
        const leaderRow = currentRow + 2;
        worksheet[XLSX.utils.encode_cell({ r: leaderRow, c: 0 })] = { t: 's', v: `리더 ${yohoeInfo.leader_count}명` };
        worksheet[XLSX.utils.encode_cell({ r: leaderRow, c: 7 })] = { t: 's', v: '신입생' };
        worksheet[XLSX.utils.encode_cell({ r: leaderRow, c: 8 })] = { t: 's', v: currentWeekReport?.attended_freshmen_names || '-' };

        // 목자명
        const shepherdRow = currentRow + 3;
        worksheet[XLSX.utils.encode_cell({ r: shepherdRow, c: 0 })] = { t: 's', v: `(${yohoeInfo.shepherd})` };
        worksheet[XLSX.utils.encode_cell({ r: shepherdRow, c: 7 })] = { t: 's', v: '불참리더' };
        worksheet[XLSX.utils.encode_cell({ r: shepherdRow, c: 8 })] = { t: 's', v: currentWeekReport?.absent_leaders_names || '-' };

        currentRow += 4;
      });

      // 총계 입력
      const totalRow = currentRow + 1;
      worksheet[XLSX.utils.encode_cell({ r: totalRow, c: 0 })] = { t: 's', v: '총계' };
      worksheet[XLSX.utils.encode_cell({ r: totalRow, c: 1 })] = { t: 's', v: '금주' };
      worksheet[XLSX.utils.encode_cell({ r: totalRow, c: 2 })] = { t: 'n', v: totals.total };
      worksheet[XLSX.utils.encode_cell({ r: totalRow, c: 3 })] = { t: 'n', v: totals.one_to_one };
      worksheet[XLSX.utils.encode_cell({ r: totalRow, c: 4 })] = { t: 'n', v: totals.attended_leaders };
      worksheet[XLSX.utils.encode_cell({ r: totalRow, c: 5 })] = { t: 'n', v: totals.absent_leaders };
      worksheet[XLSX.utils.encode_cell({ r: totalRow, c: 6 })] = { t: 's', v: `${totals.yang} (신입생 ${totals.freshmen})` };

      const lastWeekTotalRow = totalRow + 1;
      worksheet[XLSX.utils.encode_cell({ r: lastWeekTotalRow, c: 1 })] = { t: 's', v: '지난주' };
      worksheet[XLSX.utils.encode_cell({ r: lastWeekTotalRow, c: 2 })] = { t: 'n', v: 0 };
      worksheet[XLSX.utils.encode_cell({ r: lastWeekTotalRow, c: 3 })] = { t: 'n', v: 0 };
      worksheet[XLSX.utils.encode_cell({ r: lastWeekTotalRow, c: 4 })] = { t: 'n', v: 0 };
      worksheet[XLSX.utils.encode_cell({ r: lastWeekTotalRow, c: 5 })] = { t: 'n', v: 0 };
      worksheet[XLSX.utils.encode_cell({ r: lastWeekTotalRow, c: 6 })] = { t: 's', v: '0 (신입생 0)' };

      // Excel을 HTML로 변환하여 PDF 생성
      const htmlStr = XLSX.utils.sheet_to_html(worksheet);

      // 임시 div에 HTML 삽입
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlStr;
      tempDiv.style.position = 'fixed';
      tempDiv.style.top = '-9999px';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '794px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      document.body.appendChild(tempDiv);

      // HTML을 PDF로 변환
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
      });

      document.body.removeChild(tempDiv);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);

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

  return null;
};

export default ExcelToPDFExport;