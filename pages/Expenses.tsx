
import React, { useState, useMemo, useEffect } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { CATEGORY_COLORS, MONTHS } from '../constants';
import { exportToPDF } from '../utils/pdfUtils';
import anime from 'animejs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface ExpensesProps {
  expenses: Expense[];
  onAdd: (expense: Expense) => void;
  onUpdate: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, onAdd, onUpdate, onDelete }) => {
  const currentYear = new Date().getFullYear();
  const [showModal, setShowModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  
  const [formData, setFormData] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    category: ExpenseCategory.OTHER,
    description: '',
    amount: 0,
    excludedFromReports: false,
  });

  useEffect(() => {
    // Fix: cast anime to any to handle non-callable error
    (anime as any)({
      targets: '.expense-row',
      opacity: [0, 1],
      translateY: [20, 0],
      delay: anime.stagger(40),
      easing: 'easeOutQuad',
      duration: 500
    });
  }, [expenses, selectedYear, selectedMonth]);

  const years = useMemo(() => {
    const startYear = currentYear - 2;
    return Array.from({ length: 5 }, (_, i) => startYear + i);
  }, [currentYear]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      const yearMatch = d.getFullYear() === selectedYear;
      const monthMatch = selectedMonth === 'all' || d.getMonth() === selectedMonth;
      return yearMatch && monthMatch;
    });
  }, [expenses, selectedYear, selectedMonth]);

  const chartData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    Object.values(ExpenseCategory).forEach(cat => {
      dataMap[cat] = 0;
    });

    filteredExpenses.forEach(e => {
      if (!e.excludedFromReports) {
        dataMap[e.category] += e.amount;
      }
    });

    return Object.entries(dataMap)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [filteredExpenses]);

  const handleSave = () => {
    if (!formData.description || !formData.amount || formData.amount <= 0) {
      alert("Veuillez remplir correctement la description et le montant.");
      return;
    }

    const newExpense = { 
      ...formData, 
      id: Date.now().toString() 
    } as Expense;
    
    onAdd(newExpense);
    setShowModal(false);
    
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: ExpenseCategory.OTHER,
      description: '',
      amount: 0,
      excludedFromReports: false,
    });
  };

  const handleToggleExclude = (expense: Expense) => {
    onUpdate({ ...expense, excludedFromReports: !expense.excludedFromReports });
  };

  const handleExportPDF = () => {
    const headers = ['Date', 'Catégorie', 'Description', 'Montant', 'Statut'];
    const rows = filteredExpenses.map(exp => [
      new Date(exp.date).toLocaleDateString('fr-FR'),
      exp.category,
      exp.description,
      `${exp.amount.toFixed(2)} DH`,
      exp.excludedFromReports ? 'EXCLU' : 'INCLUS'
    ]);
    const periodStr = selectedMonth === 'all' ? `Année ${selectedYear}` : `${MONTHS[selectedMonth as number]} ${selectedYear}`;
    exportToPDF(`Dépenses - ${periodStr}`, headers, rows, `depenses_${periodStr.replace(/\s+/g, '_')}`);
  };

  const CHART_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'];

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Registre des Dépenses</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Suivi et analyse des coûts de la copropriété</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleExportPDF}
            className="flex-1 sm:flex-none border border-red-200 text-red-600 px-6 py-3 rounded-2xl hover:bg-red-50 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
          >
            <i className="fas fa-file-pdf"></i> PDF
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex-1 sm:flex-none bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 text-[10px] font-black uppercase tracking-widest"
          >
            <i className="fas fa-plus"></i> Nouvelle dépense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-w-0">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-[11px] text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fas fa-chart-bar text-indigo-500"></i> Répartition des charges
            </h3>
            <div className="flex gap-2">
               <select 
                 className="text-[10px] font-black uppercase border rounded-xl px-4 py-2 outline-none bg-slate-50 tracking-widest"
                 value={selectedYear}
                 onChange={(e) => setSelectedYear(parseInt(e.target.value))}
               >
                 {years.map(y => <option key={y} value={y}>{y}</option>)}
               </select>
               <select 
                 className="text-[10px] font-black uppercase border rounded-xl px-4 py-2 outline-none bg-slate-50 tracking-widest"
                 value={selectedMonth}
                 onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
               >
                 <option value="all">Toute l'année</option>
                 {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
               </select>
            </div>
          </div>
          
          <div className="h-64 w-full relative min-w-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fill: '#64748b', fontWeight: 800 }}
                    interval={0}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fill: '#64748b', fontWeight: 800 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 italic">
                <i className="fas fa-box-open text-4xl mb-4"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">Aucune donnée sur cette période</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-indigo-600 p-10 rounded-[2.5rem] text-white shadow-2xl flex flex-col justify-center min-w-0 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl"><i className="fas fa-file-invoice-dollar"></i></div>
           <div className="relative z-10">
             <h4 className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Consolidé</h4>
             <p className="text-4xl font-black mb-1 tracking-tighter">
               {filteredExpenses.filter(e => !e.excludedFromReports).reduce((sum, e) => sum + e.amount, 0).toLocaleString()} <span className="text-xl font-bold">DH</span>
             </p>
             <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest">Période : {selectedMonth === 'all' ? selectedYear : `${MONTHS[selectedMonth as number]} ${selectedYear}`}</p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bilan</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Désignation</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className={`expense-row hover:bg-slate-50 transition-colors opacity-0 ${expense.excludedFromReports ? 'bg-slate-50/50 grayscale-[0.5]' : ''}`}>
                  <td className="px-8 py-5">
                    <input 
                      type="checkbox" 
                      checked={!expense.excludedFromReports} 
                      onChange={() => handleToggleExclude(expense)} 
                      className="w-5 h-5 text-indigo-600 rounded-lg border-slate-200 focus:ring-indigo-500" 
                    />
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-slate-500">{new Date(expense.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${CATEGORY_COLORS[expense.category]}`}>
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <p className={`text-xs font-black text-slate-800 ${expense.excludedFromReports ? 'line-through opacity-40' : ''}`}>{expense.description}</p>
                  </td>
                  <td className={`px-8 py-5 font-black text-sm whitespace-nowrap ${expense.excludedFromReports ? 'text-slate-300' : 'text-rose-600'}`}>
                    -{expense.amount.toFixed(2)} DH
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={() => onDelete(expense.id)} className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all">
                      <i className="fas fa-trash-can text-xs"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Aucune dépense enregistrée sur cette période</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full p-10 space-y-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Nouvelle Dépense</h3>
               <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Libellé de la dépense</label>
                <input 
                  type="text" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Ex: Réparation ascenseur"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Montant (DH)</label>
                  <input 
                    type="number" 
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:ring-2 focus:ring-indigo-600 text-indigo-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type de charge</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as ExpenseCategory})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none appearance-none"
                >
                  {Object.values(ExpenseCategory).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <input 
                  type="checkbox" 
                  id="exclude-modal"
                  checked={formData.excludedFromReports}
                  onChange={(e) => setFormData({...formData, excludedFromReports: e.target.checked})}
                  className="w-6 h-6 text-indigo-600 rounded-lg"
                />
                <label htmlFor="exclude-modal" className="text-xs font-bold text-slate-600 leading-tight">
                  Exclure cette écriture du bilan financier annuel
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
