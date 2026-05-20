const jwt = require('jsonwebtoken');
const Session = require('../../db/session.js');
const User = require('../../db/user.js');

const SUBJECTS = ['Physics', 'Math', 'Chemistry', 'Biology', 'Computer'];

const getUserIdFromRequest = (req) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        throw new Error('Authorization token is required');
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload.id;
};

const getStartOfWeek = (weekOffset = 0) => {
    const now = new Date();
    // Reset to midnight today to prevent partial-day exclusion
    now.setHours(0, 0, 0, 0);
    const day = now.getDay();
    // Monday is 1, Sunday is 0. If Sun(0), go back 6 days, else go back (day-1) days.
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) + (weekOffset * 7);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(diff);
    return startOfWeek;
};

const calculateFocusStreak = (sessions) => {
    const sessionDays = new Set(
        sessions.map((session) => new Date(session.updatedAt).toISOString().slice(0, 10))
    );

    let streak = 0;
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().slice(0, 10);

    let active = false;
    let expired = false;

    // Check if the user has studied today or yesterday
    if (sessionDays.has(todayKey)) {
        active = true;
    } else if (sessionDays.has(yesterdayKey)) {
        active = true;
    }

    if (active) {
        let cursor = new Date(sessionDays.has(todayKey) ? today : yesterday);
        while (true) {
            const key = cursor.toISOString().slice(0, 10);
            if (!sessionDays.has(key)) break;
            streak += 1;
            cursor.setDate(cursor.getDate() - 1);
        }
    } else {
        // Did they have a streak before that broke?
        if (sessions.length > 0) {
            // Find the last study date
            const sortedDates = Array.from(sessionDays).sort((a, b) => new Date(b) - new Date(a));
            const lastSessionDate = sortedDates[0];
            // If the last session is older than yesterday, the streak expired
            if (lastSessionDate && lastSessionDate < yesterdayKey) {
                expired = true;
            }
        }
    }

    return { streak, expired };
};

const buildStudyHours = (sessions, weekOffset = 0) => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const startOfWeek = getStartOfWeek(weekOffset);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const hoursByDay = new Array(7).fill(0);

    sessions.forEach((session) => {
        const updatedAt = new Date(session.updatedAt);
        if (updatedAt < startOfWeek || updatedAt >= endOfWeek) {
            return;
        }

        const dayIndex = (updatedAt.getDay() + 6) % 7;
        const timeSpent = Number(session.timeSpent) || 0;
        hoursByDay[dayIndex] += timeSpent / 3600;
    });

    return labels.map((label, index) => ({
        label,
        hours: Number(hoursByDay[index].toFixed(2)) // Changed from 1 to 2 decimal places to capture small sessions
    }));
};

const buildSubjectMastery = (sessions) => {
    const totals = SUBJECTS.reduce((accumulator, subject) => {
        accumulator[subject] = 0;
        return accumulator;
    }, {});

    sessions.forEach((session) => {
        let normalizedSubject = session.subject;
        // Normalize "Mathematics" to "Math" for display consistency
        if (normalizedSubject === 'Mathematics') normalizedSubject = 'Math';
        
        if (totals[normalizedSubject] !== undefined) {
            totals[normalizedSubject] += session.timeSpent;
        }
    });

    return SUBJECTS.map((subject) => {
        const hours = totals[subject] / 3600;
        // Scale mastery linearly where 20 hours = 100% mastery. Add a base 2% if they started the subject so it's not completely empty.
        const mastery = Math.min(100, Math.round((hours / 20) * 100) + (hours > 0 ? 2 : 0));
        return {
            subject,
            mastery
        };
    });
};

exports.endSession = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const {
            sessionId,
            timeSpent,
            subject,
            recentQuestion = '',
            preview = ''
        } = req.body || {};

        if (!sessionId || typeof timeSpent !== 'number' || !subject) {
            return res.status(400).json({ message: 'sessionId, subject, and numeric timeSpent are required.' });
        }

        const session = await Session.findOneAndUpdate(
            { user: userId, sessionId },
            {
                user: userId,
                sessionId,
                subject,
                timeSpent,
                recentQuestion,
                preview
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        );

        return res.status(200).json({
            message: 'Session saved successfully.',
            session
        });
    } catch (error) {
        return res.status(401).json({ message: error.message || 'Unable to save session.' });
    }
};

