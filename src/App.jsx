import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  updateDoc, 
  doc, 
  deleteDoc
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Clock, CheckCircle2, Circle, User, LogOut, 
  LayoutDashboard, Moon, Sun, UserPlus, ChevronRight, Play, Filter, Calendar
} from 'lucide-react';

// --- CONFIGURAÇÃO DO FIREBASE (COLA AS TUAS CHAVES AQUI) ---
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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'focus-work-pessoal';

export default function App() {
  const [isSplash, setIsSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [priority, setPriority] = useState("Média");
  const [filter, setFilter] = useState("Todas");
  const [availableUsers, setAvailableUsers] = useState(['Alexandre', 'Marta']);

  useEffect(() => {
    const timer = setTimeout(() => setIsSplash(false), 2000);
    
    const initAuth = async () => {
      await signInAnonymously(auth);
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setDbUser(user);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!dbUser || !currentUser) return;

    const tasksCollection = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
    
    const unsubscribe = onSnapshot(tasksCollection, 
      (snapshot) => {
        const loadedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const myTasks = loadedTasks
          .filter(t => t.assignedTo === currentUser)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setTasks(myTasks);
      },
      (error) => console.error("Erro Firestore:", error)
    );

    return () => unsubscribe();
  }, [dbUser, currentUser]);

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || !dbUser) return;

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), {
        text: newTask,
        priority,
        status: "Pendente",
        assignedTo: currentUser,
        createdAt: new Date().toISOString(),
        displayDate: new Date().toLocaleString('pt-PT'),
        startTime: null,
        endTime: null
      });
      setNewTask("");
    } catch (err) {
      console.error("Erro ao gravar:", err);
    }
  };

  const toggleStatus = async (task) => {
    if (!dbUser) return;
    const taskRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id);
    const now = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

    let updates = {};
    if (task.status === "Pendente") {
      updates = { status: "Em Progresso", startTime: now };
    } else if (task.status === "Em Progresso") {
      updates = { status: "Concluído", endTime: now };
    } else {
      updates = { status: "Pendente", startTime: null, endTime: null };
    }
    await updateDoc(taskRef, updates);
  };

  const deleteTask = async (id) => {
    if (!dbUser) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', id));
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => filter === "Todas" ? true : t.status === filter);
  }, [tasks, filter]);

  if (isSplash) {
    return (
      <div className="h-screen w-screen bg-indigo-600 flex flex-col items-center justify-center text-white">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/20 p-8 rounded-[3rem] backdrop-blur-xl border border-white/30 shadow-2xl">
          <LayoutDashboard size={80} />
        </motion.div>
        <h1 className="mt-8 text-4xl font-black tracking-tighter uppercase">Focus Work</h1>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`max-w-md w-full p-8 rounded-[2.5rem] shadow-2xl ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black tracking-tight mb-2">Focus Work</h2>
            <p className="text-slate-500 font-medium">Quem vai trabalhar hoje?</p>
          </div>
          <div className="space-y-4">
            {availableUsers.map((name) => (
              <button key={name} onClick={() => setCurrentUser(name)} className={`w-full p-5 rounded-2xl flex items-center justify-between border-2 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-indigo-500' : 'bg-white border-slate-100 hover:border-indigo-500 shadow-sm'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">{name[0]}</div>
                  <span className="font-bold text-lg">{name}</span>
                </div>
                <ChevronRight className="text-slate-300" />
              </button>
            ))}
            <button onClick={() => { const n = prompt("Nome:"); if(n) setAvailableUsers([...availableUsers, n]) }} className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 font-bold mt-4 hover:bg-indigo-50 transition-colors">+ Adicionar Pessoa</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <nav className={`sticky top-0 z-30 px-6 h-20 flex items-center justify-between backdrop-blur-xl border-b ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/30"><LayoutDashboard size={24} /></div>
          <span className="text-xl font-black tracking-tighter uppercase">Focus Work</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 transition-transform active:scale-95">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
          <button onClick={() => setCurrentUser(null)} className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700 hover:text-red-500 transition-colors">
            <span className="font-bold hidden sm:block">{currentUser}</span>
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white"><User size={20} /></div>
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <section className={`p-6 rounded-[2.5rem] mb-10 shadow-xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-white'}`}>
          <form onSubmit={addTask} className="flex flex-col md:flex-row gap-4">
            <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="O que vamos organizar hoje?" className={`flex-1 p-5 rounded-2xl text-lg font-bold border-none focus:ring-4 focus:ring-indigo-500/20 ${darkMode ? 'bg-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 text-slate-900'}`} />
            <div className="flex gap-2">
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className={`p-4 rounded-2xl font-bold border-none cursor-pointer focus:ring-0 ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <option>Baixa</option><option>Média</option><option>Alta</option>
              </select>
              <button className="bg-indigo-600 text-white px-8 rounded-2xl font-black shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center gap-2">
                <Plus size={20} /> CRIAR
              </button>
            </div>
          </form>
        </section>

        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['Todas', 'Pendente', 'Em Progresso', 'Concluído'].map((f) => (
              <button 
                key={f} 
                onClick={() => setFilter(f)} 
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  filter === f 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' 
                  : darkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500 border border-slate-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
            <Filter size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-black text-2xl tracking-tight mb-4">
            <Calendar className="text-indigo-600" size={24} />
            <h2>Tarefas Ativas</h2>
          </div>

          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => (
              <motion.div 
                key={task.id} 
                layout 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-6 rounded-[1.8rem] border shadow-sm flex items-center justify-between gap-4 group transition-all ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 hover:shadow-xl'
                }`}
              >
                <div className="flex flex-col gap-3 flex-1 min-w-0">
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {task.status.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      task.priority === 'Alta' ? 'bg-red-100 text-red-600' : 
                      task.priority === 'Média' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {task.priority.toUpperCase()}
                    </span>
                  </div>

                  <h3 className={`text-2xl font-black truncate ${
                    task.status === "Concluído" ? 'text-slate-400 line-through' : darkMode ? 'text-white' : 'text-slate-800'
                  }`}>
                    {task.text}
                  </h3>

                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                    <Clock size={14} />
                    <span>{task.displayDate || new Date(task.createdAt).toLocaleString('pt-PT')}</span>
                    {task.startTime && task.status !== "Pendente" && (
                      <span className="ml-2 text-indigo-500">| Início: {task.startTime}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {task.status !== "Concluído" && (
                    <button 
                      onClick={() => toggleStatus(task)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-md active:scale-95 ${
                        task.status === "Pendente" 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20' 
                        : 'bg-green-500 text-white hover:bg-green-600 shadow-green-500/20'
                      }`}
                    >
                      <Play size={16} fill="currentColor" />
                      {task.status === "Pendente" ? "Iniciar" : "Concluir"}
                    </button>
                  )}
                  
                  {task.status === "Concluído" && (
                    <div className="bg-green-100 text-green-600 p-3 rounded-full">
                      <CheckCircle2 size={24} />
                    </div>
                  )}

                  <button 
                    onClick={() => deleteTask(task.id)} 
                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all"
                  >
                    <Trash2 size={22} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredTasks.length === 0 && (
            <div className={`p-20 rounded-[3rem] border-4 border-dashed text-center ${
              darkMode ? 'border-slate-800 text-slate-700' : 'border-slate-100 text-slate-300'
            }`}>
              <LayoutDashboard size={64} className="mx-auto mb-4 opacity-20" />
              <p className="text-xl font-bold italic">Tudo limpo por aqui. Começa algo!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
