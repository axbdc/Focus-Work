import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, where, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Clock, CheckCircle2, Circle, User, LogOut, LayoutDashboard, ChevronRight } from 'lucide-react';

// --- CONFIGURAÇÃO DO FIREBASE (USA AS TUAS CHAVES AQUI) ---
const firebaseConfig = {
  apiKey: "AIzaSyCNaeLgZg4ehdL7nAcBgixUB5AESf6n8iw",
  authDomain: "focuswork-2a9ba.firebaseapp.com",
  projectId: "focuswork-2a9ba",
  storageBucket: "focuswork-2a9ba.firebasestorage.app",
  messagingSenderId: "1001074511111",
  appId: "1:1001074511111:web:cbfd84422cce381b0c89a2"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [priority, setPriority] = useState("Média");

  // Login Automático e Carregamento de Dados
  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    if (user) {
      const q = query(
        collection(db, "tasks"), 
        where("userId", "==", user),
        orderBy("createdAt", "desc")
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [user]);

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    await addDoc(collection(db, "tasks"), {
      text: newTask,
      priority,
      status: "Pendente",
      userId: user,
      createdAt: new Date().toISOString()
    });
    setNewTask("");
  };

  const updateStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "Pendente" ? "Em Progresso" : currentStatus === "Em Progresso" ? "Concluído" : "Pendente";
    await updateDoc(doc(db, "tasks", id), { status: nextStatus });
  };

  const deleteTask = async (id) => {
    await deleteDoc(doc(db, "tasks", id));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <User className="text-indigo-600 w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Focus Work</h1>
          <p className="text-slate-500 mb-8">Quem vai trabalhar hoje?</p>
          <div className="space-y-4">
            {['Alexandre', 'Marta'].map((name) => (
              <button
                key={name}
                onClick={() => setUser(name)}
                className="w-full p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-between group"
              >
                <span className="font-semibold text-slate-700">{name}</span>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <LayoutDashboard size={20} />
            </div>
            <span className="font-bold text-lg tracking-tight">Focus Work</span>
          </div>
          <button onClick={() => setUser(null)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 transition-colors">
            <span className="font-medium">{user}</span>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8">
        {/* Input Form */}
        <form onSubmit={addTask} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-8 space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="O que tens planeado para hoje?"
              className="flex-1 bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 rounded-xl px-4 py-3"
            />
            <button type="submit" className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-all">
              <Plus size={24} />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['Baixa', 'Média', 'Alta'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  priority === p ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </form>

        {/* Task List */}
        <div className="space-y-4">
          <AnimatePresence mode='popLayout'>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all"
              >
                <button 
                  onClick={() => updateStatus(task.id, task.status)}
                  className={`transition-colors ${task.status === "Concluído" ? 'text-green-500' : 'text-slate-300 hover:text-indigo-500'}`}
                >
                  {task.status === "Concluído" ? <CheckCircle2 size={28} /> : task.status === "Em Progresso" ? <Clock size={28} className="text-orange-400" /> : <Circle size={28} />}
                </button>
                
                <div className="flex-1">
                  <h3 className={`font-semibold ${task.status === "Concluído" ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {task.text}
                  </h3>
                  <div className="flex gap-3 mt-1">
                    <span className={`text-[10px] uppercase tracking-wider font-black ${
                      task.priority === 'Alta' ? 'text-red-500' : task.priority === 'Média' ? 'text-orange-500' : 'text-blue-500'
                    }`}>
                      {task.priority}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      {task.status}
                    </span>
                  </div>
                </div>

                <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                  <Trash2 size={20} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {tasks.length === 0 && (
            <div className="text-center py-20 bg-slate-100/50 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-medium italic">Tudo limpo por aqui. Relaxa ou começa algo novo!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
