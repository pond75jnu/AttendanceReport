import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import YohoeModal from '../components/YohoeModal';
import WeeklyReportView from '../components/WeeklyReportView';
import DashboardChart from '../components/DashboardChart'; // Import the chart component

const DashboardPage = () => {
  const [yohoes, setYohoes] = useState([]);
  const [reports, setReports] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYohoe, setEditingYohoe] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchYohoes();
    fetchReports();
  }, []);

  const fetchYohoes = async () => {
    const { data, error } = await supabase.from('yohoes').select('*').order('created_at');
    if (error) console.error('Error fetching yohoes:', error);
    else setYohoes(data);
  };

  const fetchReports = async () => {
    // Fetch last 5 weeks of reports for the chart
    const date = new Date();
    date.setDate(date.getDate() - 35);
    const { data, error } = await supabase.from('reports').select('*, yohoes(name)').gte('report_date', date.toISOString().slice(0,10)).order('report_date', { ascending: false });
    if (error) console.error('Error fetching reports:', error);
    else setReports(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleOpenAddModal = () => {
    setEditingYohoe(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (yohoe) => {
    setEditingYohoe(yohoe);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingYohoe(null);
  };

  const handleYohoeAdded = (newYohoe) => {
    setYohoes([...yohoes, newYohoe]);
    fetchYohoes();
  };

  const handleYohoeUpdated = (updatedYohoe) => {
    setYohoes(yohoes.map(yohoe => yohoe.id === updatedYohoe.id ? updatedYohoe : yohoe));
  };

  const handleDeleteYohoe = async (yohoeId) => {
    if (window.confirm('정말로 이 요회를 삭제하시겠습니까? 보고서 데이터도 함께 삭제됩니다.')) {
      const { error } = await supabase.from('yohoes').delete().match({ id: yohoeId });
      if (error) {
        console.error('Error deleting yohoe:', error);
        alert('요회 삭제 중 오류가 발생했습니다.');
      } else {
        setYohoes(yohoes.filter((yohoe) => yohoe.id !== yohoeId));
        fetchReports();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <div>
            <Link to="/profile" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 mr-4">비밀번호 변경</Link>
            <button onClick={handleLogout} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">로그아웃</button>
          </div>
        </div>
      </div>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
             <WeeklyReportView date={new Date()} />
          </div>

          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow sm:rounded-lg p-4">
              <DashboardChart reports={reports} />
            </div>
          </div>

          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">전체 보고서 목록</h2>
                <Link to="/report/new" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">주간 보고서 작성</Link>
            </div>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">보고일</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요회명</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.report_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.yohoes?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/report/${report.id}`} className="text-indigo-600 hover:text-indigo-900">상세보기</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">요회 관리</h2>
                <button onClick={handleOpenAddModal} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">새 요회 추가</button>
            </div>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요회명</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요회목자</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">리더 수</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {yohoes.map((yohoe) => (
                    <tr key={yohoe.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{yohoe.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{yohoe.shepherd}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{yohoe.leader_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleOpenEditModal(yohoe)} className="text-indigo-600 hover:text-indigo-900">수정</button>
                        <button onClick={() => handleDeleteYohoe(yohoe.id)} className="text-red-600 hover:text-red-900 ml-4">삭제</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <YohoeModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onYohoeAdded={handleYohoeAdded}
        onYohoeUpdated={handleYohoeUpdated}
        yohoeToEdit={editingYohoe}
      />
    </div>
  );
};

export default DashboardPage;
