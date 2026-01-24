# Supabase Query Reference

Common SQL queries for managing Research Day scoring data. Run these in Supabase Dashboard > SQL Editor.

---

## Scores

### View all scores
```sql
SELECT
  presenter_id,
  judge_name,
  weighted_total,
  is_no_show,
  timestamp
FROM scores
ORDER BY presenter_id, judge_name;
```

### Scores by a specific judge
```sql
SELECT presenter_id, judge_name, weighted_total, is_no_show, timestamp
FROM scores
WHERE judge_name = 'Judge Name Here'
ORDER BY timestamp DESC;
```

### Score count per judge
```sql
SELECT judge_name, COUNT(*) as scores_submitted
FROM scores
WHERE is_no_show = false
GROUP BY judge_name
ORDER BY judge_name;
```

### Find judges with fewest scores
```sql
SELECT judge_name, COUNT(*) as total
FROM scores
GROUP BY judge_name
ORDER BY total ASC;
```

### View no-shows
```sql
SELECT presenter_id, judge_name, timestamp
FROM scores
WHERE is_no_show = true
ORDER BY presenter_id;
```

### Scores with full criteria breakdown
```sql
SELECT
  presenter_id,
  judge_name,
  weighted_total,
  criteria_content_why,
  criteria_content_what_how,
  criteria_content_next_steps,
  criteria_presentation_flow,
  criteria_preparedness,
  criteria_verbal_comm,
  criteria_visual_aids,
  is_no_show,
  timestamp
FROM scores
ORDER BY presenter_id, judge_name;
```

### Undergrad poster scores only
```sql
SELECT presenter_id, judge_name, weighted_total, is_no_show
FROM scores
WHERE presenter_id LIKE 'U%'
ORDER BY presenter_id, judge_name;
```

### Count scores by session (based on presenter ID pattern)
```sql
-- Undergrad posters (U prefix) = 10:15-11:15 session
SELECT 'Undergrad (10:15-11:15)' as session, COUNT(*) as score_count
FROM scores WHERE presenter_id LIKE 'U%'
UNION ALL
-- Other presenters = later sessions
SELECT 'Grad/Postdoc Sessions' as session, COUNT(*) as score_count
FROM scores WHERE presenter_id NOT LIKE 'U%';
```

---

## Feedback

### View all feedback
```sql
SELECT
  submitter_name as "Judge",
  presenter_name as "Presenter",
  strengths,
  areas_for_improvement,
  timestamp
FROM feedback
ORDER BY timestamp DESC;
```

### Feedback count by judge
```sql
SELECT submitter_name, COUNT(*) as feedback_count
FROM feedback
GROUP BY submitter_name
ORDER BY feedback_count DESC;
```

### Feedback for a specific presenter
```sql
SELECT submitter_name, strengths, areas_for_improvement, timestamp
FROM feedback
WHERE presenter_id = 'U01'
ORDER BY timestamp;
```

### Judges who haven't submitted feedback
```sql
-- Compare against your judge list manually
SELECT DISTINCT judge_name FROM scores
WHERE judge_name NOT IN (SELECT DISTINCT submitter_name FROM feedback)
ORDER BY judge_name;
```

---

## Data Management

### Clear all scores (USE WITH CAUTION!)
```sql
DELETE FROM scores;
```

### Clear all feedback (USE WITH CAUTION!)
```sql
DELETE FROM feedback;
```

### Delete scores for a specific presenter
```sql
DELETE FROM scores WHERE presenter_id = 'U01';
```

### Delete a specific judge's scores
```sql
DELETE FROM scores WHERE judge_name = 'Judge Name Here';
```

---

## Diagnostics

### Find duplicate scores (same presenter-judge combo)
```sql
SELECT presenter_id, judge_name, COUNT(*) as count
FROM scores
GROUP BY presenter_id, judge_name
HAVING COUNT(*) > 1;
```

### Find orphan scores (presenter IDs not matching expected patterns)
```sql
-- Scores for presenter IDs that look unusual
SELECT DISTINCT presenter_id, COUNT(*) as score_count
FROM scores
GROUP BY presenter_id
ORDER BY presenter_id;
```

### Check table row counts
```sql
SELECT 'scores' as table_name, COUNT(*) as row_count FROM scores
UNION ALL
SELECT 'feedback' as table_name, COUNT(*) as row_count FROM feedback;
```

### Recent activity (last hour)
```sql
SELECT 'scores' as type, presenter_id as id, judge_name, timestamp
FROM scores
WHERE timestamp > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 'feedback' as type, presenter_id as id, submitter_name, timestamp
FROM feedback
WHERE timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;
```

---

## Export Data

### Export scores as CSV-friendly format
```sql
SELECT
  presenter_id,
  judge_name,
  judge_id,
  weighted_total,
  criteria_content_why,
  criteria_content_what_how,
  criteria_content_next_steps,
  criteria_presentation_flow,
  criteria_preparedness,
  criteria_verbal_comm,
  criteria_visual_aids,
  is_no_show,
  timestamp
FROM scores
ORDER BY presenter_id, judge_name;
```

### Export feedback as CSV-friendly format
```sql
SELECT
  presenter_id,
  presenter_name,
  submitter_type,
  submitter_name,
  strengths,
  areas_for_improvement,
  timestamp
FROM feedback
ORDER BY presenter_id, submitter_name;
```
