# План реализации админ-панели Start Loft

**Дата создания**: 24 декабря 2025 г.  
**URL админки**: `startloft.kz/adminka`

---

## 📋 Общая концепция

Создать защищённую админ-панель с:

- **Авторизацией по токену** (ADMIN_TOKEN из .env)
- **Управлением турнирами** (CRUD операции)
- **Просмотром всех участников** (таблица с фильтрами по турниру/категории/статусу)
- **Конструктором турнирной сетки** (drag-and-drop, single/double elimination)
- **Дашбордом со статистикой** (количество турниров, участников, регистраций)

---

## 🔍 Текущее состояние проекта

### Аутентификация

- ✅ `ADMIN_TOKEN` существует в `backend/config.py`
- ❌ **НЕ используется** — эндпоинт `POST /api/tournaments` не защищён
- ❌ Нет проверки заголовка `X-Admin-Token`

### Существующие API эндпоинты

| Метод  | Путь                                  | Защита             | Описание                  |
| ------ | ------------------------------------- | ------------------ | ------------------------- |
| `GET`  | `/api/tournaments`                    | ❌                 | Список турниров           |
| `GET`  | `/api/tournaments/{slug}`             | ❌                 | Турнир по slug            |
| `POST` | `/api/registrations`                  | Rate limit 5/min   | Регистрация               |
| `GET`  | `/api/tournaments/{id}/registrations` | ❌                 | Участники (без телефонов) |
| `POST` | `/api/tournaments`                    | ❌ **НЕ ЗАЩИЩЁН!** | Создание турнира          |
| `GET`  | `/api/club-settings`                  | ❌                 | Настройки клуба           |

### Модели данных

#### Tournament (backend/models.py)

```python
class Tournament(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    slug: str                          # Человекопонятный URL
    title: str                         # Название турнира
    subtitle: Optional[str] = None
    status: Literal["draft", "published", "finished"]
    registration_open: bool            # Открыта ли регистрация
    dates: TournamentDates
    location: TournamentLocation
    fees: TournamentFees
    prize: TournamentPrize
    poster_image_url: Optional[str] = None
    description: str
    format_text: str
    required_fields: List[str]
    max_participants: int = 0
    contact: TournamentContact
    is_featured: bool = False
    created_at: datetime
    updated_at: datetime
```

#### Registration (backend/models.py)

```python
class Registration(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    tournament_id: str      # ObjectId string
    fio: str                # ФИО
    phone: str              # +7XXXXXXXXXX
    category: str           # "Профессионал +", "Профессионал", "Любитель +", "Любитель"
    rank: str               # "КМС", "МС", "МСМК", "ЗМС", "Нет звания"
    city_country: str
    birthdate: Optional[str] = None
    comment: Optional[str] = None
    status: Literal["new", "confirmed", "cancelled"] = "new"
    created_at: datetime
    meta: RegistrationMeta
```

### Frontend структура

```
frontend/app/
├── page.tsx                    # Главная
├── registration/page.tsx       # Регистрация
├── success/page.tsx            # Success страница
└── tournaments/[id]/page.tsx   # Страница турнира
```

**❌ Админки НЕТ!**

### UI библиотеки

- ✅ Tailwind CSS 4.x
- ❌ Нет UI компонентов (Material, Ant Design и т.д.)
- ❌ Нет drag-and-drop библиотек

---

## 🎯 План реализации

### ЭТАП 1: Backend — Защита и новые эндпоинты

#### 1.1 Добавить middleware для проверки admin токена

**Файл**: `backend/fastapi_start_loft.py`

```python
from fastapi import Header, Depends, HTTPException

async def verify_admin_token(x_admin_token: str = Header(...)):
    if x_admin_token != settings.admin_token:
        raise HTTPException(status_code=403, detail="Invalid admin token")
    return True
```

#### 1.2 Защитить существующие admin эндпоинты

```python
@app.post("/api/tournaments", dependencies=[Depends(verify_admin_token)])
async def create_tournament(...):
    # ...
```

#### 1.3 Создать новые эндпоинты для управления турнирами

```python
# Обновление турнира
@app.put("/api/tournaments/{tournament_id}", dependencies=[Depends(verify_admin_token)])
async def update_tournament(tournament_id: str, tournament: dict = Body(...)):
    # Обновить в БД
    # Вернуть обновлённый турнир
    pass

# Удаление турнира
@app.delete("/api/tournaments/{tournament_id}", dependencies=[Depends(verify_admin_token)])
async def delete_tournament(tournament_id: str):
    # Удалить турнир
    # Удалить все связанные регистрации
    pass
```

