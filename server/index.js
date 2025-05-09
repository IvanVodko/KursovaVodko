const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

const jokesPath = path.join(__dirname, 'jokes.json'); // Путь к файлу с шутками
const usersFilePath = path.join(__dirname, 'users.json');

app.use(cors());
app.use(express.json());

// --- HELPER FUNCTIONS --- //
const readJSON = (filePath) => {
  if (!fs.existsSync(filePath)) return [];
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Ошибка при чтении файла ${filePath}:`, err);
    return [];
  }
};

const writeJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// --- JOKES --- //

// GET all jokes
app.get('/api/jokes', (req, res) => {
  const jokes = readJSON(jokesPath);
  const sorted = jokes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(sorted);
});

// GET single joke
app.get('/api/jokes/:id', (req, res) => {
  const jokes = readJSON(jokesPath);
  const joke = jokes.find(j => j.id === parseInt(req.params.id));
  if (joke) {
    res.json(joke);
  } else {
    res.status(404).json({ error: 'Шутка не знайдена' });
  }
});

// POST new joke
app.post('/api/jokes', (req, res) => {
  const { text, author } = req.body;

  if (!text || !author) {
    return res.status(400).json({ error: 'Всі поля обовʼязкові' });
  }

  const jokes = readJSON(jokesPath);
  const newJoke = {
    id: jokes.length ? jokes[jokes.length - 1].id + 1 : 1,
    text,
    author,
    createdAt: new Date().toISOString(),
    likes: 0,  // Добавляем поле лайков
    dislikes: 0,  // Добавляем поле дизлайков
    likesUsers: [], // Добавляем список пользователей, которые поставили лайк
    dislikesUsers: [] // Добавляем список пользователей, которые поставили дизлайк
  };
  jokes.push(newJoke);
  writeJSON(jokesPath, jokes);
  res.status(201).json(newJoke);
});

// --- USERS --- //

// POST: регистрация
app.post('/api/register', (req, res) => {
  const { nickname, password } = req.body;
  if (!nickname || !password) return res.status(400).json({ error: 'Всі поля обовʼязкові' });

  const users = readJSON(usersFilePath);
  if (users.find(u => u.nickname === nickname)) {
    return res.status(409).json({ error: 'Користувач вже існує' });
  }

  users.push({ nickname, password });
  writeJSON(usersFilePath, users);
  res.json({ message: 'Користувача зареєстровано', nickname });
});

// POST: логін
app.post('/api/login', (req, res) => {
  const { nickname, password } = req.body;
  if (!nickname || !password) return res.status(400).json({ error: 'Всі поля обовʼязкові' });

  const users = readJSON(usersFilePath);
  const user = users.find(u => u.nickname === nickname && u.password === password);

  if (user) {
    res.json({ message: 'Успішний вхід', nickname: user.nickname });
  } else {
    res.status(401).json({ error: 'Невірний нікнейм або пароль' });
  }
});


// PUT лайк или дизлайк
app.put('/api/jokes/:id/react', (req, res) => {
  const { type, nickname } = req.body;
  const jokes = readJSON(jokesPath);
  const joke = jokes.find(j => j.id === parseInt(req.params.id));

  if (!joke) return res.status(404).json({ error: 'Шутка не найдена' });

  if (!nickname) {
    return res.status(401).json({ error: 'Не авторизован' });
  }

  // Логика лайков/дизлайков
  if (type === 'like') {
    if (!joke.likesUsers.includes(nickname)) {
      joke.likesUsers.push(nickname);
      joke.likes++;
    }
  } else if (type === 'dislike') {
    if (!joke.dislikesUsers.includes(nickname)) {
      joke.dislikesUsers.push(nickname);
      joke.dislikes++;
    }
  }

  writeJSON(jokesPath, jokes);
  res.json(joke);
});








// --- START SERVER --- //
app.listen(PORT, () => {
  console.log(`Сервер запущено на http://localhost:${PORT}`);
});
