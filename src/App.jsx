import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, where, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Clock, CheckCircle2, Circle, User, LogOut, 
  LayoutDashboard, ChevronRight, Moon, Sun, UserPlus, Filter 
} from 'lucide-react';

// --- CONFIGURAÇÃO DO FIREBASE ---
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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [priority, setPriority] = useState("Média");
  const [filter, setFilter] = useState("Todas");
  const [availableUsers, setAvailableUsers] = useState(['Alexandre', 'Marta']);

  // Splash Screen Effect
  useEffect(() => {
    setTimeout(() => setLoading(false), 2500);
    signInAnonymously(auth).catch(console.error);
  }, []);

  // Sync Tasks
  useEffect(() => {
    if (user) {
      const q = query(collection(db, "tasks"), where("userId", "==", user), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
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
      createdAt: new Date().toISOString(),
      startTime: null,
      endTime: null
    });
    setNewTask("");
  };

  const updateStatus = async (task) => {
    let updates = {};
    const now = new Date().toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit' });

    if (task.status === "Pendente") {
      updates = { status: "Em Progresso", startTime: now };
    } else if (task.status === "Em Progresso") {
      updates = { status: "Concluído", endTime: now };
    } else {
      updates = { status: "Pendente", startTime: null, endTime: null };
    }
    await updateDoc(doc(db, "tasks", task.id), updates);
  };

  const filteredTasks = tasks.filter(t => filter === "Todas" ? true : t.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
          <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-2xl mb-6">
            <LayoutDashboard size={60} className="text-white" />
          </div>
        </motion.div>
        <motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="text-3xl font-black text-slate-800 tracking-tighter">
          Focus Work
        </motion.h1>
        <div className="mt-4 w-12 h-1 bg-indigo-600 rounded-full overflow-hidden">
          <motion.div initial={{ x: -50 }} animate={{ x: 50 }} transition={{ repeat: Infinity, duration: 1 }} className="w-full h-full bg-indigo-300" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'} flex items-center justify-center p-4 transition-colors`}>
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-black mb-2">Focus Work</h1>
            <p className="text-slate-500">Selecione o seu perfil</p>
          </div>
          <div className="grid gap-4">
            {availableUsers.map(name => (
              <button key={name} onClick={() => setUser(name)} className={`p-5 rounded-2xl border-2 flex items-center justify-between group transition-all ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-indigo-500' : 'bg-white border-slate-100 hover:border-indigo-500 shadow-sm'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">{name[0]}</div>
                  <span className="font-bold text-lg">{name}</span>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-indigo-500" />
              </button>
            ))}
            <button 
              onClick={() => {
                const n = prompt("Nome da nova pessoa:");
                if(n) setAvailableUsers([...availableUsers, n]);
              }}
              className="p-4 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center gap-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
            >
              <UserPlus size={20} /> Adicionar Pessoa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} transition-colors duration-300`}>
      <nav className={`sticky top-0 z-20 px-6 h-20 flex items-center justify-between border-b ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'} backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/30"><LayoutDashboard size={24} /></div>
          <span className="text-xl font-black tracking-tight">FocusWork</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:scale-110 transition-transform">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setUser(null)} className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
            <div className="text-right hidden sm:block"><p className="text-xs text-slate-500 font-bold uppercase">Perfil</p><p className="font-bold">{user}</p></div>
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white"><User size={20} /></div>
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10 text-center">
          {['Pendente', 'Em Progresso', 'Concluído'].map(s => (
            <div key={s} className={`p-4 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">{s === 'Em Progresso' ? 'Em Curso' : s === 'Concluído' ? 'Feito' : s}</p>
              <p className="text-3xl font-black">{tasks.filter(t => t.status === s).length}</p>
            </div>
          ))}
        </div>

        {/* Create Task */}
        <form onSubmit={addTask} className={`p-6 rounded-[2.5rem] mb-10 space-y-4 shadow-xl ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100'}`}>
          <div className="flex gap-4">
            <input 
              type="text" value={newTask} onChange={e => setNewTask(e.target.value)}
              placeholder="O que vamos organizar hoje?"
              className={`flex-1 p-4 rounded-2xl text-lg font-medium border-none focus:ring-4 focus:ring-indigo-500/20 ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}
            />
            <button className="bg-indigo-600 text-white px-8 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/40">
              <Plus /> <span className="hidden sm:inline">Criar</span>
            </button>
          </div>
          <div className="flex gap-3">
             <select value={priority} onChange={e => setPriority(e.target.value)} className={`text-sm font-bold p-2 rounded-xl border-none focus:ring-0 cursor-pointer ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                <option>Baixa</option><option>Média</option><option>Alta</option>
             </select>
          </div>
        </form>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide">
          {['Todas', 'Pendente', 'Em Progresso', 'Concluído'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-6 py-2.5 rounded-2xl whitespace-nowrap text-sm font-bold transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              {f}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Clock className="text-indigo-600" size={24} /> Tarefas Ativas</h2>
          <AnimatePresence mode="popLayout">
            {filteredTasks.map(task => (
              <motion.div key={task.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className={`p-5 rounded-3xl border flex items-center gap-5 group transition-all ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-indigo-500' : 'bg-white border-slate-200 hover:shadow-xl shadow-sm'}`}
              >
                <button onClick={() => updateStatus(task)} className={`transition-colors ${task.status === "Concluído" ? 'text-green-500' : 'text-slate-300 hover:text-indigo-600'}`}>
                  {task.status === "Concluído" ? <CheckCircle2 size={32} /> : task.status === "Em Progresso" ? <Clock size={32} className="text-orange-500 animate-pulse" /> : <Circle size={32} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-lg truncate ${task.status === "Concluído" ? 'text-slate-400 line-through' : ''}`}>{task.text}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${task.priority === 'Alta' ? 'text-red-500' : task.priority === 'Média' ? 'text-orange-500' : 'text-blue-500'}`}>{task.priority}</span>
                    {task.startTime && <span className="text-[10px] text-indigo-500 font-bold uppercase">Começou: {task.startTime}</span>}
                    {task.endTime && <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider italic">Terminou: {task.endTime}</span>}
                  </div>
                </div>
                <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                  <Trash2 size={22} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredTasks.length === 0 && (
            <div className={`p-20 rounded-[3rem] border-4 border-dashed text-center ${darkMode ? 'border-slate-800 text-slate-700' : 'border-slate-100 text-slate-300'}`}>
              <LayoutDashboard size={64} className="mx-auto mb-4 opacity-20" />
              <p className="text-xl font-bold">Tudo limpo por aqui!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