#### 1.4 Создать эндпоинты для управления регистрациями

```python
# Получить все регистрации (с фильтрами)
@app.get("/api/registrations", dependencies=[Depends(verify_admin_token)])
async def get_all_registrations(
    tournament_id: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    # Фильтрация + пагинация
    # Вернуть список с телефонами (для админа)
    pass

# Изменить статус регистрации
@app.patch("/api/registrations/{registration_id}/status", dependencies=[Depends(verify_admin_token)])
async def update_registration_status(registration_id: str, status: str = Body(...)):
    # Обновить статус: new -> confirmed / cancelled
    pass

# Удалить регистрацию
@app.delete("/api/registrations/{registration_id}", dependencies=[Depends(verify_admin_token)])
async def delete_registration(registration_id: str):
    # Удалить из БД
    pass
```

---

### ЭТАП 2: Backend — Турнирная сетка

#### 2.1 Создать модель Match

**Файл**: `backend/models.py`

```python
class Match(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    tournament_id: str                # ObjectId string
    round: str                        # "1/32", "1/16", "1/8", "quarter", "semi", "final"
    position: int                     # Позиция в сетке (0-31 для 32 участников)
    player1_id: Optional[str] = None  # Registration._id
    player2_id: Optional[str] = None  # Registration._id
    player1_score: Optional[int] = None
    player2_score: Optional[int] = None
    winner_id: Optional[str] = None   # Registration._id победителя
    status: Literal["pending", "in_progress", "finished", "cancelled"] = "pending"
    scheduled_time: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.now)
```

#### 2.2 Расширить модель Tournament

```python
class Tournament(BaseModel):
    # ... существующие поля ...
    bracket_type: Optional[Literal["single", "double", "round_robin"]] = None
    bracket_size: Optional[int] = None  # 8, 16, 32, 64
```

#### 2.3 Создать эндпоинты для турнирной сетки

```python
# Генерация турнирной сетки
@app.post("/api/tournaments/{tournament_id}/bracket", dependencies=[Depends(verify_admin_token)])
async def generate_bracket(
    tournament_id: str,
    bracket_type: str = Body(...),  # "single", "double"
    bracket_size: int = Body(...),  # 8, 16, 32
    seed_by_rank: bool = Body(False)  # Сеялирование по разрядам
):
    """
    1. Получить участников турнира из Registration
    2. Опционально: сортировать по rank (МС > КМС > нет звания)
    3. Создать пустые Match записи с правильной структурой раундов
    4. Вернуть сгенерированную сетку
    """
    pass

# Получить турнирную сетку
@app.get("/api/tournaments/{tournament_id}/bracket")
async def get_bracket(tournament_id: str):
    """
    1. Получить все Match для tournament_id
    2. Получить данные участников (fio, category, rank)
    3. Вернуть структурированную сетку с инфо об участниках
    """
    pass

# Обновить результат матча
@app.patch("/api/matches/{match_id}", dependencies=[Depends(verify_admin_token)])
async def update_match(
    match_id: str,
    player1_score: Optional[int] = Body(None),
    player2_score: Optional[int] = Body(None),
    winner_id: Optional[str] = Body(None),
    status: Optional[str] = Body(None)
):
    """
    1. Обновить результат матча
    2. Если есть победитель — продвинуть его в следующий раунд
    3. Вернуть обновлённый матч
    """
    pass
```

#### 2.4 Алгоритм генерации Single Elimination сетки

```python
def generate_single_elimination_bracket(participants: List[Registration], size: int):
    """
    Пример для 8 участников:

    Rounds: ["quarter", "semi", "final"]

    Quarter-finals (4 матча):
    - Match 0: player[0] vs player[1]
    - Match 1: player[2] vs player[3]
    - Match 2: player[4] vs player[5]
    - Match 3: player[6] vs player[7]

    Semi-finals (2 матча):
    - Match 4: winner(Match 0) vs winner(Match 1)
    - Match 5: winner(Match 2) vs winner(Match 3)

    Final (1 матч):
    - Match 6: winner(Match 4) vs winner(Match 5)
    """

    # Логика создания Match записей
    # Position определяет позицию в визуальной сетке
    pass
```

---

### ЭТАП 3: Frontend — UI библиотеки и middleware

#### 3.1 Установить shadcn/ui

