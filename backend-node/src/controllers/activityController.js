import { pool } from "../config/db.js";

export const logActivity = async ({
  userId,
  userName,
  userEmail,
  eventType,
  eventDescription,
  datasetId,
  datasetName,
  detail,
  status = "ok",
  durationSeconds = 0
}) => {
  try {
    await pool.query(
      `INSERT INTO activity_logs 
        (user_id, user_name, user_email, event_type, event_description, dataset_id, dataset_name, detail, status, duration_seconds) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [userId, userName, userEmail, eventType, eventDescription, datasetId, datasetName, detail, status, durationSeconds]
    );
    return { success: true };
  } catch (error) {
    console.error("Error logging activity:", error.message);
    return { success: false, error: error.message };
  }
};

export const getActivityLogs = async (req, res) => {
  try {
    const { employee, event, status, startDate, endDate, limit = 100, includeSessions, dataset } = req.query;
    
    let query = `
      SELECT * FROM activity_logs WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (employee && employee !== "All") {
      query += ` AND user_name = $${paramIndex}`;
      params.push(employee);
      paramIndex++;
    }

    if (event && event !== "all") {
      query += ` AND event_type = $${paramIndex}`;
      params.push(event.toUpperCase());
      paramIndex++;
    }

    if (status && status !== "all") {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (dataset && dataset !== "all") {
      query += ` AND dataset_name = $${paramIndex}`;
      params.push(dataset);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(Number(limit));

    const result = await pool.query(query, params);
    
    let logs = result.rows;
    
    if (includeSessions === 'true') {
      const sessionResult = await pool.query(`
        SELECT user_email, login_time, logout_time, total_duration_seconds 
        FROM user_sessions 
        ORDER BY login_time DESC 
        LIMIT 50
      `);
      
      const sessions = sessionResult.rows.map(s => {
        const duration = s.logout_time 
          ? (s.total_duration_seconds || 0)
          : Math.floor((Date.now() - new Date(s.login_time).getTime()) / 1000);
        
        return {
          log_id: `session-${s.user_email}-${s.login_time}`,
          user_email: s.user_email,
          user_name: s.user_email?.split('@')[0] || 'Unknown',
          event_type: 'SESSION',
          event_description: s.logout_time ? `Session completed` : `Currently active`,
          detail: s.logout_time 
            ? `Logged in at ${new Date(s.login_time).toLocaleTimeString()}. Logged out at ${new Date(s.logout_time).toLocaleTimeString()}`
            : `Logged in at ${new Date(s.login_time).toLocaleTimeString()}. Still active`,
          status: s.logout_time ? 'completed' : 'active',
          duration_seconds: duration,
          created_at: s.login_time
        };
      });
      
      logs = [...logs, ...sessions];
      logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    res.json({
      success: true,
      logs,
      count: logs.length
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch activity logs" });
  }
};

export const getActivityStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        event_type,
        status,
        COUNT(*) as count
      FROM activity_logs
      GROUP BY event_type, status
    `);

    const users = await pool.query(`
      SELECT DISTINCT user_name, user_email 
      FROM activity_logs 
      ORDER BY user_name
    `);

    const uniqueEvents = await pool.query(`
      SELECT DISTINCT event_type FROM activity_logs ORDER BY event_type
    `);

    res.json({
      success: true,
      stats: stats.rows,
      users: users.rows,
      events: uniqueEvents.rows.map(r => r.event_type)
    });
  } catch (error) {
    console.error("Error fetching activity stats:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch activity stats" });
  }
};

export const logEmployeeLogin = async (userId, userName, userEmail) => {
  return logActivity({
    userId,
    userName,
    userEmail,
    eventType: "LOGIN",
    eventDescription: "Employee logged in",
    status: "ok"
  });
};

export const logEmployeeLogout = async (userId, userName, userEmail, durationSeconds) => {
  return logActivity({
    userId,
    userName,
    userEmail,
    eventType: "LOGOUT",
    eventDescription: "Employee logged out",
    status: "ok",
    durationSeconds
  });
};

export const logCleaningActivity = async (userId, userName, userEmail, datasetId, datasetName, status, detail) => {
  return logActivity({
    userId,
    userName,
    userEmail,
    eventType: "CLEAN",
    eventDescription: `Data cleaning on ${datasetName}`,
    datasetId,
    datasetName,
    detail,
    status
  });
};

export const logQueryActivity = async (userId, userName, userEmail, datasetId, datasetName, query, status, durationSeconds) => {
  return logActivity({
    userId,
    userName,
    userEmail,
    eventType: "QUERY",
    eventDescription: `Query executed on ${datasetName}`,
    datasetId,
    datasetName,
    detail: query,
    status,
    durationSeconds
  });
};

export const logVisualizationActivity = async (userId, userName, userEmail, datasetId, datasetName, status, detail) => {
  return logActivity({
    userId,
    userName,
    userEmail,
    eventType: "VISUALIZE",
    eventDescription: `Visualization created for ${datasetName}`,
    datasetId,
    datasetName,
    detail,
    status
  });
};

export const logViewSummaryActivity = async (userId, userName, userEmail, datasetId, datasetName, status) => {
  return logActivity({
    userId,
    userName,
    userEmail,
    eventType: "VIEW_SUMMARY",
    eventDescription: `Viewed summary for ${datasetName}`,
    datasetId,
    datasetName,
    detail: "Employee viewed data summary",
    status
  });
};

export const logDatasetAccess = async (userId, userName, userEmail, datasetId, datasetName, status) => {
  return logActivity({
    userId,
    userName,
    userEmail,
    eventType: "ACCESS_DATASET",
    eventDescription: `Accessed dataset ${datasetName}`,
    datasetId,
    datasetName,
    detail: `Viewed dataset: ${datasetName}`,
    status
  });
};