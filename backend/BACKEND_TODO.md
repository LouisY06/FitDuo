# Backend Development Tasks

While frontend is being developed, here are backend tasks you can work on:

## 🔥 High Priority (Core Features)

### 1. **Update Player Stats After Games** ⏳
**Status**: Partially done, needs completion
- ✅ Player stats model exists
- ⏳ Need to update stats when games end
- ⏳ Update win/loss records
- ⏳ Update win streaks
- ⏳ Award XP based on game performance

**Files to modify:**
- `app/services/game_logic.py` - Add stats update in `handle_round_end()`
- `app/routers/player.py` - Helper functions for updating stats

### 2. **Matchmaking/Lobby System** 🆕
**Status**: Not implemented
- Create endpoint to find available opponents
- Auto-match players based on skill level
- Queue system for players waiting for matches
- Match players with similar stats

**Files to create/modify:**
- `app/routers/match.py` - Add matchmaking endpoints
- `app/services/matchmaking.py` - New service for matchmaking logic

### 3. **Improve Match Creation** 🔧
**Status**: Basic implementation exists
- Allow creating match with just current user (auto-find opponent)
- Friend challenge system
- Match invitations

**Files to modify:**
- `app/routers/match.py` - Enhance create_match endpoint

## 🎯 Medium Priority (Nice to Have)

### 4. **Leaderboards** 📊
**Status**: Not implemented
- Global leaderboards (top players by wins, XP, etc.)
- Category-specific leaderboards (best pushups, best plank time)
- Weekly/monthly leaderboards

**Files to create:**
- `app/routers/leaderboard.py` - New router for leaderboards

### 5. **Achievements System** 🏆
**Status**: Not implemented
- Define achievement types (first win, 10 wins, 100 reps, etc.)
- Track achievements in database
- Award achievements when conditions met

**Files to create:**
- `app/models/achievement.py` - Achievement model
- `app/routers/achievements.py` - Achievement endpoints
- `app/services/achievement_service.py` - Achievement logic

### 6. **Game Completion Handler** ✅
**Status**: Partially done
- Mark game as finished when all rounds complete
- Calculate final winner
- Update both players' stats
- Award XP and level up if needed

**Files to modify:**
- `app/services/game_logic.py` - Add game completion logic

## 🛠️ Low Priority (Polish & Optimization)

### 7. **Enhanced XP System** 💰
**Status**: Basic (10 XP per workout)
- XP based on workout performance
- XP bonuses for wins
- XP multipliers for streaks
- Level-up rewards

**Files to modify:**
- `app/services/player.py` - Enhance XP calculation

### 8. **Player Search/Discovery** 🔍
**Status**: Not implemented
- Search players by username
- Find players by level/skill
- Recent players list

**Files to create:**
- `app/routers/players.py` - Player search endpoints

### 9. **Match History Enhancement** 📜
**Status**: Basic (list matches exists)
- Detailed match results
- Match replay data
- Player performance in matches

**Files to modify:**
- `app/routers/match.py` - Enhance match responses

### 10. **API Documentation** 📚
**Status**: Basic (FastAPI auto-docs)
- Add detailed endpoint descriptions
- Example requests/responses
- Error code documentation

**Files to modify:**
- All router files - Add docstrings and examples

## 🧪 Testing & Quality

### 11. **Comprehensive Test Suite** ✅
**Status**: Basic tests exist
- Test all player endpoints
- Test matchmaking logic
- Test stats updates
- Integration tests

**Files to create:**
- `test_player_endpoints.py`
- `test_matchmaking.py`
- `test_stats_updates.py`

### 12. **Error Handling Improvements** 🛡️
**Status**: Basic
- Better error messages
- Consistent error responses
- Error logging

**Files to modify:**
- All routers - Improve error handling

## 🚀 Recommended Starting Points

**Start with #1 (Update Player Stats)** - This is critical and will be needed when frontend is ready.

**Then #2 (Matchmaking)** - This makes the game much more playable.

**Then #4 (Leaderboards)** - Great for engagement.