```bash
cd frontend
npx shadcn-ui@latest init

# Выбрать:
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes

# Установить нужные компоненты:
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add button
npx shadcn-ui@latest add select
npx shadcn-ui@latest add input
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add card
```

#### 3.2 Установить drag-and-drop библиотеку

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

#### 3.3 Создать middleware для защиты админки

**Файл**: `frontend/middleware.ts`

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Проверка только для /adminka роутов (кроме /adminka/login)
  if (
    request.nextUrl.pathname.startsWith("/adminka") &&
    !request.nextUrl.pathname.startsWith("/adminka/login")
  ) {
    const adminToken = request.cookies.get("admin_token")?.value;

    if (!adminToken) {
      return NextResponse.redirect(new URL("/adminka/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/adminka/:path*",
};
```

---

### ЭТАП 4: Frontend — Структура админки

#### 4.1 Создать страницу логина

**Файл**: `frontend/app/adminka/login/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Проверка токена через API
    const response = await fetch("/api/verify-admin", {
      method: "POST",
      headers: {
        "X-Admin-Token": token,
      },
    });

    if (response.ok) {
      // Сохранить в cookie
      document.cookie = `admin_token=${token}; path=/; max-age=604800; secure; samesite=strict`;
      router.push("/adminka");
    } else {
      setError("Неверный токен");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Вход в админ-панель</h1>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Введите токен"
            className="w-full px-4 py-2 border rounded mb-4"
          />
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}
```

#### 4.2 Создать главную страницу админки (дашборд)

**Файл**: `frontend/app/adminka/page.tsx`

```typescript
import { Card } from "@/components/ui/card";
import Link from "next/link";

async function getDashboardStats() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`,
    {
      headers: {
        "X-Admin-Token": process.env.ADMIN_TOKEN || "",
      },
      cache: "no-store",
    }
  );
  return res.json();
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Админ-панель Start Loft</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-gray-500 text-sm">Турниры</h3>
          <p className="text-4xl font-bold">{stats.tournaments_count}</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-gray-500 text-sm">Участники</h3>
          <p className="text-4xl font-bold">{stats.registrations_count}</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-gray-500 text-sm">Активные турниры</h3>
          <p className="text-4xl font-bold">{stats.active_tournaments}</p>
        </Card>
      </div>

      <div className="space-y-4">
        <Link
          href="/adminka/tournaments"
          className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition"
        >
          <h3 className="font-bold text-lg">Управление турнирами</h3>
          <p className="text-gray-600">
            Создание, редактирование, удаление турниров
          </p>
        </Link>

        <Link
          href="/adminka/registrations"
          className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition"
        >
          <h3 className="font-bold text-lg">Регистрации</h3>
          <p className="text-gray-600">Просмотр и управление участниками</p>
        </Link>

        <Link
          href="/adminka/settings"
          className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition"
        >
          <h3 className="font-bold text-lg">Настройки клуба</h3>
          <p className="text-gray-600">Редактирование контактов и информации</p>
        </Link>
      </div>
    </div>
  );
}
```

#### 4.3 Создать страницу управления турнирами

**Файл**: `frontend/app/adminka/tournaments/page.tsx`

```typescript
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// Компонент с таблицей турниров
// Кнопки: Edit, Delete, View Bracket, Create New
```

#### 4.4 Создать страницу просмотра регистраций

**Файл**: `frontend/app/adminka/registrations/page.tsx`

```typescript
// Таблица с фильтрами:
// - По турниру (select)
// - По категории (select)
// - По статусу (select)
// - Поиск по ФИО/телефону

// Колонки:
// - ФИО
// - Телефон
// - Турнир
// - Категория
// - Разряд
// - Статус (с возможностью изменения)
// - Дата регистрации
// - Действия (удалить)
```

---

### ЭТАП 5: Frontend — Конструктор турнирной сетки

#### 5.1 Создать страницу турнирной сетки

**Файл**: `frontend/app/adminka/tournaments/[id]/bracket/page.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { BracketGenerator } from "@/components/admin/BracketGenerator";
import { BracketView } from "@/components/admin/BracketView";

export default function TournamentBracketPage({
  params,
}: {
  params: { id: string };
}) {
  const [bracket, setBracket] = useState(null);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    // Загрузить существующую сетку или участников
    loadBracket();
  }, [params.id]);

  const handleGenerateBracket = async (config) => {
    const response = await fetch(`/api/tournaments/${params.id}/bracket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Token": getAdminToken(),
      },
      body: JSON.stringify(config),
    });

    const newBracket = await response.json();
    setBracket(newBracket);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Турнирная сетка</h1>

      {!bracket ? (
        <BracketGenerator
          participants={participants}
          onGenerate={handleGenerateBracket}
        />
      ) : (
        <BracketView bracket={bracket} onUpdateMatch={handleUpdateMatch} />
      )}
    </div>
  );
}
```

#### 5.2 Создать компонент генератора сетки

**Файл**: `frontend/components/admin/BracketGenerator.tsx`

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

interface BracketGeneratorProps {
  participants: any[];
  onGenerate: (config: any) => void;
}

export function BracketGenerator({
  participants,
  onGenerate,
}: BracketGeneratorProps) {
  const [bracketType, setBracketType] = useState("single");
  const [bracketSize, setBracketSize] = useState(8);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Генератор турнирной сетки</h2>

      <p className="mb-4">Участников: {participants.length}</p>

      <div className="space-y-4">
        <div>
          <label>Тип сетки</label>
          <Select value={bracketType} onChange={setBracketType}>
            <option value="single">Single Elimination (олимпийская)</option>
            <option value="double">Double Elimination</option>
          </Select>
        </div>

        <div>
          <label>Размер сетки</label>
          <Select value={bracketSize} onChange={setBracketSize}>
            <option value={8}>8 участников</option>
            <option value={16}>16 участников</option>
            <option value={32}>32 участника</option>
            <option value={64}>64 участника</option>
          </Select>
        </div>

        <Button
          onClick={() => onGenerate({ bracketType, bracketSize })}
          disabled={participants.length === 0}
        >
          Сгенерировать сетку
        </Button>
      </div>
    </div>
  );
}
```

