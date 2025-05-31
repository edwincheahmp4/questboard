import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { supabase } from './supabaseClient';

const adjectives = ['Happy', 'Clever', 'Brave', 'Swift', 'Calm', 'Bright', 'Lucky', 'Bold', 'Kind', 'Wise'];
const animals = ['Panda', 'Tiger', 'Eagle', 'Fox', 'Lion', 'Wolf', 'Bear', 'Hawk', 'Otter', 'Dolphin'];

function generateUsername() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return adj + animal;
}

function StarField({ count = 100 }) {
  const stars = Array.from({ length: count }).map((_, i) => {
    const size = Math.random() * 2 + 1;
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const duration = 15 + Math.random() * 15; // 15s to 30s
    const delay = Math.random() * 5;
    const twinkleDelay = Math.random() * 2;
    return (
      <div
        key={i}
        className="star"
        style={{
          left: `${left}%`,
          top: `${top}%`,
          width: `${size}px`,
          height: `${size}px`,
          animationDuration: `2s, ${duration}s`,
          animationDelay: `${twinkleDelay}s, ${delay}s`
        }}
      />
    );
  });
  return <div className="space-bg">{stars}</div>;
}

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);

  const [todos, setTodos] = useState([]);
  const [task, setTask] = useState('');
  const [difficulty, setDifficulty] = useState(10);

  const [error, setError] = useState('');
  const [profile, setProfile] = useState({ exp: 0, level: 1 });
  const [leaderboard, setLeaderboard] = useState([]);

  // Fetch todos
  const fetchTodos = async () => {
    let { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setTodos(data);
  };

  // Check user on load
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (user) fetchTodos();
    else setTodos([]);
  }, [user]);

  // Add todo
  const addTodo = async (e) => {
    e.preventDefault();
    setError('');
    if (!task) return;
    const { error } = await supabase.from('todos').insert([
      { user_id: user.id, task, difficulty, completed: false }
    ]);
    if (error) setError(error.message);
    setTask('');
    fetchTodos();
  };

  // Complete todo and update profile
  const completeTodo = async (id, difficulty) => {
    setError('');
    const { error: updateTodoError } = await supabase
      .from('todos')
      .update({ completed: true })
      .eq('id', id);
    if (updateTodoError) return setError(updateTodoError.message);

    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('exp, level')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) return setError(profileError.message);

    if (!profile) {
      const { error: insertError } = await supabase.from('profiles').insert([
        { id: user.id, exp: 0, level: 1 }
      ]);
      if (insertError) return setError(insertError.message);
      profile = { exp: 0, level: 1 };
    }

    let newExp = profile.exp + difficulty;
    let newLevel = profile.level;
    while (newExp >= newLevel * 100) {
      newExp -= newLevel * 100;
      newLevel += 1;
    }

    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({ exp: newExp, level: newLevel })
      .eq('id', user.id);
    if (updateProfileError) return setError(updateProfileError.message);

    fetchTodos();
  };

  // Delete todo
  const deleteTodo = async (id) => {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);
    if (error) setError(error.message);
    fetchTodos();
  };

  // Auth functions
  const signUp = async (e) => {
  e.preventDefault();
  setError('');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) setError(error.message);
  else {
    setError('You are now ready to Log in.');
    if (data && data.user) {
      let username = generateUsername();

      // Ensure username is unique (optional: retry if duplicate found)
      let { data: existing } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      while (existing) {
        username = generateUsername();
        const res = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .single();
        existing = res.data;
      }

      await supabase.from('profiles').insert([
        { id: data.user.id, username, exp: 0, level: 1 }
      ]);
    }
  }
};

  const signIn = async (e) => {
    e.preventDefault();
    setError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else setUser(data.user);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Fetch profile info
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('exp, level, username')
          .eq('id', user.id);
        if (data && data.length > 0) setProfile(data[0]);
      }
    };
    fetchProfile();
  }, [user, todos]);

  // Fetch leaderboard
  const fetchLeaderboard = async () => {
    let { data, error } = await supabase
      .from('profiles')
      .select('username, exp, level')
      .order('level', { ascending: false })
      .order('exp', { ascending: false })
      .limit(10);
    if (error) setError(error.message);
    else setLeaderboard(data);
  };

  useEffect(() => { fetchLeaderboard(); }, []);


  return (
    <>
      <StarField count={100} />
      <div className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        fontFamily: "'Orbitron', 'Share Tech Mono', 'Segoe UI', Arial, sans-serif",
        background: "transparent"
      }}
      >
      <div className="container py-4 px-2" style={{ maxWidth: 430 }}>
        <div className="card shadow-lg border-0 p-4 mx-auto"
          style={{
            background: "rgba(16,33,62,0.96)",
            borderRadius: "1.5rem",
            boxShadow: "0 8px 32px 0 #00e1ff40, 0 1.5px 4px #0002",
            color: "#fff",
            border: "4px solid #00e1ff",
            imageRendering: "pixelated",
            borderImage: 'url("data:image/svg+xml,%3Csvg width=\'16\' height=\'16\' viewBox=\'0 0 16 16\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect x=\'0\' y=\'0\' width=\'16\' height=\'16\' fill=\'%2300e1ff\'/%3E%3Crect x=\'2\' y=\'2\' width=\'12\' height=\'12\' fill=\'none\' stroke=\'%23011a3a\' stroke-width=\'2\'/%3E%3C/svg%3E") 8',
          }}>
          <h1
  className="text-center fw-bold mb-4"
  style={{
    fontFamily: "'Press Start 2P', 'Orbitron', 'Share Tech Mono', 'Segoe UI', Arial, sans-serif",
    color: "#00e1ff",
    textShadow: "2px 2px 0 #01163a, 0 0 8px #00e1ff, 0 0 2px #fff",
    letterSpacing: "0.08em",
    fontSize: "1.5rem",
    userSelect: "none"
  }}
