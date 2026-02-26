import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Play, 
  CheckCircle, 
  Clock, 
  User, 
  LogOut, 
  ChevronRight,
  LayoutDashboard,
  Calendar,
  Moon,
  Sun,
  Filter,
  CheckCircle2,
  ListTodo,
  UserPlus,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';

// --- Configuração Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyCNaeLgZg4ehdL7nAcBgixUB5AESf6n8iw",
  authDomain: "focuswork-2a9ba.firebaseapp.com",
  projectId: "focuswork-2a9ba",
  storageBucket: "focuswork-2a9ba.firebasestorage.app",
  messagingSenderId: "1001074511111",
  appId: "1:1001074511111:web:cbfd84422cce381b0c89a2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'focus-work-pessoal';

// --- Componentes de UI Auxiliares ---

const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl shadow-xl border transition-colors duration-300 ${className} bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700`}>
    {children}
  </div>
);

const Badge = ({ status }) => {
  const styles = {
    "Pendente": "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    "Em Progresso": "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse",
    "Concluída": "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles["Pendente"]}`}>
      {status}
    </span>
  );
};

// --- Aplicação Principal ---

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [fbUser, setFbUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  
  const [newTask, setNewTask] = useState("");
  const [priority, setPriority] = useState("Média");
  const [darkMode, setDarkMode] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Todas");

  // 1. Inicializar Autenticação e Preload
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Erro na autenticação:", err);
      } finally {
        setTimeout(() => setLoading(false), 2000);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setFbUser);
    return () => unsubscribe();
  }, []);

  // 2. Carregar Tarefas e Perfis da Cloud
  useEffect(() => {
    if (!fbUser) return;

    // Listener de Tarefas
    const tasksCollection = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
    const unsubTasks = onSnapshot(tasksCollection, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Listener de Perfis
    const profilesCollection = collection(db, 'artifacts', appId, 'public', 'data', 'profiles');
    const unsubProfiles = onSnapshot(profilesCollection, (snapshot) => {
      const pList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Se estiver vazio, inicializar com Alexandre e Marta
      if (pList.length === 0) {
        initDefaultProfiles();
      } else {
        setProfiles(pList.sort((a, b) => a.name.localeCompare(b.name)));
      }
    });

    return () => {
      unsubTasks();
      unsubProfiles();
    };
  }, [fbUser]);

  const initDefaultProfiles = async () => {
    const defaults = ["Alexandre", "Marta"];
    for (const name of defaults) {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'profiles'), { name });
    }
  };

  const handleAddProfile = async (e) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'profiles'), { 
        name: newProfileName.trim() 
      });
      setNewProfileName("");
      setShowAddUser(false);
    } catch (err) {
      console.error("Erro ao criar perfil:", err);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || !fbUser) return;

    const taskData = {
      text: newTask,
      priority,
      status: "Pendente",
      owner: user,
      createdAt: new Date().toLocaleString('pt-PT'),
      startTime: null,
      endTime: null,
      timestamp: Date.now()
    };

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), taskData);
      setNewTask("");
    } catch (err) {
      console.error("Erro ao guardar tarefa:", err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', id));
    } catch (err) {
      console.error("Erro ao eliminar:", err);
    }
  };

  const updateStatus = async (id, nextStatus) => {
    const updates = { status: nextStatus };
    if (nextStatus === "Em Progresso") updates.startTime = new Date().toLocaleTimeString('pt-PT');
    if (nextStatus === "Concluída") updates.endTime = new Date().toLocaleTimeString('pt-PT');

    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', id), updates);
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  };

  // Filtragem e Estatísticas
  const userTasks = tasks
    .filter(t => t.owner === user)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const filteredTasks = userTasks.filter(t => {
    if (activeFilter === "Todas") return true;
    return t.status === activeFilter;
  });

  const stats = {
    pending: userTasks.filter(t => t.status === "Pendente").length,
    doing: userTasks.filter(t => t.status === "Em Progresso").length,
    done: userTasks.filter(t => t.status === "Concluída").length,
  };

  // Pre-load / Splash Screen
  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-500 ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-6"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="bg-blue-600 p-6 rounded-3xl shadow-2xl shadow-blue-500/20 text-white"
          >
            <LayoutDashboard size={64} />
          </motion.div>
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`text-4xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}
            >
              Focus Work
            </motion.h1>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.5, duration: 1.5 }}
              className="h-1 bg-blue-600 rounded-full mt-2"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // Ecrã de Login
  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-8">
            <h1 className={`text-4xl font-bold mb-2 tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Focus Work</h1>
            <p className="text-slate-500 font-medium italic">Selecione o seu perfil ou crie um novo</p>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence mode="popLayout">
              {profiles.map((p) => (
                <motion.button
                  key={p.id}
                  layout
                  whileHover={{ x: 5 }}
                  onClick={() => setUser(p.name)}
                  className={`p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all flex items-center justify-between group ${darkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                      {p.name[0]}
                    </div>
                    <span className="font-semibold">{p.name}</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500" />
                </motion.button>
              ))}
            </AnimatePresence>

            {!showAddUser ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => setShowAddUser(true)}
                className="mt-4 p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all flex items-center justify-center gap-2 font-medium"
              >
                <UserPlus size={20} />
                Adicionar Pessoa
              </motion.button>
            ) : (
              <motion.form 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onSubmit={handleAddProfile}
                className={`mt-4 p-4 rounded-2xl border-2 border-blue-500/30 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase text-blue-500">Novo Perfil</span>
                  <button type="button" onClick={() => setShowAddUser(false)}>
                    <X size={16} className="text-slate-400 hover:text-red-500" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Nome da pessoa"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-700 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button 
                    type="submit"
                    className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </motion.form>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-20">
        
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 transition-colors duration-300">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <LayoutDashboard size={20} />
              </div>
              <span className="font-bold text-lg hidden sm:block">FocusWork</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                <User size={16} className="text-slate-500 dark:text-slate-400" />
                <span className="text-sm font-semibold">{user}</span>
              </div>
              <button 
                onClick={() => setUser(null)}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8">
          
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: 'Pendente', val: stats.pending, color: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300' },
              { label: 'A fazer', val: stats.doing, color: 'bg-blue-500', text: 'text-white' },
              { label: 'Feito', val: stats.done, color: 'bg-emerald-500', text: 'text-white' }
            ].map((s, i) => (
              <Card key={i} className={`p-4 text-center border-none ${s.color}`}>
                <div className={`text-2xl font-bold ${s.text}`}>{s.val}</div>
                <div className={`text-[10px] uppercase tracking-wider font-bold opacity-80 ${s.text}`}>{s.label}</div>
              </Card>
            ))}
          </div>

          <Card className="p-4 mb-8">
            <form onSubmit={addTask} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text"
                  placeholder="O que precisa de fazer hoje?"
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                />
                <div className="flex gap-2">
                  <select 
                    className="px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-medium outline-none"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option>Baixa</option>
                    <option>Média</option>
                    <option>Alta</option>
                  </select>
                  <button 
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none active:scale-95"
                  >
                    <Plus size={20} />
                    <span className="hidden sm:inline">Adicionar</span>
                  </button>
                </div>
              </div>
            </form>
          </Card>

          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <Filter size={18} className="text-slate-400 flex-shrink-0" />
            {["Todas", "Pendente", "Em Progresso", "Concluída"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  activeFilter === filter 
                    ? "bg-blue-600 text-white" 
                    : "bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar size={20} className="text-blue-500" />
                Minhas Tarefas
              </h2>
            </div>
            
            <AnimatePresence mode="popLayout">
              {filteredTasks.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 bg-slate-100/50 dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700"
                >
                  <ListTodo size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-400 font-medium">Nenhuma tarefa aqui.</p>
                </motion.div>
              ) : (
                filteredTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="relative group"
                  >
                    <Card className={`p-5 transition-all ${task.status === "Concluída" ? "opacity-60 grayscale-[0.5]" : ""}`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge status={task.status} />
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                              task.priority === "Alta" ? "border-red-200 text-red-600 bg-red-50 dark:bg-red-900/20" :
                              task.priority === "Média" ? "border-amber-200 text-amber-600 bg-amber-50 dark:bg-amber-900/20" :
                              "border-slate-200 text-slate-500 dark:bg-slate-700"
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                          <h3 className={`text-lg font-semibold ${task.status === "Concluída" ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-100"}`}>
                            {task.text}
                          </h3>
                          <div className="flex flex-wrap gap-4 text-[11px] text-slate-400 font-medium">
                            <div className="flex items-center gap-1"><Clock size={12} /> {task.createdAt}</div>
                            {task.startTime && <div className="flex items-center gap-1 text-blue-500"><Play size={12} /> Início: {task.startTime}</div>}
                            {task.endTime && <div className="flex items-center gap-1 text-emerald-500"><CheckCircle2 size={12} /> Fim: {task.endTime}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-3 md:pt-0">
                          {task.status === "Pendente" && (
                            <button onClick={() => updateStatus(task.id, "Em Progresso")} className="flex-1 md:flex-none flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg font-bold text-sm"><Play size={16} /> Começar</button>
                          )}
                          {task.status === "Em Progresso" && (
                            <button onClick={() => updateStatus(task.id, "Concluída")} className="flex-1 md:flex-none flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-lg font-bold text-sm"><CheckCircle2 size={16} /> Concluir</button>
                          )}
                          <button onClick={() => deleteTask(task.id)} className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 rounded-lg"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