#### 5.3 Создать компонент отображения сетки

**Файл**: `frontend/components/admin/BracketView.tsx`

```typescript
"use client";

import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { MatchCard } from "./MatchCard";

interface BracketViewProps {
  bracket: any;
  onUpdateMatch: (matchId: string, data: any) => void;
}

export function BracketView({ bracket, onUpdateMatch }: BracketViewProps) {
  const rounds = groupMatchesByRound(bracket.matches);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-8 min-w-max">
        {Object.entries(rounds).map(([roundName, matches]) => (
          <div key={roundName} className="flex flex-col gap-4">
            <h3 className="font-bold text-center">{roundName}</h3>

            <DndContext collisionDetection={closestCenter}>
              <SortableContext
                items={matches.map((m) => m.id)}
                strategy={verticalListSortingStrategy}
              >
                {matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onUpdate={(data) => onUpdateMatch(match.id, data)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        ))}
      </div>
    </div>
  );
}

function groupMatchesByRound(matches) {
  // Группировка матчей по раундам
  // "quarter" -> [...matches]
  // "semi" -> [...matches]
  // "final" -> [...matches]
}
```

#### 5.4 Создать компонент карточки матча

**Файл**: `frontend/components/admin/MatchCard.tsx`

```typescript
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

interface MatchCardProps {
  match: any;
  onUpdate: (data: any) => void;
}

export function MatchCard({ match, onUpdate }: MatchCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: match.id,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border rounded p-4 cursor-move hover:shadow-lg transition"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold">{match.player1?.fio || "TBD"}</span>
        <input
          type="number"
          className="w-12 text-center border rounded"
          value={match.player1_score || ""}
          onChange={(e) =>
            onUpdate({ player1_score: parseInt(e.target.value) })
          }
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="font-bold">{match.player2?.fio || "TBD"}</span>
        <input
          type="number"
          className="w-12 text-center border rounded"
          value={match.player2_score || ""}
          onChange={(e) =>
            onUpdate({ player2_score: parseInt(e.target.value) })
          }
        />
      </div>

      {match.winner_id && (
        <div className="mt-2 text-sm text-green-600">
          Победитель: {match.winner?.fio}
        </div>
      )}
    </div>
  );
}
```

---

### ЭТАП 6: TypeScript типы и API клиент

#### 6.1 Обновить types/index.ts

**Файл**: `frontend/types/index.ts`

