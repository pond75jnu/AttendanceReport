import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const ReportDetailPage = () => {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*, yohoes(name)')
        .eq('id', reportId)
        .single();

      if (error) {
        console.error('Error fetching report:', error);
        setLoading(false);
      } else {
        setReport(data);
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!report) {
    return <div>보고서를 찾을 수 없습니다.</div>;
  }

  const DetailItem = ({ label, value }) => (
    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{value || '-'}</dd>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow print:shadow-none">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">보고서 상세 정보</h1>
            <p className="mt-1 text-sm text-gray-500">{report.report_date} / {report.yohoes.name} 요회</p>
          </div>
          <div className="print:hidden">
            <Link to="/" className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">대시보드로 돌아가기</Link>
            <button onClick={handlePrint} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">출력</button>
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <DetailItem label="리더 참석" value={`${report.attended_leaders_count || 0}명 - ${report.attended_leaders_names}`} />
              <DetailItem label="리더 불참" value={`${report.absent_leaders_count || 0}명 - ${report.absent_leaders_names}`} />
              <DetailItem label="학사양 참석" value={`${report.attended_graduates_count || 0}명 - ${report.attended_graduates_names}`} />
              <DetailItem label="재학생양 참석" value={`${report.attended_students_count || 0}명 - ${report.attended_students_names}`} />
              <DetailItem label="신입생양 참석" value={`${report.attended_freshmen_count || 0}명 - ${report.attended_freshmen_names}`} />
              <DetailItem label="1대1 수" value={report.one_to_one_count} />
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportDetailPage;