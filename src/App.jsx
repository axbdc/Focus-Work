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
  LayoutDashboard, Moon, Sun, UserPlus, ChevronRight, PlayCircle
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

  // 1. Inicialização e Auth (REGRA 3)
  useEffect(() => {
    const timer = setTimeout(() => setIsSplash(false), 2000);
    
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        // eslint-disable-next-line no-undef
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
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

  // 2. Carregar Dados (REGRA 1 e 2 - Sem orderBy para evitar erros)
  useEffect(() => {
    if (!dbUser || !currentUser) return;

    const tasksCollection = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
    
    // Usamos uma query simples sem filtros complexos (REGRA 2)
    const unsubscribe = onSnapshot(tasksCollection, 
      (snapshot) => {
        const loadedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Filtramos e Ordenamos em memória (Seguro e rápido)
        const myTasks = loadedTasks
          .filter(t => t.assignedTo === currentUser)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setTasks(myTasks);
      },
      (error) => {
        console.error("Erro Firestore:", error);
      }
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
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/20 p-8 rounded-[3rem] backdrop-blur-xl border border-white/30">
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
          <h2 className="text-3xl font-black text-center mb-8 tracking-tight">Quem és tu?</h2>
          <div className="space-y-4">
            {availableUsers.map((name) => (
              <button key={name} onClick={() => setCurrentUser(name)} className={`w-full p-5 rounded-2xl flex items-center justify-between border-2 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-indigo-500' : 'bg-slate-50 border-slate-100 hover:border-indigo-500 hover:bg-white hover:shadow-lg'}`}>
                <span className="font-bold text-lg">{name}</span>
                <ChevronRight className="text-slate-300" />
              </button>
            ))}
            <button onClick={() => { const n = prompt("Nome:"); if(n) setAvailableUsers([...availableUsers, n]) }} className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 font-bold mt-4">+ Adicionar Pessoa</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <nav className={`sticky top-0 z-30 px-6 h-20 flex items-center justify-between backdrop-blur-xl border-b ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white"><LayoutDashboard size={24} /></div>
          <span className="text-xl font-black tracking-tighter uppercase">Focus Work</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
          <button onClick={() => setCurrentUser(null)} className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
            <span className="font-bold hidden sm:block">{currentUser}</span>
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white"><User size={20} /></div>
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <section className={`p-6 rounded-[2.5rem] mb-10 shadow-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-white'}`}>
          <form onSubmit={addTask} className="flex flex-col md:flex-row gap-4">
            <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="O que vais fazer?" className={`flex-1 p-5 rounded-2xl text-lg font-bold border-none focus:ring-4 focus:ring-indigo-500/20 ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`} />
            <div className="flex gap-2">
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className={`p-4 rounded-2xl font-bold border-none ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <option>Baixa</option><option>Média</option><option>Alta</option>
              </select>
              <button className="bg-indigo-600 text-white px-8 rounded-2xl font-black shadow-lg">ADICIONAR</button>
            </div>
          </form>
        </section>

        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {['Todas', 'Pendente', 'Em Progresso', 'Concluído'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-6 py-3 rounded-2xl text-sm font-black transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-slate-800'}`}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => (
              <motion.div key={task.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className={`p-5 rounded-[2rem] border-2 flex items-center gap-6 group transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}
              >
                <button onClick={() => toggleStatus(task)} className={`transition-all ${task.status === "Concluído" ? 'text-green-500' : task.status === "Em Progresso" ? 'text-orange-500' : 'text-slate-300'}`}>
                  {task.status === "Concluído" ? <CheckCircle2 size={36} /> : task.status === "Em Progresso" ? <Clock size={36} className="animate-pulse" /> : <Circle size={36} />}
                </button>

                <div className="flex-1 min-w-0">
                  <h3 className={`text-xl font-black truncate ${task.status === "Concluído" ? 'text-slate-400 line-through' : ''}`}>{task.text}</h3>
                  <div className="flex flex-wrap gap-x-4 mt-1 text-[10px] font-black uppercase tracking-widest italic">
                    <span className={task.priority === 'Alta' ? 'text-red-500' : 'text-indigo-500'}>{task.priority}</span>
                    {task.startTime && <span className="text-orange-500">Início: {task.startTime}</span>}
                    {task.endTime && <span className="text-green-600 font-bold">Fim: {task.endTime}</span>}
                  </div>
                </div>

                <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-3 text-slate-300 hover:text-red-500 transition-all">
                  <Trash2 size={22} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredTasks.length === 0 && (
            <div className={`p-20 rounded-[3rem] border-4 border-dashed text-center opacity-30 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <p className="font-bold italic">Nada por aqui. Começa algo!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