```typescript
// Добавить недостающий тип для rank
export interface RegistrationForm {
  // ...existing fields...
  rank: "Нет звания" | "КМС" | "МС" | "МСМК" | "ЗМС";
  // ...existing fields...
}

// Добавить типы для турнирной сетки
export interface Match {
  id: string;
  tournament_id: string;
  round: string;
  position: number;
  player1_id?: string;
  player2_id?: string;
  player1_score?: number;
  player2_score?: number;
  winner_id?: string;
  status: "pending" | "in_progress" | "finished" | "cancelled";
  scheduled_time?: string;
  completed_at?: string;
  created_at: string;
}

export interface BracketConfig {
  bracket_type: "single" | "double" | "round_robin";
  bracket_size: 8 | 16 | 32 | 64;
  seed_by_rank?: boolean;
}

export interface Bracket {
  tournament_id: string;
  matches: Match[];
  config: BracketConfig;
}

// Расширить Tournament
export interface Tournament {
  // ...existing fields...
  bracket_type?: "single" | "double" | "round_robin";
  bracket_size?: number;
}
```

#### 6.2 Обновить API клиент

**Файл**: `frontend/lib/api.ts`

```typescript
// Добавить функции для админки

// Регистрации
export async function getAllRegistrations(
  params?: {
    tournament_id?: string;
    status?: string;
    category?: string;
    skip?: number;
    limit?: number;
  },
  adminToken?: string
) {
  const queryParams = new URLSearchParams(params as any).toString();
  const response = await fetch(`${API_URL}/api/registrations?${queryParams}`, {
    headers: {
      "X-Admin-Token": adminToken || "",
    },
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Failed to fetch registrations");
  return response.json();
}

export async function updateRegistrationStatus(
  registrationId: string,
  status: string,
  adminToken: string
) {
  const response = await fetch(
    `${API_URL}/api/registrations/${registrationId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Token": adminToken,
      },
      body: JSON.stringify({ status }),
    }
  );

  if (!response.ok) throw new Error("Failed to update status");
  return response.json();
}

export async function deleteRegistration(
  registrationId: string,
  adminToken: string
) {
  const response = await fetch(
    `${API_URL}/api/registrations/${registrationId}`,
    {
      method: "DELETE",
      headers: {
        "X-Admin-Token": adminToken,
      },
    }
  );

  if (!response.ok) throw new Error("Failed to delete registration");
  return response.json();
}