>

  <style>
  {`
    .custom-input::placeholder {
      color: #fff;
      opacity: 1;
    }
  `}
</style>
  
  <span role="img" aria-label="rocket" style={{ fontSize: "2rem", marginRight: 8 }}>🚀</span>
  QUESTBOARD
</h1>
          {!user ? (
            <form autoComplete="off">
              <div className="mb-3">
                <input
                  type="email"
                  className="form-control custom-input"
                  style={{ background: "#151f33", color: "#fff", borderColor: "#00e1ff" }}
                  placeholder="Email"
                  value={email}
                  autoComplete="username"
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <input
                  type="password"
                  className="form-control custom-input"
                  style={{ background: "#151f33", color: "#fff", borderColor: "#00e1ff" }}
                  placeholder="Password"
                  value={password}
                  autoComplete="current-password"
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <div className="d-flex gap-2">
                <button onClick={signIn}
                  className="btn w-50"
                  style={{
                    background: "linear-gradient(90deg, #00e1ff 40%, #1e75fc 100%)",
                    color: "#fff",
                    border: "none",
                    boxShadow: "0 0 8px #00e1ff60"
                  }}
                  type="submit"
                >
                  <i className="bi bi-box-arrow-in-right"></i> Sign In
                </button>
                <button onClick={signUp}
                  className="btn w-50 border-info"
                  style={{ color: "#00e1ff", borderWidth: 2, borderStyle: "solid", background: "transparent" }}
                  type="button"
                >
                  <i className="bi bi-person-plus"></i> Sign Up
                </button>
              </div>
              {error && <div className="text-danger text-center mt-3">{error}</div>}
            </form>
          ) : (
            <div>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="small" style={{ color: "#00e1ff" }}>
                  <i className="bi bi-person-circle me-1"></i>
                  {profile.username || user.email}
                </span>
                <button onClick={signOut} className="btn btn-link px-0" style={{ color: "#00e1ff" }}>Sign Out</button>
              </div>
              {/* Profile & EXP */}
              <div className="mb-4 p-3 rounded text-center border border-info shadow"
                style={{ background: "rgba(13,31,61,0.7)", color: "#fff" }}>
                <span className="fw-bold" style={{ color: "#00e1ff", fontSize: 20 }}>
                  <i className="bi bi-star-fill"></i> Level {profile.level}
                </span>
                <span className="mx-2" style={{ color: "#1e75fc" }}>|</span>
                <span className="fw-bold" style={{ color: "#00e1ff", fontSize: 20 }}>
                  EXP
                </span>
                <span className="ms-1">{profile.exp} / {profile.level * 100}</span>
                <div className="progress mt-2" style={{ height: 9, background: "#01163a", borderRadius: 8 }}>
                  <div
                    className="progress-bar"
                    style={{
                      width: `${(profile.exp / (profile.level * 100)) * 100}%`,
                      background: "linear-gradient(90deg,#00e1ff,#1e75fc)",
                      boxShadow: "0 0 10px #00e1ff80"
                    }}
                  />
                </div>
              </div>
              {/* Add Todo */}
              <form className="d-flex gap-2 mb-3 flex-wrap" onSubmit={addTodo}>
                <input
                  type="text"
                  className="form-control w-100 w-md-auto"
                  style={{ background: "#ffffff", color: "black", borderColor: "#00e1ff" }}
                  placeholder="Add a New quest..."
                  value={task}
                  onChange={e => setTask(e.target.value)}
                />
                <label className="text-center d-flex flex-column form-label mb-1" htmlFor="difficultySelect" style={{ color: "#00e1ff", fontWeight: 500 }}>
    Select your difficulty
  </label>
                <div className="d-flex flex-column text-center align-items-center">
  <select
    id="difficultySelect"
    className="form-select w-auto"
    style={{ background: "#172339", color: "#00e1ff", borderColor: "#00e1ff" }}
    value={difficulty}
    onChange={e => setDifficulty(Number(e.target.value))}
  >
    <option value={10}>Easy (+10 XP)</option>
    <option value={20}>Medium (+20 XP)</option>
    <option value={30}>Hard (+30 XP)</option>
  </select>
</div>
                <button className="btn"
                  style={{
                    background: "linear-gradient(90deg, #00e1ff 40%, #1e75fc 100%)",
                    color: "#fff",
                    border: "none",
                    boxShadow: "0 0 8px #00e1ff60"
                  }}
                  type="submit"
                >
                  <i className="bi bi-plus-circle"></i> Add
                </button>
              </form>
              {/* Todo list */}
              <ul className="list-group mb-3">
  {todos.map(todo => (
    <li key={todo.id}
        className="list-group-item d-flex align-items-center justify-content-between border-0 mb-2"
        style={{
          background: todo.completed ? "#101e2a" : "rgba(16, 33, 62, 0.88)",
          color: todo.completed ? "#929cb6" : "#fff",
          textDecoration: todo.completed ? "line-through" : "none",
          borderRadius: 12,
          fontSize: "1.06rem",
          boxShadow: "0 1px 2px #01163a22"
        }}>
      <div className="d-flex align-items-center">
        <input
          className="form-check-input me-2"
          type="checkbox"
          checked={todo.completed}
          onChange={() => completeTodo(todo.id, todo.difficulty)}
          disabled={todo.completed}
          style={{ width: 20, height: 20 }}
        />
        <span>
          <i className="bi bi-joystick text-info me-2"></i>
          {todo.task}
          <span className="badge bg-info ms-2">{todo.difficulty} XP</span>
        </span>
      </div>
      <button
        onClick={() => deleteTodo(todo.id)}
        className="btn btn-outline-danger btn-sm ms-2"
        title="Delete"
      >
        <i className="bi bi-x-lg"></i>
      </button>
    </li>
  ))}
</ul>
              {error && <div className="text-danger text-center">{error}</div>}
              {/* Leaderboard */}
              <div className="mt-5">
                <h2 className="h5 mb-3 text-center"
                  style={{
                    color: "#00e1ff",
                    textShadow: "0 0 8px #00e1ff, 0 0 2px #fff"
                  }}>
                  <i className="bi bi-trophy-fill me-2"></i>Leaderboard
                </h2>
                <div className="table-responsive">
                  <table className="table table-dark table-hover align-middle mb-0"
                    style={{
                      borderRadius: "0.8rem",
                      overflow: "hidden",
                      background: "rgba(16, 33, 62, 0.96)"
                    }}>
                    <thead>
                      <tr>
                        <th style={{ width: '10%', color: "#00e1ff" }}>#</th>
                        <th style={{ width: '40%', color: "#00e1ff" }}>Username</th>
                        <th style={{ width: '25%', color: "#00e1ff" }}>Lvl</th>
                        <th style={{ width: '25%', color: "#00e1ff" }}>XP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((luser, idx) => (
                        <tr key={luser.username || idx}>
                          <td className="fw-bold" style={{ color: "#00e1ff" }}>{idx + 1}</td>
                          <td className="fw-semibold">{luser.username || "Anonymous"}</td>
                          <td>{luser.level}</td>
                          <td>{luser.exp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="text-center text-white small mt-3 opacity-75"
          style={{ fontFamily: "'Orbitron', 'Share Tech Mono', 'Segoe UI', Arial, sans-serif" }}>
          <div className="text-center mt-4">
  <a
    href="https://www.buymeacoffee.com/yourusername"
    target="_blank"
    rel="noopener noreferrer"
  >
    <img
      src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
      alt="Buy Me A Coffee"
      style={{ height: "45px", width: "162px", borderRadius: "8px", boxShadow: "0 0 8px #00e1ff50" }}
    />
  </a>
</div>
        </div>
      </div>
    </div>
    </>
  );
}

export default App;
