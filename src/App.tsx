import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Plus, 
  Trash2, 
  Send, 
  Sparkles, 
  Zap, 
  BookOpen, 
  Briefcase, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Play, 
  Pause, 
  RotateCcw, 
  FileText, 
  Mail, 
  Search, 
  Compass, 
  Cpu, 
  Terminal,
  Activity,
  Copy,
  Check,
  LogIn,
  UserPlus,
  LogOut,
  User as UserIcon,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { Task, MicroTask, ProactiveAsset, ChatMessage, TaskProfile, User } from './types';

// Default tasks to seed the applet
const SEED_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Q2 Performance Review Slide Deck',
    description: 'Compile slide deck summarizing team KPIs, project milestones completed, and resource constraints for next quarter presentation.',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString().slice(0, 16), // 4 hours from now
    estimatedEffort: 3,
    impact: 'high',
    profile: 'professional',
    status: 'pending',
    priorityScore: 94,
    priorityExplanation: 'High impact deliverable due in less than 4 hours requiring 3 hours of concentrated work. You have almost zero margin for procrastination. Start drafting immediately.',
    microTasks: [
      {
        id: 'm1',
        title: 'Gather team metrics and Excel exports',
        duration: 20,
        timeBlock: '09:00 AM - 09:20 AM',
        description: 'Pull core CSVs and copy-paste the absolute numbers into a quick notepad to skip application switching overhead.',
        completed: false
      },
      {
        id: 'm2',
        title: 'Draft Key Highlights & Wins',
        duration: 15,
        timeBlock: '09:20 AM - 09:35 AM',
        description: 'Focus purely on writing 3 high-impact accomplishments. Don\'t format slides yet.',
        completed: false
      }
    ],
    proactiveAssets: [
      {
        id: 'a1',
        title: 'Q2 Performance Outline Structure',
        type: 'outline',
        content: '# Q2 Performance Review Outline\n\n## Slide 1: Executive Summary\n- Core message: Achieved 114% of the quarterly revenue target while operating under budget constraints.\n- Core Metric: $1.2M gross sales (+18% QoQ).\n\n## Slide 2: Major Milestones Completed\n- Launched Cloud Portal 2.0 ahead of the June deadline.\n- Migrated 40 active client accounts to the new infrastructure.\n\n## Slide 3: Growth Blockers & Help Needed\n- Understaffed: Need 2 additional full-stack engineers to meet the Q3 roadmap commits.\n- API response latency is currently sitting at 450ms (needs optimization phase).',
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 't2',
    title: 'Research CS301 Machine Learning Term Paper',
    description: 'Draft the theoretical overview and comparison between convolutional networks and transformer-based visual systems.',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString().slice(0, 16), // 12 hours from now
    estimatedEffort: 5,
    impact: 'high',
    profile: 'student',
    status: 'pending',
    priorityScore: 82,
    priorityExplanation: 'Requires deep cognitive load and academic precision. Due in 12 hours with an estimated 5 hours of intensive writing. Break it down to avoid late night panic.',
    microTasks: [],
    proactiveAssets: []
  },
  {
    id: 't3',
    title: 'Urgent response to VC Lead Investor regarding Series A term sheet',
    description: 'Draft the counter-proposal email addressing the liquidation preference and board seat veto clauses.',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString().slice(0, 16), // 2 hours from now
    estimatedEffort: 1,
    impact: 'high',
    profile: 'entrepreneur',
    status: 'pending',
    priorityScore: 98,
    priorityExplanation: 'Critical funding gatekeeper. Deal terms are pending and have a 2-hour soft expiration. Delaying is not an option; a clear stance keeps the deal alive.',
    microTasks: [],
    proactiveAssets: []
  }
];