// Турниры (CRUD)
export async function updateTournament(
  tournamentId: string,
  data: any,
  adminToken: string
) {
  const response = await fetch(`${API_URL}/api/tournaments/${tournamentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Token": adminToken,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error("Failed to update tournament");
  return response.json();
}

export async function deleteTournament(
  tournamentId: string,
  adminToken: string
) {
  const response = await fetch(`${API_URL}/api/tournaments/${tournamentId}`, {
    method: "DELETE",
    headers: {
      "X-Admin-Token": adminToken,
    },
  });

  if (!response.ok) throw new Error("Failed to delete tournament");
  return response.json();
}

// Турнирная сетка
export async function generateBracket(
  tournamentId: string,
  config: BracketConfig,
  adminToken: string
) {
  const response = await fetch(
    `${API_URL}/api/tournaments/${tournamentId}/bracket`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Token": adminToken,
      },
      body: JSON.stringify(config),
    }
  );

  if (!response.ok) throw new Error("Failed to generate bracket");
  return response.json();
}

export async function getBracket(tournamentId: string) {
  const response = await fetch(
    `${API_URL}/api/tournaments/${tournamentId}/bracket`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) throw new Error("Failed to fetch bracket");
  return response.json();
}

export async function updateMatch(
  matchId: string,
  data: Partial<Match>,
  adminToken: string
) {
  const response = await fetch(`${API_URL}/api/matches/${matchId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Token": adminToken,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error("Failed to update match");
  return response.json();
}
```

---

## 📚 Ссылки и примеры

### Турнирные сетки (вдохновение)

- **tournamentservice.net** — примеры сеток 8/16/32/64 участников
- Популярные форматы: 16-4, 32-8, s16, d16

### Библиотеки для изучения

- **@dnd-kit/core** — современный drag-and-drop
- **shadcn/ui** — Tailwind компоненты (рекомендую!)
- **react-tournament-bracket** — готовые компоненты сеток (опционально)

---

## ✅ Чеклист реализации

### Backend

- [ ] Добавить `verify_admin_token()` dependency
- [ ] Защитить `POST /api/tournaments`
- [ ] Создать `PUT /api/tournaments/{id}`
- [ ] Создать `DELETE /api/tournaments/{id}`
- [ ] Создать `GET /api/registrations` (с фильтрами)
- [ ] Создать `PATCH /api/registrations/{id}/status`
- [ ] Создать `DELETE /api/registrations/{id}`
- [ ] Создать модель `Match` в models.py
- [ ] Расширить `Tournament` полями bracket_type, bracket_size
- [ ] Создать `POST /api/tournaments/{id}/bracket`
- [ ] Создать `GET /api/tournaments/{id}/bracket`
- [ ] Создать `PATCH /api/matches/{id}`
- [ ] Создать `GET /api/admin/stats` (для дашборда)

### Frontend

- [ ] Установить shadcn/ui
- [ ] Установить @dnd-kit/core
- [ ] Создать middleware.ts
- [ ] Создать `/adminka/login/page.tsx`
- [ ] Создать `/adminka/page.tsx` (дашборд)
- [ ] Создать `/adminka/tournaments/page.tsx`
- [ ] Создать `/adminka/tournaments/[id]/edit/page.tsx`
- [ ] Создать `/adminka/registrations/page.tsx`
- [ ] Создать `/adminka/settings/page.tsx`
- [ ] Создать `/adminka/tournaments/[id]/bracket/page.tsx`
- [ ] Создать `BracketGenerator.tsx`
- [ ] Создать `BracketView.tsx`
- [ ] Создать `MatchCard.tsx`
- [ ] Создать `RegistrationsTable.tsx`
- [ ] Обновить types/index.ts (Match, Bracket, BracketConfig)
- [ ] Обновить lib/api.ts (все новые методы)

---

## 🔧 Дополнительные функции (опционально)

### Приоритет 1 (важно)

- [ ] **Сеялирование участников** — автоматическое распределение по rank
- [ ] **Экспорт сетки в PDF** — html2canvas + jsPDF
- [ ] **История изменений** — логирование действий админа
- [ ] **Уведомления участникам** — SMS/Email при изменении статуса

### Приоритет 2 (желательно)

- [ ] **Статистика турниров** — графики регистраций (recharts)
- [ ] **Поиск дубликатов** — проверка участников по телефону
- [ ] **Массовые действия** — подтвердить/отменить группу регистраций
- [ ] **Импорт/экспорт** — CSV файлы участников

### Приоритет 3 (низкий)

- [ ] **Онлайн-трансляция сетки** — публичный URL для просмотра
- [ ] **Push-уведомления** — для участников о начале матчей
- [ ] **Интеграция с Google Sheets** — синхронизация данных
- [ ] **Мобильная версия админки** — адаптивный дизайн

---

## 🚀 Порядок реализации (рекомендуемый)

1. **День 1-2: Backend защита + CRUD**

   - Добавить verify_admin_token
   - Создать все admin эндпоинты для турниров и регистраций
   - Тестирование через /docs

2. **День 3: Frontend базовая админка**

   - Установить shadcn/ui
   - Создать login, middleware, дашборд
   - Создать страницу управления турнирами

3. **День 4: Frontend регистрации**

   - Создать таблицу регистраций с фильтрами
   - Добавить изменение статусов
   - Подключить к API

4. **День 5-6: Backend турнирная сетка**

   - Создать модель Match
   - Реализовать генерацию Single Elimination
   - Создать эндпоинты для сетки

5. **День 7-8: Frontend турнирная сетка**

   - Установить @dnd-kit
   - Создать BracketGenerator
   - Создать BracketView с drag-and-drop
   - Создать MatchCard с редактированием результатов

6. **День 9-10: Тестирование и доработка**
   - Тестирование всех функций
   - Исправление багов
   - Улучшение UI/UX
   - Деплой на сервер

---

## 📝 Заметки

- **Безопасность**: хранить ADMIN_TOKEN в .env, никогда не коммитить
- **Cookie**: использовать secure + sameSite для production
- **Валидация**: все admin эндпоинты должны проверять ObjectId формат
- **Пагинация**: для больших турниров limit = 100 может быть мало
- **MongoDB индексы**: добавить для tournament_id, status в Registration

---

## 🎯 Минимально работающий продукт (MVP)

Если нужно быстро запустить базовую версию:

### Backend (минимум):

- ✅ Защита токеном
- ✅ GET /api/registrations
- ✅ PATCH /api/registrations/{id}/status
- ✅ PUT /api/tournaments/{id}

### Frontend (минимум):

- ✅ Login страница
- ✅ Дашборд
- ✅ Таблица турниров (без create/delete)
- ✅ Таблица регистраций (просмотр + смена статуса)

**Турнирную сетку можно добавить позже** как отдельную фичу.

---

**Статус**: План готов к реализации  
**Следующий шаг**: Начать с Backend защиты и эндпоинтов