exports.getProgress = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const weekOffset = parseInt(req.query.weekOffset) || 0;
        const user = await User.findById(userId).select('weeklyGoalHours').lean();
        const sessions = await Session.find({ user: userId }).sort({ updatedAt: -1 }).lean();

        const totalSessions = sessions.length;
        const totalSeconds = sessions.reduce((sum, session) => sum + (Number(session.timeSpent) || 0), 0);
        
        // Calculate weekly hours based on the offset
        const startOfWeek = getStartOfWeek(weekOffset);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 7);
        
        const weeklyHours = sessions
            .filter((session) => {
                const updatedAt = new Date(session.updatedAt);
                return updatedAt >= startOfWeek && updatedAt < endOfWeek;
            })
            .reduce((sum, session) => sum + (Number(session.timeSpent) || 0), 0) / 3600;

        const conceptsMastered = calculateMastery(sessions, totalSeconds);
        const { streak: focusStreak, expired: streakExpired } = calculateFocusStreak(sessions);
        const weeklyGoalHours = user?.weeklyGoalHours || 17;

        return res.status(200).json({
            summary: {
                totalSessions,
                weeklyGoal: `${weeklyHours.toFixed(1)}/${weeklyGoalHours}h`,
                weeklyGoalHours,
                conceptsMastered,
                focusStreak: `${focusStreak} ${focusStreak === 1 ? 'Day' : 'Days'}`,
                streakCount: focusStreak,
                streakExpired: streakExpired
            },
            studyHours: buildStudyHours(sessions, weekOffset),
            subjectMastery: buildSubjectMastery(sessions),
            insight: totalSeconds > 0
                ? "You're building strong momentum. Keep showing up for short focused sessions and your mastery bars will keep climbing."
                : "Start a guided study session to unlock your learning progress and subject mastery insights.",
            recentSessions: sessions.slice(0, 5)
        });
    } catch (error) {
        return res.status(401).json({ message: error.message || 'Unable to load progress.' });
    }
};

exports.updateWeeklyGoal = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const { weeklyGoalHours } = req.body || {};

        if (typeof weeklyGoalHours !== 'number' || weeklyGoalHours <= 0) {
            return res.status(400).json({ message: 'Please provide a valid weekly goal in hours.' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { weeklyGoalHours },
            { new: true }
                ).select('weeklyGoalHours');

        return res.status(200).json({
            message: 'Weekly goal updated successfully.',
            weeklyGoalHours: user.weeklyGoalHours
        });
    } catch (error) {
        return res.status(401).json({ message: error.message || 'Unable to update weekly goal.' });
    }
};

exports.getAllSessions = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const sessions = await Session.find({ user: userId }).sort({ updatedAt: -1 }).lean();

        // Calculate total stats
        const totalSeconds = sessions.reduce((acc, s) => acc + (Number(s.timeSpent) || 0), 0);
        const totalHours = (totalSeconds / 3600).toFixed(1);
        const conceptsMastered = calculateMastery(sessions, totalSeconds);
        const { streak: focusStreak, expired: streakExpired } = calculateFocusStreak(sessions);

        return res.status(200).json({
            success: true,
            count: sessions.length,
            stats: {
                totalSessions: sessions.length,
                totalHours: parseFloat(totalHours),
                totalSeconds,
                conceptsMastered,
                focusStreak,
                streakExpired
            },
            sessions
        });
    } catch (error) {
        return res.status(401).json({ message: error.message || 'Unable to load sessions.' });
    }
};

const calculateMastery = (sessions, totalSeconds) => {
    // Optimized Mastery Logic:
    // 1. Time-based: 1 concept per 10 minutes (600s)
    // 2. Volume-based booster: 1 concept for every 3 meaningful sessions (>1 min)
    const timeBasedConcepts = Math.floor(totalSeconds / 600);
    const meaningfulSessions = sessions.filter(s => s.timeSpent > 60).length;
    const sessionBonus = Math.floor(meaningfulSessions / 3);
    
    return Math.max(sessions.length > 0 ? 1 : 0, timeBasedConcepts + sessionBonus);
};