export default function App() {
  // --- USER AUTHENTICATION STATE ---
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('lastminute_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('lastminute_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authProfile, setAuthProfile] = useState<TaskProfile>('professional');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // --- APPLICATION STATE ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('lastminute_tasks');
    if (saved) {
      return JSON.parse(saved);
    } else {
      // Seed tasks for guests and initial state
      return SEED_TASKS.map(t => ({ ...t, userId: 'guest' }));
    }
  });

  const [profile, setProfile] = useState<TaskProfile>(() => {
    return currentUser?.profile || 'professional';
  });
  
  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState(() => {
    // Default to 4 hours from now
    const d = new Date(Date.now() + 1000 * 60 * 60 * 4);
    return d.toISOString().slice(0, 16);
  });
  const [newEffort, setNewEffort] = useState(2);
  const [newImpact, setNewImpact] = useState<'low' | 'medium' | 'high'>('high');

  const activeUserId = currentUser ? currentUser.id : 'guest';
  const userTasks = tasks.filter(t => t.userId === activeUserId);

  // Interactive Selection
  const [selectedTaskId, setSelectedTaskId] = useState<string>('t1');
  const [activeMicroTaskId, setActiveMicroTaskId] = useState<string | null>(null);
  
  // Timer State for micro-task sprint
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1500); // Default to 25m
  const [originalDurationMinutes, setOriginalDurationMinutes] = useState<number>(25);
  const [customMinutes, setCustomMinutes] = useState<number>(25);

  // Proactive execution states
  const [assetTypeToGenerate, setAssetTypeToGenerate] = useState<'email_draft' | 'outline' | 'research' | 'structure' | 'code' | 'talking_points'>('outline');
  const [isGeneratingAsset, setIsGeneratingAsset] = useState(false);
  const [viewingAsset, setViewingAsset] = useState<ProactiveAsset | null>(null);
  const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);

  // Prioritization state
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [isBreakingDown, setIsBreakingDown] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('lastminute_chat');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const unique: ChatMessage[] = [];
          const seen = new Set<string>();
          for (const msg of parsed) {
            if (msg && msg.id && !seen.has(msg.id)) {
              seen.add(msg.id);
              unique.push(msg);
            }
          }
          return unique;
        }
      } catch (e) {
        console.error("Error loading chat history:", e);
      }
    }
    return [
      {
        id: 'c1',
        userId: 'guest',
        sender: 'ai',
        text: "I am 'The Last-Minute Life Saver'. Deadlines are creeping in, and stress is mounting. Stop overthinking. Select a task below or add a new commitment, and let's start hacking it down block by block. What are we starting right now?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const userChatMessages = chatMessages.filter(m => m.userId === activeUserId);

  // Ref for chat auto-scroll
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // --- SYNC & ONBOARDING EFFECTS ---
  useEffect(() => {
    localStorage.setItem('lastminute_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('lastminute_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Sync profile when current user changes
  useEffect(() => {
    if (currentUser) {
      setProfile(currentUser.profile);
    }
  }, [currentUser]);

  // Seed tasks for new registered users dynamically to keep their deck beautiful and active
  useEffect(() => {
    const activeId = currentUser ? currentUser.id : 'guest';
    setTasks(prev => {
      const existingUserTasks = prev.filter(t => t.userId === activeId);
      if (existingUserTasks.length === 0) {
        const personalizedSeeds = SEED_TASKS.map((t, idx) => ({
          ...t,
          id: `task_seed_${activeId}_${idx}`,
          userId: activeId,
          profile: currentUser?.profile || 'professional',
          dueDate: new Date(Date.now() + (idx === 0 ? 1000 * 60 * 60 * 4 : idx === 1 ? 1000 * 60 * 60 * 12 : 1000 * 60 * 60 * 2)).toISOString().slice(0, 16)
        }));
        setTimeout(() => setSelectedTaskId(personalizedSeeds[0]?.id || ''), 0);
        return [...prev, ...personalizedSeeds];
      }
      return prev;
    });
  }, [currentUser]);

  // Keep selected task selection valid when user/tasks change
  useEffect(() => {
    const activeId = currentUser ? currentUser.id : 'guest';
    const currentTasks = tasks.filter(t => t.userId === activeId);
    if (currentTasks.length > 0) {
      const exists = currentTasks.some(t => t.id === selectedTaskId);
      if (!exists) {
        setSelectedTaskId(currentTasks[0].id);
      }
    } else {
      setSelectedTaskId('');
    }
  }, [currentUser, tasks, selectedTaskId]);

  // Seed welcome messages for each user ID dynamically
  useEffect(() => {
    if (activeUserId) {
      setChatMessages(prev => {
        const hasWelcome = prev.some(m => m.id === `welcome_${activeUserId}` || m.userId === activeUserId);
        if (hasWelcome) {
          return prev;
        }
        const welcomeMsg: ChatMessage = {
          id: `welcome_${activeUserId}`,
          userId: activeUserId,
          sender: 'ai',
          text: `Welcome ${currentUser ? currentUser.name : 'Guest'}! I am 'The Last-Minute Life Saver'. I've loaded your ${profile} profile. Tell me, what's currently stressing you out or keeping you up? Let's tackle it immediately.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        return [...prev, welcomeMsg];
      });
    }
  }, [activeUserId, currentUser, profile]);

  // --- REGISTRATION & LOGIN ACTIONS ---
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!authName.trim() || !authEmail.trim() || !authPassword.trim()) {
      setAuthError('All fields are required.');
      return;
    }

    const emailLower = authEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    if (authPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    const exists = users.some(u => u.email.toLowerCase() === emailLower);
    if (exists) {
      setAuthError('This email is already registered.');
      return;
    }

    const newUser: User = {
      id: 'usr_' + Date.now(),
      name: authName.trim(),
      email: emailLower,
      profile: authProfile,
      password: authPassword
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('lastminute_users', JSON.stringify(updatedUsers));

    setCurrentUser(newUser);
    localStorage.setItem('lastminute_current_user', JSON.stringify(newUser));
    setAuthSuccess(`Account created! Welcoming you, ${newUser.name}.`);

    setAuthName('');
    setAuthEmail('');
    setAuthPassword('');
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('Email and Password are required.');
      return;
    }

    const emailLower = authEmail.trim().toLowerCase();
    const foundUser = users.find(u => u.email.toLowerCase() === emailLower);

    if (!foundUser || foundUser.password !== authPassword) {
      setAuthError('Invalid email or password.');
      return;
    }

    setCurrentUser(foundUser);
    localStorage.setItem('lastminute_current_user', JSON.stringify(foundUser));
    setAuthSuccess(`Welcome back, ${foundUser.name}!`);

    setAuthEmail('');
    setAuthPassword('');
  };

  const handleLogOut = () => {
    setCurrentUser(null);
    localStorage.removeItem('lastminute_current_user');
    setSelectedTaskId('');
    setTimerRunning(false);
  };

  const handleGuestAccess = () => {
    const guestUser: User = {
      id: 'guest',
      name: 'Guest Survivor',
      email: 'guest@lastminute.io',
      profile: 'professional'
    };
    setCurrentUser(guestUser);
    localStorage.setItem('lastminute_current_user', JSON.stringify(guestUser));
  };

  // Active micro-task timer tick
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && timerRunning) {
      setTimerRunning(false);
      // Mark active microtask as completed when timer runs out
      if (selectedTaskId && activeMicroTaskId) {
        completeMicroTask(selectedTaskId, activeMicroTaskId);
      }
    }
    return () => clearInterval(interval);
  }, [timerRunning, secondsRemaining]);

  const activeTask = userTasks.find(t => t.id === selectedTaskId);
  const activeMicroTask = activeTask?.microTasks?.find(m => m.id === activeMicroTaskId);

  // Trigger real countdown calculation for task due times
  const getRemainingTimeText = (dueDateStr: string) => {
    const diff = new Date(dueDateStr).getTime() - Date.now();
    if (diff <= 0) return 'OVERDUE';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours === 0) return `${mins}m left`;
    return `${hours}h ${mins}m left`;
  };

  // Add a task commitment
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: Task = {
      id: 'task_' + Date.now(),
      userId: activeUserId,
      title: newTitle.trim(),
      description: newDesc.trim() || 'No description provided.',
      dueDate: newDueDate,
      estimatedEffort: Number(newEffort) || 1,
      impact: newImpact,
      profile: profile,
      status: 'pending',
      microTasks: [],
      proactiveAssets: []
    };

    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    setSelectedTaskId(newTask.id);

    // Reset Form
    setNewTitle('');
    setNewDesc('');
    
    // Automatically trigger prioritization for the user's filtered list
    const updatedUserTasks = [newTask, ...userTasks];
    await prioritizeTasksList(updatedUserTasks, profile);
  };

  // Delete a task
  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    if (selectedTaskId === id) {
      setSelectedTaskId(updated[0]?.id || '');
    }
  };

  // Trigger prioritizing on Backend
  const prioritizeTasksList = async (taskList: Task[], currentProfile: TaskProfile) => {
    setIsPrioritizing(true);
    try {
      const response = await fetch('/api/prioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: taskList, profile: currentProfile })
      });
      if (response.ok) {
        const data = await response.json();
        const prioritizedScores = data.prioritizedTasks || [];
        
        // Map scores back to state
        setTasks(prevTasks => {
          return prevTasks.map(t => {
            const match = prioritizedScores.find((ps: any) => ps.id === t.id);
            if (match) {
              return {
                ...t,
                priorityScore: match.priorityScore,
                priorityExplanation: match.priorityExplanation
              };
            }
            return t;
          });
        });

        // Add a helpful nudge in chat
        const highTask = taskList[0];
        setChatMessages(prev => [
          ...prev,
          {
            id: 'c_' + Date.now(),
            sender: 'ai',
            text: `⚠️ I have reprioritized your deck for the ${currentProfile} profile. Stop worrying about everything all at once. Your next high-momentum action is to focus exclusively on "${highTask?.title || 'the top card'}". I've analyzed deadlines and impacts. Let's break this down or build the starting assets right now. Ready?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (error) {
      console.error('Error prioritizing tasks:', error);
    } finally {
      setIsPrioritizing(false);
    }
  };

  // Break Down Task into Micro-Tasks
  const handleBreakdownTask = async () => {
    if (!activeTask) return;
    setIsBreakingDown(true);

    try {
      const response = await fetch('/api/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: activeTask })
      });

      if (response.ok) {
        const data = await response.json();
        const generatedMicro = (data.microTasks || []).map((m: any, idx: number) => ({
          id: `micro_${Date.now()}_${idx}`,
          title: m.title,
          duration: m.duration || 20,
          timeBlock: m.timeBlock,
          description: m.description,
          completed: false
        }));

        setTasks(prevTasks => {
          return prevTasks.map(t => {
            if (t.id === activeTask.id) {
              return {
                ...t,
                microTasks: generatedMicro
              };
            }
            return t;
          });
        });

        // Prompt user inside the chatbot
        setChatMessages(prev => [
          ...prev,
          {
            id: 'c_' + Date.now(),
            sender: 'ai',
            text: `I've shredded "${activeTask.title}" into highly precise, low-friction chunks. Check the micro-schedule block. It is set up with strict durations to prevent burnout. Which sprint should we launch first?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (error) {
      console.error('Error generating breakdown:', error);
    } finally {
      setIsBreakingDown(false);
    }
  };

  // Generate Proactive Asset (Do the work, don't just prompt)
  const handleGenerateAsset = async () => {
    if (!activeTask) return;
    setIsGeneratingAsset(true);

    try {
      const response = await fetch('/api/generate-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: activeTask, assetType: assetTypeToGenerate })
      });

      if (response.ok) {
        const data = await response.json();
        const newAsset: ProactiveAsset = {
          id: `asset_${Date.now()}`,
          title: data.title || `${assetTypeToGenerate.toUpperCase()} Draft`,
          type: assetTypeToGenerate,
          content: data.content,
          createdAt: new Date().toISOString()
        };

        setTasks(prevTasks => {
          return prevTasks.map(t => {
            if (t.id === activeTask.id) {
              return {
                ...t,
                proactiveAssets: [newAsset, ...(t.proactiveAssets || [])]
              };
            }
            return t;
          });
        });

        setViewingAsset(newAsset);

        // Put advice in the chatbot
        setChatMessages(prev => [
          ...prev,
          {
            id: 'c_' + Date.now(),
            sender: 'ai',
            text: `📝 BAM! Your initial burden is lowered. I went ahead and drafted a ${assetTypeToGenerate.replace('_', ' ')}: "${newAsset.title}". No placeholders, fully custom for you. Check it out on the layout. Copy it and customize. What is the next best step?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (error) {
      console.error('Error generating asset:', error);
    } finally {
      setIsGeneratingAsset(false);
    }
  };

  // Send message inside Chat Companion
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatSending) return;

    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      userId: activeUserId,
      sender: 'user',
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...userChatMessages, userMsg].slice(-8), // send last 8 messages for context
          activeTask: activeTask,
          activeMicroTask: activeMicroTask,
          profile: profile
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [
          ...prev,
          {
            id: 'ai_' + Date.now(),
            userId: activeUserId,
            sender: 'ai',
            text: data.text || "I'm with you. Let's quit talking and push forward.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (error) {
      console.error('Chat companion failed:', error);
    } finally {
      setIsChatSending(false);
    }
  };

  // Start a microtask timer sprint
  const startTimerSprint = (micro: MicroTask) => {
    setActiveMicroTaskId(micro.id);
    setSecondsRemaining(micro.duration * 60);
    setOriginalDurationMinutes(micro.duration);
    setTimerRunning(true);
  };

  // Toggle Timer state
  const toggleTimer = () => {
    setTimerRunning(!timerRunning);
  };

  // Reset current micro task timer
  const resetTimer = () => {
    if (activeMicroTask) {
      setSecondsRemaining(activeMicroTask.duration * 60);
      setTimerRunning(false);
    }
  };

  // Complete micro task
  const completeMicroTask = (taskId: string, microId: string) => {
    setTasks(prev => {
      return prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            microTasks: t.microTasks?.map(m => {
              if (m.id === microId) return { ...m, completed: !m.completed };
              return m;
            })
          };
        }
        return t;
      });
    });
    
    // Stop timer if it was running on this microtask
    if (activeMicroTaskId === microId) {
      setTimerRunning(false);
      setActiveMicroTaskId(null);
    }
  };

  // Copy helper
  const handleCopyContent = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAssetId(id);
    setTimeout(() => setCopiedAssetId(null), 2000);
  };

  // Format time remaining
  const formatTimerTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Change Profile and automatically prioritize
  const handleProfileChange = async (newProfile: TaskProfile) => {
    setProfile(newProfile);
    await prioritizeTasksList(tasks, newProfile);
  };

  // Render priority badge color
  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  };

  if (!currentUser) {
    return (
      <div id="auth-root" className="flex items-center justify-center min-h-screen bg-[#09090b] text-[#fafafa] font-sans p-4 relative overflow-hidden">
        {/* Decorative background grid and ambient glows */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f23_1px,transparent_1px),linear-gradient(to_bottom,#1f1f23_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-rose-900/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 transition-all">
          
          {/* Logo & Headline */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-900/30 mb-3 animate-pulse">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              The Last-Minute <span className="text-rose-500">Life Saver</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs">
              Stop overthinking, start executing. Your firm and ultra-proactive deadlines assistant.
            </p>
          </div>

          {/* Form Tabs */}
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/5 mb-6">
            <button
              id="tab-signin"
              onClick={() => {
                setAuthMode('signin');
                setAuthError('');
                setAuthSuccess('');
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'signin' ? 'bg-zinc-800 text-white border-b border-white/5 shadow' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              id="tab-signup"
              onClick={() => {
                setAuthMode('signup');
                setAuthError('');
                setAuthSuccess('');
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'signup' ? 'bg-zinc-800 text-white border-b border-white/5 shadow' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create Account
            </button>
          </div>

          {/* Errors & Success Feedback */}
          {authError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}
          {authSuccess && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-start gap-2">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* Core forms */}
          {authMode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="signin-email"
                    type="email"
                    placeholder="name@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-rose-500 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-rose-500 text-white"
                  required
                />
              </div>

              <button
                id="btn-signin-submit"
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-950/40 flex items-center justify-center gap-1.5"
              >
                Let's Start Hackin' <Zap className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  placeholder="Alex Mercer"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-rose-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="alex@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-rose-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Password (min 6 chars)
                </label>
                <input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-rose-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Primary Productivity Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAuthProfile('professional')}
                    className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${
                      authProfile === 'professional'
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/10'
                    }`}
                  >
                    Professional
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthProfile('student')}
                    className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${
                      authProfile === 'student'
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/10'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthProfile('entrepreneur')}
                    className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${
                      authProfile === 'entrepreneur'
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/10'
                    }`}
                  >
                    Founder
                  </button>
                </div>
              </div>

              <button
                id="btn-signup-submit"
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-950/40 flex items-center justify-center gap-1.5"
              >
                Create Free Account <Plus className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Guest Access Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5"></span>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-zinc-950 px-2.5 text-zinc-500">Or Quick Start</span>
            </div>
          </div>

          <button
            id="btn-guest-login"
            onClick={handleGuestAccess}
            className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 rounded-xl text-xs font-medium transition-all border border-white/5 hover:border-white/10 flex items-center justify-center gap-1.5 animate-pulse"
          >
            <UserIcon className="w-3.5 h-3.5" /> Enter as Guest (No Account)
          </button>

        </div>
      </div>
    );
  }

  return (
    <div id="app-root" className="flex flex-col min-h-screen w-full bg-[#09090b] text-[#fafafa] font-sans p-4 sm:p-6 overflow-x-hidden">
      
      {/* HEADER BAR */}
      <header id="app-header" className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-900/20">
            <Zap className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-display flex items-center gap-2">
              The Last-Minute <span className="text-rose-500">Life Saver</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">Ultra-proactive, firm-but-empathetic deadlines rescue system</p>
          </div>
        </div>

        {/* Profile switches and global stats */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex bg-zinc-900/80 p-1 rounded-xl border border-white/10 w-full sm:w-auto">
            <button 
              id="profile-btn-professional"
              onClick={() => handleProfileChange('professional')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${profile === 'professional' ? 'bg-zinc-800 text-white font-semibold border-b border-white/10' : 'text-zinc-400 hover:text-white'}`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Professional
            </button>
            <button 
              id="profile-btn-student"
              onClick={() => handleProfileChange('student')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${profile === 'student' ? 'bg-zinc-800 text-white font-semibold border-b border-white/10' : 'text-zinc-400 hover:text-white'}`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Student
            </button>
            <button 
              id="profile-btn-entrepreneur"
              onClick={() => handleProfileChange('entrepreneur')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${profile === 'entrepreneur' ? 'bg-zinc-800 text-white font-semibold border-b border-white/10' : 'text-zinc-400 hover:text-white'}`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Entrepreneur
            </button>
          </div>

          {/* USER CHIP / LOGOUT BUTTON */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-zinc-300 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-rose-600/20 text-rose-400 rounded-full flex items-center justify-center text-[10px] font-bold border border-rose-500/10">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'G'}
              </div>
              <span className="font-semibold text-zinc-200 truncate max-w-[100px]" title={currentUser?.name || 'Guest'}>
                {currentUser?.name || 'Guest'}
              </span>
            </div>
            <button
              id="btn-logout"
              onClick={handleLogOut}
              className="text-[10px] text-rose-400 hover:text-rose-300 font-bold transition-colors flex items-center gap-1 cursor-pointer pl-2 border-l border-white/10"
              title="Log Out"
            >
              <LogOut className="w-3 h-3 text-rose-500" />
              Exit
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-zinc-400 w-full sm:w-auto justify-center">
            <Clock className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
            <span>UTC Clock: {new Date().toISOString().slice(11, 16)}</span>
          </div>
        </div>
      </header>

      {/* BENTO GRID MAIN CONTENT */}
      <div id="bento-main-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-stretch">
        
        {/* COL 1: TASK GENERATOR & LIST OF TASKS (col-span-4) */}
        <div id="bento-col-left" className="lg:col-span-4 flex flex-col gap-5">
          
          {/* Bento Block: Quick Rescue Task Creator */}
          <div id="block-task-creator" className="bg-zinc-900/40 border border-white/10 rounded-3xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-md font-semibold tracking-tight text-zinc-200 flex items-center gap-2">
                <Plus className="w-5 h-5 text-rose-500" />
                Log A Commitment
              </h2>
              <span className="text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase font-mono">
                {profile} view
              </span>
            </div>

            <form onSubmit={handleAddTask} className="space-y-3">
              <div>
                <input 
                  id="input-task-title"
                  type="text" 
                  placeholder="Task Name (e.g. Write CS301 paper)" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-rose-500 text-white placeholder-zinc-500"
                  required
                />
              </div>

              <div>
                <textarea 
                  id="input-task-desc"
                  placeholder="Details, specifications, goals or requirements..." 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-rose-500 text-white placeholder-zinc-500 h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Deadline Date</label>
                  <input 
                    id="input-task-due"
                    type="datetime-local" 
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-white/10 rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:border-rose-500 text-zinc-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Est. Effort (Hrs)</label>
                  <input 
                    id="input-task-effort"
                    type="number" 
                    min="1" 
                    max="100"
                    value={newEffort}
                    onChange={(e) => setNewEffort(Number(e.target.value))}
                    className="w-full bg-zinc-950/80 border border-white/10 rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:border-rose-500 text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex gap-1.5 items-center">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Impact:</span>
                  {(['low', 'medium', 'high'] as const).map(imp => (
                    <button
                      key={imp}
                      type="button"
                      onClick={() => setNewImpact(imp)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border transition-all ${
                        newImpact === imp 
                          ? imp === 'high' ? 'bg-rose-500/20 border-rose-500 text-rose-400' : imp === 'medium' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-blue-500/20 border-blue-500 text-blue-400'
                          : 'bg-transparent border-white/5 text-zinc-500 hover:border-white/10'
                      }`}
                    >
                      {imp}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    id="btn-clear-task-form"
                    type="button"
                    onClick={() => {
                      setNewTitle('');
                      setNewDesc('');
                      const d = new Date(Date.now() + 1000 * 60 * 60 * 4);
                      setNewDueDate(d.toISOString().slice(0, 16));
                      setNewEffort(2);
                      setNewImpact('high');
                    }}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-all"
                  >
                    Clear Form
                  </button>
                  <button 
                    id="btn-add-task-submit"
                    type="submit" 
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Commit
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Bento Block: Priority Deck */}
          <div id="block-priority-deck" className="bg-zinc-900/40 border border-white/10 rounded-3xl p-5 flex flex-col flex-1 min-h-[300px]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-md font-semibold tracking-tight text-zinc-200 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-rose-500" />
                  Priority Deck
                </h2>
                <p className="text-[11px] text-zinc-400">Deadlines sorted dynamically by AI risk factors</p>
              </div>
              <div className="flex gap-1.5 items-center">
                <button 
                  id="btn-clear-all-tasks"
                  onClick={() => {
                    if (confirm("Are you sure you want to clear all commitments from your deck?")) {
                      setTasks(prev => prev.filter(t => t.userId !== activeUserId));
                      setSelectedTaskId('');
                    }
                  }}
                  disabled={userTasks.length === 0}
                  className="px-2 py-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 border border-white/5 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
                  title="Clear All Tasks"
                >
                  Clear Deck
                </button>
                <button 
                  id="btn-rescue-prioritize"
                  onClick={() => prioritizeTasksList(userTasks, profile)}
                  disabled={isPrioritizing || userTasks.length === 0}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-rose-400 border border-white/10 hover:border-rose-500/30 rounded-xl text-xs font-medium transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3 text-rose-500 animate-spin" />
                  {isPrioritizing ? 'Ranking...' : 'Rescue List'}
                </button>
              </div>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1 flex-1">
              {userTasks.filter(t => t.profile === profile).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-white/5 rounded-2xl bg-zinc-950/20">
                  <AlertTriangle className="w-8 h-8 text-zinc-600 mb-2" />
                  <p className="text-xs text-zinc-500">No active commitments in this profile.</p>
                  <button 
                    onClick={() => {
                      const presets = SEED_TASKS.filter(t => t.profile === profile).map(t => ({
                        ...t,
                        id: `task_seed_${activeUserId}_preset_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                        userId: activeUserId
                      }));
                      if (presets.length > 0) {
                        setTasks(prev => [...presets, ...prev]);
                      }
                    }}
                    className="mt-3 text-xs text-rose-400 underline"
                  >
                    Load preset demo tasks
                  </button>
                </div>
              ) : (
                userTasks
                  .filter(t => t.profile === profile)
                  // Sort by priorityScore (highest first), fall back to sooner due dates
                  .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
                  .map((t) => {
                    const isSelected = selectedTaskId === t.id;
                    const timeLeft = getRemainingTimeText(t.dueDate);
                    const isCritical = timeLeft === 'OVERDUE' || timeLeft.includes('m left') || (t.priorityScore && t.priorityScore > 90);

                    return (
                      <div 
                        id={`task-card-${t.id}`}
                        key={t.id}
                        onClick={() => setSelectedTaskId(t.id)}
                        className={`p-3.5 rounded-2xl transition-all cursor-pointer border flex flex-col gap-2 relative overflow-hidden group ${
                          isSelected 
                            ? 'bg-zinc-800/80 border-rose-500/50 shadow-md shadow-rose-950/10' 
                            : 'bg-zinc-950/60 border-white/5 hover:bg-zinc-900/40 hover:border-white/10'
                        }`}
                      >
                        {/* Glow bar if selected */}
                        {isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-500 to-amber-500" />
                        )}

                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 pr-2">
                            <h3 className="text-xs font-semibold text-white truncate font-display group-hover:text-rose-400 transition-colors">
                              {t.title}
                            </h3>
                            <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{t.description}</p>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {t.priorityScore ? (
                              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                                t.priorityScore >= 90 ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-300'
                              }`}>
                                {t.priorityScore}% RISK
                              </span>
                            ) : (
                              <span className="text-[9px] text-zinc-500 bg-zinc-800/60 px-1.5 py-0.5 rounded">
                                Unranked
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-1 border-t border-white/5 pt-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md uppercase ${getImpactBadge(t.impact)}`}>
                              {t.impact} Impact
                            </span>
                            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-zinc-400" />
                              {t.estimatedEffort}h req.
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold ${
                              isCritical ? 'text-rose-400 animate-pulse font-extrabold' : 'text-zinc-400'
                            }`}>
                              ⏱️ {timeLeft}
                            </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(t.id);
                              }}
                              className="text-zinc-600 hover:text-rose-400 p-1 rounded-md transition-colors"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

        </div>

        {/* COL 2: MAIN STRATEGY & ACTIONS CARD (col-span-5) */}
        <div id="bento-col-middle" className="lg:col-span-5 flex flex-col gap-5">
          
          {/* Active Strategy Focus Header */}
          {activeTask ? (
            <div id="block-active-strategy" className="bg-zinc-900/40 border border-white/10 rounded-3xl p-6 flex flex-col justify-between flex-1">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[10px] uppercase tracking-wider font-bold">
                    Proactive Intervention Plan
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-clear-selection"
                      onClick={() => setSelectedTaskId('')}
                      className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] rounded border border-white/5 transition-all"
                    >
                      Clear Selection
                    </button>
                    <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Selected Task</span>
                    </div>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2 text-white font-display">
                  {activeTask.title}
                </h2>
                <p className="text-zinc-400 text-xs mb-4 line-clamp-3 leading-relaxed">
                  {activeTask.description}
                </p>

                {/* AI Justification Explanation */}
                {activeTask.priorityExplanation && (
                  <div className="p-3.5 bg-zinc-950/80 border border-white/5 rounded-2xl text-[11px] text-zinc-300 italic mb-4 leading-relaxed border-l-2 border-l-amber-500">
                    <span className="font-bold text-amber-400 uppercase tracking-widest text-[9px] block mb-1">Rescue Nudge:</span>
                    "{activeTask.priorityExplanation}"
                  </div>
                )}

                {/* Micro task schedulers */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                      ⏱️ Micro-Tasks & Sprints
                    </h3>
                    <div className="flex gap-2">
                      {activeTask.microTasks && activeTask.microTasks.length > 0 && (
                        <button
                          id="btn-clear-sprints"
                          onClick={() => {
                            setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, microTasks: [] } : t));
                            if (activeMicroTaskId) {
                              setTimerRunning(false);
                              setActiveMicroTaskId(null);
                            }
                          }}
                          className="text-[11px] text-zinc-400 hover:text-rose-400 font-medium transition-all"
                        >
                          Clear Sprints
                        </button>
                      )}
                      <button 
                        id="btn-break-down-task"
                        onClick={handleBreakdownTask}
                        disabled={isBreakingDown}
                        className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
                      >
                        <Zap className="w-3 h-3 text-rose-500" />
                        {isBreakingDown ? 'Generating Sprints...' : 'Generate 20m Sprints'}
                      </button>
                    </div>
                  </div>

                  {activeTask.microTasks && activeTask.microTasks.length > 0 ? (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {activeTask.microTasks.map((micro) => {
                        const isCurrentlyRunning = activeMicroTaskId === micro.id;
                        return (
                          <div 
                            key={micro.id}
                            className={`p-2.5 rounded-xl border flex items-start gap-3 transition-all ${
                              isCurrentlyRunning 
                                ? 'bg-rose-950/20 border-rose-500/40' 
                                : micro.completed 
                                  ? 'bg-zinc-950/30 border-white/5 opacity-50' 
                                  : 'bg-zinc-950/60 border-white/5 hover:border-white/10'
                            }`}
                          >
                            <button 
                              onClick={() => completeMicroTask(activeTask.id, micro.id)}
                              className="mt-0.5 shrink-0"
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                micro.completed 
                                  ? 'bg-rose-500 border-rose-600 text-white' 
                                  : 'border-zinc-600 hover:border-rose-500'
                              }`}>
                                {micro.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                              </div>
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-1">
                                <h4 className={`text-xs font-semibold truncate ${micro.completed ? 'line-through text-zinc-500' : 'text-white'}`}>
                                  {micro.title}
                                </h4>
                                <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded shrink-0">
                                  {micro.timeBlock} ({micro.duration}m)
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{micro.description}</p>
                              
                              {!micro.completed && !isCurrentlyRunning && (
                                <button
                                  onClick={() => startTimerSprint(micro)}
                                  className="mt-2 text-[10px] text-rose-400 font-bold flex items-center gap-1 hover:underline"
                                >
                                  <Play className="w-2.5 h-2.5" /> Start Sprint Timer
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-5 border border-dashed border-white/5 rounded-2xl bg-zinc-950/40">
                      <p className="text-[11px] text-zinc-500">No micro-tasks generated yet for this commitment.</p>
                      <button 
                        onClick={handleBreakdownTask}
                        className="mt-2 px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-medium border border-white/10 transition-all"
                      >
                        Break it down into low-friction sprints
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Proactive Asset Creator (Reducing activation energy) */}
              <div className="mt-5 border-t border-white/5 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    🚀 Instant Proactive Rescue Kit
                  </h3>
                  <div className="flex items-center gap-1">
                    {activeTask.proactiveAssets && activeTask.proactiveAssets.length > 0 && (
                      <button
                        id="btn-clear-assets"
                        onClick={() => {
                          setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, proactiveAssets: [] } : t));
                          setViewingAsset(null);
                        }}
                        className="text-[10px] text-zinc-500 hover:text-rose-400 font-medium mr-2"
                      >
                        Clear Drafts
                      </button>
                    )}
                    <span className="text-[10px] text-zinc-500 mr-1">Draft:</span>
                    <select 
                      id="select-asset-type"
                      value={assetTypeToGenerate}
                      onChange={(e: any) => setAssetTypeToGenerate(e.target.value)}
                      className="bg-zinc-950 border border-white/10 rounded-lg text-[11px] px-2 py-1 text-white focus:outline-none focus:border-rose-500 font-medium"
                    >
                      <option value="outline">Document Outline</option>
                      <option value="email_draft">Email Response</option>
                      <option value="research">Research Context</option>
                      <option value="structure">Directory Structure</option>
                      <option value="code">Automation Script</option>
                      <option value="talking_points">Speaking talking points</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    id="btn-generate-asset"
                    onClick={handleGenerateAsset}
                    disabled={isGeneratingAsset}
                    className="flex-1 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-900/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isGeneratingAsset ? 'Generating starting code/draft...' : 'Write Starting Draft / Outline'}
                  </button>
                </div>

                {/* Mini Asset Carousel / Quick View */}
                {activeTask.proactiveAssets && activeTask.proactiveAssets.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <span className="text-[9px] text-zinc-500 uppercase font-black block">Available Drafts (Do not start from empty screen!):</span>
                    <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto">
                      {activeTask.proactiveAssets.map(asset => (
                        <button
                          key={asset.id}
                          onClick={() => setViewingAsset(asset)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 border transition-all ${
                            viewingAsset?.id === asset.id 
                              ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                              : 'bg-zinc-950 border-white/5 text-zinc-400 hover:border-white/10'
                          }`}
                        >
                          {asset.type === 'email_draft' && <Mail className="w-3 h-3 text-rose-400" />}
                          {asset.type === 'outline' && <FileText className="w-3 h-3 text-amber-400" />}
                          {asset.type !== 'email_draft' && asset.type !== 'outline' && <Terminal className="w-3 h-3 text-blue-400" />}
                          {asset.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/40 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center flex-1">
              <AlertTriangle className="w-12 h-12 text-zinc-500 mb-3 animate-bounce" />
              <h3 className="text-lg font-bold text-white mb-2">No active deadline selected</h3>
              <p className="text-xs text-zinc-400 max-w-sm">
                Select a task from your Priority Deck on the left or log a new commitment to unlock proactive intervention.
              </p>
            </div>
          )}

          {/* Asset Viewer Modal Overlay style inside a Bento Box */}
          {viewingAsset && activeTask && (
            <div className="bg-zinc-950 border border-rose-500/30 rounded-3xl p-5 relative">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                  Active Asset Tool
                </span>
                <div className="flex gap-1.5">
                  <button 
                    id="btn-clear-asset-view"
                    onClick={() => setViewingAsset(null)}
                    className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-rose-400 text-[11px] font-medium transition-all"
                  >
                    Clear View
                  </button>
                  <button 
                    onClick={() => handleCopyContent(viewingAsset.content, viewingAsset.id)}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-300 text-[11px] flex items-center gap-1"
                  >
                    {copiedAssetId === viewingAsset.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    {copiedAssetId === viewingAsset.id ? 'Copied' : 'Copy Draft'}
                  </button>
                  <button 
                    onClick={() => setViewingAsset(null)}
                    className="text-zinc-500 hover:text-white text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <h4 className="text-xs font-bold text-zinc-200 mb-2">{viewingAsset.title}</h4>
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-3 max-h-[140px] overflow-y-auto text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">
                {viewingAsset.content}
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 italic">Ready-to-use template built by 'The Last-Minute Life Saver' engine. Customize and send!</p>
            </div>
          )}

        </div>

        {/* COL 3: CHAT COMPANION & TIMER (col-span-3) */}
        <div id="bento-col-right" className="lg:col-span-3 flex flex-col gap-5">
          
          {/* Active Sprint Flow State / Countdown Timer */}
          <div id="block-sprint-timer" className={`rounded-3xl p-5 text-white flex flex-col justify-between transition-all ${
            timerRunning ? 'bg-gradient-to-br from-rose-600 to-rose-700 shadow-lg shadow-rose-950/20' : 'bg-zinc-900/60 border border-white/10'
          }`}>
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-100">
                  ⚡ Sprint Counter
                </h3>
                <div className="flex gap-2">
                  <button
                    id="btn-clear-timer"
                    onClick={() => {
                      setTimerRunning(false);
                      setSecondsRemaining(0);
                      setOriginalDurationMinutes(0);
                      setActiveMicroTaskId(null);
                    }}
                    className="text-[9px] text-zinc-400 hover:text-white font-medium bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded transition-all"
                  >
                    Clear Timer
                  </button>
                  {activeMicroTask && (
                    <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full uppercase font-bold shrink-0">
                      ACTIVE SPRINT
                    </span>
                  )}
                </div>
              </div>
              
              {activeMicroTask ? (
                <p className="text-xs text-zinc-200 font-medium">
                  Active task: <span className="font-bold underline">{activeTask?.title}</span> - {activeMicroTask.title}
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-200">
                    No active micro-task selected. Start a custom Pomodoro focus sprint:
                  </p>
                  <div className="flex gap-1">
                    {([15, 25, 45] as const).map(mins => (
                      <button
                        key={mins}
                        onClick={() => {
                          setCustomMinutes(mins);
                          setSecondsRemaining(mins * 60);
                          setOriginalDurationMinutes(mins);
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                          customMinutes === mins && secondsRemaining === mins * 60
                            ? 'bg-white text-rose-600 border-white'
                            : 'bg-zinc-950/80 border-white/10 text-zinc-300 hover:border-white/20'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={customMinutes}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value) || 1);
                        setCustomMinutes(val);
                        setSecondsRemaining(val * 60);
                        setOriginalDurationMinutes(val);
                      }}
                      className="w-12 bg-zinc-950/80 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-center focus:outline-none focus:border-white text-white"
                      title="Custom Minutes"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-4xl sm:text-5xl font-mono font-black tracking-tighter shrink-0">
                {formatTimerTime(secondsRemaining)}
              </span>
              
              <div className="flex gap-2 items-center">
                {/* PROMINENT START TIMER BUTTON */}
                <button
                  id="btn-timer-start-text"
                  onClick={() => {
                    if (secondsRemaining === 0) {
                      setSecondsRemaining(customMinutes * 60);
                      setOriginalDurationMinutes(customMinutes);
                    }
                    setTimerRunning(!timerRunning);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold tracking-wide uppercase transition-all shadow-md flex items-center gap-1 ${
                    timerRunning
                      ? 'bg-zinc-950 hover:bg-zinc-900 text-white'
                      : 'bg-white hover:bg-zinc-100 text-rose-600 font-black'
                  }`}
                >
                  {timerRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" /> PAUSE
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" /> START
                    </>
                  )}
                </button>

                {activeMicroTask && (
                  <button 
                    onClick={resetTimer}
                    className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                    title="Reset Sprint"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-white" />
                  </button>
                )}
              </div>
            </div>
            {timerRunning && (
              <div className="mt-3 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-white h-full transition-all duration-1000" 
                  style={{ width: `${(secondsRemaining / (originalDurationMinutes * 60)) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Firm but Empathetic Chat Companion */}
          <div id="block-companion-chat" className="bg-zinc-900/40 border border-white/10 rounded-3xl p-5 flex flex-col flex-1 min-h-[300px]">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-rose-500" />
                Rescue Companion
              </h3>
              <button
                id="btn-clear-chat"
                onClick={() => {
                  setChatMessages(prev => prev.filter(m => m.userId !== activeUserId));
                }}
                className="text-[10px] text-zinc-500 hover:text-rose-400 font-medium transition-all"
              >
                Clear Chat
              </button>
            </div>

            {/* Scrollable messages box */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[300px] mb-3 text-xs leading-relaxed">
              {userChatMessages.map(msg => (
                <div 
                  key={msg.id}
                  className={`p-3 rounded-2xl max-w-[85%] ${
                    msg.sender === 'user' 
                      ? 'bg-rose-600 text-white ml-auto rounded-tr-none' 
                      : 'bg-zinc-950/80 text-zinc-200 border border-white/5 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span className={`text-[8px] mt-1 block text-right ${msg.sender === 'user' ? 'text-rose-200' : 'text-zinc-500'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              ))}
              {isChatSending && (
                <div className="p-3 rounded-2xl bg-zinc-950/80 text-zinc-400 border border-white/5 rounded-tl-none max-w-[80%] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[10px]">Lifesaver is formulating next action...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input message form */}
            <form onSubmit={handleSendChatMessage} className="relative mt-auto">
              <input 
                id="input-chat-message"
                type="text" 
                placeholder="I'm feeling stuck/anxious..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="w-full bg-zinc-950/80 border border-white/10 rounded-xl pl-3 pr-10 py-2.5 text-xs focus:outline-none focus:border-rose-500 text-white placeholder-zinc-500"
              />
              <button 
                id="btn-send-chat"
                type="submit"
                disabled={!chatInput.trim() || isChatSending}
                className="absolute right-1.5 top-1.5 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Sync status metrics */}
          <div id="block-sync-metrics" className="bg-zinc-900/40 border border-white/10 rounded-3xl p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Sync Network</h3>
              <button
                id="btn-clear-sync-logs"
                onClick={() => {
                  alert("All telemetry cache and offline syncing networks cleared securely.");
                }}
                className="text-[10px] text-zinc-500 hover:text-rose-400 font-medium transition-all"
              >
                Clear Cache
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-zinc-950/50 border border-white/5 rounded-xl flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-zinc-400">Calendar Synced</span>
              </div>
              <div className="p-2 bg-zinc-950/50 border border-white/5 rounded-xl flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-zinc-400">Task Analytics</span>
              </div>
            </div>
            <div className="mt-3 p-3 bg-zinc-950 border border-white/5 rounded-2xl">
              <div className="flex justify-between items-center text-[9px] text-zinc-500">
                <span>FLOW MODE RATING</span>
                <span className="text-rose-400 font-bold">PEAK FOCUS</span>
              </div>
              <p className="text-[10px] mt-1.5 text-zinc-300">Predicting peak focus zone until 04:30 PM. Push through now!</p>
            </div>
          </div>

        </div>

      </div>

      {/* FOOTER BAR */}
      <footer id="app-footer" className="mt-6 flex flex-col sm:flex-row justify-between items-center px-4 py-3 bg-zinc-900/30 border border-white/5 rounded-2xl text-[11px] text-zinc-500 gap-2">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span> 
            <span>Proactive AI Core Live</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 
            <span>Local persistence active</span>
          </div>
        </div>
        <div>
          The Last-Minute Life Saver • Empowering you with swift starting templates and schedules.
        </div>
      </footer>

    </div>
  );
}
