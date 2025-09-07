import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const YohoeModal = ({ isOpen, onClose, onYohoeAdded, onYohoeUpdated, yohoeToEdit }) => {
  const [name, setName] = useState('');
  const [shepherd, setShepherd] = useState('');
  const [leaderCount, setLeaderCount] = useState('');
  const [orderNum, setOrderNum] = useState('');

  const isEditMode = Boolean(yohoeToEdit);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setName(yohoeToEdit.name);
        setShepherd(yohoeToEdit.shepherd);
        setLeaderCount(yohoeToEdit.leader_count);
        setOrderNum(yohoeToEdit.order_num || '');
      } else {
        setName('');
        setShepherd('');
        setLeaderCount('');
        setOrderNum('');
      }
    }
  }, [yohoeToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const yohoeData = {
      name,
      shepherd,
      leader_count: leaderCount,
      order_num: orderNum ? parseInt(orderNum) : null
    };
    
    if (isEditMode) {
      const { data, error } = await supabase
        .from('yohoe')
        .update(yohoeData)
        .match({ id: yohoeToEdit.id })
        .select();
      
      if (error) {
        console.error('Error updating yohoe:', error);
        alert('요회 수정 중 오류가 발생했습니다.');
      } else {
        onYohoeUpdated(data[0]);
        onClose();
      }
    } else {
      const { data, error } = await supabase
        .from('yohoe')
        .insert([yohoeData])
        .select();

      if (error) {
        console.error('Error adding yohoe:', error);
        alert('요회 추가 중 오류가 발생했습니다.');
      } else {
        onYohoeAdded(data[0]);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {isEditMode ? '요회 수정' : '새 요회 추가'}
          </h3>
          <form className="mt-2 px-7 py-3" onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">요회명</label>
              <input
                type="text"
                placeholder="요회명"
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">요회목자</label>
              <input
                type="text"
                placeholder="요회목자"
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
                value={shepherd}
                onChange={(e) => setShepherd(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">리더 수</label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="리더 수"
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
                value={leaderCount}
                onChange={(e) => setLeaderCount(e.target.value)}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">표시순서</label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="정렬 순서 (1, 2, 3...)"
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
                value={orderNum}
                onChange={(e) => setOrderNum(e.target.value)}
                onFocus={(e) => e.target.select()}
                min="1"
              />
            </div>
            <div className="items-center px-4 py-3">
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                저장
              </button>
            </div>
          </form>
          <div className="items-center px-4 pb-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                취소
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default YohoeModal;