
import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { CATEGORY_COLORS, MONTHS } from '../constants';
import { exportToPDF } from '../utils/pdfUtils';
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
  const [showModal, setShowModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  
  const [formData, setFormData] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    category: ExpenseCategory.OTHER,
    excludedFromReports: false,
  });

  const years = useMemo(() => {
    // Explicitly type the set and the sort arguments to ensure numeric context
    const yearsSet = new Set<number>(expenses.map(e => new Date(e.date).getFullYear()));
    yearsSet.add(new Date().getFullYear());
    return Array.from(yearsSet).sort((a: number, b: number) => b - a);
  }, [expenses]);

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
    // Initialisation avec toutes les catégories pour avoir un graphe complet
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
    const newExpense = { ...formData, id: Date.now().toString() } as Expense;
    onAdd(newExpense);
    setShowModal(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: ExpenseCategory.OTHER,
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestion des Dépenses</h2>
          <p className="text-slate-500">Suivez et analysez les coûts de la copropriété.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleExportPDF}
            className="flex-1 sm:flex-none border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <i className="fas fa-file-pdf"></i> Exporter PDF
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex-1 sm:flex-none bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <i className="fas fa-plus"></i> Nouvelle dépense
          </button>
        </div>
      </div>

      {/* Section Analyse Graphique */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <i className="fas fa-chart-bar text-indigo-500"></i> Répartition par Catégorie
            </h3>
            <div className="flex gap-2">
               <select 
                 className="text-xs border rounded-lg px-2 py-1 outline-none bg-slate-50 font-medium"
                 value={selectedYear}
                 onChange={(e) => setSelectedYear(parseInt(e.target.value))}
               >
                 {years.map(y => <option key={y} value={y}>{y}</option>)}
               </select>
               <select 
                 className="text-xs border rounded-lg px-2 py-1 outline-none bg-slate-50 font-medium"
                 value={selectedMonth}
                 onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
               >
                 <option value="all">Toute l'année</option>
                 {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
               </select>
            </div>
          </div>
          
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 italic">
                <i className="fas fa-chart-pie text-3xl mb-2 opacity-20"></i>
                <p className="text-sm">Aucune donnée pour cette période</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-100 flex flex-col justify-center">
           <h4 className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Total Dépenses Période</h4>
           <p className="text-4xl font-bold mb-4">
             {filteredExpenses.filter(e => !e.excludedFromReports).reduce((sum, e) => sum + e.amount, 0).toLocaleString()} <span className="text-xl">DH</span>
           </p>
           <div className="space-y-3">
              <div className="flex items-center justify-between text-sm border-t border-indigo-500 pt-3">
                <span className="text-indigo-200">Nombre d'opérations</span>
                <span className="font-bold">{filteredExpenses.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-indigo-200">Exclues des bilans</span>
                <span className="font-bold">{filteredExpenses.filter(e => e.excludedFromReports).length}</span>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
           <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Historique des transactions</h3>
           <span className="text-[10px] text-slate-400 font-bold italic">Filtré par la période sélectionnée haut</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center w-12">Bilans</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Catégorie</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Description</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Montant</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className={`hover:bg-slate-50 transition-colors ${expense.excludedFromReports ? 'bg-slate-50/50 grayscale-[0.5] opacity-75' : ''}`}>
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="checkbox" 
                      title={expense.excludedFromReports ? "Inclure dans les bilans" : "Exclure des bilans"}
                      checked={!expense.excludedFromReports} 
                      onChange={() => handleToggleExclude(expense)}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-6 py-4 text-slate-600">{new Date(expense.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[expense.category]}`}>
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-800 font-medium">{expense.description}</span>
                      {expense.excludedFromReports && (
                        <span className="text-[10px] font-bold text-amber-600 uppercase">Hors Bilans</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-red-600">-{expense.amount.toFixed(2)} DH</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onDelete(expense.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">Aucune dépense pour cette période.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 space-y-6">
            <h3 className="text-2xl font-bold text-slate-800">Ajouter une dépense</h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <input 
                  type="text" 
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: Réparation ascenseur"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Catégorie</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as ExpenseCategory})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {Object.values(ExpenseCategory).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Montant (DH)</label>
                  <input 
                    type="number" 
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Date</label>
                <input 
                  type="date" 
                  value={formData.date || ''}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <input 
                  id="exclude-new"
                  type="checkbox" 
                  checked={formData.excludedFromReports}
                  onChange={(e) => setFormData({...formData, excludedFromReports: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <label htmlFor="exclude-new" className="text-sm text-slate-700 font-medium">Exclure cette dépense du calcul des bilans financiers</label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
